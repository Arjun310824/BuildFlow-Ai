import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Project from '../models/Project.js';

const AHMEDABAD_DEMO_PROJECTS = [
  {
    name: 'Ahmedabad Metro Business Hub',
    location: 'Thaltej, Ahmedabad',
    client: 'Westline Developments',
    manager: 'Alex Morgan',
    startDate: '2026-06-01',
    endDate: '2027-11-30',
    progress: 62,
    status: 'In Progress',
    risk: 'Low',
  },
  {
    name: 'Sabarmati Riverside Residential Towers',
    location: 'Paldi, Ahmedabad',
    client: 'Riverfront Habitat Group',
    manager: 'Alex Morgan',
    startDate: '2026-03-15',
    endDate: '2027-12-31',
    progress: 48,
    status: 'In Progress',
    risk: 'Medium',
  },
  {
    name: 'SG Highway Tech Park',
    location: 'SG Highway, Ahmedabad',
    client: 'Nova Infra Ventures',
    manager: 'Alex Morgan',
    startDate: '2026-01-01',
    endDate: '2027-08-31',
    progress: 71,
    status: 'In Progress',
    risk: 'Low',
  },
  {
    name: 'Bopal Urban Housing Complex',
    location: 'Bopal, Ahmedabad',
    client: 'GreenAxis Developers',
    manager: 'Alex Morgan',
    startDate: '2026-04-10',
    endDate: '2028-03-31',
    progress: 35,
    status: 'In Progress',
    risk: 'Medium',
  },
  {
    name: 'Sola Healthcare Centre',
    location: 'Sola, Ahmedabad',
    client: 'CareBuild Infrastructure',
    manager: 'Alex Morgan',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    progress: 28,
    status: 'In Progress',
    risk: 'Low',
  },
  {
    name: 'Prahladnagar Corporate Tower',
    location: 'Prahladnagar, Ahmedabad',
    client: 'UrbanCore Projects',
    manager: 'Alex Morgan',
    startDate: '2026-02-15',
    endDate: '2027-10-31',
    progress: 56,
    status: 'In Progress',
    risk: 'High',
  },
  {
    name: 'Shela Residential Community',
    location: 'Shela, Ahmedabad',
    client: 'BlueStone Habitat',
    manager: 'Alex Morgan',
    startDate: '2026-05-01',
    endDate: '2028-09-30',
    progress: 22,
    status: 'Planning',
    risk: 'Medium',
  },
  {
    name: 'Shilaj Mixed-Use Development',
    location: 'Shilaj, Ahmedabad',
    client: 'MetroEdge Developers',
    manager: 'Alex Morgan',
    startDate: '2026-08-01',
    endDate: '2028-12-31',
    progress: 15,
    status: 'In Progress',
    risk: 'Medium',
  },
  {
    name: 'Vaishnodevi Circle Logistics Park',
    location: 'Vaishnodevi Circle, Ahmedabad',
    client: 'PrimeLogix Infrastructure',
    manager: 'Alex Morgan',
    startDate: '2026-01-15',
    endDate: '2027-07-31',
    progress: 67,
    status: 'In Progress',
    risk: 'High',
  },
  {
    name: 'Chandkheda Smart Residential Complex',
    location: 'Chandkheda, Ahmedabad',
    client: 'UrbanNest Developers',
    manager: 'Alex Morgan',
    startDate: '2026-03-01',
    endDate: '2028-02-28',
    progress: 43,
    status: 'In Progress',
    risk: 'Low',
  },
];

const seedAhmedabadProjects = async () => {
  const API_URL = 'http://localhost:5000/api/projects';
  console.log('🚀 Starting Ahmedabad Demo Construction Projects Seeding...');

  // Connect to DB directly to verify existing records
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
  await mongoose.connect(mongoUri);
  console.log('📦 Connected to MongoDB at:', mongoUri);

  const existingProjects = await Project.find({}, 'name location client');
  console.log(`Found ${existingProjects.length} existing project(s) in MongoDB:`);
  existingProjects.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name} (${p.location})`);
  });

  const existingNames = new Set(existingProjects.map((p) => p.name.trim().toLowerCase()));

  let createdCount = 0;
  let skippedCount = 0;

  for (const projectData of AHMEDABAD_DEMO_PROJECTS) {
    const normName = projectData.name.trim().toLowerCase();

    if (existingNames.has(normName)) {
      console.log(`⏩ [SKIP] Project already exists: "${projectData.name}"`);
      skippedCount++;
      continue;
    }

    try {
      // Attempt insertion via POST /api/projects HTTP endpoint first
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        console.log(`✅ [POST /api/projects] Created: "${json.data.name}" [ID: ${json.data._id || json.data.id}]`);
        createdCount++;
      } else {
        console.warn(`⚠️ API POST returned ${res.status}: ${json.message || 'Falling back to Mongoose Model'}`);
        // Fallback directly to Project model if API endpoint returned non-200
        const doc = await Project.create({
          ...projectData,
          startDate: new Date(projectData.startDate),
          endDate: new Date(projectData.endDate),
        });
        console.log(`✅ [Project Model] Created: "${doc.name}" [ID: ${doc._id}]`);
        createdCount++;
      }
    } catch (err) {
      console.warn(`API unreachable (${err.message}). Using Mongoose model directly.`);
      const doc = await Project.create({
        ...projectData,
        startDate: new Date(projectData.startDate),
        endDate: new Date(projectData.endDate),
      });
      console.log(`✅ [Project Model] Created: "${doc.name}" [ID: ${doc._id}]`);
      createdCount++;
    }
  }

  const finalProjects = await Project.find({}).sort({ createdAt: 1 });
  console.log('\n==================================================');
  console.log('SEEDING SUMMARY');
  console.log('==================================================');
  console.log(`Newly Created: ${createdCount}`);
  console.log(`Skipped (Already Existed): ${skippedCount}`);
  console.log(`Total Projects in Database: ${finalProjects.length}`);
  console.log('--------------------------------------------------');
  finalProjects.forEach((p, idx) => {
    console.log(`${String(idx + 1).padStart(2, ' ')}. ${p.name}`);
    console.log(`    Location: ${p.location} | Client: ${p.client} | Risk: ${p.risk} | Status: ${p.status} | Progress: ${p.progress}%`);
  });
  console.log('==================================================\n');

  await mongoose.disconnect();
  console.log('🔌 MongoDB connection closed. Done!');
};

seedAhmedabadProjects().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
