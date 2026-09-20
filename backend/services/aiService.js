import { GoogleGenAI } from '@google/genai';

/**
 * BuildOps AI - Domain-Specific Gemini AI Service
 * Grounded strictly in real-time MongoDB construction data.
 */

const SYSTEM_INSTRUCTION = `You are the BuildOps AI Construction Intelligence Engine.

Your role is to analyze real-world construction project data provided strictly by the BuildOps AI platform.
You are not a generic chatbot.

Your analysis must be grounded strictly and factually in the project data provided to you.
Never invent project facts, measurements, dates, people, costs, delays, materials, or statistics.
Identify risks only when there is concrete evidence in the supplied data.
When information is missing, explicitly state: "Insufficient project data to determine this."

Analyze:
1. Project health and status (Healthy, Attention Required, At Risk, Critical) with clear evidence.
2. Delays (task progress, status, priorities, deadlines).
3. Material availability (availableQuantity vs requiredQuantity, stock percentages, low stock, out of stock).
4. Progress velocity (project progress % vs tasks completed).
5. Identified project risks (Schedule Risk, Task Risk, Material Risk, Progress Risk, Deadline Risk).
6. Actionable recommendations strictly based on the provided project data.

Return ONLY valid JSON matching the following schema without any surrounding markdown or code blocks:
{
  "summary": "String summarizing current project condition",
  "overallHealth": {
    "status": "Healthy | Attention Required | At Risk | Critical",
    "reason": "Clear explanation based on actual project metrics"
  },
  "risks": [
    {
      "type": "Schedule Risk | Task Risk | Material Risk | Progress Risk | Deadline Risk",
      "severity": "Low | Medium | High | Critical",
      "evidence": "Factual evidence from provided project data",
      "recommendation": "Concrete practical action"
    }
  ],
  "delays": [
    {
      "task": "Task title",
      "status": "Delayed | In Progress",
      "progress": 0,
      "reason": "Why this delay matters based on priority/due date",
      "recommendation": "Recommended remediation"
    }
  ],
  "materialAlerts": [
    {
      "material": "Material name",
      "available": 0,
      "required": 0,
      "unit": "Unit",
      "status": "Low Stock | Out of Stock",
      "recommendation": "Reorder or procurement guidance"
    }
  ],
  "recommendations": [
    {
      "priority": "High | Medium | Low",
      "action": "Action to take",
      "reason": "Grounded reason from project data"
    }
  ]
}`;

// Models in priority order with automatic fallback for high-demand spikes
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

/**
 * Dispatches a prompt with system instructions to Gemini API with automatic model failover
 * @param {string} prompt
 * @param {string} systemInstruction
 * @param {boolean} requireJson
 * @returns {Promise<string>}
 */
