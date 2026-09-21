import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }

  return { status: response.status, ok: response.ok, data };
}

async function runAuditTests() {
  console.log('====================================================');
  console.log('BUILD OPS AI — TASK 14 INTEGRATION & API AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // ----------------------------------------------------
  // 1. Health Endpoint & Base URL Check
  // ----------------------------------------------------
  console.log('--- 1. Health Endpoint & Base URL Check ---');
  const healthRes = await request('/health');
  assert(healthRes.status === 200, 'GET /api/health returns 200');
  assert(healthRes.data?.status === 'ok', 'Health status is ok');

  // ----------------------------------------------------
  // 2. Projects API CRUD & Validation
  // ----------------------------------------------------
  console.log('\n--- 2. Projects API CRUD & Validation ---');
  const projectsRes = await request('/projects');
  assert(projectsRes.status === 200 && projectsRes.data?.success === true, 'GET /api/projects returns 200 with success: true');
  assert(Array.isArray(projectsRes.data?.data) && projectsRes.data.data.length > 0, `Projects list contains real projects (count: ${projectsRes.data?.data?.length})`);

  const realProject = projectsRes.data.data[0];
  const realProjectId = realProject._id || realProject.id;
  assert(/^[0-9a-fA-F]{24}$/.test(realProjectId), `Project uses valid MongoDB ObjectId: ${realProjectId}`);

  // Test GET project by ID
  const singleProjRes = await request(`/projects/${realProjectId}`);
  assert(singleProjRes.status === 200 && singleProjRes.data?.data?._id === realProjectId, `GET /api/projects/:id returns matching project (${realProject.name})`);

  // Test invalid ObjectId rejection
  const invalidProjRes = await request('/projects/PRJ-101');
  assert(invalidProjRes.status === 400 && invalidProjRes.data?.success === false, 'GET /api/projects/PRJ-101 correctly rejected with 400 Bad Request');
  assert(invalidProjRes.data?.message?.includes('Invalid project ID format'), 'Invalid ID returns clear human-readable error message');

  // Test POST project validation (end date < start date failure)
  const invalidDateProjRes = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid Date Audit Project',
      client: 'Audit Client',
      location: 'Audit Site',
      manager: 'Alex Morgan',
      startDate: '2026-10-01',
      endDate: '2026-05-01', // Before start date
      status: 'Planning',
      risk: 'Low',
    }),
  });
  assert(invalidDateProjRes.status === 400 && invalidDateProjRes.data?.success === false, 'POST /api/projects correctly rejects endDate < startDate');

  // Test POST valid project creation
  const createProjRes = await request('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Task 14 Audit Temp Project',
      client: 'Apex Infrastructure Group',
      location: 'Sector 5 Construction Zone',
      manager: 'Alex Morgan',
      startDate: '2026-10-01',
      endDate: '2027-06-30',
      progress: 5,
      status: 'Planning',
      risk: 'Low',
    }),
  });
  assert(createProjRes.status === 201 && createProjRes.data?.success === true, 'POST /api/projects creates new project successfully (201 Created)');
  const createdProjId = createProjRes.data?.data?._id;

  // Test PUT project update
  if (createdProjId) {
    const updateProjRes = await request(`/projects/${createdProjId}`, {
      method: 'PUT',
      body: JSON.stringify({
        progress: 15,
        status: 'In Progress',
        risk: 'Medium',
      }),
    });
    assert(updateProjRes.status === 200 && updateProjRes.data?.data?.progress === 15, 'PUT /api/projects/:id updates project fields (progress: 15%)');

    // Test DELETE project
    const deleteProjRes = await request(`/projects/${createdProjId}`, {
      method: 'DELETE',
    });
    assert(deleteProjRes.status === 200 && deleteProjRes.data?.success === true, 'DELETE /api/projects/:id removes project successfully');
  }

  // ----------------------------------------------------
  // 3. AI Endpoints Integration
  // ----------------------------------------------------
  console.log('\n--- 3. AI Endpoints Integration ---');

  // GET /api/ai/projects
  const aiProjectsRes = await request('/ai/projects');
  assert(aiProjectsRes.status === 200 && aiProjectsRes.data?.success === true, 'GET /api/ai/projects returns real project metadata');

  // POST /api/ai/analyze-project
  const analyzeProjRes = await request('/ai/analyze-project', {
    method: 'POST',
    body: JSON.stringify({ projectId: realProjectId }),
  });
  assert(analyzeProjRes.status === 200 && analyzeProjRes.data?.success === true, 'POST /api/ai/analyze-project returns structured analysis');

  // POST /api/ai/chat (Text Q&A grounded in MongoDB)
  const chatTextRes = await request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      projectId: realProjectId,
      message: 'Which tasks are delayed in this project?',
    }),
  });
  assert(chatTextRes.status === 200 && chatTextRes.data?.success === true, 'POST /api/ai/chat (Text Q&A) responds with 200 OK');
  assert(Array.isArray(chatTextRes.data?.sources) && chatTextRes.data?.sources.length > 0, `Response includes grounded sources: ${chatTextRes.data?.sources?.join(', ')}`);
  assert(Boolean(chatTextRes.data?.confidence), `Response includes confidence score: ${chatTextRes.data?.confidence}`);

  // POST /api/ai/chat (Document/PDF analysis)
  const dummyPdfBase64 = 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA0IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoxNzUKJSVFT0YK';
  const chatDocRes = await request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      projectId: realProjectId,
      message: 'Analyze this inspection report for rebar compliance',
      documents: [{
        name: 'inspection_report.pdf',
        mimeType: 'application/pdf',
        data: `data:application/pdf;base64,${dummyPdfBase64}`,
        size: 2048,
      }],
    }),
  });
  assert(chatDocRes.status === 200 && chatDocRes.data?.success === true, 'POST /api/ai/chat (PDF Analysis) returns 200 OK with document evaluation');

  // POST /api/ai/chat (Image analysis)
  const dummyImageBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const chatImgRes = await request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      projectId: realProjectId,
      message: 'Inspect this site photo for safety and equipment',
      images: [{
        name: 'site_photo.jpg',
        mimeType: 'image/jpeg',
        data: `data:image/jpeg;base64,${dummyImageBase64}`,
        size: 1024,
      }],
    }),
  });
  assert(chatImgRes.status === 200 && chatImgRes.data?.success === true, 'POST /api/ai/chat (Image Analysis) returns 200 OK with site photo analysis');

  // GET /api/ai/project-risk/:projectId
  const riskRes = await request(`/ai/project-risk/${realProjectId}`);
  assert(riskRes.status === 200 && riskRes.data?.success === true, 'GET /api/ai/project-risk/:projectId returns deterministic risk analysis');

  // GET /api/ai/project-briefing/:projectId
  const briefingRes = await request(`/ai/project-briefing/${realProjectId}`);
  assert(briefingRes.status === 200 && briefingRes.data?.success === true, 'GET /api/ai/project-briefing/:projectId returns daily briefing');

  // POST /api/ai/generate-report
  const reportRes = await request('/ai/generate-report', {
    method: 'POST',
    body: JSON.stringify({
      projectId: realProjectId,
      reportType: 'Project Status Report',
    }),
  });
  assert(reportRes.status === 200 && reportRes.data?.success === true, 'POST /api/ai/generate-report generates structured project report');
  const reportTitle = reportRes.data?.reportData?.title || reportRes.data?.reportType || reportRes.data?.report?.reportType;
  assert(Boolean(reportTitle), `Report contains generated title or type: "${reportTitle}"`);

  // ----------------------------------------------------
  // 4. Conversation History Lifecycle
  // ----------------------------------------------------
  console.log('\n--- 4. Conversation History Lifecycle ---');

  // Create conversation
  const createConvRes = await request('/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Task 14 Audit Conversation',
      projectId: realProjectId,
      projectName: realProject.name,
      userId: 'audit-user',
    }),
  });
  assert(createConvRes.status === 201 && createConvRes.data?.success === true, 'POST /api/ai/conversations creates conversation');
  const convId = createConvRes.data?.data?._id;

  if (convId) {
    // Send message to conversation
    const sendMsgRes = await request(`/ai/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Give me a brief summary of this project.',
        projectId: realProjectId,
      }),
    });
    assert(sendMsgRes.status === 200 && sendMsgRes.data?.success === true, 'POST /api/ai/conversations/:id/messages adds message to conversation');

    // Load single conversation
    const loadConvRes = await request(`/ai/conversations/${convId}`);
    assert(loadConvRes.status === 200 && loadConvRes.data?.data?._id === convId, 'GET /api/ai/conversations/:id retrieves conversation with messages');
    assert(loadConvRes.data?.data?.messages?.length >= 1, `Messages array populated (${loadConvRes.data?.data?.messages?.length} message(s))`);

    // Delete conversation
    const deleteConvRes = await request(`/ai/conversations/${convId}`, {
      method: 'DELETE',
    });
    assert(deleteConvRes.status === 200 && deleteConvRes.data?.success === true, 'DELETE /api/ai/conversations/:id removes conversation');
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
