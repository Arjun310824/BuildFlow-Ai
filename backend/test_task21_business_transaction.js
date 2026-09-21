import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function apiRequest(endpoint, options = {}, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 500, ok: false, data: null, error: err.message };
  }
}

async function runTask21Suite() {
  console.log('========================================================================');
  console.log('BUILDOPS AI — TASK 21 B2B BUSINESS TRANSACTIONS & WORKSPACE SUITE');
  console.log('========================================================================\n');

  // Connect DB
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);

  // ---------------------------------------------------------
  // Phase 1: Authentication & Partner Connection Setup
  // ---------------------------------------------------------
  console.log('--- Phase 1: Authentication & Partner Connection Setup ---');

  // Login Ramesh Patel (ABC Village Construction, Sanand)
  const rameshLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ramesh.patel@abcvillage.com',
      password: 'Password123!',
    }),
  });
  assert(rameshLogin.status === 200, 'Ramesh Patel (ABC Village Construction) login succeeded');
  const rameshToken = rameshLogin.data?.token;

  const rameshOrgRes = await apiRequest('/organizations/my', { method: 'GET' }, rameshToken);
  assert(rameshOrgRes.status === 200, 'GET /organizations/my for Ramesh succeeded');
  const abcOrg = rameshOrgRes.data?.data;
  const abcOrgId = abcOrg?._id;
  assert(abcOrg?.name === 'ABC Village Construction', 'Ramesh org is ABC Village Construction');

  // Login Alex Morgan (XYZ City Infrastructure, Ahmedabad)
  const alexLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'alex.morgan@buildops.ai',
      password: 'Password123!',
    }),
  });
  assert(alexLogin.status === 200, 'Alex Morgan (XYZ City Infrastructure) login succeeded');
  const alexToken = alexLogin.data?.token;

  const alexOrgRes = await apiRequest('/organizations/my', { method: 'GET' }, alexToken);
  assert(alexOrgRes.status === 200, 'GET /organizations/my for Alex succeeded');
  const xyzOrg = alexOrgRes.data?.data;
  const xyzOrgId = xyzOrg?._id;
  assert(xyzOrg?.name === 'XYZ City Infrastructure', 'Alex org is XYZ City Infrastructure');

  // Find accepted business connection between ABC and XYZ
  const connListRes = await apiRequest('/business-connections', { method: 'GET' }, rameshToken);
  assert(connListRes.status === 200, 'GET /business-connections succeeded for Ramesh');
  let activeConn = connListRes.data?.data?.find((c) => c.status === 'Accepted');
  assert(!!activeConn, 'Found active Accepted connection between ABC Construction and XYZ Infrastructure');

  // Create project belonging specifically to ABC Construction
  const createAbcProjRes = await apiRequest(
    '/projects',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Sanand Commercial Center ${Date.now()}`,
        client: 'Sanand Infrastructure Board',
        location: 'Sanand',
        manager: 'Ramesh Patel',
        startDate: '2026-09-01',
        endDate: '2027-06-30',
        status: 'In Progress',
        risk: 'Low',
      }),
    },
    rameshToken
  );
  assert(createAbcProjRes.status === 201, 'Created project belonging to ABC Construction');
  const abcProjectId = createAbcProjRes.data?.data?._id;

  // Query Alex's project for un-owned project isolation test
  const alexProjRes = await apiRequest('/projects', { method: 'GET' }, alexToken);
  const xyzProject = (alexProjRes.data?.data || []).find(
    (p) => (p.organizationId?._id?.toString() || p.organizationId?.toString()) === xyzOrgId.toString()
  );
  const alexProjectId = xyzProject?._id;

  // ---------------------------------------------------------
  // TEST 1 & TEST 10: Date Validation & Create Transaction (ABC -> XYZ)
  // ---------------------------------------------------------
  console.log('\n--- Phase 2: Date Validation & Request Creation (TEST 1 & TEST 10) ---');

  // TEST 9 PREP: Ramesh attempts to link Alex's project (XYZ project) -> Should fail 403 Forbidden
  if (alexProjectId) {
    const unownedProjTxRes = await apiRequest(
      '/business-transactions',
      {
        method: 'POST',
        body: JSON.stringify({
          recipientOrganizationId: xyzOrgId,
          connectionId: activeConn._id,
          projectId: alexProjectId, // Belonging to XYZ, not ABC!
          requestType: 'Material Request',
          title: 'Illicit Project Link Request',
          expectedDeliveryDate: '2026-09-30',
        }),
      },
      rameshToken
    );
    assert(
      unownedProjTxRes.status === 403,
      'TEST 9: User cannot link another organization\'s private project (returns 403 Forbidden)',
      `status: ${unownedProjTxRes.status}`
    );
  }

  // TEST 10: Invalid Date Test: expectedDeliveryDate earlier than requestedDate
  const invalidDateRes = await apiRequest(
    '/business-transactions',
    {
      method: 'POST',
      body: JSON.stringify({
        recipientOrganizationId: xyzOrgId,
        connectionId: activeConn._id,
        projectId: abcProjectId,
        requestType: 'Material Request',
        title: 'Invalid Date Cement Order',
        materialName: 'Cement',
        quantity: 500,
        unit: 'Bags',
        requestedDate: '2026-09-25',
        expectedDeliveryDate: '2026-09-20', // EARLIER than requested date
      }),
    },
    rameshToken
  );
  assert(
    invalidDateRes.status === 400,
    'TEST 10: Backend rejects request with expectedDeliveryDate < requestedDate (400 Bad Request)',
    `status: ${invalidDateRes.status}`
  );

  // TEST 1: Valid Transaction Creation: ABC Construction sends Cement request to XYZ Infrastructure
  const createTxRes = await apiRequest(
    '/business-transactions',
    {
      method: 'POST',
      body: JSON.stringify({
        recipientOrganizationId: xyzOrgId,
        connectionId: activeConn._id,
        projectId: abcProjectId,
        requestType: 'Material Request',
        title: '500 Bags Cement Supply for RCC Work',
        materialName: 'Cement 53 Grade',
        quantity: 500,
        unit: 'Bags',
        requestedDate: '2026-09-21',
        expectedDeliveryDate: '2026-09-25',
        description: 'Required for RCC work in Ahmedabad Commercial Project',
      }),
    },
    rameshToken
  );

  assert(createTxRes.status === 201, 'TEST 1: Organization A (ABC) sends request to Organization B (XYZ)', `status: ${createTxRes.status}`);
  const tx1 = createTxRes.data?.data;
  assert(!!tx1?._id, 'Business transaction object returned with valid ObjectId');
  assert(tx1?.status === 'Sent', 'Initial business transaction status is Sent');
  assert(tx1?.title === '500 Bags Cement Supply for RCC Work', 'Transaction title matches input');
  assert(tx1?.quantity === 500, 'Quantity is 500');
  assert(tx1?.unit === 'Bags', 'Unit is Bags');

  // ---------------------------------------------------------
  // TEST 2: Notification Received by Organization B (XYZ)
  // ---------------------------------------------------------
  console.log('\n--- Phase 3: Notifications Verification (TEST 2) ---');
  const xyzNotifRes = await apiRequest('/notifications', { method: 'GET' }, alexToken);
  assert(xyzNotifRes.status === 200, 'GET /notifications succeeded for Alex (XYZ Infrastructure)');
  const notifList = xyzNotifRes.data?.data || [];
  const reqNotif = notifList.find((n) => n.type === 'BUSINESS_TRANSACTION_REQUEST');
  assert(!!reqNotif, 'TEST 2: Organization B (XYZ) receives notification for incoming material request');
  assert(
    reqNotif?.message?.includes('ABC Village Construction'),
    'Notification message references sender organization name'
  );

  // ---------------------------------------------------------
  // TEST 3: Organization B Views Request (Auto Transition to 'Viewed')
  // ---------------------------------------------------------
  console.log('\n--- Phase 4: Auto-View Transition (TEST 3) ---');
  const getTxRes = await apiRequest(`/business-transactions/${tx1._id}`, { method: 'GET' }, alexToken);
  assert(getTxRes.status === 200, 'TEST 3: Organization B (XYZ) fetches transaction details');
  assert(
    getTxRes.data?.data?.status === 'Viewed',
    'TEST 3: Transaction status automatically transitioned from Sent to Viewed upon recipient access'
  );

  // ---------------------------------------------------------
  // TEST 4 & TEST 5: Acceptance & Status Sync Across Organizations
  // ---------------------------------------------------------
  console.log('\n--- Phase 5: Acceptance & Status Synchronization (TEST 4 & TEST 5) ---');
  const acceptRes = await apiRequest(
    `/business-transactions/${tx1._id}/accept`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        responseMessage: 'Material dispatch scheduled for 25th September 2026',
      }),
    },
    alexToken
  );

  assert(acceptRes.status === 200, 'TEST 4: Organization B (XYZ) accepts the material request');
  assert(acceptRes.data?.data?.status === 'Accepted', 'Transaction status is now Accepted');
  assert(
    acceptRes.data?.data?.responseMessage === 'Material dispatch scheduled for 25th September 2026',
    'Response message recorded successfully'
  );

  // Verify Organization A (ABC) sees updated status = Accepted
  const rameshGetTxRes = await apiRequest(`/business-transactions/${tx1._id}`, { method: 'GET' }, rameshToken);
  assert(rameshGetTxRes.status === 200, 'Organization A (ABC) queries transaction');
  assert(
    rameshGetTxRes.data?.data?.status === 'Accepted',
    'TEST 5: Organization A sees updated status = Accepted'
  );

  // Verify Requester Notification on Acceptance
  const abcNotifRes = await apiRequest('/notifications', { method: 'GET' }, rameshToken);
  const acceptNotif = (abcNotifRes.data?.data || []).find((n) => n.type === 'BUSINESS_TRANSACTION_ACCEPTED');
  assert(!!acceptNotif, 'Organization A (ABC) received notification of request acceptance');

  // ---------------------------------------------------------
  // Phase 6: Operational Execution (Start -> Complete Lifecycle)
  // ---------------------------------------------------------
  console.log('\n--- Phase 6: Delivery Execution & Completion Lifecycle ---');
  const startRes = await apiRequest(
    `/business-transactions/${tx1._id}/start`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        carrier: 'Gujarat Concrete Logistics',
        vehicleNumber: 'GJ-01-BX-9988',
        note: 'Transit dispatch initiated from Ahmedabad yard',
      }),
    },
    alexToken
  );

  assert(startRes.status === 200, 'Organization B starts delivery execution');
  assert(startRes.data?.data?.status === 'In Progress', 'Transaction status updated to In Progress');

  const completeRes = await apiRequest(
    `/business-transactions/${tx1._id}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify({ note: 'Batch received and quality verified on site' }),
    },
    rameshToken
  );

  assert(completeRes.status === 200, 'Organization A marks transaction completed');
  assert(completeRes.data?.data?.status === 'Completed', 'Transaction status updated to Completed');

  // ---------------------------------------------------------
  // TEST 6: Rejection Flow
  // ---------------------------------------------------------
  console.log('\n--- Phase 7: Rejection Lifecycle (TEST 6) ---');
  const createTx2 = await apiRequest(
    '/business-transactions',
    {
      method: 'POST',
      body: JSON.stringify({
        recipientOrganizationId: xyzOrgId,
        connectionId: activeConn._id,
        requestType: 'Service Request',
        title: 'Specialized Soil Testing Engineering Services',
        quantity: 1,
        unit: 'Units',
        requestedDate: '2026-09-22',
        expectedDeliveryDate: '2026-09-30',
        description: 'Geotechnical soil investigation request',
      }),
    },
    rameshToken
  );

  assert(createTx2.status === 201, 'Created second request (Service Request)');
  const tx2Id = createTx2.data?.data?._id;

  const rejectRes = await apiRequest(
    `/business-transactions/${tx2Id}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Equipment currently committed to Metro Rail project' }),
    },
    alexToken
  );

  assert(rejectRes.status === 200, 'TEST 6: Organization B rejects second request');
  assert(rejectRes.data?.data?.status === 'Rejected', 'Status updated to Rejected');
  assert(
    rejectRes.data?.data?.rejectionReason === 'Equipment currently committed to Metro Rail project',
    'Rejection reason recorded'
  );

  // ---------------------------------------------------------
  // TEST 7: IDOR Defense & Unauthorized Access Prevention
  // ---------------------------------------------------------
  console.log('\n--- Phase 8: IDOR & Authorization Security (TEST 7 & TEST 8) ---');

  // Register an unrelated 3rd party Organization User
  const org3Email = `unauthorized_builder_${Date.now()}@buildops.ai`;
  const registerOrg3 = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sneha Verma',
      email: org3Email,
      password: 'Password123!',
      role: 'Manager',
      organizationName: 'Baroda Structural Builders',
      organizationLocation: 'Vadodara',
    }),
  });

  assert(registerOrg3.status === 201, 'Registered unrelated 3rd organization (Baroda Structural Builders)');
  const org3Token = registerOrg3.data?.token;

  // IDOR Test: Org 3 tries to access Org A / B transaction
  const ilicitiTxView = await apiRequest(`/business-transactions/${tx1._id}`, { method: 'GET' }, org3Token);
  assert(
    ilicitiTxView.status === 403,
    'TEST 7: Unauthorized organization cannot access transaction (returns 403 Forbidden)',
    `got status: ${ilicitiTxView.status}`
  );

  const illicitAccept = await apiRequest(`/business-transactions/${tx1._id}/accept`, { method: 'PATCH' }, org3Token);
  assert(
    illicitAccept.status === 403,
    'TEST 7: Unauthorized organization cannot accept transaction (returns 403 Forbidden)'
  );

  // ---------------------------------------------------------
  // TEST 8: Cannot Create Transaction with Unconnected Organization
  // ---------------------------------------------------------
  const org3Id = registerOrg3.data?.user?.organizationId;
  const unconnectedTxRes = await apiRequest(
    '/business-transactions',
    {
      method: 'POST',
      body: JSON.stringify({
        recipientOrganizationId: org3Id, // No accepted business connection exists with Org 3!
        requestType: 'Material Request',
        title: 'Unconnected Cement Order',
        quantity: 100,
        unit: 'Bags',
        expectedDeliveryDate: '2026-09-30',
      }),
    },
    rameshToken
  );

  assert(
    unconnectedTxRes.status === 400,
    'TEST 8: User cannot create transaction with an organization that is not connected (400 Bad Request)',
    `got status: ${unconnectedTxRes.status}`
  );

  // ---------------------------------------------------------
  // TEST 9: Private Project Information Isolation
  // ---------------------------------------------------------
  console.log('\n--- Phase 9: Project Data Isolation (TEST 9) ---');
  const partnerTxView = await apiRequest(`/business-transactions/${tx1._id}`, { method: 'GET' }, alexToken);
  assert(partnerTxView.status === 200, 'Recipient fetched transaction with linked project');
  const linkedProj = partnerTxView.data?.data?.projectId;

  assert(!!linkedProj?.name, 'Sanitized project exposes name');
  assert(!!linkedProj?.location, 'Sanitized project exposes location');
  assert(!linkedProj?.tasks, 'TEST 9: Private project tasks are NOT exposed');
  assert(!linkedProj?.documents, 'TEST 9: Private documents are NOT exposed');
  assert(!linkedProj?.budget, 'TEST 9: Private financial information is NOT exposed');

  // ---------------------------------------------------------
  // TEST 11: Audit Log Events Recorded
  // ---------------------------------------------------------
  console.log('\n--- Phase 10: Audit Logs Verification (TEST 11) ---');
  const auditRes = await apiRequest('/business-connections/audit-logs', { method: 'GET' }, rameshToken);
  assert(auditRes.status === 200, 'GET /business-connections/audit-logs succeeded');
  const auditEvents = auditRes.data?.data || [];
  const loggedActions = auditEvents.map((a) => a.action);

  assert(
    loggedActions.includes('BUSINESS_TRANSACTION_CREATED'),
    'TEST 11: Audit log records BUSINESS_TRANSACTION_CREATED'
  );
  assert(
    loggedActions.includes('BUSINESS_TRANSACTION_VIEWED'),
    'TEST 11: Audit log records BUSINESS_TRANSACTION_VIEWED'
  );
  assert(
    loggedActions.includes('BUSINESS_TRANSACTION_ACCEPTED'),
    'TEST 11: Audit log records BUSINESS_TRANSACTION_ACCEPTED'
  );
  assert(
    loggedActions.includes('BUSINESS_TRANSACTION_REJECTED'),
    'TEST 11: Audit log records BUSINESS_TRANSACTION_REJECTED'
  );

  // ---------------------------------------------------------
  // TEST 12: Regression Safety for Existing Modules
  // ---------------------------------------------------------
  console.log('\n--- Phase 11: Core Application Regression Safety (TEST 12) ---');
  const projRes = await apiRequest('/projects', { method: 'GET' }, alexToken);
  assert(projRes.status === 200 && projRes.data?.count > 0, 'TEST 12: Projects API continues working');

  const taskRes = await apiRequest('/tasks', { method: 'GET' }, alexToken);
  assert(taskRes.status === 200 && taskRes.data?.count > 0, 'TEST 12: Tasks API continues working');

  const matRes = await apiRequest('/materials', { method: 'GET' }, alexToken);
  assert(matRes.status === 200 && matRes.data?.count > 0, 'TEST 12: Materials API continues working');

  console.log('\n========================================================================');
  console.log(`TASK 21 SUITE RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTask21Suite().catch((err) => {
  console.error('Task 21 test suite uncaught failure:', err);
  process.exit(1);
});
