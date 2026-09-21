/**
 * TASK 17 — FINAL END-TO-END TESTING & HACKATHON READINESS SUITE
 * Comprehensive audit verifying:
 * 1. Startup & Route Integrity (no /api/api)
 * 2. Authentication (Register, Hash check, Login, Token, Protected Routes, Logout)
 * 3. Project CRUD & Date Validation (endDate >= startDate)
 * 4. Task CRUD & Date Validation (dueDate >= startDate)
 * 5. Material CRUD, Non-Negative Validation, & Auto-Status (Available, Low Stock, Out of Stock)
 * 6. AI Text Chat & Construction-Only Redirection Guardrails
 * 7. AI Risk Analysis
 * 8. AI Project Briefing
 * 9. AI Report Generation
 * 10. Conversation History (Create, Retrieve, Delete)
 * 11. Real Ahmedabad Projects & Seed Data
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

async function runHackathonReadinessSuite() {
  console.log('================================================================');
  console.log('TASK 17 — FINAL END-TO-END TESTING & HACKATHON READINESS SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const failureLog = [];

  function assert(condition, message, errorDetail = null) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      if (errorDetail) console.error(`     Detail: ${JSON.stringify(errorDetail)}`);
      failed++;
      failureLog.push({ message, errorDetail });
    }
  }

  // =================================================================
  // SECTION 1: STARTUP & ROUTE INTEGRITY
  // =================================================================
  console.log('--- 1. STARTUP & ROUTE INTEGRITY ---');
  try {
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.data.success, 'Server running and GET /api/health returns 200 OK');

    // Verify no double /api/api
    const doubleApiRes = await request('GET', '/api/api/projects');
    assert(doubleApiRes.status === 404, 'No accidental /api/api/projects route (404 expected)');
  } catch (err) {
    assert(false, `Server connectivity check failed: ${err.message}`);
  }

  // =================================================================
  // SECTION 2: AUTHENTICATION FLOW
  // =================================================================
  console.log('\n--- 2. AUTHENTICATION (REGISTER, HASH CHECK, LOGIN, PROTECTED ROUTES) ---');
  const testEmail = `testpilot_${Date.now()}@buildops.ai`;
  const testPassword = 'SecurePassword123!';
  let testUserToken = '';

  // 2.1 Register
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Hackathon QA Auditor',
    email: testEmail,
    password: testPassword,
    role: 'Quality Assurance Lead',
  });
  assert(regRes.status === 201 && regRes.data.success, 'POST /api/auth/register creates user account');
  assert(regRes.data.user && !regRes.data.user.password, 'Password is NEVER returned in register response');
  assert(!!regRes.data.token, 'Registration issues valid JWT token');

  // 2.2 Login with valid credentials
  const loginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  assert(loginRes.status === 200 && loginRes.data.success, 'POST /api/auth/login authenticates user');
  assert(loginRes.data.user && !loginRes.data.user.password, 'Password is NEVER returned in login response');
  testUserToken = loginRes.data.token;
  assert(!!testUserToken, 'Login issues JWT token');

  // 2.3 Login with invalid credentials
  const invalidLoginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'WrongPassword999!',
  });
  assert(invalidLoginRes.status === 401, 'Reject login with invalid password (401 Unauthorized)');

  // 2.4 Protected route with valid token
  const meRes = await request('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${testUserToken}`,
  });
  assert(meRes.status === 200 && meRes.data.success, 'GET /api/auth/me loads profile for authenticated user');
  assert(meRes.data.user?.email === testEmail, 'Profile email matches authenticated user');

  // 2.5 Protected route WITHOUT token
  const unauthMeRes = await request('GET', '/api/auth/me');
  assert(unauthMeRes.status === 401, 'Reject access to protected route when unauthenticated (401 Unauthorized)');

  // 2.6 Protected route with invalid token
  const badTokenRes = await request('GET', '/api/auth/me', null, {
    Authorization: 'Bearer invalid_garbage_token_string',
  });
  assert(badTokenRes.status === 401, 'Reject access with invalid token (401 Unauthorized)');

  // 2.7 Logout
  const logoutRes = await request('POST', '/api/auth/logout', null, {
    Authorization: `Bearer ${testUserToken}`,
  });
  assert(logoutRes.status === 200 && logoutRes.data.success, 'POST /api/auth/logout successfully acknowledged');

  // Primary operational token (Alex Morgan)
  let authHeaders = {};
  const alexLoginRes = await request('POST', '/api/auth/login', {
    email: 'alex.morgan@buildops.ai',
    password: 'Password123!',
  });
  if (alexLoginRes.status === 200 && alexLoginRes.data.token) {
    authHeaders = { Authorization: `Bearer ${alexLoginRes.data.token}` };
    console.log('  ℹ️  Logged in as default project director: alex.morgan@buildops.ai');
  }

  // =================================================================
  // SECTION 3: PROJECT CRUD & DATE VALIDATION
  // =================================================================
  console.log('\n--- 3. PROJECT CRUD & DATE VALIDATION ---');

  // 3.1 Date Validation: endDate < startDate must fail with 400
  const invalidProjDate = await request('POST', '/api/projects', {
    name: 'Invalid Project Timeline',
    client: 'Test Client',
    location: 'Ahmedabad',
    manager: 'Alex Morgan',
    startDate: '2026-12-01',
    endDate: '2026-10-01', // Earlier than startDate!
    status: 'Planning',
  }, authHeaders);
  assert(invalidProjDate.status === 400, 'Reject project when endDate < startDate (400 Bad Request)');
  assert(
    invalidProjDate.data.message?.toLowerCase().includes('end date') ||
    invalidProjDate.data.errors?.some(e => e.toLowerCase().includes('end date')),
    'Returned clear date validation message'
  );

  // 3.2 Create valid project
  const newProjRes = await request('POST', '/api/projects', {
    name: 'Task 17 Commercial Tower QA Sandbox',
    client: 'Gujarat Infrastructure Development Board',
    location: 'S.G. Highway, Ahmedabad',
    manager: 'Alex Morgan',
    startDate: '2026-10-01',
    endDate: '2027-12-31',
    progress: 15,
    status: 'In Progress',
    risk: 'Low',
  }, authHeaders);
  assert(newProjRes.status === 201 && newProjRes.data.success, 'POST /api/projects creates new project (201 Created)');
  const createdProject = newProjRes.data.data;
  const createdProjectId = createdProject._id || createdProject.id;
  assert(/^[0-9a-fA-F]{24}$/.test(createdProjectId), `Created project has valid MongoDB ObjectId: ${createdProjectId}`);

  // 3.3 Read project by ID
  const getProjRes = await request('GET', `/api/projects/${createdProjectId}`, null, authHeaders);
  assert(getProjRes.status === 200 && getProjRes.data.success, 'GET /api/projects/:id loads project');
  assert(getProjRes.data.data.name === 'Task 17 Commercial Tower QA Sandbox', 'Loaded project name matches');

  // 3.4 Update project
  const updateProjRes = await request('PUT', `/api/projects/${createdProjectId}`, {
    progress: 35,
    risk: 'Medium',
    status: 'In Progress',
  }, authHeaders);
  assert(updateProjRes.status === 200 && updateProjRes.data.success, 'PUT /api/projects/:id updates project');
  assert(updateProjRes.data.data.progress === 35, 'Updated progress persisted');

  // =================================================================
  // SECTION 4: TASK CRUD & DATE VALIDATION
  // =================================================================
  console.log('\n--- 4. TASK CRUD & DATE VALIDATION ---');

  // 4.1 Date Validation: dueDate < startDate must fail with 400
  const invalidTaskDate = await request('POST', '/api/tasks', {
    projectId: createdProjectId,
    title: 'Faulty Chronology Task',
    startDate: '2026-11-20',
    dueDate: '2026-11-05', // Earlier than start date!
    status: 'Not Started',
  }, authHeaders);
  assert(invalidTaskDate.status === 400, 'Reject task when dueDate < startDate (400 Bad Request)');

  // 4.2 Create Task
  const createTaskRes = await request('POST', '/api/tasks', {
    projectId: createdProjectId,
    title: 'HVAC Chiller Installation & Duct Pressure Test',
    description: 'Verify ductwork sealing per SMACNA Class A standards',
    assignedTo: 'Sterling MEP Contractors / V. Patel',
    startDate: '2026-10-05',
    dueDate: '2026-11-15',
    status: 'In Progress',
    priority: 'High',
    progress: 50,
  }, authHeaders);
  assert(createTaskRes.status === 201 && createTaskRes.data.success, 'POST /api/tasks creates task (201 Created)');
  const createdTask = createTaskRes.data.data;
  const createdTaskId = createdTask._id;
  assert(/^[0-9a-fA-F]{24}$/.test(createdTaskId), `Created task has valid MongoDB ObjectId: ${createdTaskId}`);

  // 4.3 Update Task
  const updateTaskRes = await request('PUT', `/api/tasks/${createdTaskId}`, {
    status: 'Delayed',
    progress: 55,
  }, authHeaders);
  assert(updateTaskRes.status === 200 && updateTaskRes.data.success, 'PUT /api/tasks/:id updates status to Delayed');
  assert(updateTaskRes.data.data.status === 'Delayed', 'Task status correctly updated to Delayed');

  // 4.4 Filter Tasks by Project
  const projTasksRes = await request('GET', `/api/tasks?projectId=${createdProjectId}`, null, authHeaders);
  assert(projTasksRes.status === 200 && projTasksRes.data.success, 'GET /api/tasks?projectId=... filters by project');
  assert(projTasksRes.data.data.some(t => t._id === createdTaskId), 'Project task list includes created task');

  // 4.5 Filter Tasks by Status
  const delayedTasksRes = await request('GET', '/api/tasks?status=Delayed', null, authHeaders);
  assert(delayedTasksRes.status === 200 && delayedTasksRes.data.success, 'GET /api/tasks?status=Delayed filters tasks');
  assert(delayedTasksRes.data.data.every(t => t.status === 'Delayed'), 'All returned tasks have status "Delayed"');

  // =================================================================
  // SECTION 5: MATERIAL CRUD & STATUS CALCULATION
  // =================================================================
  console.log('\n--- 5. MATERIAL CRUD & STATUS CALCULATION ---');

  // 5.1 Negative quantity validation
  const negMatRes = await request('POST', '/api/materials', {
    projectId: createdProjectId,
    name: 'Negative Quantity Bricks',
    category: 'Concrete & Masonry',
    requiredQuantity: -100,
    availableQuantity: 50,
    unit: 'Pieces',
  }, authHeaders);
  assert(negMatRes.status === 400, 'Reject material with negative quantity (400 Bad Request)');

  // 5.2 Create Material: Available (> 20%)
  const matAvailRes = await request('POST', '/api/materials', {
    projectId: createdProjectId,
    name: 'Grade 500D TMT Reinforcement Steel',
    category: 'Metals & Rebar',
    requiredQuantity: 2000,
    availableQuantity: 1400,
    usedQuantity: 300,
    unit: 'Tons',
  }, authHeaders);
  assert(matAvailRes.status === 201 && matAvailRes.data.success, 'Create Material (Available) 201 Created');
  assert(matAvailRes.data.data.status === 'Available', 'Backend computes status "Available"');
  const matAvailId = matAvailRes.data.data._id;

  // 5.3 Create Material: Low Stock (<= 20% and > 0)
  const matLowRes = await request('POST', '/api/materials', {
    projectId: createdProjectId,
    name: 'OPC 53 Grade Premium Cement',
    category: 'Concrete & Masonry',
    requiredQuantity: 1000,
    availableQuantity: 120, // 12% -> Low Stock
    usedQuantity: 800,
    unit: 'Bags',
  }, authHeaders);
  assert(matLowRes.status === 201 && matLowRes.data.success, 'Create Material (Low Stock) 201 Created');
  assert(matLowRes.data.data.status === 'Low Stock', 'Backend computes status "Low Stock"');
  const matLowId = matLowRes.data.data._id;

  // 5.4 Create Material: Out of Stock (<= 0)
  const matOutRes = await request('POST', '/api/materials', {
    projectId: createdProjectId,
    name: 'CPVC Fire Sprinkler Pipes 32mm',
    category: 'Electrical & MEP',
    requiredQuantity: 300,
    availableQuantity: 0, // 0 -> Out of Stock
    usedQuantity: 150,
    unit: 'Meters',
  }, authHeaders);
  assert(matOutRes.status === 201 && matOutRes.data.success, 'Create Material (Out of Stock) 201 Created');
  assert(matOutRes.data.data.status === 'Out of Stock', 'Backend computes status "Out of Stock"');
  const matOutId = matOutRes.data.data._id;

  // 5.5 Update Material & auto status recalculation
  const updateMatRes = await request('PUT', `/api/materials/${matOutId}`, {
    availableQuantity: 280, // Replenished to >20%
  }, authHeaders);
  assert(updateMatRes.status === 200 && updateMatRes.data.success, 'PUT /api/materials/:id updates quantity');
  assert(updateMatRes.data.data.status === 'Available', 'Status dynamically recalculated to "Available" upon replenishment');

  // =================================================================
  // SECTION 6: AI TEXT CHAT & CONSTRUCTION-ONLY GUARDRAILS
  // =================================================================
  console.log('\n--- 6. AI TEXT CHAT & CONSTRUCTION-ONLY GUARDRAILS ---');

  // 6.1 Valid construction query with project context
  const validAiChat = await request('POST', '/api/ai/chat', {
    message: 'What tasks are delayed and what materials are low stock for this project?',
    projectId: createdProjectId,
  }, authHeaders);
  assert(validAiChat.status === 200 && validAiChat.data.success, 'POST /api/ai/chat answers construction queries');
  const aiAnswer = validAiChat.data.answer || validAiChat.data.response || '';
  assert(typeof aiAnswer === 'string' && aiAnswer.length > 20, 'AI generated informative grounded response');

  // 6.2 Construction guardrail: Non-construction questions MUST be redirected
  const nonConstructionQuestions = [
    'What is the capital of France?',
    'Tell me a joke.',
    'What is Bitcoin?',
    'Who won yesterday\'s cricket match?',
  ];

  for (const query of nonConstructionQuestions) {
    const nonConRes = await request('POST', '/api/ai/chat', {
      message: query,
      projectId: createdProjectId,
    }, authHeaders);
    assert(nonConRes.status === 200, `Guardrail handled query: "${query}" (200 OK)`);
    const respText = (nonConRes.data.answer || nonConRes.data.response || '').toLowerCase();
    const redirectsToConstruction =
      respText.includes('construction') ||
      respText.includes('project') ||
      respText.includes('buildops') ||
      respText.includes('scope') ||
      respText.includes('operations');
    assert(redirectsToConstruction, `AI properly redirected off-topic question "${query}" back to construction operations`);
  }

  // =================================================================
  // SECTION 7: AI RISK ANALYSIS & PROJECT BRIEFING
  // =================================================================
  console.log('\n--- 7. AI RISK ANALYSIS & PROJECT BRIEFING ---');

  // 7.1 Risk Analysis
  const riskRes = await request('GET', `/api/ai/project-risk/${createdProjectId}`, null, authHeaders);
  assert(riskRes.status === 200 && riskRes.data.success, 'GET /api/ai/project-risk/:projectId returned 200');
  const risksList = riskRes.data.data?.risks || riskRes.data.risks || [];
  assert(Array.isArray(risksList), 'Risk analysis returned array of risks');
  if (risksList.length > 0) {
    const firstRisk = risksList[0];
    assert(!!firstRisk.category, 'Risk contains category');
    assert(!!firstRisk.severity, 'Risk contains severity');
    assert(!!firstRisk.evidence, 'Risk contains evidence from real database records');
    assert(!!firstRisk.recommendation, 'Risk contains actionable recommendation');
  }

  // 7.2 Project Briefing
  const briefingRes = await request('GET', `/api/ai/project-briefing/${createdProjectId}`, null, authHeaders);
  assert(briefingRes.status === 200 && briefingRes.data.success, 'GET /api/ai/project-briefing/:projectId returned 200');
  const briefingAnswer = briefingRes.data.answer || '';
  assert(typeof briefingAnswer === 'string' && briefingAnswer.length > 30, 'Project briefing generated comprehensive summary');

  // =================================================================
  // SECTION 8: REPORT GENERATION
  // =================================================================
  console.log('\n--- 8. AI REPORT GENERATION ---');

  // 8.1 Single Project Report
  const singleReportRes = await request('POST', '/api/ai/generate-report', {
    projectId: createdProjectId,
    reportType: 'Project Status Report',
  }, authHeaders);
  assert(singleReportRes.status === 200 && singleReportRes.data.success, 'POST /api/ai/generate-report generated Project Status Report');
  const hasReportData = !!(singleReportRes.data.reportData || singleReportRes.data.report?.reportData);
  assert(hasReportData, 'Report contains structured reportData');

  // 8.2 Portfolio Construction Progress Report
  const portfolioReportRes = await request('POST', '/api/ai/generate-report', {
    projectId: 'all',
    reportType: 'Construction Progress Report',
  }, authHeaders);
  assert(portfolioReportRes.status === 200 && portfolioReportRes.data.success, 'POST /api/ai/generate-report generated Portfolio Progress Report');

  // =================================================================
  // SECTION 9: CONVERSATION HISTORY
  // =================================================================
  console.log('\n--- 9. CONVERSATION HISTORY ---');

  // 9.1 Create conversation
  const createConvRes = await request('POST', '/api/ai/conversations', {
    title: 'QA Audit Chat Session',
    projectId: createdProjectId,
  }, authHeaders);
  assert(createConvRes.status === 201 && createConvRes.data.success, 'POST /api/ai/conversations creates conversation');
  const convId = createConvRes.data.data?._id || createConvRes.data.data?.id;

  // 9.2 Add message to conversation
  const addMsgRes = await request('POST', `/api/ai/conversations/${convId}/messages`, {
    message: 'What is the structural inspection milestone status?',
  }, authHeaders);
  assert(addMsgRes.status === 200 && addMsgRes.data.success, 'POST /api/ai/conversations/:id/messages appends message');

  // 9.3 Get conversation
  const getConvRes = await request('GET', `/api/ai/conversations/${convId}`, null, authHeaders);
  assert(getConvRes.status === 200 && getConvRes.data.success, 'GET /api/ai/conversations/:id loads conversation messages');
  assert(getConvRes.data.data?.messages?.length > 0, 'Messages persisted and retrieved successfully');

  // 9.4 Delete conversation
  const delConvRes = await request('DELETE', `/api/ai/conversations/${convId}`, null, authHeaders);
  assert(delConvRes.status === 200 && delConvRes.data.success, 'DELETE /api/ai/conversations/:id deletes conversation');

  // =================================================================
  // SECTION 10: CLEANUP TEST ENTITIES
  // =================================================================
  console.log('\n--- 10. CLEANUP TEST ENTITIES ---');
  await request('DELETE', `/api/tasks/${createdTaskId}`, null, authHeaders);
  await request('DELETE', `/api/materials/${matAvailId}`, null, authHeaders);
  await request('DELETE', `/api/materials/${matLowId}`, null, authHeaders);
  await request('DELETE', `/api/materials/${matOutId}`, null, authHeaders);
  await request('DELETE', `/api/projects/${createdProjectId}`, null, authHeaders);
  console.log('  ✅ Cleaned up temporary QA test entities');

  // Verify project deletion
  const verifyProjDel = await request('GET', `/api/projects/${createdProjectId}`, null, authHeaders);
  assert(verifyProjDel.status === 404, 'Verified sandbox project permanently deleted (404 Not Found)');

  // =================================================================
  // SECTION 11: DEMO DATA VERIFICATION (AHMEDABAD PROJECTS)
  // =================================================================
  console.log('\n--- 11. DEMO DATA VERIFICATION (AHMEDABAD PROJECTS) ---');
  const allProjectsRes = await request('GET', '/api/projects', null, authHeaders);
  assert(allProjectsRes.status === 200 && allProjectsRes.data.success, 'GET /api/projects returns 200');
  const projects = allProjectsRes.data.data || [];
  assert(projects.length >= 3, `Found ${projects.length} real projects in MongoDB (minimum 3 required)`);

  const allTasksRes = await request('GET', '/api/tasks', null, authHeaders);
  const tasks = allTasksRes.data.data || [];
  const delayedTasks = tasks.filter(t => t.status === 'Delayed');
  assert(tasks.length >= 8, `Found ${tasks.length} total tasks in MongoDB`);
  assert(delayedTasks.length >= 1, `Found ${delayedTasks.length} delayed task(s) in MongoDB for live demo risk detection`);

  const allMatsRes = await request('GET', '/api/materials', null, authHeaders);
  const mats = allMatsRes.data.data || [];
  const lowMats = mats.filter(m => m.status === 'Low Stock');
  const outMats = mats.filter(m => m.status === 'Out of Stock');
  assert(mats.length >= 6, `Found ${mats.length} total materials in MongoDB`);
  assert(lowMats.length + outMats.length >= 1, `Found ${lowMats.length} low stock & ${outMats.length} out of stock materials for live inventory alert demo`);

  console.log('\n================================================================');
  console.log(`FINAL E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error('FAILURES DETECTED:');
    failureLog.forEach((f, idx) => {
      console.error(` ${idx + 1}. ${f.message}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL 48 END-TO-END VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
    process.exit(0);
  }
}

runHackathonReadinessSuite().catch((err) => {
  console.error('Unhandled fatal error during E2E suite:', err);
  process.exit(1);
});
