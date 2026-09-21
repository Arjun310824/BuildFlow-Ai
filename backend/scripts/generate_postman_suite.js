import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionUid = 'buildops-ai-full-test-suite-v21';

function makeHeader(key, value) {
  return { key, value, type: 'text' };
}

function authHeaders(withFinancial = false) {
  const headers = [
    makeHeader('Authorization', 'Bearer {{jwt_token}}'),
    makeHeader('Content-Type', 'application/json'),
  ];
  if (withFinancial) {
    headers.push(makeHeader('x-financial-access-token', '{{financial_token}}'));
  }
  return headers;
}

function jsonBody(obj) {
  return {
    mode: 'raw',
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: 'json' } },
  };
}

function testScript(lines) {
  return [
    {
      listen: 'test',
      script: {
        exec: lines,
        type: 'text/javascript',
      },
    },
  ];
}

function preRequestScript(lines) {
  return [
    {
      listen: 'prerequest',
      script: {
        exec: lines,
        type: 'text/javascript',
      },
    },
  ];
}

function urlObject(rawUrl) {
  const parts = rawUrl.replace('{{baseUrl}}/', '').split('?');
  const pathParts = parts[0].split('/').filter(Boolean);
  const result = {
    raw: rawUrl,
    host: ['{{baseUrl}}'],
    path: pathParts,
  };
  if (parts[1]) {
    const qParams = parts[1].split('&').map((pair) => {
      const [k, v] = pair.split('=');
      return { key: decodeURIComponent(k), value: decodeURIComponent(v || '') };
    });
    result.query = qParams;
  }
  return result;
}

// ==========================================
// FOLDERS & REQUESTS DEFINITION
// ==========================================

