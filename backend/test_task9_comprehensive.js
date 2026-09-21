import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { calculateProjectRisksFromData, RISK_CATEGORIES, RISK_SEVERITY } from './services/riskAnalysisService.js';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING TASK 9 COMPREHENSIVE 16-POINT TEST SUITE');
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

  const now = new Date('2026-09-21T00:00:00Z');

  // -------------------------------------------------------------
  // Test 1: Project with no risks
  // -------------------------------------------------------------
  console.log('[Test 1] Project with no risks');
  const cleanProject = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Ideal Tower',
    progress: 65,
    status: 'In Progress',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-12-31'),
  };
  const cleanTasks = [
    { title: 'Excavation', status: 'Completed', priority: 'Medium', progress: 100, dueDate: new Date('2026-03-01') },
    { title: 'Framing', status: 'In Progress', priority: 'Medium', progress: 50, dueDate: new Date('2026-10-01') },
  ];
  const cleanMaterials = [
    { name: 'Sand', status: 'In Stock', availableQuantity: 500, requiredQuantity: 500, unit: 'Tons' },
  ];
  const res1 = calculateProjectRisksFromData(cleanProject, cleanTasks, cleanMaterials, now);
  assert(res1.detectedRisksCount === 0, 'Detected risks count is 0');
  assert(res1.overallRiskLevel === RISK_SEVERITY.LOW, 'Overall risk level is Low');
  assert(res1.message.includes('No significant operational risks were detected'), 'Returns exact no-risk message');
  assert(res1.safetyNotice.includes('No structural safety conclusion can be made'), 'Includes safety notice');

  // -------------------------------------------------------------
  // Test 2: Project with overdue task
  // -------------------------------------------------------------
  console.log('\n[Test 2] Project with overdue task');
  const overdueTasks = [
    { title: 'Electrical Wiring', status: 'In Progress', priority: 'Medium', progress: 40, dueDate: new Date('2026-09-10') },
  ];
  const res2 = calculateProjectRisksFromData(cleanProject, overdueTasks, cleanMaterials, now);
  assert(res2.detectedRisksCount >= 1, 'Detected at least 1 risk');
  const schedRisk2 = res2.risks.find((r) => r.category === RISK_CATEGORIES.SCHEDULE);
  assert(!!schedRisk2, 'Identified Schedule Risk');
  assert(schedRisk2.evidence.some((e) => e.includes('Electrical Wiring')), 'Evidence contains overdue task name');

  // -------------------------------------------------------------
  // Test 3: Project with delayed task
  // -------------------------------------------------------------
  console.log('\n[Test 3] Project with delayed task');
  const delayedTasks = [
    { title: 'Plumbing Rough-in', status: 'Delayed', priority: 'Medium', progress: 20, dueDate: new Date('2026-10-15') },
  ];
  const res3 = calculateProjectRisksFromData(cleanProject, delayedTasks, cleanMaterials, now);
  assert(res3.detectedRisksCount >= 1, 'Detected delayed task risk');
  assert(res3.risks.some((r) => r.category === RISK_CATEGORIES.SCHEDULE), 'Categorized as Schedule Risk');

  // -------------------------------------------------------------
  // Test 4: Project with high-priority delayed task
  // -------------------------------------------------------------
  console.log('\n[Test 4] Project with high-priority delayed task');
  const highPriorityDelayed = [
    { title: 'Main Core Concrete Pour', status: 'Delayed', priority: 'High', progress: 30, dueDate: new Date('2026-09-15') },
  ];
  const res4 = calculateProjectRisksFromData(cleanProject, highPriorityDelayed, cleanMaterials, now);
  const hpRisk = res4.risks.find((r) => r.category === RISK_CATEGORIES.SCHEDULE);
  assert(hpRisk?.severity === RISK_SEVERITY.HIGH, 'Classified as High severity');
  assert(hpRisk?.title.includes('High/Critical Priority'), 'Title reflects high priority');

  // -------------------------------------------------------------
  // Test 5: Project with low-stock material
  // -------------------------------------------------------------
  console.log('\n[Test 5] Project with low-stock material');
  const lowStockMaterials = [
    { name: 'Ceramic Floor Tiles', category: 'Finishes', status: 'Low Stock', availableQuantity: 20, requiredQuantity: 200, unit: 'Boxes' },
  ];
  const res5 = calculateProjectRisksFromData(cleanProject, cleanTasks, lowStockMaterials, now);
  const matRisk5 = res5.risks.find((r) => r.category === RISK_CATEGORIES.MATERIAL);
  assert(!!matRisk5, 'Detected Material Risk');
  assert(matRisk5?.severity === RISK_SEVERITY.MEDIUM, 'Medium severity for standard material');
  assert(matRisk5?.evidence[0].includes('Ceramic Floor Tiles'), 'Evidence contains low stock material name');

  // -------------------------------------------------------------
  // Test 6: Project with out-of-stock material
  // -------------------------------------------------------------
  console.log('\n[Test 6] Project with out-of-stock material');
  const outOfStockMaterials = [
    { name: 'Main Power Transformers', category: 'Electrical', status: 'Out of Stock', availableQuantity: 0, requiredQuantity: 4, unit: 'Units' },
  ];
  const res6 = calculateProjectRisksFromData(cleanProject, cleanTasks, outOfStockMaterials, now);
  const matRisk6 = res6.risks.find((r) => r.category === RISK_CATEGORIES.MATERIAL);
  assert(matRisk6?.severity === RISK_SEVERITY.CRITICAL, 'Classified as Critical severity');
  assert(res6.overallRiskLevel === RISK_SEVERITY.CRITICAL, 'Overall project risk elevated to Critical');

  // -------------------------------------------------------------
  // Test 7: Multiple simultaneous risks
  // -------------------------------------------------------------
  console.log('\n[Test 7] Multiple simultaneous risks');
  const res7 = calculateProjectRisksFromData(cleanProject, highPriorityDelayed, lowStockMaterials, now);
  assert(res7.detectedRisksCount >= 3, `Detected ${res7.detectedRisksCount} risks (expected >= 3)`);
  assert(res7.risks.some((r) => r.category === RISK_CATEGORIES.OPERATIONAL), 'Compound Operational Risk detected');

  // -------------------------------------------------------------
  // Test 8: All-project risk analysis API
  // -------------------------------------------------------------
  console.log('\n[Test 8] All-project risk analysis API (GET /api/ai/project-risk/all)');
  try {
    const r8 = await fetch(`${API_BASE}/ai/project-risk/all`);
    const d8 = await r8.json();
    assert(d8.success === true, 'API returns success: true');
    assert(d8.data.totalProjectsCount > 0, `Returns ${d8.data.totalProjectsCount} total projects`);
    assert(Array.isArray(d8.data.portfolioRisks), 'portfolioRisks is an array');
    assert(d8.data.safetyNotice.length > 0, 'safetyNotice is returned');
  } catch (err) {
    assert(false, `API call failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 9: Invalid project ID handling
  // -------------------------------------------------------------
  console.log('\n[Test 9] Invalid project ID handling');
  try {
    const r9a = await fetch(`${API_BASE}/ai/project-risk/invalid-id-xyz`);
    assert(r9a.status === 400, 'Invalid ObjectId format returns HTTP 400');

    const r9b = await fetch(`${API_BASE}/ai/project-risk/507f1f77bcf86cd799439011`);
    assert(r9b.status === 404, 'Non-existent project returns HTTP 404');
  } catch (err) {
    assert(false, `Invalid ID test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Project with no tasks
  // -------------------------------------------------------------
  console.log('\n[Test 10] Project with no tasks');
  const res10 = calculateProjectRisksFromData(cleanProject, [], cleanMaterials, now);
  assert(res10.projectId === cleanProject._id, 'Handles empty tasks list safely');
  assert(typeof res10.detectedRisksCount === 'number', 'Returns valid metrics');

  // -------------------------------------------------------------
  // Test 11: Project with no materials
  // -------------------------------------------------------------
  console.log('\n[Test 11] Project with no materials');
  const res11 = calculateProjectRisksFromData(cleanProject, cleanTasks, [], now);
  assert(res11.projectId === cleanProject._id, 'Handles empty materials list safely');
  assert(typeof res11.detectedRisksCount === 'number', 'Returns valid metrics');

  // -------------------------------------------------------------
  // Test 12: Gemini failure resilience / safe error handling
  // -------------------------------------------------------------
  console.log('\n[Test 12] Error handling resilience');
  try {
    const r12 = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', images: [], documents: [] }),
    });
    assert(r12.status === 400, 'Empty chat message rejected with HTTP 400');
  } catch (err) {
    assert(false, `Error test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 13: Existing text chat with real project context
  // -------------------------------------------------------------
  console.log('\n[Test 13] Existing text chat with real project context');
  try {
    const r13 = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: '6ab0187225af66f8fed3a656', // Chandkheda
        message: 'Are there any risks in this project?',
      }),
    });
    const d13 = await r13.json();
    assert(d13.success === true, 'Chat responds with success: true');
    assert(typeof d13.answer === 'string' && d13.answer.length > 50, 'Chat answer generated');
    assert(
      d13.answer.toLowerCase().includes('risk') || d13.answer.toLowerCase().includes('schedule') || d13.answer.toLowerCase().includes('material'),
      'Chat response addresses project risks with evidence'
    );
  } catch (err) {
    assert(false, `Chat call failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 14: Existing image analysis regression
  // -------------------------------------------------------------
  console.log('\n[Test 14] Existing image analysis regression');
  try {
    // 1x1 transparent PNG
    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const r14 = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Inspect this site image for visible structural rebar.',
        images: [{ data: tinyPng, mimeType: 'image/png', name: 'site_test.png', size: 100 }],
      }),
    });
    const d14 = await r14.json();
    assert(d14.success === true, 'Multimodal image analysis functions correctly');
    assert(d14.answer.length > 0, 'Image analysis answer returned');
  } catch (err) {
    assert(false, `Image analysis failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 15: Existing PDF analysis regression
  // -------------------------------------------------------------
  console.log('\n[Test 15] Existing PDF analysis regression');
  try {
    // Minimal valid 1-page PDF
    const minimalPdfBase64 = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
    ).toString('base64');

    const r15 = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Summarize the attached construction document.',
        documents: [{ data: minimalPdfBase64, mimeType: 'application/pdf', name: 'specification.pdf', size: 300 }],
      }),
    });
    const d15 = await r15.json();
    assert(d15.success === true, 'PDF document analysis functions correctly');
    assert(d15.answer.length > 0, 'PDF analysis answer returned');
  } catch (err) {
    assert(false, `PDF analysis failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 16: Existing conversation history regression
  // -------------------------------------------------------------
  console.log('\n[Test 16] Existing conversation history regression');
  try {
    const r16 = await fetch(`${API_BASE}/ai/conversations`);
    const d16 = await r16.json();
    assert(d16.success === true, 'Conversations endpoint returns HTTP 200 with success: true');
    assert(Array.isArray(d16.data), 'Conversations list is an array');
  } catch (err) {
    assert(false, `Conversations failed: ${err.message}`);
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

runTests();
