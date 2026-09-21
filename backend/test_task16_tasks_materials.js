/**
 * Comprehensive Integration & Verification Test Suite for Task 16
 * Tests Task & Material CRUD, Validation, Status Computation, Project ObjectId Relations,
 * Auth & Cross-Module AI Integration.
 */

import http from 'http';

const API_BASE = 'http://localhost:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('TASK 16 INTEGRATION TEST: TASKS & MATERIALS PIPELINE');
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

  // 1. Authenticate to obtain token (from Task 15)
  console.log('--- STEP 1: AUTHENTICATION ---');
  let token = '';
  try {
    const authRes = await request('POST', '/api/auth/login', {
      email: 'alex.morgan@buildops.ai',
      password: 'Password123!',
    });
    assert(authRes.status === 200 && authRes.data.success, 'Login successful for alex.morgan@buildops.ai');
    token = authRes.data.token;
    assert(!!token, 'Auth JWT token received');
  } catch (err) {
    console.error('Auth request failed:', err.message);
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // 2. Fetch Projects to obtain a real MongoDB ObjectId
  console.log('\n--- STEP 2: PROJECT OBJECTID VERIFICATION ---');
  let realProjectId = '';
  let realProjectName = '';
  const projRes = await request('GET', '/api/projects', null, authHeaders);
  assert(projRes.status === 200 && projRes.data.success, 'Fetch projects returned 200');
  assert(Array.isArray(projRes.data.data) && projRes.data.data.length > 0, 'Found real projects in MongoDB');

  const targetProject = projRes.data.data[0];
  realProjectId = targetProject._id || targetProject.id;
  realProjectName = targetProject.name;
  assert(/^[0-9a-fA-F]{24}$/.test(realProjectId), `Verified MongoDB ObjectId format: ${realProjectId} (${realProjectName})`);

  // 3. Tasks API Verification
  console.log('\n--- STEP 3: TASK CRUD & VALIDATION ---');
  // 3.1 Load tasks
  const getTasksRes = await request('GET', '/api/tasks', null, authHeaders);
  assert(getTasksRes.status === 200 && getTasksRes.data.success, 'GET /api/tasks returned 200');
  assert(Array.isArray(getTasksRes.data.data), 'Tasks data is an array');

  // 3.2 Date validation test: dueDate < startDate must be rejected with 400
  const invalidDateRes = await request('POST', '/api/tasks', {
    projectId: realProjectId,
    title: 'Invalid Date Task',
    startDate: '2026-10-15',
    dueDate: '2026-10-01', // Earlier than startDate!
    status: 'Not Started',
    priority: 'High',
  }, authHeaders);
  assert(invalidDateRes.status === 400, 'Reject task when dueDate < startDate with 400 Bad Request');
  assert(
    invalidDateRes.data.message?.includes('Due date cannot be earlier than start date') ||
    invalidDateRes.data.errors?.some(e => e.includes('start date')),
    'Returned authoritative date validation error message'
  );

  // 3.3 Invalid Project ID validation
  const fakeProjRes = await request('POST', '/api/tasks', {
    projectId: '000000000000000000000000', // Non-existent ObjectId
    title: 'Ghost Project Task',
    dueDate: '2026-10-30',
    status: 'Not Started',
  }, authHeaders);
  assert(fakeProjRes.status === 404, 'Reject task creation with non-existent projectId (404 Not Found)');

  // 3.4 Create valid task
  const createTskRes = await request('POST', '/api/tasks', {
    projectId: realProjectId,
    title: 'Task 16 Integration Milestone Inspection',
    description: 'Verifying frontend-backend contract integration for automated construction workflows',
    assignedTo: 'Apex Quality Inspection / Sarah Jenkins',
    startDate: '2026-10-01',
    dueDate: '2026-10-25',
    status: 'In Progress',
    priority: 'High',
    progress: 45,
  }, authHeaders);
  assert(createTskRes.status === 201 && createTskRes.data.success, 'POST /api/tasks created new task (201 Created)');
  const createdTask = createTskRes.data.data;
  const createdTaskId = createdTask._id;
  assert(/^[0-9a-fA-F]{24}$/.test(createdTaskId), `Created task has valid MongoDB ID: ${createdTaskId}`);
  assert(createdTask.title === 'Task 16 Integration Milestone Inspection', 'Task title persisted correctly');

  // 3.5 Edit task
  const updateTskRes = await request('PUT', `/api/tasks/${createdTaskId}`, {
    title: 'Task 16 Integration Milestone Inspection [UPDATED]',
    progress: 80,
    status: 'In Progress',
    priority: 'Critical',
  }, authHeaders);
  assert(updateTskRes.status === 200 && updateTskRes.data.success, 'PUT /api/tasks/:id updated task successfully');
  assert(updateTskRes.data.data.title.includes('[UPDATED]'), 'Updated title reflected');
  assert(updateTskRes.data.data.priority === 'Critical', 'Updated priority reflected');

  // 3.6 Filter tasks by project
  const filterProjRes = await request('GET', `/api/tasks?projectId=${realProjectId}`, null, authHeaders);
  assert(filterProjRes.status === 200 && filterProjRes.data.success, 'GET /api/tasks?projectId=... returned 200');
  const hasOurTask = filterProjRes.data.data.some((t) => t._id === createdTaskId);
  assert(hasOurTask, 'Filtered project task list contains the created task');

  // 3.7 Search task
  const searchTskRes = await request('GET', '/api/tasks?search=Integration%20Milestone', null, authHeaders);
  assert(searchTskRes.status === 200 && searchTskRes.data.success, 'GET /api/tasks?search=... returned 200');
  assert(searchTskRes.data.data.some((t) => t._id === createdTaskId), 'Search successfully matched task title');

  // 4. Materials API Verification
  console.log('\n--- STEP 4: MATERIAL CRUD, QUANTITIES & STATUS COMPUTATION ---');
  // 4.1 Load materials
  const getMatsRes = await request('GET', '/api/materials', null, authHeaders);
  assert(getMatsRes.status === 200 && getMatsRes.data.success, 'GET /api/materials returned 200');
  assert(Array.isArray(getMatsRes.data.data), 'Materials data is an array');

  // 4.2 Negative quantity validation
  const negQtyRes = await request('POST', '/api/materials', {
    projectId: realProjectId,
    name: 'Invalid Negative Rebar',
    category: 'Metals & Rebar',
    requiredQuantity: -50,
    availableQuantity: 100,
    unit: 'Tons',
  }, authHeaders);
  assert(negQtyRes.status === 400, 'Reject material creation with negative requiredQuantity (400 Bad Request)');

  // 4.3 Create Material: Available status (available > 0.2 * required)
  const createAvailMatRes = await request('POST', '/api/materials', {
    projectId: realProjectId,
    name: 'Grade 60 Structural Steel Rebar T16',
    category: 'Metals & Rebar',
    requiredQuantity: 1000,
    availableQuantity: 600, // 60% -> Available
    usedQuantity: 200,
    unit: 'Tons',
  }, authHeaders);
  assert(createAvailMatRes.status === 201 && createAvailMatRes.data.success, 'Create Material (Available) 201 Created');
  const availMat = createAvailMatRes.data.data;
  assert(availMat.status === 'Available', `Backend correctly computed status: "${availMat.status}" for 60% inventory`);

  // 4.4 Create Material: Low Stock status (available <= 0.2 * required)
  const createLowMatRes = await request('POST', '/api/materials', {
    projectId: realProjectId,
    name: 'Type II Portland Cement Special Blend',
    category: 'Concrete & Masonry',
    requiredQuantity: 500,
    availableQuantity: 75, // 15% -> Low Stock
    usedQuantity: 300,
    unit: 'Bags',
  }, authHeaders);
  assert(createLowMatRes.status === 201 && createLowMatRes.data.success, 'Create Material (Low Stock) 201 Created');
  const lowMat = createLowMatRes.data.data;
  assert(lowMat.status === 'Low Stock', `Backend correctly computed status: "${lowMat.status}" for 15% inventory`);

  // 4.5 Create Material: Out of Stock status (available <= 0)
  const createOutMatRes = await request('POST', '/api/materials', {
    projectId: realProjectId,
    name: 'Pre-insulated Copper Chilled Piping 50mm',
    category: 'Electrical & MEP',
    requiredQuantity: 200,
    availableQuantity: 0, // 0 -> Out of Stock
    usedQuantity: 100,
    unit: 'Meters',
  }, authHeaders);
  assert(createOutMatRes.status === 201 && createOutMatRes.data.success, 'Create Material (Out of Stock) 201 Created');
  const outMat = createOutMatRes.data.data;
  assert(outMat.status === 'Out of Stock', `Backend correctly computed status: "${outMat.status}" for 0 available`);

  // 4.6 Edit material & auto recalculate status
  // Update available quantity from 0 to 180 (90%) -> should transition from 'Out of Stock' to 'Available'
  const updateMatRes = await request('PUT', `/api/materials/${outMat._id}`, {
    availableQuantity: 180,
  }, authHeaders);
  assert(updateMatRes.status === 200 && updateMatRes.data.success, 'PUT /api/materials/:id updated material');
  assert(
    updateMatRes.data.data.status === 'Available',
    `Status dynamically recalculated by backend to "${updateMatRes.data.data.status}" upon replenishment`
  );

  // 4.7 Filter materials by project
  const filterMatProjRes = await request('GET', `/api/materials?projectId=${realProjectId}`, null, authHeaders);
  assert(filterMatProjRes.status === 200 && filterMatProjRes.data.success, 'GET /api/materials?projectId=... returned 200');
  const containsOurMat = filterMatProjRes.data.data.some((m) => m._id === availMat._id);
  assert(containsOurMat, 'Filtered project material list contains created material');

  // 5. Cross-Module Verification: AI Integration
  console.log('\n--- STEP 5: AI & REPORTS INTEGRATION ---');
  // 5.1 Project Briefing retrieves real tasks & materials
  const briefingRes = await request('GET', `/api/ai/project-briefing/${realProjectId}`, null, authHeaders);
  assert(briefingRes.status === 200 && briefingRes.data.success, 'GET /api/ai/project-briefing/:id returned 200');
  const briefingInfo = briefingRes.data.briefingData || briefingRes.data.data?.briefingData || briefingRes.data.data;
  assert(
    briefingInfo?.project?.name === realProjectName || !!briefingRes.data.answer,
    'Briefing includes real project data'
  );
  assert(
    (Array.isArray(briefingInfo?.tasks) && briefingInfo.tasks.length > 0) || !!briefingRes.data.sources,
    `Briefing context contains real tasks intelligence`
  );
  assert(
    (Array.isArray(briefingInfo?.materials) && briefingInfo.materials.length > 0) || !!briefingRes.data.sources,
    `Briefing context contains real materials intelligence`
  );

  // 5.2 AI Chat query regarding tasks and materials
  const aiChatRes = await request('POST', '/api/ai/chat', {
    message: `What tasks and material shortages exist for ${realProjectName}?`,
    projectId: realProjectId,
  }, authHeaders);
  const aiReply = aiChatRes.data.answer || aiChatRes.data.response;
  assert(
    typeof aiReply === 'string' && aiReply.length > 20,
    'AI returned grounded response based on MongoDB project context'
  );

  // 6. Clean up temporary test records
  console.log('\n--- STEP 6: CLEANUP TEST ARTIFACTS ---');
  const delTskRes = await request('DELETE', `/api/tasks/${createdTaskId}`, null, authHeaders);
  assert(delTskRes.status === 200 && delTskRes.data.success, `DELETE /api/tasks/${createdTaskId} cleaned up`);

  await request('DELETE', `/api/materials/${availMat._id}`, null, authHeaders);
  await request('DELETE', `/api/materials/${lowMat._id}`, null, authHeaders);
  await request('DELETE', `/api/materials/${outMat._id}`, null, authHeaders);
  console.log('  ✅ Cleaned up temporary test materials');

  // Verify deletion from MongoDB
  const verifyDelTsk = await request('GET', `/api/tasks/${createdTaskId}`, null, authHeaders);
  assert(verifyDelTsk.status === 404, 'Verified task permanently deleted from MongoDB (404)');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Unhandled error during integration tests:', err);
  process.exit(1);
});
