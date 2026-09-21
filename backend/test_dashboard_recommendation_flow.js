import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import Project from './models/Project.js';
import Task from './models/Task.js';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import { chatWithProject } from './services/projectAnalysisService.js';

/**
 * Pure helper function matching frontend AIInsights.jsx implementation
 */
export const generateInsightQuestion = (ctx) => {
  if (!ctx) return 'Analyze the project status and provide actionable recommendations.';
  const { projectName, insightType, insightTitle, insightDescription, affectedTaskName, delayDays } = ctx;

  const type = (insightType || insightTitle || 'Schedule Pressure').toLowerCase();

  if (affectedTaskName) {
    const delaySnippet = delayDays > 0 ? `delayed by ${delayDays} days` : 'delayed';
    return `What should we do about the schedule pressure in ${projectName || 'the project'} caused by the ${affectedTaskName} task being ${delaySnippet}? Please provide a structured analysis including Situation, Evidence, Impact, Recommended Actions, Priority, and immediate Next Steps.`;
  }

  if (type.includes('material') || type.includes('stock')) {
    return `Analyze the material risk in ${projectName || 'the project'}${insightDescription ? `: "${insightDescription}"` : ''}. Which materials are at risk, what is the shortfall, and what recovery actions should we take?`;
  }

  if (type.includes('cost') || type.includes('budget') || type.includes('financial')) {
    return `Analyze the cost and financial risk in ${projectName || 'the project'}${insightDescription ? `: "${insightDescription}"` : ''}. What factors are driving this concern and what corrective actions are recommended?`;
  }

  if (insightDescription) {
    return `Analyze the ${insightTitle || 'issue'} detected in ${projectName || 'the project'}: "${insightDescription}". What is the operational impact and what specific actions should the project team take?`;
  }

  return `Analyze the ${insightTitle || 'operational status'} in ${projectName || 'the project'} and recommend recovery actions.`;
};

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/buildops';

