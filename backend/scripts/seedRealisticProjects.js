import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';

const seedRealisticData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for realistic demo seeding.');

    // 1. Update or create Project 1: Metropolitan Transit Terminal
    let prj1 = await Project.findOne({ name: 'Metropolitan Transit Terminal' });
    if (!prj1) {
      prj1 = await Project.create({
        name: 'Metropolitan Transit Terminal',
        client: 'City Transport Authority',
        location: 'Downtown Central Station, Sector 4',
        manager: 'Alex Morgan',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-11-30'),
        progress: 42,
        status: 'In Progress',
        risk: 'High',
      });
    } else {
      prj1.progress = 42;
      prj1.risk = 'High';
      await prj1.save();
    }

    const prj1Id = prj1._id;

    // Remove existing tasks for prj1 to avoid duplicates
    await Task.deleteMany({ projectId: prj1Id });

    // Seed realistic tasks for Project 1 (Contains delays & high priorities)
    await Task.insertMany([
      {
        projectId: prj1Id,
        title: 'Electrical Substation Conduit & Cabling',
        description: 'Underground conduit pull and transformer pad connection for main concourse power.',
        assignedTo: 'Apex MEP Contractors / Robert K.',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-08-15'), // Overdue!
        status: 'Delayed',
        progress: 35,
        priority: 'High',
      },
      {
        projectId: prj1Id,
        title: 'Structural Platform Pier Concreting',
        description: 'Heavy structural columns and retaining foundation wall pour.',
        assignedTo: 'Titan Concrete Works',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-10-15'),
        status: 'In Progress',
        progress: 60,
        priority: 'Critical',
      },
      {
        projectId: prj1Id,
        title: 'HVAC Vent Shaft Installation',
        description: 'Fabrication and mounting of underground air exchange dampers.',
        assignedTo: 'Metro Climate Systems',
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-10-30'),
        status: 'In Progress',
        progress: 25,
        priority: 'Medium',
      },
      {
        projectId: prj1Id,
        title: 'Subway Concourse Tile Finishing',
        description: 'Surface preparation and anti-slip stone floor installation.',
        assignedTo: 'Fine Finish Co.',
        startDate: new Date('2026-09-01'),
        dueDate: new Date('2026-11-20'),
        status: 'Not Started',
        progress: 0,
        priority: 'Low',
      },
    ]);

    // Ensure Cement (Low Stock) is added to Project 1
    const cementExists = await Material.findOne({ projectId: prj1Id, name: 'Portland Cement Grade 53' });
    if (!cementExists) {
      await Material.create({
        projectId: prj1Id,
        name: 'Portland Cement Grade 53',
        category: 'Masonry & Concrete',
        requiredQuantity: 1000,
        availableQuantity: 150, // 15% -> Low Stock!
        usedQuantity: 850,
        unit: 'Bags',
      });
    }

    // 2. Create Project 2: Aura Heights Tech Campus (Healthy, On-Track scenario)
    let prj2 = await Project.findOne({ name: 'Aura Heights Tech Campus' });
    if (!prj2) {
      prj2 = await Project.create({
        name: 'Aura Heights Tech Campus',
        client: 'Aura Innovations Ltd',
        location: 'Cyber Valley, Phase 2',
        manager: 'Sarah Jenkins',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2027-03-31'),
        progress: 78,
        status: 'In Progress',
        risk: 'Low',
      });
    }

    const prj2Id = prj2._id;
    await Task.deleteMany({ projectId: prj2Id });
    await Task.insertMany([
      {
        projectId: prj2Id,
        title: 'Exterior Double-Glazed Facade Installation',
        description: 'Precision curtain wall glass assembly across towers 1 and 2.',
        assignedTo: 'Horizon Glazing Specialists',
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-11-15'),
        status: 'In Progress',
        progress: 85,
        priority: 'High',
      },
      {
        projectId: prj2Id,
        title: 'Interior Gypsum Partition Walls',
        description: 'Fire-rated wall framing and insulation complete on levels 1 to 8.',
        assignedTo: 'Drywall Masters Inc.',
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2026-08-30'),
        status: 'Completed',
        progress: 100,
        priority: 'Medium',
      },
      {
        projectId: prj2Id,
        title: 'Fiber Optic Backbone & Server Room Fitout',
        description: 'Structured cabling and uninterrupted power supply rack integration.',
        assignedTo: 'InfraTech Networks',
        startDate: new Date('2026-07-15'),
        dueDate: new Date('2026-12-01'),
        status: 'In Progress',
        progress: 70,
        priority: 'Critical',
      },
    ]);

    await Material.deleteMany({ projectId: prj2Id });
    await Material.insertMany([
      {
        projectId: prj2Id,
        name: 'Ready-Mix Concrete Grade 40',
        category: 'Concrete',
        requiredQuantity: 1200,
        availableQuantity: 900,
        usedQuantity: 300,
        unit: 'm³',
      },
      {
        projectId: prj2Id,
        name: 'Curtain Wall Glass Panels',
        category: 'Facade',
        requiredQuantity: 600,
        availableQuantity: 520,
        usedQuantity: 80,
        unit: 'panels',
      },
    ]);

    console.log('✅ Realistic demo projects, tasks, and materials seeded successfully!');
    console.log(`- Project 1 ID: ${prj1Id} (${prj1.name})`);
    console.log(`- Project 2 ID: ${prj2Id} (${prj2.name})`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding realistic data:', err);
    process.exit(1);
  }
};

seedRealisticData();
