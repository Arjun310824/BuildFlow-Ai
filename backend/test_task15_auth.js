import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';

const API_BASE = 'http://localhost:5000/api';
let passed = 0;
let total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

async function runAuthSuite() {
  console.log('====================================================');
  console.log('BUILD OPS AI — TASK 15 AUTHENTICATION TEST SUITE');
  console.log('====================================================\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);

  const testEmail = `test_engineer_${Date.now()}@buildops.ai`;
  const testPassword = 'StrongPassword99!';
  const testName = 'Marcus Vance';
  const testRole = 'Site Engineer';

  // ----------------------------------------------------
  // 1. Registration Tests
  // ----------------------------------------------------
  console.log('--- 1. Registration Tests ---');

  // 1. Register valid user
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      role: testRole,
    }),
  });
  assert(regRes.status === 201 && regRes.data?.success === true, 'Register valid user returns 201 Created');
  assert(Boolean(regRes.data?.token), 'Registration response contains JWT token');
  assert(regRes.data?.user?.email === testEmail.toLowerCase(), 'Registration response contains safe user object');
  assert(!regRes.data?.user?.password && !regRes.data?.user?.passwordHash, 'Password and hash are NEVER returned in response');

  // 2. Register duplicate email
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Duplicate Vance',
      email: testEmail,
      password: 'AnotherPassword123!',
    }),
  });
  assert(dupRes.status === 400 && dupRes.data?.success === false, 'Duplicate email registration correctly rejected with 400 Bad Request');
  assert(dupRes.data?.message?.includes('already exists'), 'Duplicate email returns clear explanatory message');

  // 3. Register invalid email
  const invEmailRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid Email',
      email: 'not-an-email',
      password: 'ValidPassword123!',
    }),
  });
  assert(invEmailRes.status === 400 && invEmailRes.data?.success === false, 'Invalid email format rejected with 400 Bad Request');

  // 4. Register missing password
  const noPassRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'No Password',
      email: 'nopass@buildops.ai',
    }),
  });
  assert(noPassRes.status === 400 && noPassRes.data?.success === false, 'Missing password rejected with 400 Bad Request');

  // 5. Short password (<6 chars)
  const shortPassRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Short Pass',
      email: 'shortpass@buildops.ai',
      password: '123',
    }),
  });
  assert(shortPassRes.status === 400 && shortPassRes.data?.success === false, 'Password < 6 characters rejected with 400 Bad Request');

  // 6. Verify password is saved as bcrypt hash in MongoDB
  const dbUser = await User.findOne({ email: testEmail.toLowerCase() }).select('+password');
  assert(Boolean(dbUser), 'User record persisted in MongoDB User collection');
  assert(
    dbUser?.password && dbUser.password.startsWith('$2') && dbUser.password !== testPassword,
    'User password is securely hashed with bcrypt in database'
  );

  // ----------------------------------------------------
  // 2. Login Tests
  // ----------------------------------------------------
  console.log('\n--- 2. Login Tests ---');

  // 7. Valid login
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  assert(loginRes.status === 200 && loginRes.data?.success === true, 'Valid login returns 200 OK');
  assert(Boolean(loginRes.data?.token), 'Valid login issues JWT token');
  assert(loginRes.data?.user?.name === testName, 'Login response returns user name');
  assert(loginRes.data?.user?.role === testRole, 'Login response returns user role');
  assert(!loginRes.data?.user?.password, 'Login response does not expose password');

  const validToken = loginRes.data?.token;

  // 8. Invalid password
  const badPassRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword!',
    }),
  });
  assert(badPassRes.status === 401 && badPassRes.data?.success === false, 'Invalid password rejected with 401 Unauthorized');
  assert(badPassRes.data?.message === 'Invalid email or password.', 'Error message does not reveal account enumeration details');

  // 9. Non-existent email
  const badEmailRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'nonexistent@buildops.ai',
      password: 'AnyPassword!',
    }),
  });
  assert(badEmailRes.status === 401 && badEmailRes.data?.success === false, 'Non-existent user login rejected with 401 Unauthorized');

  // ----------------------------------------------------
  // 3. Current User (/api/auth/me) Tests
  // ----------------------------------------------------
  console.log('\n--- 3. /api/auth/me Tests ---');

  // 10. GET /api/auth/me with valid token
  const meValidRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert(meValidRes.status === 200 && meValidRes.data?.success === true, 'GET /api/auth/me with valid token returns 200 OK');
  assert(meValidRes.data?.user?.email === testEmail.toLowerCase(), 'Profile email matches authenticated user');
  assert(meValidRes.data?.user?.role === testRole, 'Profile role matches authenticated user');

  // 11. GET /api/auth/me without token
  const meNoTokenRes = await request('/auth/me');
  assert(meNoTokenRes.status === 401 && meNoTokenRes.data?.success === false, 'GET /api/auth/me without token rejected with 401 Unauthorized');

  // 12. GET /api/auth/me with invalid token
  const meInvTokenRes = await request('/auth/me', {
    headers: { Authorization: 'Bearer invalid.fake.token' },
  });
  assert(meInvTokenRes.status === 401 && meInvTokenRes.data?.success === false, 'GET /api/auth/me with invalid token rejected with 401 Unauthorized');

  // 13. GET /api/auth/me with expired token
  const expiredToken = jwt.sign(
    { id: dbUser._id.toString(), email: testEmail, role: testRole },
    process.env.JWT_SECRET,
    { expiresIn: '0s' } // Expired immediately
  );
  const meExpTokenRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(meExpTokenRes.status === 401 && meExpTokenRes.data?.success === false, 'GET /api/auth/me with expired token rejected with 401 Unauthorized');

  // ----------------------------------------------------
  // 4. Protected API Endpoints Verification
  // ----------------------------------------------------
  console.log('\n--- 4. Protected API Endpoints Verification ---');

  // 14. Unauthenticated /api/projects
  const unauthProjects = await request('/projects');
  assert(unauthProjects.status === 401, 'Unauthenticated GET /api/projects rejected with 401');

  // 15. Authenticated /api/projects
  const authProjects = await request('/projects', {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert(authProjects.status === 200 && authProjects.data?.success === true, 'Authenticated GET /api/projects returns 200 OK with project data');

  // 16. Unauthenticated /api/ai/projects
  const unauthAiProjects = await request('/ai/projects');
  assert(unauthAiProjects.status === 401, 'Unauthenticated GET /api/ai/projects rejected with 401');

  // 17. Authenticated /api/ai/projects
  const authAiProjects = await request('/ai/projects', {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert(authAiProjects.status === 200 && authAiProjects.data?.success === true, 'Authenticated GET /api/ai/projects returns 200 OK');

  // 18. Public /api/health check remains accessible without token
  const healthRes = await request('/health');
  assert(healthRes.status === 200, 'Public GET /api/health remains accessible without auth token');

  // Cleanup test user from MongoDB
  await User.deleteOne({ email: testEmail.toLowerCase() });

  console.log('\n====================================================');
  console.log(`TASK 15 TEST RESULTS: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

runAuthSuite().catch((err) => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
