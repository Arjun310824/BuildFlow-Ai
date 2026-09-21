/**
 * Task 13 — Dedicated 9 Combinations Test Suite
 * Tests all 9 media, document, text, and project context combinations:
 * 1. Text only
 * 2. Image + text
 * 3. PDF + text
 * 4. Project + text
 * 5. Project + image
 * 6. Project + PDF
 * 7. Project + image + text
 * 8. Project + PDF + text
 * 9. Project + PDF + image + text
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Project from './models/Project.js';
import { chatWithProject } from './services/projectAnalysisService.js';

let passed = 0;
let failed = 0;

function assert(condition, comboName, details = '') {
  if (condition) {
    console.log(`✅ [COMBO ${passed + failed + 1}] ${comboName}`);
    passed++;
  } else {
    console.error(`❌ [COMBO ${passed + failed + 1}] ${comboName} - ${details}`);
    failed++;
  }
}

async function runCombinationsSuite() {
  console.log('========================================================');
  console.log('Task 13 — 9 Media + Document + Project Combinations Suite');
  console.log('========================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  try {
    const chandkheda = await Project.findOne({ name: /chandkheda/i }).lean();
    if (!chandkheda) throw new Error('Chandkheda project not found.');
    const projectId = chandkheda._id.toString();

    const sampleImage = {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mimeType: 'image/jpeg',
      name: 'site_rebar_elevation.jpg',
      size: 1540,
    };

    const samplePdf = {
      data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA0IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoxNzUKJSVFT0YK',
      mimeType: 'application/pdf',
      name: 'slab_curing_schedule.pdf',
      size: 2840,
    };

    // 1. Text only (General construction question without specific project ID)
    const res1 = await chatWithProject(null, 'What is the required curing time for OPC 53 grade concrete?');
    assert(
      res1 && typeof res1.answer === 'string' && res1.answer.length > 20,
      'Combination 1: Text only'
    );

    // 2. Image + text (Without project ID)
    const res2 = await chatWithProject(
      null,
      'Inspect visible rebar cover and identify any corrosion signs',
      [sampleImage]
    );
    assert(
      res2 && typeof res2.answer === 'string' && res2.sources.some((s) => s.label.includes('Uploaded Image') || s.type === 'image'),
      'Combination 2: Image + text'
    );

    // 3. PDF + text (Without project ID)
    const res3 = await chatWithProject(
      null,
      'Summarize key quality inspection milestones from this specification sheet',
      [],
      [samplePdf]
    );
    assert(
      res3 && typeof res3.answer === 'string' && res3.sources.some((s) => s.label.includes('Uploaded Document') || s.type === 'document'),
      'Combination 3: PDF + text'
    );

    // 4. Project + text
    const res4 = await chatWithProject(projectId, 'What is the current completion progress of this project?');
    assert(
      res4 && typeof res4.answer === 'string' && res4.sources.some((s) => s.label === 'Project Data'),
      'Combination 4: Project + text'
    );

    // 5. Project + image (No typed text -> triggers default inspection prompt)
    const res5 = await chatWithProject(projectId, '', [sampleImage]);
    assert(
      res5 && typeof res5.answer === 'string' && res5.sources.some((s) => s.type === 'image' || s.label.includes('Uploaded Image')),
      'Combination 5: Project + image (default inspection prompt)'
    );

    // 6. Project + PDF (No typed text -> triggers default document review prompt)
    const res6 = await chatWithProject(projectId, '', [], [samplePdf]);
    assert(
      res6 && typeof res6.answer === 'string' && res6.sources.some((s) => s.type === 'document' || s.label.includes('Uploaded Document')),
      'Combination 6: Project + PDF (default document prompt)'
    );

    // 7. Project + image + text
    const res7 = await chatWithProject(
      projectId,
      'Check if this column rebar layout aligns with current site work for this project',
      [sampleImage]
    );
    assert(
      res7 && typeof res7.answer === 'string' && res7.sources.some((s) => s.type === 'image' || s.label.includes('Uploaded Image')),
      'Combination 7: Project + image + text'
    );

    // 8. Project + PDF + text
    const res8 = await chatWithProject(
      projectId,
      'Does this curing schedule document affect any of our active delayed tasks?',
      [],
      [samplePdf]
    );
    assert(
      res8 && typeof res8.answer === 'string' && res8.sources.some((s) => s.type === 'document' || s.label.includes('Uploaded Document')),
      'Combination 8: Project + PDF + text'
    );

    // 9. Project + PDF + image + text
    const res9 = await chatWithProject(
      projectId,
      'Cross-reference the rebar schedule in this PDF document with the visible steel in this site photograph',
      [sampleImage],
      [samplePdf]
    );
    assert(
      res9 &&
      typeof res9.answer === 'string' &&
      res9.sources.some((s) => s.type === 'document' || s.label.includes('Uploaded Document')) &&
      res9.sources.some((s) => s.type === 'image' || s.label.includes('Uploaded Image')),
      'Combination 9: Project + PDF + image + text'
    );

  } catch (err) {
    console.error('Combinations test suite error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n========================================================');
    console.log(`Task 13 Combinations Test Summary: Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runCombinationsSuite();
