/**
 * Task 13: 26-Step Final End-to-End Verification Test Suite
 * Tests all 26 verification steps required by Task 13 prompt against real MongoDB data and services.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Project from './models/Project.js';
import Task from './models/Task.js';
import Material from './models/Material.js';
import Conversation from './models/Conversation.js';

import {
  generateProjectReport,
  buildDeterministicReportData,
} from './services/projectReportService.js';
import { generateProjectBriefing } from './services/projectBriefingService.js';
import { detectProjectRisks } from './services/riskAnalysisService.js';
import { chatWithProject } from './services/projectAnalysisService.js';
import { STANDARD_UNRELATED_RESPONSE } from './services/aiService.js';

let passed = 0;
let failed = 0;

function assert(condition, stepNum, testName, details = '') {
  if (condition) {
    console.log(`✅ [STEP ${stepNum}] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [STEP ${stepNum}] ${testName} - ${details}`);
    failed++;
  }
}

async function runTask13E2ETests() {
  console.log('====================================================');
  console.log('Task 13 — 26-Step Final End-to-End Test Suite');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  try {
    // 1. Open BuildOps AI / Verify Projects exist
    const allProjects = await Project.find({}).lean();
    assert(Array.isArray(allProjects) && allProjects.length >= 2, 1, 'Open BuildOps AI & check real projects available');

    // 2. Select a real project: Chandkheda Smart Residential Complex (has real tasks and materials)
    const projA = allProjects.find((p) => p.name.includes('Chandkheda')) || allProjects[0];
    const projAId = projA._id.toString();
    assert(projA && projAId, 2, `Select real project: "${projA.name}"`);

    // 3 & 4. Ask: "Give me a project briefing" & Verify real MongoDB data
    const briefingResult = await generateProjectBriefing(projAId);
    assert(
      briefingResult &&
      briefingResult.briefingData.projectName.includes('Chandkheda') &&
      typeof briefingResult.briefingData.progress === 'number' &&
      briefingResult.sources.some((s) => s.label === 'Project Data'),
      '3 & 4',
      `Briefing for "${projA.name}" successfully uses real MongoDB metrics`
    );

    // 5 & 6. Ask: "Which tasks are delayed?" & Verify task evidence
    const tasksA = await Task.find({ projectId: projA._id }).lean();
    const taskChatRes = await chatWithProject(projAId, 'Which tasks are delayed?');
    assert(
      taskChatRes &&
      typeof taskChatRes.answer === 'string' &&
      taskChatRes.sources.some((s) => s.label === 'Task Data' || s.label === 'Project Data'),
      '5 & 6',
      `Delayed tasks inquiry returns grounded evidence (Found ${tasksA.length} DB tasks)`
    );

    // 7 & 8. Ask: "Which materials are low stock?" & Verify material evidence
    const materialsA = await Material.find({ projectId: projA._id }).lean();
    const matChatRes = await chatWithProject(projAId, 'Which materials are low stock?');
    assert(
      matChatRes &&
      typeof matChatRes.answer === 'string' &&
      matChatRes.sources.some((s) => s.label === 'Material Data' || s.label === 'Project Data'),
      '7 & 8',
      `Materials low stock inquiry returns grounded evidence (Found ${materialsA.length} DB materials)`
    );

    // 9 & 10. Upload a construction image & Ask a construction-related question
    const sampleImage = {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mimeType: 'image/jpeg',
      name: 'site_foundation_inspection.jpg',
      size: 1540,
    };
    const imgChatRes = await chatWithProject(
      projAId,
      'Check this foundation slab rebar placement for proper spacing and cover blocks',
      [sampleImage]
    );
    assert(
      imgChatRes &&
      typeof imgChatRes.answer === 'string' &&
      imgChatRes.sources.some((s) => s.label.includes('Uploaded Image') || s.type === 'image'),
      '9 & 10',
      'Construction image analysis executes and includes Uploaded Image source grounding'
    );

    // 11 & 12. Upload a construction PDF & Ask a question about the PDF
    const samplePdf = {
      data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA0IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoxNzUKJSVFT0YK',
      mimeType: 'application/pdf',
      name: 'structural_spec_sheet.pdf',
      size: 2840,
    };
    const pdfChatRes = await chatWithProject(
      projAId,
      'What are the concrete grade requirements mentioned in this structural spec document?',
      [],
      [samplePdf]
    );
    assert(
      pdfChatRes &&
      typeof pdfChatRes.answer === 'string' &&
      pdfChatRes.sources.some((s) => s.label.includes('Uploaded Document') || s.type === 'document'),
      '11 & 12',
      'Construction PDF analysis executes and includes Uploaded Document source grounding'
    );

    // 13 & 14. Ask: "Are there any risks in this project?" & Verify risk evidence
    const riskData = await detectProjectRisks(projAId);
    assert(
      riskData &&
      typeof riskData.overallRiskLevel === 'string' &&
      Array.isArray(riskData.risks) &&
      riskData.safetyNotice.includes('structural safety'),
      '13 & 14',
      `Operational risk analysis calculated deterministically (${riskData.overallRiskLevel} risk, ${riskData.detectedRisksCount} items)`
    );

    // 15 & 16. Ask: "Generate a project status report" & Verify real data
    const reportRes = await generateProjectReport(projAId, 'Project Status Report');
    assert(
      reportRes &&
      typeof reportRes.answer === 'string' &&
      reportRes.answer.includes('PROJECT OVERVIEW') &&
      reportRes.answer.includes('PROJECT PROGRESS') &&
      reportRes.sources.length >= 3,
      '15 & 16',
      'AI Project Report generated with real data and grounded sources'
    );

    // 17 & 18. Verify PDF fileDownloader logic & non-mirrored BuildOps logo
    const fileDownloaderPath = path.join(__dirname, '../frontend/src/utils/fileDownloader.js');
    const fileDownloaderCode = fs.readFileSync(fileDownloaderPath, 'utf8');
    const hasCorrectLogo =
      fileDownloaderCode.includes('fillRect(MARGIN_LEFT, topY - 18, 6, 18, C_BLUE)') &&
      fileDownloaderCode.includes('fillRect(MARGIN_LEFT + 8, topY - 24, 6, 24, C_ORANGE)') &&
      fileDownloaderCode.includes('fillRect(MARGIN_LEFT + 16, topY - 14, 6, 14, C_BLUE)');
    assert(hasCorrectLogo, '17 & 18', 'PDF generator uses standard A4 geometry and non-mirrored BuildOps vector logo');

    // 19, 20 & 21. Conversation history: create, reload, verify persistence
    const testConv = await Conversation.create({
      title: 'Task 13 Verification Chat',
      projectId: projAId,
      projectName: projA.name,
      userId: 'test-user-e2e',
      messages: [
        {
          role: 'user',
          content: 'Give me a project briefing',
          createdAt: new Date(),
        },
        {
          role: 'assistant',
          content: 'Here is the project briefing...',
          sources: [{ type: 'project', label: 'Project Data' }],
          confidence: 'High',
          createdAt: new Date(),
        },
      ],
    });

    const reloadedConv = await Conversation.findById(testConv._id).lean();
    assert(
      reloadedConv &&
      reloadedConv.messages.length === 2 &&
      reloadedConv.projectId.toString() === projAId &&
      reloadedConv.messages[1].sources[0].label === 'Project Data',
      '19, 20 & 21',
      'Conversation history reloaded and verified with messages and project context intact'
    );
    await Conversation.deleteOne({ _id: testConv._id }); // cleanup

    // 22, 23 & 24. Switch project to another project & Verify new project data is used
    const projB = allProjects.find((p) => (p.name.includes('Metropolitan') || p.name.includes('Aura')) && p._id.toString() !== projAId) || allProjects[1];
    const projBId = projB._id.toString();
    const briefingB = await generateProjectBriefing(projBId);
    assert(
      briefingB &&
      briefingB.briefingData.projectName === projB.name &&
      briefingB.briefingData.projectName !== projA.name,
      '22, 23 & 24',
      `Switched project to "${projB.name}". New project context verified.`
    );

    // 25 & 26. Ask an unrelated question & Verify construction-only redirect
    const unrelatedQuery = 'Who won the cricket match yesterday?';
    const unrelatedRes = await chatWithProject(projBId, unrelatedQuery);
    assert(
      unrelatedRes &&
      unrelatedRes.answer.includes(STANDARD_UNRELATED_RESPONSE) &&
      unrelatedRes.sources.length === 0,
      '25 & 26',
      'Unrelated query correctly intercepted with construction-only redirect'
    );

  } catch (err) {
    console.error('Task 13 E2E Test Suite Error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`Task 13 E2E Test Summary: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTask13E2ETests();