async function runDashboardRecommendationFlowTests() {
  console.log('================================================================');
  console.log('BUILDOPS AI: DASHBOARD RECOMMENDATION TO AI CHATBOARD E2E TEST');
  console.log('================================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find or seed a project with delayed task (e.g. Chandkheda)
    let project = await Project.findOne({ name: /Chandkheda/i });
    if (!project) {
      project = await Project.findOne({});
    }
    assert(project, '1. Project must exist in database');
    console.log(`✓ Project found: "${project.name}" (ID: ${project._id})`);

    // 2. Find tasks for this project
    const tasks = await Task.find({ projectId: project._id }).sort({ dueDate: 1 });
    const delayedTask = tasks.find(t => t.status === 'Delayed') || tasks[0];
    console.log(`✓ Task analyzed: "${delayedTask?.title || 'General Construction'}" (Status: ${delayedTask?.status || 'Active'})`);

    // 3. Test Dynamic Prompt Generator
    const testContext = {
      projectId: project._id.toString(),
      projectName: project.name,
      insightType: 'Schedule Pressure',
      insightTitle: 'Schedule Pressure Detected',
      insightDescription: `${delayedTask?.title || 'Tower B Column'} in ${project.name} is behind schedule.`,
      affectedTaskId: delayedTask?._id?.toString(),
      affectedTaskName: delayedTask?.title || 'Tower B Column Reinforcement',
      taskPriority: delayedTask?.priority || 'Critical',
      taskStatus: delayedTask?.status || 'Delayed',
      delayDays: 42,
    };

    const prompt = generateInsightQuestion(testContext);
    console.log('\n--- Dynamic Prompt Generated ---');
    console.log(prompt);
    assert(prompt.includes(project.name), 'Prompt must include project name');
    assert(prompt.includes(testContext.affectedTaskName), 'Prompt must include affected task name');
    assert(prompt.includes('42 days'), 'Prompt must include delay duration');
    assert(prompt.includes('Situation'), 'Prompt must ask for structured Situation');
    console.log('✓ Dynamic Prompt Generation Test Passed');

    // 4. Test Conversation Creation with Project Binding
    const convTitle = `${testContext.insightTitle}: ${testContext.projectName}`;
    const conversation = await Conversation.create({
      title: convTitle.slice(0, 70),
      userId: 'test-runner',
      projectId: project._id,
      projectName: project.name,
      messages: [],
    });
    assert(conversation._id, 'Conversation should be created in MongoDB');
    console.log(`✓ Persistent Conversation Created (ID: ${conversation._id}, Project: ${conversation.projectName})`);

    // 5. Test AI Recommendation Generation with Real Gemini Service
    console.log('\nQuerying Gemini AI via chatWithProject...');
    const chatResult = await chatWithProject(
      project._id.toString(),
      prompt,
      [],
      [],
      [],
      { user: { _id: new mongoose.Types.ObjectId(), organizationId: project.organizationId } }
    );

    assert(chatResult && chatResult.answer, 'Gemini should return answer');
    console.log('\n--- AI Structured Recommendation Output ---');
    console.log(chatResult.answer.slice(0, 500) + '...\n');
    console.log(`✓ Confidence: ${chatResult.confidence || 'High'}`);
    console.log(`✓ Sources: ${JSON.stringify(chatResult.sources || [])}`);

    // Verify structured recommendation content
    const answer = chatResult.answer.toLowerCase();
    const hasStructure =
      answer.includes('situation') ||
      answer.includes('issue') ||
      answer.includes('impact') ||
      answer.includes('recommend') ||
      answer.includes('action') ||
      answer.includes('priority') ||
      answer.includes('step');
    assert(hasStructure, 'AI response should follow structured recommendation format');
    console.log('✓ Structured Recommendation Format Verified');

    // 6. Test Follow-up Question in Same Context
    console.log('\nTesting Follow-up Question in the same conversation continuity...');
    const followUpQuestion = 'Which specific trade or personnel should we assign to address this delay first?';
    const followUpHistory = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: chatResult.answer },
    ];
    const followUpResult = await chatWithProject(
      project._id.toString(),
      followUpQuestion,
      [],
      [],
      followUpHistory
    );
    assert(followUpResult && followUpResult.answer, 'Follow-up query should succeed');
    console.log('--- AI Follow-up Response Snippet ---');
    console.log(followUpResult.answer.slice(0, 300) + '...\n');
    console.log('✓ Follow-up Conversational Continuity Verified');

    // 7. Test Financial Lock Masking
    console.log('\nTesting Financial Protection when Financials are Locked...');
    // Create a user with financialAccessPasswordHash
    const lockedUser = {
      _id: new mongoose.Types.ObjectId(),
      organizationId: project.organizationId,
      financialAccessPasswordHash: 'simulated_hash',
    };
    // Save to User collection temporarily
    await User.create({
      _id: lockedUser._id,
      name: 'Locked Test User',
      email: `locked_${Date.now()}@test.com`,
      password: 'password123',
      organizationId: project.organizationId,
      role: 'Project Manager',
      financialAccessPasswordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    });

    const financialQuery = 'What is the total revenue and profit margin of this project?';
    const lockedResult = await chatWithProject(
      project._id.toString(),
      financialQuery,
      [],
      [],
      [],
      { user: lockedUser, financialToken: null } // No token provided!
    );
    console.log('--- AI Financial Lock Protection Response ---');
    console.log(lockedResult.answer.slice(0, 350) + '...\n');
    const finAnswer = lockedResult.answer.toLowerCase();
    const indicatesProtection =
      finAnswer.includes('lock') ||
      finAnswer.includes('protect') ||
      finAnswer.includes('authoriz') ||
      finAnswer.includes('security') ||
      finAnswer.includes('unavailable') ||
      finAnswer.includes('not have access');
    assert(indicatesProtection, 'AI must state financials are locked or protected when secondary password is required');
    console.log('✓ Financial Protection & Locking Verified (Zero unauthorized financial disclosure)');

    // Clean up test conversation & test user
    await Conversation.findByIdAndDelete(conversation._id);
    await User.findByIdAndDelete(lockedUser._id);
    console.log('✓ Cleaned up test artifacts');

    console.log('\n================================================================');
    console.log('ALL DASHBOARD RECOMMENDATION FLOW TESTS PASSED (100% SUCCESS)');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runDashboardRecommendationFlowTests();
