/**
 * BuildFlow AI - Domain-Specific Gemini AI Service
 * Grounded strictly in real-time MongoDB construction data.
 */

const SYSTEM_INSTRUCTION = `You are the BuildFlow AI Construction Intelligence Engine.

Your role is to analyze real-world construction project data provided strictly by the BuildFlow AI platform.
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
  const prompt = `Analyze the following real construction project data from BuildFlow AI database and output the required structured JSON:

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
  const chatSystemInstruction = `You are BuildFlow AI Project Assistant.
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
