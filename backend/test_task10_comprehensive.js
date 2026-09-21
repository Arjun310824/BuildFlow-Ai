import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function runTask10Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING TASK 10 COMPREHENSIVE 16-POINT TEST SUITE');
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
  // Test 1: Simple project question
  // -------------------------------------------------------------
  console.log('[Test 1] Simple project question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'What is the current progress and location of this project?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(typeof d.answer === 'string' && d.answer.length > 20, 'Generated valid answer');
    assert(Array.isArray(d.sources), 'Sources is an array');
    assert(d.sources.some((s) => s.type === 'project'), 'Source includes Project Data');
    assert(!d.sources.some((s) => s.type === 'document' || s.type === 'image'), 'No fake document or image source');
    assert(['High', 'Medium', 'Low'].includes(d.confidence), `Confidence is valid enum: ${d.confidence}`);
  } catch (err) {
    assert(false, `Test 1 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: Task question
  // -------------------------------------------------------------
  console.log('\n[Test 2] Task question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'Which tasks are currently delayed?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'tasks'), 'Source includes Task Data');
    assert(d.confidence === 'High', 'Confidence is High for direct task query');
  } catch (err) {
    assert(false, `Test 2 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Material question
  // -------------------------------------------------------------
  console.log('\n[Test 3] Material question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'What materials are running low in stock?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'materials'), 'Source includes Material Data');
    assert(d.confidence === 'High', 'Confidence is High for direct material query');
  } catch (err) {
    assert(false, `Test 3 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: All-project question
  // -------------------------------------------------------------
  console.log('\n[Test 4] All-project question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'all',
        message: 'Which projects currently have schedule risks?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'project' || s.type === 'tasks'), 'Sources include Project/Task Data');
    assert(d.confidence === 'High', 'Confidence is High');
  } catch (err) {
    assert(false, `Test 4 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: PDF question
  // -------------------------------------------------------------
  console.log('\n[Test 5] PDF question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Summarize the attached construction document.',
        documents: [{ data: samplePdfBase64, mimeType: 'application/pdf', name: 'structural_report.pdf', size: 500 }],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    const docSrc = d.sources.find((s) => s.type === 'document');
    assert(!!docSrc, 'Source includes Uploaded Document');
    assert(docSrc?.label.includes('structural_report.pdf'), `Document label includes filename: ${docSrc?.label}`);
    assert(!d.sources.some((s) => s.type === 'image'), 'No fake image source in PDF question');
  } catch (err) {
    assert(false, `Test 5 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6: Image question
  // -------------------------------------------------------------
  console.log('\n[Test 6] Image question');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Inspect this site photograph.',
        images: [{ data: samplePngBase64, mimeType: 'image/png', name: 'column_inspection.png', size: 200 }],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    const imgSrc = d.sources.find((s) => s.type === 'image');
    assert(!!imgSrc, 'Source includes Uploaded Image');
    assert(imgSrc?.label.includes('column_inspection.png'), `Image label includes filename: ${imgSrc?.label}`);
    assert(!d.sources.some((s) => s.type === 'document'), 'No fake document source in image question');
  } catch (err) {
    assert(false, `Test 6 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 7: PDF + project data
  // -------------------------------------------------------------
  console.log('\n[Test 7] PDF + project data');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'Correlate this specification with the current project status.',
        documents: [{ data: samplePdfBase64, mimeType: 'application/pdf', name: 'spec_v2.pdf', size: 500 }],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'document'), 'Includes document source');
    assert(d.sources.some((s) => s.type === 'project' || s.type === 'tasks'), 'Includes project database source');
  } catch (err) {
    assert(false, `Test 7 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8: Image + project data
  // -------------------------------------------------------------
  console.log('\n[Test 8] Image + project data');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'Compare visible progress with the recorded project progress.',
        images: [{ data: samplePngBase64, mimeType: 'image/png', name: 'site_overview.png', size: 200 }],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'image'), 'Includes image source');
    assert(d.sources.some((s) => s.type === 'project'), 'Includes project database source');
  } catch (err) {
    assert(false, `Test 8 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 9: PDF + image + project data
  // -------------------------------------------------------------
  console.log('\n[Test 9] PDF + image + project data (Multimodal Combined)');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'Correlate document, site photo, and live database metrics.',
        documents: [{ data: samplePdfBase64, mimeType: 'application/pdf', name: 'drawing.pdf', size: 500 }],
        images: [{ data: samplePngBase64, mimeType: 'image/png', name: 'slab.png', size: 200 }],
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'document'), 'Contains document source');
    assert(d.sources.some((s) => s.type === 'image'), 'Contains image source');
    assert(d.sources.some((s) => s.type === 'project' || s.type === 'tasks'), 'Contains database source');
  } catch (err) {
    assert(false, `Test 9 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Risk analysis with source grounding
  // -------------------------------------------------------------
  console.log('\n[Test 10] Risk analysis with source grounding');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'What needs immediate attention and why is this project at risk?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(d.sources.some((s) => s.type === 'tasks'), 'Schedule risks supported by Task Data');
    assert(d.sources.some((s) => s.type === 'materials'), 'Material risks supported by Material Data');
    assert(d.confidence === 'High', 'Confidence is High for deterministic risk analysis');
  } catch (err) {
    assert(false, `Test 10 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 11: Conflicting document / database information
  // -------------------------------------------------------------
  console.log('\n[Test 11] Conflicting document / database information');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'The contractor invoice document says the Foundation work is 95% finished and approved. What is the status in BuildOps records?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(
      d.answer.toLowerCase().includes('discrepancy') ||
      d.answer.toLowerCase().includes('in progress') ||
      d.answer.toLowerCase().includes('delayed') ||
      d.answer.toLowerCase().includes('40%'),
      'Identifies variance between claim and database'
    );
  } catch (err) {
    assert(false, `Test 11 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 12: Missing information
  // -------------------------------------------------------------
  console.log('\n[Test 12] Missing information');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'What is the certified LEED Gold Environmental Audit registration number for this project?',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(
      d.answer.toLowerCase().includes("don't have enough information") ||
      d.answer.toLowerCase().includes('not available') ||
      d.answer.toLowerCase().includes('insufficient') ||
      d.confidence === 'Low',
      'Acknowledges missing information without hallucinating'
    );
  } catch (err) {
    assert(false, `Test 12 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 13: Existing conversation history persistence of sources & confidence
  // -------------------------------------------------------------
  console.log('\n[Test 13] Conversation history persistence of sources & confidence');
  try {
    // 1. Create a conversation
    const cRes = await fetch(`${API_BASE}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Task 10 Verification Chat',
        projectId: PROJECT_ID,
      }),
    });
    const cData = await cRes.json();
    assert(cData.success === true, 'Created conversation successfully');
    const convId = cData.data._id || cData.data.id;

    // 2. Send a message to the conversation
    const mRes = await fetch(`${API_BASE}/ai/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Which tasks are delayed?',
        projectId: PROJECT_ID,
      }),
    });
    const mData = await mRes.json();
    assert(mData.success === true, 'Sent message to conversation');
    assert(Array.isArray(mData.sources), 'Returns sources array in conversation message');
    assert(['High', 'Medium', 'Low'].includes(mData.confidence), `Returns confidence: ${mData.confidence}`);

    // 3. Fetch conversation from MongoDB and verify sources and confidence are stored on assistant message
    const getRes = await fetch(`${API_BASE}/ai/conversations/${convId}`);
    const getData = await getRes.json();
    const assistantMsg = getData.data.messages.find((m) => m.role === 'assistant');
    assert(!!assistantMsg, 'Assistant message saved in MongoDB');
    assert(Array.isArray(assistantMsg.sources) && assistantMsg.sources.length > 0, 'Sources persisted in MongoDB message');
    assert(['High', 'Medium', 'Low'].includes(assistantMsg.confidence), `Confidence persisted in MongoDB: ${assistantMsg.confidence}`);

    // 4. Cleanup test conversation
    await fetch(`${API_BASE}/ai/conversations/${convId}`, { method: 'DELETE' });
  } catch (err) {
    assert(false, `Test 13 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 14: Unrelated question
  // -------------------------------------------------------------
  console.log('\n[Test 14] Unrelated question (Zero fake sources)');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me a funny joke',
      }),
    });
    const d = await res.json();
    assert(d.success === true, 'Response status is success: true');
    assert(Array.isArray(d.sources) && d.sources.length === 0, 'Zero fake database sources for unrelated question');
    assert(d.answer.includes('BuildOps AI, focused on construction'), 'Redirects politely to construction domain');
  } catch (err) {
    assert(false, `Test 14 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 15: Gemini / API failure resilience
  // -------------------------------------------------------------
  console.log('\n[Test 15] API failure resilience');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '   ',
        images: [],
        documents: [],
      }),
    });
    assert(res.status === 400, 'Empty message rejected with HTTP 400');
  } catch (err) {
    assert(false, `Test 15 failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 16: Verify no fake sources
  // -------------------------------------------------------------
  console.log('\n[Test 16] Verify strict source accuracy (No fake sources)');
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'What is the project start date?',
      }),
    });
    const d = await res.json();
    assert(!d.sources.some((s) => s.type === 'document'), 'No document source claimed when no document was attached');
    assert(!d.sources.some((s) => s.type === 'image'), 'No image source claimed when no image was attached');
    assert(d.sources.some((s) => s.type === 'project'), 'Properly cites Project Data');
  } catch (err) {
    assert(false, `Test 16 failed: ${err.message}`);
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

runTask10Tests();