export const callGemini = async (prompt, systemInstruction = SYSTEM_INSTRUCTION, requireJson = true) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured in backend environment variables.');
    error.statusCode = 500;
    throw error;
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.1, // High determinism for factual grounding
          topP: 0.8,
          maxOutputTokens: 2048,
          ...(requireJson ? { responseMimeType: 'application/json' } : {}),
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.warn(`[Gemini API Warning] Model ${model} returned error: ${errorMsg}. Trying fallback model...`);
        lastError = new Error(errorMsg);
        continue; // Try next candidate model
      }

      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini returned an empty response candidate.');
      }

      return candidate.content.parts[0].text;
    } catch (err) {
      console.warn(`[Gemini API Warning] Failed with model ${model}: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  throw new Error(`All Gemini models failed to generate content. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Generate comprehensive structured analysis for a given project context
 * @param {Object} context
 * @returns {Promise<Object>}
 */
export const generateProjectAnalysis = async (context) => {
  const prompt = `Analyze the following real construction project data from BuildOps AI database and output the required structured JSON:

PROJECT DATA CONTEXT:
${JSON.stringify(context, null, 2)}

Ensure all conclusions are supported strictly by this data. If no tasks or materials are logged, report: "Insufficient project data to determine this." for that specific section.`;

  const rawText = await callGemini(prompt, SYSTEM_INSTRUCTION, true);

  // Clean and parse JSON response
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON output:', cleaned);
    throw new Error('Gemini response could not be parsed as valid JSON.');
  }
};

/**
 * Generate a project-aware chat answer for user questions
 * @param {Object} context
 * @param {string} userQuestion
 * @returns {Promise<string>}
 */
export const generateProjectChatResponse = async (context, userQuestion) => {
  const chatSystemInstruction = `You are BuildOps AI Project Assistant.
You answer user questions about a specific construction project strictly using the provided database facts.
Never invent facts, metrics, contractors, or dates.
If the data does not contain the answer, say: "Insufficient project data to determine this."
Keep answers concise, professional, and directly relevant to construction project management.`;

  const prompt = `PROJECT DATA CONTEXT:
${JSON.stringify(context, null, 2)}

USER QUESTION:
"${userQuestion}"

Answer the user's question accurately using only the project context above.`;

  return await callGemini(prompt, chatSystemInstruction, false);
};

/**
 * Calculates dynamic task delay in days based on dueDate and current date.
 * Does NOT store delayDays in MongoDB.
 *
 * @param {string|Date} dueDate - The task's due date string or Date object.
 * @param {string} status - Current task status ('Delayed', 'In Progress', 'Completed', etc.).
 * @param {Date} [referenceDate=new Date()] - Reference date for calculation (defaults to current date).
 * @returns {number} Delay in days (integer >= 0).
 */
export const calculateTaskDelay = (dueDate, status, referenceDate = new Date()) => {
  if (!dueDate) return 0;
  if (status && String(status).trim().toLowerCase() === 'completed') return 0;

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) {
    return (status && String(status).trim().toLowerCase() === 'delayed') ? 1 : 0;
  }

  const now = new Date(referenceDate);
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return diffDays;
  }

  if (status && String(status).trim().toLowerCase() === 'delayed') {
    return 1;
  }

  return 0;
};

/**
 * Parses material quantity strings (e.g. "45.0 Tons", "14.2 Tons", "60 m³", "120 Units")
 * or numeric values into separate numeric quantity and unit values.
 *
 * @param {string|number} stockValue - Raw stock string or number.
 * @returns {{ quantity: number, unit: string }}
 */
