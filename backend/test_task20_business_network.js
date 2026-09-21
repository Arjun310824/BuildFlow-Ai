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

async function runTask20Suite() {
  console.log('========================================================================');
  console.log('BUILDOPS AI — TASK 20 BUSINESS NETWORK & DATA SHARING TEST SUITE');
  console.log('========================================================================\n');

  // Connect to DB for direct verification
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);

  // ---------------------------------------------------------
  // 1. Authenticate Alex Morgan (XYZ City Infrastructure)
  // ---------------------------------------------------------
  console.log('--- Phase 1: Authentication & Organization Profile ---');
  const alexLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'alex.morgan@buildops.ai',
      password: 'Password123!',
    }),
  });

  assert(alexLogin.status === 200, 'Alex Morgan login succeeded', `status: ${alexLogin.status}`);
  const alexToken = alexLogin.data?.token;
  const alexUser = alexLogin.data?.user;
  assert(!!alexToken, 'JWT token returned for Alex Morgan');
  assert(!!alexUser?.organizationId, 'Alex Morgan user object contains organizationId');

  // Verify Organization Profile via /api/organizations/my
  const myOrgRes = await apiRequest('/organizations/my', { method: 'GET' }, alexToken);
  assert(myOrgRes.status === 200, 'GET /api/organizations/my succeeded');
  assert(
    myOrgRes.data?.data?.name === 'XYZ City Infrastructure',
    'Caller organization is XYZ City Infrastructure'
  );
  assert(
    myOrgRes.data?.data?.location === 'Ahmedabad',
    'XYZ City Infrastructure location is Ahmedabad'
  );
  const xyzOrgId = myOrgRes.data?.data?._id;

  // ---------------------------------------------------------
  // 2. Authenticate Ramesh Patel (ABC Village Construction)
  // ---------------------------------------------------------
  const rameshLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'ramesh.patel@abcvillage.com',
      password: 'Password123!',
    }),
  });

  assert(rameshLogin.status === 200, 'Ramesh Patel (Village Builder) login succeeded');
  const rameshToken = rameshLogin.data?.token;
  const rameshUser = rameshLogin.data?.user;
  assert(!!rameshUser?.organizationId, 'Ramesh user contains organizationId');

  const rameshOrgRes = await apiRequest('/organizations/my', { method: 'GET' }, rameshToken);
  assert(
    rameshOrgRes.data?.data?.name === 'ABC Village Construction',
    'Ramesh organization is ABC Village Construction'
  );
  assert(
    rameshOrgRes.data?.data?.location === 'Sanand',
    'ABC Village Construction location is Sanand'
  );
  const abcOrgId = rameshOrgRes.data?.data?._id;

  // ---------------------------------------------------------
  // 3. Organization Directory Search
  // ---------------------------------------------------------
  console.log('\n--- Phase 2: Organization Directory Search ---');
  const dirRes = await apiRequest('/organizations', { method: 'GET' }, alexToken);
  assert(dirRes.status === 200, 'GET /api/organizations returns directory list');
  assert(Array.isArray(dirRes.data?.data), 'Organizations data is an array');
  const hasAbc = dirRes.data?.data?.some((o) => o.name === 'ABC Village Construction');
  assert(hasAbc, 'ABC Village Construction is listed in partner directory');

  // ---------------------------------------------------------
  // 4. Existing Accepted Connection & Controlled Shared Data
  // ---------------------------------------------------------
  console.log('\n--- Phase 3: Active Connection & Controlled Data Sharing ---');
  const connListRes = await apiRequest('/business-connections', { method: 'GET' }, alexToken);
  assert(connListRes.status === 200, 'GET /api/business-connections succeeded');
  assert(connListRes.data?.count >= 1, 'Found at least 1 active or pending connection');

  const acceptedConn = connListRes.data?.data?.find((c) => c.status === 'Accepted');
  assert(!!acceptedConn, 'Found active accepted connection between XYZ and ABC');

  if (acceptedConn) {
    // Query shared data as Alex (XYZ)
    const sharedRes = await apiRequest(
      `/business-connections/${acceptedConn._id}/shared-data`,
      { method: 'GET' },
      alexToken
    );

    assert(sharedRes.status === 200, 'GET /shared-data succeeded for authorized partner');
    assert(
      Array.isArray(sharedRes.data?.data?.sharedItems),
      'Shared data contains structured sharedItems array'
    );
    assert(
      sharedRes.data?.data?.sharedItems.length >= 2,
      `Shared items returned: ${sharedRes.data?.data?.sharedItems?.length}`
    );

    // Verify Data Sharing Provenance Metadata (Section 9)
    const firstItem = sharedRes.data?.data?.sharedItems[0];
    assert(!!firstItem?.ownerOrganization, 'Shared item clearly specifies ownerOrganization');
    assert(!!firstItem?.sharedBy, 'Shared item clearly specifies sharedBy actor');
    assert(!!firstItem?.permittedBy, 'Shared item clearly specifies permittedBy permission');
    assert(!!firstItem?.sharedAt, 'Shared item clearly specifies sharedAt timestamp');

    // Query shared data as Ramesh (ABC)
    const rameshSharedRes = await apiRequest(
      `/business-connections/${acceptedConn._id}/shared-data`,
      { method: 'GET' },
      rameshToken
    );
    assert(rameshSharedRes.status === 200, 'Ramesh (ABC Village) can also access shared data');
  }

  // ---------------------------------------------------------
  // 5. Lifecycle Test: Create, Duplicate, Self-Connection & Reject Flow
  // ---------------------------------------------------------
  console.log('\n--- Phase 4: Lifecycle, Self-Connection & Duplicate Validation ---');

  // Test Self-Connection prevention
  const selfConnRes = await apiRequest(
    '/business-connections',
    {
      method: 'POST',
      body: JSON.stringify({
        receivingOrganizationId: xyzOrgId, // Alex connecting to Alex's own org
        permissions: ['MATERIAL_ORDERS'],
      }),
    },
    alexToken
  );
  assert(
    selfConnRes.status === 400,
    'Self-connection is rejected with 400 Bad Request',
    `got: ${selfConnRes.status}`
  );

  // Test Duplicate active connection prevention
  const dupConnRes = await apiRequest(
    '/business-connections',
    {
      method: 'POST',
      body: JSON.stringify({
        receivingOrganizationId: abcOrgId, // already connected
        permissions: ['MATERIAL_ORDERS'],
      }),
    },
    alexToken
  );
  assert(
    dupConnRes.status === 400,
    'Duplicate active connection is rejected with 400 Bad Request',
    `got: ${dupConnRes.status}`
  );

  // ---------------------------------------------------------
  // 6. Register a 3rd Builder Organization for Dynamic Connection Testing
  // ---------------------------------------------------------
  console.log('\n--- Phase 5: Dynamic Request, Acceptance, & IDOR Security ---');
  const org3Email = `builder3_${Date.now()}@buildops.ai`;
  const registerOrg3 = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Pooja Sharma',
      email: org3Email,
      password: 'Password123!',
      role: 'Operations Head',
      organizationName: 'Gujarat Metro Concrete Works',
      organizationLocation: 'Gandhinagar',
    }),
  });

  assert(registerOrg3.status === 201, 'Registered 3rd test builder organization');
  const org3Token = registerOrg3.data?.token;
  const org3Id = registerOrg3.data?.user?.organizationId;
  assert(!!org3Id, '3rd builder successfully created and linked to organization');

  // Alex sends connection request to Org 3
  const requestConn = await apiRequest(
    '/business-connections',
    {
      method: 'POST',
      body: JSON.stringify({
        receivingOrganizationId: org3Id,
        permissions: ['MATERIAL_ORDERS', 'DOCUMENTS'],
        purpose: 'Metro transit batch supply testing',
      }),
    },
    alexToken
  );

  assert(requestConn.status === 201, 'Connection request sent successfully to Org 3');
  const newConnId = requestConn.data?.data?._id;
  assert(requestConn.data?.data?.status === 'Pending', 'Connection status is initially Pending');

  // IDOR Defense: Alex (the REQUESTER) attempts to accept his own connection request
  const illicitAccept = await apiRequest(
    `/business-connections/${newConnId}/accept`,
    { method: 'PATCH' },
    alexToken
  );
  assert(
    illicitAccept.status === 403,
    'Requester cannot accept own request (IDOR Defense returns 403)',
    `got: ${illicitAccept.status}`
  );

  // IDOR Defense: Ramesh (an unrelated 3rd party org) attempts to accept or view Org 3 connection
  const rameshIllicitAccept = await apiRequest(
    `/business-connections/${newConnId}/accept`,
    { method: 'PATCH' },
    rameshToken
  );
  assert(
    rameshIllicitAccept.status === 403,
    'Unrelated organization cannot accept connection (403 Forbidden)',
    `got: ${rameshIllicitAccept.status}`
  );

  const rameshIllicitView = await apiRequest(
    `/business-connections/${newConnId}`,
    { method: 'GET' },
    rameshToken
  );
  assert(
    rameshIllicitView.status === 403,
    'Unrelated organization cannot inspect connection details (403 Forbidden)',
    `got: ${rameshIllicitView.status}`
  );

  // State Defense: Attempting to access shared data on a PENDING connection
  const prematureSharedData = await apiRequest(
    `/business-connections/${newConnId}/shared-data`,
    { method: 'GET' },
    org3Token
  );
  assert(
    prematureSharedData.status === 403,
    'Shared data access is forbidden on Pending connection (returns 403)',
    `got: ${prematureSharedData.status}`
  );

  // Legitimate Acceptance: Org 3 accepts the connection
  const validAccept = await apiRequest(
    `/business-connections/${newConnId}/accept`,
    { method: 'PATCH' },
    org3Token
  );
  assert(validAccept.status === 200, 'Org 3 accepts connection successfully');
  assert(validAccept.data?.data?.status === 'Accepted', 'Connection status transitioned to Accepted');

  // Now shared data is authorized
  const postAcceptShared = await apiRequest(
    `/business-connections/${newConnId}/shared-data`,
    { method: 'GET' },
    org3Token
  );
  assert(
    postAcceptShared.status === 200,
    'Shared data access is now authorized after acceptance',
    `got: ${postAcceptShared.status}`
  );

  // Test Update Permissions
  const updatePerms = await apiRequest(
    `/business-connections/${newConnId}/permissions`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        permissions: ['MATERIAL_ORDERS', 'PROJECT_MILESTONES'],
      }),
    },
    alexToken
  );
  assert(updatePerms.status === 200, 'Permissions updated successfully on connection');
  assert(
    updatePerms.data?.data?.permissions?.includes('PROJECT_MILESTONES'),
    'Permissions include PROJECT_MILESTONES'
  );

  // Test Suspend Connection
  const suspendRes = await apiRequest(
    `/business-connections/${newConnId}/suspend`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Temporary maintenance' }),
    },
    alexToken
  );
  assert(suspendRes.status === 200, 'Connection suspended successfully');
  assert(suspendRes.data?.data?.status === 'Suspended', 'Status is Suspended');

  // Verify shared data is blocked while Suspended
  const suspendedSharedData = await apiRequest(
    `/business-connections/${newConnId}/shared-data`,
    { method: 'GET' },
    org3Token
  );
  assert(
    suspendedSharedData.status === 403,
    'Shared data access is forbidden when connection is Suspended (returns 403)'
  );

  // ---------------------------------------------------------
  // 7. Audit Log Verification
  // ---------------------------------------------------------
  console.log('\n--- Phase 6: Audit Log & Notifications ---');
  const auditRes = await apiRequest('/business-connections/audit-logs', { method: 'GET' }, alexToken);
  assert(auditRes.status === 200, 'GET /business-connections/audit-logs succeeded');
  assert(Array.isArray(auditRes.data?.data), 'Audit logs is an array');
  assert(auditRes.data?.count >= 1, `Audit records found: ${auditRes.data?.count}`);

  const actionsLogged = auditRes.data?.data?.map((l) => l.action) || [];
  assert(
    actionsLogged.some((a) => a.includes('REQUESTED') || a.includes('ACCEPTED')),
    'Audit logs record lifecycle events (REQUESTED / ACCEPTED)'
  );

  // Notifications Check for Org 3
  const notifRes = await apiRequest('/notifications', { method: 'GET' }, org3Token);
  assert(notifRes.status === 200, 'GET /notifications succeeded for Org 3');
  assert(Array.isArray(notifRes.data?.data), 'Notifications is an array');
  assert(
    notifRes.data?.data?.length >= 1,
    `Org 3 received notifications: ${notifRes.data?.data?.length}`
  );

  // ---------------------------------------------------------
  // 8. Regression Safety: Existing Core Modules
  // ---------------------------------------------------------
  console.log('\n--- Phase 7: Application Regression Safety ---');
  const projRes = await apiRequest('/projects', { method: 'GET' }, alexToken);
  assert(projRes.status === 200 && projRes.data?.count > 0, 'Projects API continues functioning normally');

  const taskRes = await apiRequest('/tasks', { method: 'GET' }, alexToken);
  assert(taskRes.status === 200 && taskRes.data?.count > 0, 'Tasks API continues functioning normally');

  const matRes = await apiRequest('/materials', { method: 'GET' }, alexToken);
  assert(matRes.status === 200 && matRes.data?.count > 0, 'Materials API continues functioning normally');

  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTask20Suite().catch((err) => {
  console.error('Test suite uncaught failure:', err);
  process.exit(1);
});
