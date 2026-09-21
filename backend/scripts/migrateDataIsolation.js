import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';
import Conversation from '../models/Conversation.js';
import SiteUpdate from '../models/SiteUpdate.js';
import Document from '../models/Document.js';

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Data Isolation Migration.');

    // 1. Identify or ensure Demo Organization and User
    let demoUser = await User.findOne({ email: 'alex.morgan@buildops.ai' });
    let demoOrg = null;

    if (demoUser && demoUser.organizationId) {
      demoOrg = await Organization.findById(demoUser.organizationId);
    }
    if (!demoOrg) {
      demoOrg = await Organization.findOne({ name: 'XYZ City Infrastructure' });
    }
    if (!demoOrg) {
      demoOrg = await Organization.findOne({});
    }
    if (!demoOrg) {
      demoOrg = await Organization.create({
        name: 'XYZ City Infrastructure',
        address: '100 Construction Way, Suite 400',
        contactEmail: 'contact@xyz-infrastructure.demo',
      });
      console.log(`Created default demo organization: ${demoOrg._id}`);
    }

    const demoOrgId = demoOrg._id;
    console.log(`🏛️ Using Demo Organization: "${demoOrg.name}" (${demoOrgId})`);

    if (demoUser && (!demoUser.organizationId || demoUser.organizationId.toString() !== demoOrgId.toString())) {
      demoUser.organizationId = demoOrgId;
      await demoUser.save();
      console.log(`Updated Alex Morgan with organizationId: ${demoOrgId}`);
    }

    // 2. Ensure all Projects have an organizationId
    const projectsWithoutOrg = await Project.find({ organizationId: { $exists: false } });
    if (projectsWithoutOrg.length > 0) {
      await Project.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: demoOrgId } }
      );
      console.log(`Updated ${projectsWithoutOrg.length} projects with demo organizationId.`);
    }

    // Create a lookup map of Project ID -> organizationId
    const allProjects = await Project.find({}, '_id name organizationId');
    const projectOrgMap = new Map();
    const projectNameMap = new Map();
    for (const p of allProjects) {
      projectOrgMap.set(p._id.toString(), p.organizationId);
      projectNameMap.set(p.name.toLowerCase().trim(), p);
    }
    console.log(`Found ${allProjects.length} total projects across all organizations.`);

    // 3. Migrate Tasks: backfill organizationId
    const allTasks = await Task.find({});
    let tasksUpdated = 0;
    for (const task of allTasks) {
      let targetOrgId = task.organizationId;
      if (!targetOrgId && task.projectId) {
        targetOrgId = projectOrgMap.get(task.projectId.toString()) || demoOrgId;
      } else if (!targetOrgId) {
        targetOrgId = demoOrgId;
      }

      if (!task.organizationId || task.organizationId.toString() !== targetOrgId.toString()) {
        task.organizationId = targetOrgId;
        await task.save();
        tasksUpdated++;
      }
    }
    console.log(`✅ Tasks migration: ${tasksUpdated} tasks updated with organizationId (total: ${allTasks.length}).`);

    // 4. Migrate Materials: backfill organizationId
    const allMaterials = await Material.find({});
    let materialsUpdated = 0;
    for (const mat of allMaterials) {
      let targetOrgId = mat.organizationId;
      if (!targetOrgId && mat.projectId) {
        targetOrgId = projectOrgMap.get(mat.projectId.toString()) || demoOrgId;
      } else if (!targetOrgId) {
        targetOrgId = demoOrgId;
      }

      if (!mat.organizationId || mat.organizationId.toString() !== targetOrgId.toString()) {
        mat.organizationId = targetOrgId;
        await mat.save();
        materialsUpdated++;
      }
    }
    console.log(`✅ Materials migration: ${materialsUpdated} materials updated with organizationId (total: ${allMaterials.length}).`);

    // 5. Migrate Conversations
    const allConversations = await Conversation.find({});
    let convosUpdated = 0;
    for (const convo of allConversations) {
      let changed = false;
      if (!convo.organizationId) {
        convo.organizationId = demoOrgId;
        changed = true;
      }
      if (demoUser && (!convo.userId || convo.userId.toString() === 'default-user')) {
        convo.userId = demoUser._id;
        changed = true;
      }
      if (changed) {
        await convo.save();
        convosUpdated++;
      }
    }
    console.log(`✅ Conversations migration: ${convosUpdated} conversations updated (total: ${allConversations.length}).`);

    // 6. Seed initial demo Site Updates if none exist for demo organization
    const existingSiteUpdatesCount = await SiteUpdate.countDocuments({ organizationId: demoOrgId });
    if (existingSiteUpdatesCount === 0) {
      console.log('Seeding initial Site Updates for demo organization...');
      const sampleUpdates = [
        {
          projectName: 'Narayan Aashish',
          workCompleted: '7th floor structural slab concreting complete. 180 m³ M30 grade concrete pumped and vibration compacted with test cubes.',
          progress: 64,
          workers: 42,
          supervisor: 'Rajesh Patel',
          issues: 'Morning rain delayed concrete transit mixer arrival by 2 hours.',
          weather: 'Cloudy / 29°C',
          tags: ['RCC Slab', 'Concrete', 'Waghodia Road'],
          image: '/images/site_foundation.jpg',
        },
        {
          projectName: 'Narayan Solaris',
          workCompleted: '4th floor unitized double-glazed facade panels erected opposite Akota Stadium. Pressure balancing completed.',
          progress: 76,
          workers: 36,
          supervisor: 'Vikram Trivedi',
          issues: 'Awaiting revised shipment of Saint-Gobain facade modules.',
          weather: 'Clear / 33°C',
          tags: ['Facade', 'Glazing', 'Solaris'],
          image: '/images/site_facade.jpg',
        },
        {
          projectName: 'Metropolitan Transit Terminal',
          workCompleted: 'Structural steel framing reached central concourse roof. Welded connections passed ultrasonic non-destructive testing.',
          progress: 48,
          workers: 55,
          supervisor: 'Alex Morgan',
          issues: 'Minor steel truss delivery delay from vendor.',
          weather: 'Sunny / 28°C',
          tags: ['Steel Framing', 'Roofing', 'Concourse'],
          image: '/images/site_steel.jpg',
        },
        {
          projectName: 'Aura Heights Luxury Residences',
          workCompleted: 'Tower B level 14 drywall framing and acoustic insulation completed. Riser plumbing lines pressure tested.',
          progress: 58,
          workers: 34,
          supervisor: 'Ketan Joshi',
          issues: 'None. Ahead of schedule by 3 days.',
          weather: 'Clear / 30°C',
          tags: ['Drywall', 'Plumbing', 'Tower B'],
          image: '/images/site_interior.jpg',
        },
      ];

      for (const update of sampleUpdates) {
        // match project
        let proj = projectNameMap.get(update.projectName.toLowerCase().trim());
        if (!proj) {
          // fallback to first demo org project
          proj = allProjects.find(p => p.organizationId.toString() === demoOrgId.toString());
        }

        if (proj) {
          await SiteUpdate.create({
            organizationId: demoOrgId,
            projectId: proj._id,
            workCompleted: update.workCompleted,
            progress: update.progress,
            workers: update.workers,
            supervisor: update.supervisor,
            issues: update.issues,
            weather: update.weather,
            tags: update.tags,
            image: update.image,
            date: new Date(),
          });
        }
      }
      console.log('✅ Demo Site Updates seeded successfully.');
    } else {
      console.log(`ℹ️ Demo organization already has ${existingSiteUpdatesCount} site updates.`);
    }

    // 7. Seed initial demo Documents if none exist for demo organization
    const existingDocsCount = await Document.countDocuments({ organizationId: demoOrgId });
    if (existingDocsCount === 0) {
      console.log('Seeding initial Documents for demo organization...');
      const sampleDocs = [
        {
          name: 'Transit_Terminal_Structural_Steel_Inspection_Signoff.pdf',
          type: 'Certificate',
          projectName: 'Metropolitan Transit Terminal',
          uploadedBy: 'Alex Morgan',
          size: '4.8 MB',
          status: 'Approved',
        },
        {
          name: 'Aura_Heights_Main_Construction_Contract_Rev3.pdf',
          type: 'Contract',
          projectName: 'Aura Heights Luxury Residences',
          uploadedBy: 'Legal Counsel',
          size: '18.2 MB',
          status: 'Executed',
        },
        {
          name: 'Central_Hospital_MEP_Substation_Shop_Drawing_A104.dwg',
          type: 'Drawing',
          projectName: 'Central Hospital Modernization',
          uploadedBy: 'Vitro Engineering',
          size: '32.6 MB',
          status: 'Under Review',
        },
        {
          name: 'Apex_ReadyMix_Concrete_Batch_Invoice_INV-8821.pdf',
          type: 'Invoice',
          projectName: 'Metropolitan Transit Terminal',
          uploadedBy: 'Accounting Dept',
          size: '1.2 MB',
          status: 'Paid',
        },
        {
          name: 'Monthly_Geotechnical_Subsidence_Report_Aug26.pdf',
          type: 'Report',
          projectName: 'Aura Heights Luxury Residences',
          uploadedBy: 'Geotech Solutions',
          size: '7.4 MB',
          status: 'Reviewed',
        },
      ];

      for (const doc of sampleDocs) {
        let proj = projectNameMap.get(doc.projectName.toLowerCase().trim());
        if (!proj) {
          proj = allProjects.find(p => p.organizationId.toString() === demoOrgId.toString());
        }

        if (proj) {
          await Document.create({
            organizationId: demoOrgId,
            projectId: proj._id,
            name: doc.name,
            type: doc.type,
            uploadedBy: doc.uploadedBy,
            size: doc.size,
            status: doc.status,
            date: new Date(),
          });
        }
      }
      console.log('✅ Demo Documents seeded successfully.');
    } else {
      console.log(`ℹ️ Demo organization already has ${existingDocsCount} documents.`);
    }

    console.log('\n🎉 ALL DATA ISOLATION MIGRATIONS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