const folders = [
  // -------------------------------------------------------------
  // FOLDER 1: Health & Diagnostics
  // -------------------------------------------------------------
  {
    name: '01 - System & Health Diagnostics',
    description: 'System liveness, readiness, and API health monitoring checks',
    item: [
      {
        name: 'Check Backend API Health',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Response is valid JSON with success: true", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.status).to.eql("ok");',
          '    pm.expect(jsonData.message).to.include("BuildOps AI backend is running");',
          '});',
          'pm.test("Response time is under 1000ms", function () {',
          '    pm.expect(pm.response.responseTime).to.be.below(1000);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: [],
          url: urlObject('{{baseUrl}}/api/health'),
          description: 'Validates that the Node.js/Express server and underlying connections are live.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 2: Authentication & Profile
  // -------------------------------------------------------------
  {
    name: '02 - Authentication & Profile',
    description: 'User registration, JWT token generation, active session verification, and logout',
    item: [
      {
        name: 'Register QA Engineer User',
        event: [
          ...preRequestScript([
            'if (!pm.environment.get("test_email")) {',
            '    var uniqueEmail = "qa_lead_" + Date.now() + "@buildops.ai";',
            '    pm.environment.set("test_email", uniqueEmail);',
            '}',
            'if (!pm.environment.get("test_password")) {',
            '    pm.environment.set("test_password", "BuildOps2026!Secure");',
            '}',
          ]),
          ...testScript([
            'pm.test("Status code is 201 Created or 200 OK", function () {',
            '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
            '});',
            'pm.test("Returns valid JWT token and user info", function () {',
            '    var jsonData = pm.response.json();',
            '    pm.expect(jsonData.success).to.eql(true);',
            '    pm.expect(jsonData.token).to.be.a("string");',
            '    pm.expect(jsonData.user).to.be.an("object");',
            '    pm.environment.set("jwt_token", jsonData.token);',
            '    if (jsonData.user._id || jsonData.user.id) {',
            '        pm.environment.set("userId", jsonData.user._id || jsonData.user.id);',
            '    }',
            '});',
          ]),
        ],
        request: {
          method: 'POST',
          header: [makeHeader('Content-Type', 'application/json')],
          body: jsonBody({
            name: 'Alex Mercer (Lead QA)',
            email: '{{test_email}}',
            password: '{{test_password}}',
            role: 'Project Manager',
          }),
          url: urlObject('{{baseUrl}}/api/auth/register'),
          description: 'Registers a new user account with role Project Manager and obtains a JWT token.',
        },
      },
      {
        name: 'Login User with Credentials',
        event: testScript([
          'pm.test("Login status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns authenticated JWT token", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.token).to.be.a("string");',
          '    pm.environment.set("jwt_token", jsonData.token);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: [makeHeader('Content-Type', 'application/json')],
          body: jsonBody({
            email: '{{test_email}}',
            password: '{{test_password}}',
          }),
          url: urlObject('{{baseUrl}}/api/auth/login'),
          description: 'Authenticates with email and password and captures the JWT Bearer token.',
        },
      },
      {
        name: 'Get Current Authenticated User (Me)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns current user profile matching registered email", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.user).to.be.an("object");',
          '    pm.expect(jsonData.user.email).to.eql(pm.environment.get("test_email"));',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/auth/me'),
          description: 'Retrieves current user details using Authorization: Bearer {{jwt_token}}.',
        },
      },
      {
        name: 'User Logout Endpoint',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns success message", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: [makeHeader('Content-Type', 'application/json')],
          body: jsonBody({}),
          url: urlObject('{{baseUrl}}/api/auth/logout'),
          description: 'Calls logout endpoint to invalidate/terminate active session tokens.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 3: Organization & B2B Directory
  // -------------------------------------------------------------
  {
    name: '03 - Organizations & Workspaces',
    description: 'B2B organization management, directory listing, and workspace affiliation',
    item: [
      {
        name: 'Create or Update Organization',
        event: testScript([
          'pm.test("Status code is 200 OK or 201 Created", function () {',
          '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
          '});',
          'pm.test("Organization created or updated with valid ID", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    if (jsonData.data._id) {',
          '        pm.environment.set("organizationId", jsonData.data._id);',
          '    }',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            name: 'Apex Infrastructure Group',
            type: 'General Contractor',
            location: 'Ahmedabad, Gujarat',
            code: 'APEX',
            description: 'Commercial & High-Rise Infrastructure Specialist',
          }),
          url: urlObject('{{baseUrl}}/api/organizations'),
          description: 'Associates the authenticated user with a registered B2B organization.',
        },
      },
      {
        name: 'Get Current User Organization (/my)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns caller organization info and stats", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    if (jsonData.data) {',
          '        pm.expect(jsonData.data.name).to.include("Apex");',
          '        pm.expect(jsonData.data.stats).to.be.an("object");',
          '    }',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/organizations/my'),
          description: 'Retrieves active organization details and partnership statistics.',
        },
      },
      {
        name: 'List Registered Organizations for Discovery',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns array of organizations", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/organizations'),
          description: 'Queries B2B directory for external partners.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 4: Project Management CRUD
  // -------------------------------------------------------------
  {
    name: '04 - Project Management',
    description: 'Full CRUD lifecycle for construction projects including status/risk queries',
    item: [
      {
        name: 'Create New Construction Project',
        event: testScript([
          'pm.test("Project creation returns 201 Created", function () {',
          '    pm.response.to.have.status(201);',
          '});',
          'pm.test("Returns created project object with MongoDB ObjectId", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.be.a("string");',
          '    pm.environment.set("projectId", id);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            name: 'Skyline Heights Luxury Tower Phase II',
            client: 'Apex Global Developments',
            location: 'SG Highway, Ahmedabad',
            manager: 'Alex Mercer',
            startDate: '2026-04-01',
            endDate: '2026-12-31',
            progress: 35,
            status: 'In Progress',
            risk: 'Low',
          }),
          url: urlObject('{{baseUrl}}/api/projects'),
          description: 'Creates a new construction project and stores projectId in environment.',
        },
      },
      {
        name: 'List All Projects',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Response includes count and array of projects", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.count).to.be.a("number");',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    pm.expect(jsonData.data.length).to.be.at.least(1);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/projects'),
          description: 'Fetches list of all construction projects.',
        },
      },
      {
        name: 'Get Project by ID',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns project matching requested projectId", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.eql(pm.environment.get("projectId"));',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}'),
          description: 'Retrieves specific project details using its unique ID.',
        },
      },
      {
        name: 'Update Project Details & Progress',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Project updated with new progress percentage", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data.progress).to.eql(42);',
          '    pm.expect(jsonData.data.risk).to.eql("Low");',
          '});',
        ]),
        request: {
          method: 'PUT',
          header: authHeaders(),
          body: jsonBody({
            progress: 42,
            risk: 'Low',
            status: 'In Progress',
          }),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}'),
          description: 'Updates project progress to 42% and verifies persisted state.',
        },
      },
      {
        name: 'Filter Projects by Status Query',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("All returned projects have In Progress status", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    jsonData.data.forEach(function (proj) {',
          '        pm.expect(proj.status).to.eql("In Progress");',
          '    });',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/projects?status=In%20Progress'),
          description: 'Filters projects by status parameter.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 5: Task Management CRUD
  // -------------------------------------------------------------
  {
    name: '05 - Task Management',
    description: 'Task scheduling, dependency tracking, status workflows, and priority filters',
    item: [
      {
        name: 'Create Task for Project',
        event: testScript([
          'pm.test("Status code is 201 Created", function () {',
          '    pm.response.to.have.status(201);',
          '});',
          'pm.test("Task created and linked to project", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.be.a("string");',
          '    pm.environment.set("taskId", id);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            projectId: '{{projectId}}',
            title: 'Substructure Raft Concrete Pouring - Block B',
            startDate: '2026-04-10',
            dueDate: '2026-05-20',
            progress: 25,
            status: 'In Progress',
            priority: 'High',
          }),
          url: urlObject('{{baseUrl}}/api/tasks'),
          description: 'Creates a task associated with the project and captures taskId.',
        },
      },
      {
        name: 'List All Tasks',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns tasks array with count", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    pm.expect(jsonData.count).to.be.at.least(1);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/tasks'),
          description: 'Retrieves all tasks in the system.',
        },
      },
      {
        name: 'Get Task by ID',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns task with matching taskId", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.eql(pm.environment.get("taskId"));',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/tasks/{{taskId}}'),
          description: 'Gets individual task details.',
        },
      },
      {
        name: 'Update Task Progress & Status',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Task updated successfully", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data.progress).to.eql(50);',
          '    pm.expect(jsonData.data.priority).to.eql("Critical");',
          '});',
        ]),
        request: {
          method: 'PUT',
          header: authHeaders(),
          body: jsonBody({
            progress: 50,
            priority: 'Critical',
            status: 'In Progress',
          }),
          url: urlObject('{{baseUrl}}/api/tasks/{{taskId}}'),
          description: 'Updates task progress to 50% and priority to Critical.',
        },
      },
      {
        name: 'Filter Tasks by Project ID',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("All returned tasks belong to target projectId", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    var targetId = pm.environment.get("projectId");',
          '    jsonData.data.forEach(function (task) {',
          '        var pId = task.projectId?._id || task.projectId || task.project;',
          '        pm.expect(String(pId)).to.include(targetId);',
          '    });',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/tasks?projectId={{projectId}}'),
          description: 'Queries tasks scoped to the current project.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 6: Material Management CRUD
  // -------------------------------------------------------------
  {
    name: '06 - Material Management',
    description: 'Inventory monitoring, stock tracking, category classification, and material records',
    item: [
      {
        name: 'Create Material for Project',
        event: testScript([
          'pm.test("Status code is 201 Created", function () {',
          '    pm.response.to.have.status(201);',
          '});',
          'pm.test("Material created and linked to project", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.be.a("string");',
          '    pm.environment.set("materialId", id);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            projectId: '{{projectId}}',
            name: 'Grade 60 Structural Steel Rebar',
            category: 'Structural Steel',
            requiredQuantity: 600,
            availableQuantity: 420,
            usedQuantity: 180,
            unit: 'Tons',
          }),
          url: urlObject('{{baseUrl}}/api/materials'),
          description: 'Records a new material item under the active project.',
        },
      },
      {
        name: 'List All Materials',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns materials array with count", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    pm.expect(jsonData.count).to.be.at.least(1);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/materials'),
          description: 'Fetches inventory records across all projects.',
        },
      },
      {
        name: 'Get Material by ID',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns material matching materialId", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    var id = jsonData.data._id || jsonData.data.id;',
          '    pm.expect(id).to.eql(pm.environment.get("materialId"));',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/materials/{{materialId}}'),
          description: 'Gets individual material stock record.',
        },
      },
      {
        name: 'Update Material Stock Level',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Material inventory updated successfully", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data.availableQuantity).to.eql(480);',
          '});',
        ]),
        request: {
          method: 'PUT',
          header: authHeaders(),
          body: jsonBody({
            availableQuantity: 480,
          }),
          url: urlObject('{{baseUrl}}/api/materials/{{materialId}}'),
          description: 'Updates available material quantity following a new site delivery.',
        },
      },
      {
        name: 'Filter Materials by Category',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("All returned materials match queried category", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    jsonData.data.forEach(function (mat) {',
          '        pm.expect(mat.category).to.eql("Structural Steel");',
          '    });',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/materials?category=Structural%20Steel'),
          description: 'Filters materials by category parameter.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 7: AI Intelligence Suite
  // -------------------------------------------------------------
  {
    name: '07 - AI Intelligence Suite',
    description: 'Deterministic risk detection, on-demand briefings, reports, and AI chat sessions',
    item: [
      {
        name: 'List AI-Enabled Projects',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns array of projects for AI engine", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/ai/projects'),
          description: 'Fetches list of projects available for Gemini AI analysis selection.',
        },
      },
      {
        name: 'Deterministic Project Risk Assessment (Task 9)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns structured risk analysis payload", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    pm.expect(jsonData.data.overallRiskLevel).to.be.oneOf(["Low", "Medium", "High", "Critical"]);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/ai/project-risk/{{projectId}}'),
          description: 'Calculates deterministic operational risks grounded in MongoDB tasks and materials.',
        },
      },
      {
        name: 'Portfolio-Wide Risk Detection',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns portfolio risk telemetry", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/ai/project-risk/all'),
          description: 'Aggregates risk telemetry across all active projects in the portfolio.',
        },
      },
      {
        name: 'On-Demand Project Briefing (Task 11)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns briefing with answer and data sources", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.answer).to.be.a("string");',
          '    pm.expect(jsonData.sources).to.be.an("array");',
          '    pm.expect(jsonData.confidence).to.be.a("string");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/ai/project-briefing/{{projectId}}'),
          description: 'Synthesizes an executive status briefing grounded in project telemetry.',
        },
      },
      {
        name: 'Generate AI Project Report (Task 12)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns synthesized report with confidence metrics", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.report).to.be.an("object");',
          '    pm.expect(jsonData.answer).to.be.a("string");',
          '    pm.expect(jsonData.confidence).to.be.a("string");',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            projectId: '{{projectId}}',
            reportType: 'Project Status Report',
          }),
          url: urlObject('{{baseUrl}}/api/ai/generate-report'),
          description: 'Generates an AI construction report with strict deterministic fallback.',
        },
      },
      {
        name: 'Create Persistent AI Conversation',
        event: testScript([
          'pm.test("Status code is 201 Created or 200 OK", function () {',
          '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
          '});',
          'pm.test("Conversation created and ID captured", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    var id = jsonData.data?._id || jsonData.data?.id || jsonData.conversation?._id;',
          '    if (id) {',
          '        pm.environment.set("conversationId", id);',
          '    }',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            title: 'Q2 Substructure Risk Analysis',
            projectId: '{{projectId}}',
          }),
          url: urlObject('{{baseUrl}}/api/ai/conversations'),
          description: 'Initializes a persistent conversation thread for AI consultation.',
        },
      },
      {
        name: 'List AI Conversations',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns array of conversations", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/ai/conversations'),
          description: 'Retrieves user conversation history.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 8: Business Network & Connections
  // -------------------------------------------------------------
  {
    name: '08 - Business Connections & Network',
    description: 'B2B partner connections, controlled data sharing, and collaboration audit logging',
    item: [
      {
        name: 'List Business Connections',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns connections array with count", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/business-connections'),
          description: 'Lists all business connections for caller organization.',
        },
      },
      {
        name: 'Get Collaboration Audit Logs',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns audit logs array", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/business-connections/audit-logs'),
          description: 'Retrieves immutable audit logs of B2B partnership interactions.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 9: Business Transactions & Workflows
  // -------------------------------------------------------------
  {
    name: '09 - Business Transactions & Workflows',
    description: 'Inter-organization material/service orders and multi-stage transaction workflows',
    item: [
      {
        name: 'List Business Transactions',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns transactions array with count", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/business-transactions'),
          description: 'Fetches list of B2B orders/service requests for caller organization.',
        },
      },
      {
        name: 'Filter Transactions by Status (Pending)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns array of pending transactions", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/business-transactions?status=Pending'),
          description: 'Queries transactions awaiting action.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 10: Notifications & Alerts
  // -------------------------------------------------------------
  {
    name: '10 - Notifications & Alerts',
    description: 'System alert delivery, unread notification counts, and bulk read receipts',
    item: [
      {
        name: 'Get User Notifications',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns notifications array and unread count", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("array");',
          '    pm.expect(jsonData.unreadCount).to.be.a("number");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/notifications'),
          description: 'Fetches recent notifications with unread counts.',
        },
      },
      {
        name: 'Mark All Notifications as Read',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Success message returned", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'PATCH',
          header: authHeaders(),
          body: jsonBody({}),
          url: urlObject('{{baseUrl}}/api/notifications/read-all'),
          description: 'Marks all pending notifications as read.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 11: Protected Project Financials (Security Layer)
  // -------------------------------------------------------------
  {
    name: '11 - Protected Project Financials',
    description: 'Two-level financial security, password authentication, short-lived JWT, and financials CRUD',
    item: [
      {
        name: 'Check Financial Security Status',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns financial configuration and lockout status", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData).to.have.property("isConfigured");',
          '    pm.expect(jsonData).to.have.property("isLockedOut");',
          '    pm.environment.set("isFinancialConfigured", jsonData.isConfigured);',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/financials/status'),
          description: 'Checks whether user has set up a secondary financial password.',
        },
      },
      {
        name: 'Configure Financial Security Password',
        event: testScript([
          'pm.test("Password setup returns 200 or 400 (if already set)", function () {',
          '    pm.expect(pm.response.code).to.be.oneOf([200, 400]);',
          '});',
          'var jsonData = pm.response.json();',
          'if (pm.response.code === 200) {',
          '    pm.test("Password setup succeeded", function () {',
          '        pm.expect(jsonData.success).to.eql(true);',
          '    });',
          '}',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            password: 'FinancialSecure2026!',
            confirmPassword: 'FinancialSecure2026!',
          }),
          url: urlObject('{{baseUrl}}/api/financials/setup-password'),
          description: 'Configures initial 8+ character financial security password.',
        },
      },
      {
        name: 'Unlock Project Financials (Obtain 15m Token)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns 15-minute Financial Access Token", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.financialToken).to.be.a("string");',
          '    pm.environment.set("financial_token", jsonData.financialToken);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({
            password: 'FinancialSecure2026!',
          }),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/unlock'),
          description: 'Authenticates against financial security layer and issues project-scoped JWT.',
        },
      },
      {
        name: 'Get Project Financials & KPIs (Protected)',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns financial summary, KPI calculations, and transactions", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    pm.expect(jsonData.data.summary).to.be.an("object");',
          '    pm.expect(jsonData.data.summary.totalRevenue).to.be.a("number");',
          '    pm.expect(jsonData.data.summary.totalExpenses).to.be.a("number");',
          '    pm.expect(jsonData.data.summary.netProfit).to.be.a("number");',
          '    pm.expect(jsonData.data.transactions).to.be.an("array");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(true),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials'),
          description: 'Fetches sensitive financial data requiring x-financial-access-token.',
        },
      },
      {
        name: 'Create Financial Transaction',
        event: testScript([
          'pm.test("Status code is 201 Created", function () {',
          '    pm.response.to.have.status(201);',
          '});',
          'pm.test("Transaction recorded and financialTxId captured", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data).to.be.an("object");',
          '    pm.expect(jsonData.data._id).to.be.a("string");',
          '    pm.environment.set("financialTxId", jsonData.data._id);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(true),
          body: jsonBody({
            type: 'Expense',
            category: 'Material',
            amount: 485000,
            date: '2026-04-12',
            description: 'Ready-Mix M40 High-Performance Concrete Batch Pour (120 cu.m)',
            referenceNumber: 'PO-CON-9941',
            vendorOrClient: 'UltraTech RMC Batch Plant',
            paymentStatus: 'Paid',
            paymentMethod: 'Bank Transfer',
          }),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/transactions'),
          description: 'Records an audited financial expense under Financial Security.',
        },
      },
      {
        name: 'Update Financial Transaction',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Transaction amount and description updated", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data.amount).to.eql(510000);',
          '});',
        ]),
        request: {
          method: 'PUT',
          header: authHeaders(true),
          body: jsonBody({
            amount: 510000,
            description: 'Ready-Mix M40 High-Performance Concrete Batch Pour (130 cu.m adjusted)',
          }),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/transactions/{{financialTxId}}'),
          description: 'Updates financial record amount and description.',
        },
      },
      {
        name: 'Generate Financial PDF Report Payload',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Returns PDF audit report structure", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.metrics).to.be.an("object");',
          '    pm.expect(jsonData.reportTitle).to.include("Financial Audit Report");',
          '});',
        ]),
        request: {
          method: 'GET',
          header: authHeaders(true),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/report-pdf'),
          description: 'Generates authorized financial PDF report data.',
        },
      },
      {
        name: 'Delete Financial Transaction',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Transaction deleted successfully", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '    pm.expect(jsonData.data.id).to.eql(pm.environment.get("financialTxId"));',
          '});',
        ]),
        request: {
          method: 'DELETE',
          header: authHeaders(true),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/transactions/{{financialTxId}}'),
          description: 'Deletes test financial record.',
        },
      },
      {
        name: 'Manually Lock Project Financials',
        event: testScript([
          'pm.test("Status code is 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Financials locked successfully", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'POST',
          header: authHeaders(),
          body: jsonBody({}),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}/financials/lock'),
          description: 'Immediately terminates financial session and logs audit lock event.',
        },
      },
    ],
  },

  // -------------------------------------------------------------
  // FOLDER 12: Teardown & Resource Cleanup
  // -------------------------------------------------------------
  {
    name: '12 - Teardown & Resource Cleanup',
    description: 'Removes temporary test entities created during test execution to maintain database hygiene',
    item: [
      {
        name: 'Delete Test Task',
        event: testScript([
          'pm.test("Task deletion returns 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Success message confirms deletion", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'DELETE',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/tasks/{{taskId}}'),
          description: 'Deletes task created during test run.',
        },
      },
      {
        name: 'Delete Test Material',
        event: testScript([
          'pm.test("Material deletion returns 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Success message confirms deletion", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'DELETE',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/materials/{{materialId}}'),
          description: 'Deletes material created during test run.',
        },
      },
      {
        name: 'Delete Test Project',
        event: testScript([
          'pm.test("Project deletion returns 200 OK", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          'pm.test("Success message confirms deletion", function () {',
          '    var jsonData = pm.response.json();',
          '    pm.expect(jsonData.success).to.eql(true);',
          '});',
        ]),
        request: {
          method: 'DELETE',
          header: authHeaders(),
          url: urlObject('{{baseUrl}}/api/projects/{{projectId}}'),
          description: 'Deletes project created during test run.',
        },
      },
    ],
  },
];

// Construct Final Postman Collection (v2.1 Schema)
const collection = {
  info: {
    _postman_id: collectionUid,
    name: 'BuildOps AI — Comprehensive API Test Suite',
    description:
      'Complete automated end-to-end API test suite for BuildOps AI covering System Health, Authentication, Organizations, Projects, Tasks, Materials, AI Intelligence Suite, Business Network, Business Transactions, Notifications, and Protected Financial Security.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: folders,
};

// Construct Environment File
const environment = {
  id: 'buildops-ai-local-env',
  name: 'BuildOps AI — Local Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'default', enabled: true },
    { key: 'jwt_token', value: '', type: 'default', enabled: true },
    { key: 'userId', value: '', type: 'default', enabled: true },
    { key: 'organizationId', value: '', type: 'default', enabled: true },
    { key: 'projectId', value: '', type: 'default', enabled: true },
    { key: 'taskId', value: '', type: 'default', enabled: true },
    { key: 'materialId', value: '', type: 'default', enabled: true },
    { key: 'conversationId', value: '', type: 'default', enabled: true },
    { key: 'financial_token', value: '', type: 'default', enabled: true },
    { key: 'financialTxId', value: '', type: 'default', enabled: true },
    { key: 'test_email', value: '', type: 'default', enabled: true },
    { key: 'test_password', value: 'BuildOps2026!Secure', type: 'default', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

// Write files to disk
const collectionPath = path.resolve(__dirname, '../buildops_postman_collection.json');
const environmentPath = path.resolve(__dirname, '../buildops_postman_environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf-8');
fs.writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf-8');

console.log(`✅ [Postman Suite] Generated Postman Collection: ${collectionPath}`);
console.log(`✅ [Postman Suite] Generated Postman Environment: ${environmentPath}`);
console.log(`📊 [Postman Suite] Total Folders: ${folders.length}`);
let totalRequests = 0;
folders.forEach((f) => {
  totalRequests += f.item.length;
});
console.log(`📊 [Postman Suite] Total API Requests: ${totalRequests}`);
