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

async function requestWithRetry(method, path, body = null, headers = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await request(method, path, body, headers);
    if (res.status === 200 || res.status === 201) return res;
    if (attempt < retries - 1) {
      console.log(`\n⚠️ Request returned status ${res.status}. Waiting 6 seconds before retry (Attempt ${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, 6000));
    } else {
      return res;
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runMultilingualTestSuite() {
  console.log('================================================================');
  console.log('TASK 22 — MULTILINGUAL BUILDOPS AI TEST SUITE (EN + HI + GU)');
  console.log('================================================================\n');

  // 1. Authenticate user
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'ramesh.patel@abcvillage.com',
    password: 'Password123!',
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Auth login as ramesh.patel@abcvillage.com');
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Fetch active projects to get a valid projectId
  const projectsRes = await request('GET', '/api/projects', null, authHeaders);
  assert(projectsRes.status === 200 && Array.isArray(projectsRes.data.data), 'GET /api/projects returns array');
  const projects = projectsRes.data.data;
  assert(projects.length > 0, 'At least one project exists in database');
  const projectId = projects[0]._id;
  console.log(`📌 Testing using project: ${projects[0].name} (ID: ${projectId})\n`);

  // Sample 1x1 base64 GIF / PNG image for multimodal testing
  const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Minimal valid PDF base64 for PDF testing
  const samplePdfBase64 = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
  ).toString('base64');

  // TEST CASES
  const testCases = [
    {
      id: 1,
      name: 'TEST 1: English - Delayed Tasks',
      query: 'Which tasks are delayed?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 2,
      name: 'TEST 2: Hindi - Delayed Tasks (Hinglish)',
      query: 'Kaunse tasks delayed hain?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 3,
      name: 'TEST 3: Gujarati - Delayed Tasks (Script)',
      query: 'કયા tasks delayed છે?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 4,
      name: 'TEST 4: English - Low Materials',
      query: 'What materials are low?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 5,
      name: 'TEST 5: Hindi - Low Materials (Hinglish)',
      query: 'Kaunse materials low hain?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 6,
      name: 'TEST 6: Gujarati - Low Materials (Script)',
      query: 'કયા materials low છે?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 7,
      name: 'TEST 7: English - Today Briefing',
      query: "Give me today's project briefing.",
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 15,
    },
    {
      id: 8,
      name: 'TEST 8: Hindi - Today Briefing',
      query: 'Aaj ka project briefing do.',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 15,
    },
    {
      id: 9,
      name: 'TEST 9: Gujarati - Today Briefing',
      query: 'આજનું project briefing આપો.',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 15,
    },
    {
      id: 10,
      name: 'TEST 10: Mixed Gujlish - Current Progress',
      query: 'Project nu current progress ketlu chhe?',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 11,
      name: 'TEST 11: Language Switch - Risk in Gujarati',
      query: 'Project ka risk Gujarati mein explain karo.',
      type: 'chat',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 12,
      name: 'TEST 12: Image + Hindi Question',
      query: 'Is photo mein kya problem dikh rahi hai?',
      type: 'image',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 13,
      name: 'TEST 13: Image + Gujarati Question',
      query: 'આ photo માં કોઈ construction problem દેખાય છે?',
      type: 'image',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 14,
      name: 'TEST 14: PDF + Hindi Question',
      query: 'Is PDF mein kaunse project risks mention kiye hain?',
      type: 'pdf',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 15,
      name: 'TEST 15: PDF + Gujarati Question',
      query: 'આ document માં material shortage વિશે શું લખ્યું છે?',
      type: 'pdf',
      check: (ans) => typeof ans === 'string' && ans.length > 10,
    },
    {
      id: 16,
      name: 'TEST 16: Unrelated English Question',
      query: 'What is Bitcoin?',
      type: 'unrelated',
      check: (ans) =>
        ans.toLowerCase().includes('construction') ||
        ans.toLowerCase().includes('project') ||
        ans.toLowerCase().includes('buildops'),
    },
    {
      id: 17,
      name: 'TEST 17: Unrelated Hindi Question',
      query: 'भारत का प्रधानमंत्री कौन है?',
      type: 'unrelated',
      check: (ans) =>
        ans.includes('BuildOps AI') ||
        ans.includes('construction') ||
        ans.includes('project') ||
        ans.includes('मदद'),
    },
    {
      id: 18,
      name: 'TEST 18: Unrelated Gujarati Question',
      query: 'આજે IPL માં કોણ જીત્યું?',
      type: 'unrelated',
      check: (ans) =>
        ans.includes('BuildOps AI') ||
        ans.includes('construction') ||
        ans.includes('project') ||
        ans.includes('મદદ'),
    },
  ];

  for (const tc of testCases) {
    console.log(`--- Running ${tc.name} ---`);
    let payload = {
      message: tc.query,
      projectId,
    };

    if (tc.type === 'image') {
      payload.images = [
        {
          data: sampleImageBase64,
          mimeType: 'image/png',
          name: 'site_inspection.png',
        },
      ];
    } else if (tc.type === 'pdf') {
      payload.documents = [
        {
          data: samplePdfBase64,
          mimeType: 'application/pdf',
          name: 'project_report.pdf',
        },
      ];
    }

    // Add pacing delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const res = await requestWithRetry('POST', '/api/ai/chat', payload, authHeaders);
    assert(res.status === 200, `POST /api/ai/chat returned HTTP 200 for ${tc.name}`);
    const answer = res.data.answer || res.data.response || '';
    assert(tc.check(answer), `Validation passed for ${tc.name}`);
    console.log(`💬 AI Output snippet (${tc.name}): "${answer.slice(0, 90).replace(/\n/g, ' ')}..."\n`);
  }

  console.log('================================================================');
  console.log('🎉 ALL 18 MULTILINGUAL BUILDOPS AI TEST CASES PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runMultilingualTestSuite().catch((err) => {
  console.error('\n❌ Multilingual Test Suite Failed:', err.message);
  process.exit(1);
});