export const parseStockQuantity = (stockValue) => {
  if (stockValue === null || stockValue === undefined) {
    return { quantity: 0, unit: '' };
  }

  if (typeof stockValue === 'number') {
    return { quantity: isNaN(stockValue) ? 0 : stockValue, unit: '' };
  }

  const str = String(stockValue).trim();
  if (!str) {
    return { quantity: 0, unit: '' };
  }

  // Match leading number (including decimals and comma grouping) followed by unit text
  const match = str.match(/^([\d,]+(?:\.\d+)?)\s*(.*)$/);
  if (match) {
    const rawNum = match[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    const unit = (match[2] || '').trim();
    return {
      quantity: isNaN(num) ? 0 : num,
      unit,
    };
  }

  // Fallback match for any numeric token
  const numMatch = str.match(/[\d,]+(?:\.\d+)?/);
  if (numMatch) {
    const rawNum = numMatch[0].replace(/,/g, '');
    const num = parseFloat(rawNum);
    const unit = str.replace(numMatch[0], '').trim();
    return {
      quantity: isNaN(num) ? 0 : num,
      unit,
    };
  }

  return { quantity: 0, unit: '' };
};

/**
 * Calculates material shortage from required and current stock values.
 *
 * @param {string|number} requiredStock - Required stock value (e.g. "45.0 Tons").
 * @param {string|number} currentStock - Available stock value (e.g. "14.2 Tons").
 * @returns {{ required: number, available: number, unit: string, shortage: number }}
 */
export const calculateMaterialShortage = (requiredStock, currentStock) => {
  const req = parseStockQuantity(requiredStock);
  const cur = parseStockQuantity(currentStock);
  const unit = req.unit || cur.unit || '';
  const shortage = Math.max(0, Number((req.quantity - cur.quantity).toFixed(2)));

  return {
    required: req.quantity,
    available: cur.quantity,
    unit,
    shortage,
  };
};

/**
 * Prepares and normalizes construction project data into a clean structured payload
 * for Gemini AI analysis without sending raw MongoDB documents.
 *
 * @param {Object} projectData - Project object or wrapper containing { project, tasks, materials }.
 * @param {Array} [tasksData=[]] - Optional tasks array.
 * @param {Array} [materialsData=[]] - Optional materials array.
 * @returns {Object} Structured data ready for AI ingestion.
 */
export const prepareProjectDataForAI = (projectData, tasksData = [], materialsData = []) => {
  let project = projectData || {};
  let tasks = Array.isArray(tasksData) ? tasksData : [];
  let materials = Array.isArray(materialsData) ? materialsData : [];

  // Extract from Mongoose document if applicable
  if (typeof project.toObject === 'function') {
    project = project.toObject();
  }

  // Support wrapper payload: { project, tasks, materials } or combined object
  if (project.project) {
    tasks = project.tasks || tasks;
    materials = project.materials || materials;
    project = typeof project.project.toObject === 'function' ? project.project.toObject() : project.project;
  } else if (Array.isArray(project.tasks) || Array.isArray(project.materials)) {
    tasks = project.tasks || tasks;
    materials = project.materials || materials;
    project = { ...project };
    delete project.tasks;
    delete project.materials;
  }

  // Project fields: name, progress, status, deadline, budget, spent
  const formattedProject = {
    name: project.name || 'Unnamed Construction Project',
    progress: typeof project.progress === 'number' ? project.progress : 0,
    status: project.status || 'In Progress',
    deadline: project.deadline || 'Not specified',
    budget: project.budget || 'Not specified',
    spent: project.spent || 'Not specified',
  };

  // Task fields: title, status, dueDate + dynamic delayDays
  const formattedTasks = tasks.map((taskItem) => {
    const t = typeof taskItem.toObject === 'function' ? taskItem.toObject() : taskItem;
    const delayDays = calculateTaskDelay(t.dueDate, t.status);
    return {
      title: t.title || 'Untitled Task',
      status: t.status || 'Pending',
      dueDate: t.dueDate || 'Not specified',
      delayDays,
    };
  });

  // Material fields: material, requiredStock, currentStock, status + parsed quantities & shortages
  const formattedMaterials = materials.map((matItem) => {
    const m = typeof matItem.toObject === 'function' ? matItem.toObject() : matItem;
    const shortageData = calculateMaterialShortage(m.requiredStock, m.currentStock);
    return {
      material: m.material || 'Unnamed Material',
      status: m.status || 'Normal',
      requiredStockRaw: m.requiredStock || '',
      currentStockRaw: m.currentStock || '',
      requiredQuantity: shortageData.required,
      availableQuantity: shortageData.available,
      unit: shortageData.unit,
      shortage: shortageData.shortage,
    };
  });

  return {
    project: formattedProject,
    tasks: formattedTasks,
    materials: formattedMaterials,
  };
};

/**
 * Initializes and returns the Google Gen AI client using process.env.GEMINI_API_KEY.
 *
 * @returns {GoogleGenAI}
 */
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in process.env. Please configure a valid key in your backend .env file.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * System prompt instructing Gemini to analyze the 3 MVP features and return structured JSON.
 */
const MVP_SYSTEM_INSTRUCTION = `You are an expert construction project intelligence and risk analysis AI for the BuildOps AI platform.
Analyze the provided construction project, tasks, and materials data for a construction project manager.

Cover ONLY these 3 core analytical features:
1. PROJECT RISK ANALYSIS (assess overall health, progress percentage against deadline, budget vs spent, and assign an overall risk score from 0 to 100).
2. TASK DELAY ANALYSIS (analyze delayed tasks, delay duration in days, and operational trade bottlenecks).
3. MATERIAL SHORTAGE ANALYSIS (identify inventory stockouts, material deficits, required vs available stock, units, and supply chain impacts).

Keep the summary and recommendations concise, direct, and actionable for site operations.

You MUST respond strictly with a valid JSON object matching this exact schema:
{
  "riskLevel": "LOW | MEDIUM | HIGH",
  "riskScore": 0,
  "summary": "short project health summary",
  "issues": [
    "issue 1",
    "issue 2"
  ],
  "delays": [
    {
      "task": "task name",
      "delayDays": 0,
      "reason": "reason"
    }
  ],
  "materialShortages": [
    {
      "material": "material name",
      "required": 0,
      "available": 0,
      "unit": "unit",
      "shortage": 0
    }
  ],
  "recommendedActions": [
    "action 1",
    "action 2",
    "action 3"
  ]
}`;

/**
 * Core AI service function to analyze construction project data with Gemini AI.
 *
 * @param {Object} projectData - Project object or { project, tasks, materials }.
 * @param {Array} [tasksData=[]] - Optional array of tasks.
 * @param {Array} [materialsData=[]] - Optional array of materials.
 * @returns {Promise<Object>} Structured AI evaluation matching the specified schema.
 */
export const analyzeProjectWithAI = async (projectData, tasksData = [], materialsData = []) => {
  // 1. Prepare structured data and calculations
  const structuredData = prepareProjectDataForAI(projectData, tasksData, materialsData);

  // 2. Initialize Gemini client
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // 3. Construct prompt with clean structured construction data
  const prompt = `Perform construction analytics on this project dataset:

PROJECT:
- Name: ${structuredData.project.name}
- Progress: ${structuredData.project.progress}%
- Status: ${structuredData.project.status}
- Schedule Deadline: ${structuredData.project.deadline}
- Budget: ${structuredData.project.budget}
- Spent: ${structuredData.project.spent}

TASKS (${structuredData.tasks.length} tracked):
${structuredData.tasks.length > 0 ? structuredData.tasks.map(t => `- "${t.title}" | Status: ${t.status} | Due: ${t.dueDate} | Delay: ${t.delayDays} days`).join('\n') : 'No tasks recorded'}

MATERIALS (${structuredData.materials.length} tracked):
${structuredData.materials.length > 0 ? structuredData.materials.map(m => `- "${m.material}" | Status: ${m.status} | Required: ${m.requiredQuantity} ${m.unit} | Available: ${m.availableQuantity} ${m.unit} | Shortage: ${m.shortage} ${m.unit}`).join('\n') : 'No materials recorded'}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: MVP_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    let jsonText = rawText.trim();

    // Strip markdown formatting if returned
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate and guarantee exact contract schema
    return {
      riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(String(parsed.riskLevel).toUpperCase())
        ? String(parsed.riskLevel).toUpperCase()
        : 'MEDIUM',
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 50,
      summary: parsed.summary || 'Project health summary generated.',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      delays: Array.isArray(parsed.delays)
        ? parsed.delays.map(d => ({
            task: d.task || 'Unnamed Task',
            delayDays: typeof d.delayDays === 'number' ? d.delayDays : 0,
            reason: d.reason || 'Schedule overrun',
          }))
        : [],
      materialShortages: Array.isArray(parsed.materialShortages)
        ? parsed.materialShortages.map(m => ({
            material: m.material || 'Unnamed Material',
            required: typeof m.required === 'number' ? m.required : 0,
            available: typeof m.available === 'number' ? m.available : 0,
            unit: m.unit || '',
            shortage: typeof m.shortage === 'number' ? m.shortage : 0,
          }))
        : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`AI Service failed to parse JSON from Gemini response: ${error.message}`);
    }
    throw new Error(`AI Service analysis failed: ${error.message}`);
  }
};

export default analyzeProjectWithAI;
