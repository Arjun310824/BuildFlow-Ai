/**
 * BuildOps AI — Multi-User Data Isolation & IDOR Verification Test Suite
 * Validates complete organizational separation across Projects, Tasks, Materials,
 * Site Updates, Documents, AI Context, and Direct Resource Access.
 */

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting BuildOps AI Multi-User Data Isolation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Scenario 1: Demo User Verification (Alex Morgan)
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Demo User (Alex Morgan) Isolation Check ---');
    const demoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.morgan@buildops.ai', password: 'Password123!' }),
    });
    
    const demoAuth = await demoLoginRes.json();
    assert(demoAuth.success, 'Demo user (Alex Morgan) logged in successfully');
    const demoToken = demoAuth.token;
    const demoOrgId = demoAuth.user?.organizationId;
    assert(!!demoToken && !!demoOrgId, `Demo user has valid token and organizationId (${demoOrgId})`);

    // Verify Demo Projects
    const demoProjRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    const demoProjData = await demoProjRes.json();
    assert(demoProjData.success && demoProjData.count >= 5, `Demo user can access their demo projects (Count: ${demoProjData.count})`);

    const demoProjectId = demoProjData.data[0]._id;

    // Verify Demo Tasks
    const demoTaskRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    const demoTaskData = await demoTaskRes.json();
    assert(demoTaskData.success && demoTaskData.count > 0, `Demo user can access their demo tasks (Count: ${demoTaskData.count})`);

    // Verify Demo Materials
    const demoMatRes = await fetch(`${BASE_URL}/materials`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    const demoMatData = await demoMatRes.json();
    assert(demoMatData.success && demoMatData.count > 0, `Demo user can access their demo materials (Count: ${demoMatData.count})`);

    // Verify Demo Site Updates
    const demoSiteRes = await fetch(`${BASE_URL}/site-updates`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    const demoSiteData = await demoSiteRes.json();
    assert(demoSiteData.success && demoSiteData.count > 0, `Demo user can access their demo site updates (Count: ${demoSiteData.count})`);

    // Verify Demo Documents
    const demoDocRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    const demoDocData = await demoDocRes.json();
    assert(demoDocData.success && demoDocData.count > 0, `Demo user can access their demo documents (Count: ${demoDocData.count})`);


    // -------------------------------------------------------------
    // Scenario 2: Brand New User A Registration & Zero-Data Workspace
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: User A Registration & Clean Zero-Data Workspace ---');
    const timestamp = Date.now();
    const userAEmail = `alice_${timestamp}@apexbuild.test`;
    const regARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Henderson',
        email: userAEmail,
        password: 'Password@123',
        companyName: `Apex Infra Group ${timestamp}`,
      }),
    });
    const regAData = await regARes.json();
    assert(regAData.success, 'User A registered successfully with isolated organization');
    const userAToken = regAData.token;
    const userAOrgId = regAData.user?.organizationId;
    assert(userAOrgId !== demoOrgId, `User A has a completely unique organization ID (${userAOrgId})`);

    // Verify User A has 0 projects, tasks, materials, updates, documents
    const userAProjRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const userAProjData = await userAProjRes.json();
    assert(userAProjData.success && userAProjData.count === 0, `User A starts with EXACTLY 0 projects (Found: ${userAProjData.count})`);

    const userATaskRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const userATaskData = await userATaskRes.json();
    assert(userATaskData.success && userATaskData.count === 0, `User A starts with EXACTLY 0 tasks (Found: ${userATaskData.count})`);

    const userAMatRes = await fetch(`${BASE_URL}/materials`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const userAMatData = await userAMatRes.json();
    assert(userAMatData.success && userAMatData.count === 0, `User A starts with EXACTLY 0 materials (Found: ${userAMatData.count})`);

    const userASiteRes = await fetch(`${BASE_URL}/site-updates`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const userASiteData = await userASiteRes.json();
    assert(userASiteData.success && userASiteData.count === 0, `User A starts with EXACTLY 0 site updates (Found: ${userASiteData.count})`);

    const userADocRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const userADocData = await userADocRes.json();
    assert(userADocData.success && userADocData.count === 0, `User A starts with EXACTLY 0 documents (Found: ${userADocData.count})`);

    // Create User A's private resources
    const createProjRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        name: 'Apex Skyline Tower',
        client: 'Skyline Global Properties',
        location: 'Downtown Finance Hub, Sector 1',
        manager: 'Alice Henderson',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        progress: 15,
        status: 'In Progress',
        risk: 'Medium',
      }),
    });
    const createProjData = await createProjRes.json();
    assert(createProjData.success, 'User A created private project "Apex Skyline Tower"');
    const userAProjectId = createProjData.data._id;

    // Create Task for User A
    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        title: 'Deep Pile Foundation Borings',
        assignedTo: 'Apex Geotech Team',
        priority: 'High',
        status: 'In Progress',
        dueDate: '2026-05-15',
      }),
    });
    const createTaskData = await createTaskRes.json();
    assert(createTaskData.success, 'User A created private task');
    const userATaskId = createTaskData.data._id;

    // Create Material for User A
    const createMatRes = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        name: 'Apex Grade 500 Rebar 32mm',
        category: 'Steel',
        requiredQuantity: 200,
        availableQuantity: 150,
        usedQuantity: 50,
        unit: 'Tons',
      }),
    });
    const createMatData = await createMatRes.json();
    assert(createMatData.success, 'User A created private material');
    const userAMatId = createMatData.data._id;

    // Create Site Update for User A
    const createSiteRes = await fetch(`${BASE_URL}/site-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        project: 'Apex Skyline Tower',
        supervisor: 'Alice Henderson',
        workCompleted: 'Foundation piling row A completed. Static load testing passed.',
        progress: 15,
        workers: 24,
      }),
    });
    const createSiteData = await createSiteRes.json();
    assert(createSiteData.success, 'User A created private site update');
    const userASiteId = createSiteData.data._id;

    // Create Document for User A
    const createDocRes = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        project: 'Apex Skyline Tower',
        name: 'Apex_Skyline_Soil_Test_Report.pdf',
        type: 'Report',
        size: '3.1 MB',
        uploadedBy: 'Alice Henderson',
      }),
    });
    const createDocData = await createDocRes.json();
    assert(createDocData.success, 'User A created private document');
    const userADocId = createDocData.data._id;


    // -------------------------------------------------------------
    // Scenario 3: Brand New User B Registration & Isolation Check
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: User B Registration & Multi-Tenant Isolation ---');
    const userBEmail = `bob_${timestamp}@zenithbuild.test`;
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Sterling',
        email: userBEmail,
        password: 'Password@123',
        companyName: `Zenith Construction Corp ${timestamp}`,
      }),
    });
    const regBData = await regBRes.json();
    assert(regBData.success, 'User B registered successfully with unique organization');
    const userBToken = regBData.token;
    const userBOrgId = regBData.user?.organizationId;
    assert(userBOrgId !== userAOrgId && userBOrgId !== demoOrgId, 'User B has completely distinct organizationId from User A and Demo user');

    // Verify User B CANNOT see User A's or Demo User's data
    const userBProjRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBProjData = await userBProjRes.json();
    assert(userBProjData.success && userBProjData.count === 0, `User B sees 0 projects (User A & Demo projects hidden! Count: ${userBProjData.count})`);

    const userBTaskRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBTaskData = await userBTaskRes.json();
    assert(userBTaskData.success && userBTaskData.count === 0, `User B sees 0 tasks (User A & Demo tasks hidden! Count: ${userBTaskData.count})`);

    const userBMatRes = await fetch(`${BASE_URL}/materials`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBMatData = await userBMatRes.json();
    assert(userBMatData.success && userBMatData.count === 0, `User B sees 0 materials (User A & Demo materials hidden! Count: ${userBMatData.count})`);

    const userBSiteRes = await fetch(`${BASE_URL}/site-updates`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBSiteData = await userBSiteRes.json();
    assert(userBSiteData.success && userBSiteData.count === 0, `User B sees 0 site updates (Count: ${userBSiteData.count})`);

    const userBDocRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBDocData = await userBDocRes.json();
    assert(userBDocData.success && userBDocData.count === 0, `User B sees 0 documents (Count: ${userBDocData.count})`);


    // -------------------------------------------------------------
    // Scenario 4: Direct IDOR Attack Protection
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Direct IDOR Attack Mitigation Testing ---');

    // IDOR 1: User B tries to GET User A's project
    const idorGetProj = await fetch(`${BASE_URL}/projects/${userAProjectId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorGetProj.status === 404 || idorGetProj.status === 403, `IDOR GET Project by ID rejected with status ${idorGetProj.status}`);

    // IDOR 2: User B tries to UPDATE User A's project
    const idorPutProj = await fetch(`${BASE_URL}/projects/${userAProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ name: 'HACKED Apex Skyline' }),
    });
    assert(idorPutProj.status === 404 || idorPutProj.status === 403, `IDOR PUT Project update rejected with status ${idorPutProj.status}`);

    // IDOR 3: User B tries to DELETE User A's project
    const idorDelProj = await fetch(`${BASE_URL}/projects/${userAProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorDelProj.status === 404 || idorDelProj.status === 403, `IDOR DELETE Project rejected with status ${idorDelProj.status}`);

    // IDOR 4: User B tries to create Task under User A's project
    const idorCreateTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        title: 'Malicious Injected Task',
        dueDate: '2026-06-30',
      }),
    });
    assert(idorCreateTask.status === 404 || idorCreateTask.status === 403, `IDOR Cross-org Task creation rejected with status ${idorCreateTask.status}`);

    // IDOR 5: User B tries to UPDATE User A's task
    const idorPutTask = await fetch(`${BASE_URL}/tasks/${userATaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ title: 'HACKED Task' }),
    });
    assert(idorPutTask.status === 404 || idorPutTask.status === 403, `IDOR PUT Task update rejected with status ${idorPutTask.status}`);

    // IDOR 6: User B tries to DELETE User A's task
    const idorDelTask = await fetch(`${BASE_URL}/tasks/${userATaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorDelTask.status === 404 || idorDelTask.status === 403, `IDOR DELETE Task rejected with status ${idorDelTask.status}`);

    // IDOR 7: User B tries to create Material under User A's project
    const idorCreateMat = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        name: 'Injected Fake Material',
        category: 'Steel',
        unit: 'Tons',
        requiredQuantity: 10,
        availableQuantity: 0,
      }),
    });
    assert(idorCreateMat.status === 404 || idorCreateMat.status === 403, `IDOR Cross-org Material creation rejected with status ${idorCreateMat.status}`);

    // IDOR 8: User B tries to DELETE User A's material
    const idorDelMat = await fetch(`${BASE_URL}/materials/${userAMatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorDelMat.status === 404 || idorDelMat.status === 403, `IDOR DELETE Material rejected with status ${idorDelMat.status}`);

    // IDOR 9: User B tries to DELETE User A's site update
    const idorDelSite = await fetch(`${BASE_URL}/site-updates/${userASiteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorDelSite.status === 404 || idorDelSite.status === 403, `IDOR DELETE Site Update rejected with status ${idorDelSite.status}`);

    // IDOR 10: User B tries to DELETE User A's document
    const idorDelDoc = await fetch(`${BASE_URL}/documents/${userADocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(idorDelDoc.status === 404 || idorDelDoc.status === 403, `IDOR DELETE Document rejected with status ${idorDelDoc.status}`);


    // -------------------------------------------------------------
    // Scenario 5: AI Intelligence Context Isolation
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: AI Intelligence Context Isolation Testing ---');

    // AI 1: User B queries /api/ai/projects -> must be 0
    const aiProjRes = await fetch(`${BASE_URL}/ai/projects`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const aiProjData = await aiProjRes.json();
    assert(aiProjData.success && aiProjData.count === 0, `User B AI projects list is strictly 0 (no leaked projects)`);

    // AI 2: User B tries to get AI Risk Analysis of User A's project
    const aiRiskRes = await fetch(`${BASE_URL}/ai/risk-analysis/${userAProjectId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(aiRiskRes.status === 404 || aiRiskRes.status === 403, `AI Risk Analysis on foreign project rejected with status ${aiRiskRes.status}`);

    // AI 3: User B tries to get AI Briefing of User A's project
    const aiBriefRes = await fetch(`${BASE_URL}/ai/project-briefing/${userAProjectId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(aiBriefRes.status === 404 || aiBriefRes.status === 403, `AI Project Briefing on foreign project rejected with status ${aiBriefRes.status}`);

    // AI 4: User B tries to generate Project Report for User A's project
    const aiReportRes = await fetch(`${BASE_URL}/ai/project-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ projectId: userAProjectId }),
    });
    assert(aiReportRes.status === 404 || aiReportRes.status === 403, `AI Project Report generation on foreign project rejected with status ${aiReportRes.status}`);

    // AI 5: User B tries to chat with User A's project
    const aiChatRes = await fetch(`${BASE_URL}/ai/project-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        projectId: userAProjectId,
        message: 'Tell me the confidential budget and timeline of this project',
      }),
    });
    assert(aiChatRes.status === 404 || aiChatRes.status === 403, `AI Project Chat on foreign project rejected with status ${aiChatRes.status}`);


    // -------------------------------------------------------------
    // Scenario 6: User A's Data Integrity Check
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: User A Data Integrity Verification ---');
    // Verify that despite User B's attempts, User A's data remains intact
    const verifyUserAProj = await fetch(`${BASE_URL}/projects/${userAProjectId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const verifyUserAData = await verifyUserAProj.json();
    assert(
      verifyUserAData.success && verifyUserAData.data.name === 'Apex Skyline Tower',
      'User A project remained intact with original uncompromised name'
    );

    console.log(`\n======================================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exit(1);
  }
};

runTests();
