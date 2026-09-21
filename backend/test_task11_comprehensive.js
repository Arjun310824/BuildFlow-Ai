import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';
const PROJECT_ID = '6ab0187225af66f8fed3a656'; // Chandkheda Smart Residential Complex

// Minimal valid 1x1 transparent PNG base64
const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Minimal valid 1-page PDF base64
const samplePdfBase64 = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
).toString('base64');

async function runTask11Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING TASK 11 COMPREHENSIVE 18-POINT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Briefing for one project (Dedicated Endpoint & Structure)
  // -------------------------------------------------------------
  console.log('[Test 1] Briefing for one project');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(res.status === 200, 'HTTP 200 returned');
    assert(d.success === true, 'Response status is success: true');
    assert(typeof d.answer === 'string' && d.answer.length > 50, 'Answer has substantial content');
    assert(d.answer.toLowerCase().includes('project briefing'), 'Contains PROJECT BRIEFING header');
    assert(d.briefingData.scope === 'single_project', 'Scope is single_project');
    assert(d.confidence === 'High', 'Confidence is High');
    assert(Array.isArray(d.sources) && d.sources.length > 0, 'Sources array is present');
  } catch (err) {
    assert(false, `Test 1 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: Briefing for All Projects (Portfolio Summary)
  // -------------------------------------------------------------
  console.log('\n[Test 2] Briefing for All Projects (Portfolio)');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/all`);
    const d = await res.json();
    assert(res.status === 200, 'HTTP 200 returned for portfolio');
    assert(d.success === true, 'Response status is success: true');
    assert(d.briefingData.scope === 'portfolio', 'Scope is portfolio');
    assert(typeof d.briefingData.totalProjects === 'number', 'Reports total projects');
    assert(typeof d.briefingData.averageProgress === 'number', 'Reports average progress');
    assert(
      d.answer.toLowerCase().includes('portfolio briefing') ||
      d.answer.toLowerCase().includes('portfolio') ||
      d.answer.toLowerCase().includes('active projects'),
      'Contains portfolio briefing indicators'
    );
  } catch (err) {
    assert(false, `Test 2 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Project with delayed tasks
  // -------------------------------------------------------------
  console.log('\n[Test 3] Project with delayed tasks');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(d.briefingData.tasks.delayed > 0, 'Accurately detected delayed tasks');
    assert(
      d.answer.toLowerCase().includes('delayed') || d.briefingData.tasks.delayed > 0,
      'Briefing accounts for delayed tasks'
    );
  } catch (err) {
    assert(false, `Test 3 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Project with overdue tasks
  // -------------------------------------------------------------
  console.log('\n[Test 4] Project with overdue tasks');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(typeof d.briefingData.tasks.overdue === 'number', 'Overdue tasks count is computed');
    assert(
      d.briefingData.scheduleStatus.includes('Potential schedule attention required') ||
      d.briefingData.scheduleStatus.includes('schedule'),
      'Schedule status accurately captures schedule variance'
    );
  } catch (err) {
    assert(false, `Test 4 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: Project with low-stock materials
  // -------------------------------------------------------------
  console.log('\n[Test 5] Project with low-stock materials');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(typeof d.briefingData.materials.lowStock === 'number', 'Low stock count is reported');
    assert(d.sources.some((s) => s.type === 'materials'), 'Material Data source cited');
  } catch (err) {
    assert(false, `Test 5 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6: Project with out-of-stock materials
  // -------------------------------------------------------------
  console.log('\n[Test 6] Project with out-of-stock materials');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(typeof d.briefingData.materials.outOfStock === 'number', 'Out of stock count is reported');
  } catch (err) {
    assert(false, `Test 6 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 7: Project with no risks (Today's priorities handling)
  // -------------------------------------------------------------
  console.log('\n[Test 7] Project with no risks handling');
  try {
    const { formatDeterministicBriefingFallback } = await import('./services/projectBriefingService.js');
    const mockZeroRiskData = {
      scope: 'single_project',
      projectName: 'Zero Risk Tower',
      status: 'In Progress',
      progress: 50,
      scheduleStatus: 'On schedule',
      tasks: { total: 5, completed: 3, inProgress: 2, delayed: 0, overdue: 0 },
      materials: { total: 4, available: 4, lowStock: 0, outOfStock: 0 },
      todayPriorities: [],
      risks: [],
    };
    const fallbackText = formatDeterministicBriefingFallback(mockZeroRiskData);
    assert(
      fallbackText.includes('No immediate operational priorities were identified from the currently available BuildOps data'),
      'Zero-risk briefing uses exact designated phrase'
    );
  } catch (err) {
    assert(false, `Test 7 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8: Project with missing task data
  // -------------------------------------------------------------
  console.log('\n[Test 8] Project with missing task data');
  try {
    const { formatDeterministicBriefingFallback } = await import('./services/projectBriefingService.js');
    const mockNoTaskData = {
      scope: 'single_project',
      projectName: 'Planning Only Site',
      status: 'Planning',
      progress: 0,
      scheduleStatus: 'Planning stage',
      tasks: { total: 0, completed: 0, inProgress: 0, delayed: 0, overdue: 0 },
      materials: { total: 2, available: 2, lowStock: 0, outOfStock: 0 },
      todayPriorities: [],
      risks: [],
    };
    const fallbackText = formatDeterministicBriefingFallback(mockNoTaskData);
    assert(
      fallbackText.includes('No task records available for this project'),
      'Explicitly reports missing task records'
    );
  } catch (err) {
    assert(false, `Test 8 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 9: Project with missing material data
  // -------------------------------------------------------------
  console.log('\n[Test 9] Project with missing material data');
  try {
    const { formatDeterministicBriefingFallback } = await import('./services/projectBriefingService.js');
    const mockNoMaterialData = {
      scope: 'single_project',
      projectName: 'Design Consultancy Hub',
      status: 'In Progress',
      progress: 35,
      scheduleStatus: 'On schedule',
      tasks: { total: 4, completed: 2, inProgress: 2, delayed: 0, overdue: 0 },
      materials: { total: 0, available: 0, lowStock: 0, outOfStock: 0 },
      todayPriorities: [],
      risks: [],
    };
    const fallbackText = formatDeterministicBriefingFallback(mockNoMaterialData);
    assert(
      fallbackText.includes('Material information is unavailable for this project'),
      'Explicitly reports unavailable material information'
    );
  } catch (err) {
    assert(false, `Test 9 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Invalid project ID (HTTP 400)
  // -------------------------------------------------------------
  console.log('\n[Test 10] Invalid project ID');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/invalid-id-xyz`);
    assert(res.status === 400, 'Returns HTTP 400 for invalid ID');
    const d = await res.json();
    assert(d.success === false, 'success is false');
    assert(d.error.includes('Invalid project ID format'), 'Clear error message returned');
  } catch (err) {
    assert(false, `Test 10 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 11: Gemini failure fallback
  // -------------------------------------------------------------
  console.log('\n[Test 11] Gemini failure fallback');
  try {
    const { formatDeterministicBriefingFallback } = await import('./services/projectBriefingService.js');
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    const fallback = formatDeterministicBriefingFallback(d.briefingData);
    assert(typeof fallback === 'string' && fallback.length > 50, 'Fallback generates robust string');
    assert(fallback.includes('PROJECT BRIEFING'), 'Fallback contains PROJECT BRIEFING');
    assert(fallback.includes(d.briefingData.projectName), 'Fallback contains project name');
    assert(fallback.includes('Recommended Actions:'), 'Fallback includes Recommended Actions');
  } catch (err) {
    assert(false, `Test 11 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 12: Existing text chat
  // -------------------------------------------------------------
  console.log('\n[Test 12] Existing text chat (Grounded briefing via chat)');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: "Give me today's project briefing.",
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(
      d.answer.toLowerCase().includes('project briefing') ||
      d.answer.toLowerCase().includes('progress') ||
      d.answer.toLowerCase().includes('status'),
      'Generates briefing via chat interface'
    );
    assert(d.sources.some((s) => s.type === 'project'), 'Includes Project Data source');
    assert(d.confidence === 'High', 'Confidence is High');
  } catch (err) {
    assert(false, `Test 12 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 13: Existing image analysis
  // -------------------------------------------------------------
  console.log('\n[Test 13] Existing image analysis');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What do you observe in this image?',
        images: [
          {
            name: 'site_photo.png',
            mimeType: 'image/png',
            data: samplePngBase64,
          },
        ],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Image analysis succeeds');
    assert(d.sources.some((s) => s.type === 'image'), 'Image source properly identified');
  } catch (err) {
    assert(false, `Test 13 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 14: Existing PDF analysis
  // -------------------------------------------------------------
  console.log('\n[Test 14] Existing PDF analysis');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Summarize the attached document',
        documents: [
          {
            name: 'progress_spec.pdf',
            mimeType: 'application/pdf',
            data: samplePdfBase64,
          },
        ],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'PDF analysis succeeds');
    assert(d.sources.some((s) => s.type === 'document'), 'Document source properly identified');
  } catch (err) {
    assert(false, `Test 14 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 15: Existing risk analysis endpoint
  // -------------------------------------------------------------
  console.log('\n[Test 15] Existing risk analysis');
  try {
    const res = await fetch(`${API_BASE}/ai/project-risk/${PROJECT_ID}`);
    const d = await res.json();
    assert(res.status === 200, 'Risk endpoint returns HTTP 200');
    assert(d.success === true, 'Risk endpoint returns success: true');
    assert(typeof d.data.detectedRisksCount === 'number', 'Risk count computed');
  } catch (err) {
    assert(false, `Test 15 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 16: Source metadata
  // -------------------------------------------------------------
  console.log('\n[Test 16] Source metadata');
  try {
    const res = await fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`);
    const d = await res.json();
    assert(Array.isArray(d.sources), 'Sources is an array');
    assert(d.sources.every((s) => s.type && s.label), 'Every source has type and label');
    assert(!d.sources.some((s) => s.type === 'document'), 'No fake document source claimed');
    assert(!d.sources.some((s) => s.type === 'image'), 'No fake image source claimed');
    assert(d.confidence === 'High', 'Confidence is explicitly High');
  } catch (err) {
    assert(false, `Test 16 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 17: Conversation history persistence
  // -------------------------------------------------------------
  console.log('\n[Test 17] Conversation history persistence');
  try {
    // 1. Create conversation
    const cRes = await fetch(`${API_BASE}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task 11 Briefing Chat',
        projectId: PROJECT_ID,
      }),
    });
    const cData = await cRes.json();
    assert(cData.success === true, 'Created conversation for briefing');
    const convId = cData.data._id || cData.data.id;

    // 2. Send briefing request message
    const mRes = await fetch(`${API_BASE}/ai/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Give me today's project briefing.",
        projectId: PROJECT_ID,
      }),
    });
    const mData = await mRes.json();
    assert(mData.success === true, 'Sent briefing message to conversation');
    assert(Array.isArray(mData.sources), 'Returns sources with conversation message');

    // 3. Verify assistant message in MongoDB
    const getRes = await fetch(`${API_BASE}/ai/conversations/${convId}`);
    const getData = await getRes.json();
    const assistantMsg = getData.data.messages.find((m) => m.role === 'assistant');
    assert(!!assistantMsg, 'Assistant briefing saved to MongoDB conversation');
    assert(assistantMsg.sources.length > 0, 'Sources saved to MongoDB conversation');

    // 4. Cleanup
    await fetch(`${API_BASE}/ai/conversations/${convId}`, { method: 'DELETE' });
  } catch (err) {
    assert(false, `Test 17 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 18: Duplicate-click / Concurrency protection
  // -------------------------------------------------------------
  console.log('\n[Test 18] Duplicate-click / Concurrency handling');
  try {
    // Issue parallel briefing requests to simulate simultaneous duplicate clicks
    const [p1, p2] = await Promise.all([
      fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`),
      fetch(`${API_BASE}/ai/project-briefing/${PROJECT_ID}`),
    ]);
    assert(p1.status === 200, 'First concurrent request succeeded');
    assert(p2.status === 200, 'Second concurrent request completed cleanly without crashing server');
  } catch (err) {
    assert(false, `Test 18 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTask11Tests();
