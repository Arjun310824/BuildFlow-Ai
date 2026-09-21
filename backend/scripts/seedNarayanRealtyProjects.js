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

/**
 * Authentic real-world data from Narayan Realty (narayanrealty.com)
 * Headquartered in Vadodara, Gujarat with 4+ decades of landmark developments
 * across Vadodara, Bharuch, and Surat.
 */
export const NARAYAN_REALTY_PROJECTS = [
  {
    name: 'Narayan Aashish',
    client: 'Narayan Realty Ltd.',
    location: 'Waghodia-Dabhoi Ring Road, Vadodara',
    manager: 'Rajesh Patel',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2027-03-31'),
    progress: 64,
    status: 'In Progress',
    risk: 'Low',
    tasks: [
      {
        title: 'RCC Superstructure & 7th Floor Slab Concreting',
        description: 'Cast-in-situ RCC frame casting with transit mixers and boom placers.',
        assignedTo: 'Patel Infra Tech / Suresh M.',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-10-15'),
        status: 'In Progress',
        progress: 75,
        priority: 'High',
      },
      {
        title: 'Brick Masonry & AAC Block Internal Partitions',
        description: 'Lightweight AAC blockwork with polymer bonding mortar on floors 3-6.',
        assignedTo: 'Gujarat Masonry Works',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-11-10'),
        status: 'In Progress',
        progress: 55,
        priority: 'Medium',
      },
      {
        title: 'Plumbing & Concealed CPVC Pipeline Pressure Testing',
        description: 'Multi-stack drainage, rainwater down-take and internal toilet lines.',
        assignedTo: 'Apex MEP Solutions',
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-11-30'),
        status: 'In Progress',
        progress: 40,
        priority: 'Medium',
      },
      {
        title: 'Passenger Elevators Shaft Installation & Alignment',
        description: 'Dual 8-passenger high-speed VVVF elevators installation.',
        assignedTo: 'Schindler India Vadodara',
        startDate: new Date('2026-06-15'),
        dueDate: new Date('2026-09-10'), // Delayed
        status: 'Delayed',
        progress: 30,
        priority: 'Critical',
      },
      {
        title: 'Podium Amenities & Landscaped Garden Pathways',
        description: '30+ podium amenities, kids play zone and paved walking tracks.',
        assignedTo: 'GreenScape Gujarat',
        startDate: new Date('2026-10-01'),
        dueDate: new Date('2027-01-15'),
        status: 'Not Started',
        progress: 0,
        priority: 'Low',
      },
    ],
    materials: [
      {
        name: 'UltraTech Grade 53 OPC Cement',
        category: 'Masonry & Concrete',
        requiredQuantity: 5000,
        availableQuantity: 1200,
        usedQuantity: 3800,
        unit: 'Bags',
      },
      {
        name: 'Tata Tiscon Fe550D TMT Steel Rebar',
        category: 'Structural Steel',
        requiredQuantity: 85,
        availableQuantity: 65,
        usedQuantity: 20,
        unit: 'Tons',
      },
      {
        name: 'River Sand & M-Sand Wash Blend',
        category: 'Aggregates',
        requiredQuantity: 350,
        availableQuantity: 80,
        usedQuantity: 270,
        unit: 'Brass',
      },
      {
        name: 'Kajaria 600x1200mm Vitrified Floor Tiles',
        category: 'Flooring',
        requiredQuantity: 2400,
        availableQuantity: 350, // Low stock: <= 20%
        usedQuantity: 1800,
        unit: 'Boxes',
      },
    ],
  },
  {
    name: 'Narayan Orbis (Phase 2)',
    client: 'Narayan Realty Ltd.',
    location: 'Sunpharma - Padra Road, Atladara, Vadodara',
    manager: 'Sanjay Desai',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2026-12-31'),
    progress: 92,
    status: 'In Progress',
    risk: 'Low',
    tasks: [
      {
        title: 'Villa Private Garden Landscaping & Turf Laying',
        description: 'Laying natural Mexican lawn turf and automated drip irrigation for luxury triplex villas.',
        assignedTo: 'NatureCraft Landscaping',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-10-30'),
        status: 'In Progress',
        progress: 85,
        priority: 'Medium',
      },
      {
        title: 'Italian Marble Honing & Mirror Polish in Living Lounges',
        description: 'Diamond pad grinding and 5-stage crystallization for imported marble floors.',
        assignedTo: 'Fine Stones Studio',
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-11-15'),
        status: 'In Progress',
        progress: 90,
        priority: 'High',
      },
      {
        title: 'Clubhouse Infinity Swimming Pool Waterproofing & Mosaic',
        description: 'Epoxy grouting and glass mosaic tile installation.',
        assignedTo: 'AquaPro Gujarat',
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-08-20'),
        status: 'Completed',
        progress: 100,
        priority: 'Critical',
      },
      {
        title: 'Pre-Handover Snag List Rectification & Client Walkthrough',
        description: 'Comprehensive electrical, joinery, and silicone sealing quality check.',
        assignedTo: 'Narayan QA/QC Audit Cell',
        startDate: new Date('2026-09-01'),
        dueDate: new Date('2026-12-15'),
        status: 'In Progress',
        progress: 70,
        priority: 'High',
      },
    ],
    materials: [
      {
        name: 'Italian Botticino Marble Slabs',
        category: 'Flooring',
        requiredQuantity: 8000,
        availableQuantity: 7600,
        usedQuantity: 400,
        unit: 'sq.ft',
      },
      {
        name: 'Schneider Electric Modular Switches & Automation Hubs',
        category: 'Electrical',
        requiredQuantity: 450,
        availableQuantity: 410,
        usedQuantity: 40,
        unit: 'Sets',
      },
      {
        name: 'Teak Wood Main Entrance Panel Doors',
        category: 'Carpentry & Doors',
        requiredQuantity: 65,
        availableQuantity: 8, // Low Stock: <= 20%
        usedQuantity: 57,
        unit: 'Units',
      },
    ],
  },
  {
    name: 'Narayan Solaris',
    client: 'Narayan Realty Ltd. (Corporate Leasing)',
    location: 'Productivity Road, Opp. Akota Stadium, BPC Road, Vadodara',
    manager: 'Vikram Trivedi',
    startDate: new Date('2025-04-15'),
    endDate: new Date('2027-02-28'),
    progress: 76,
    status: 'In Progress',
    risk: 'Medium',
    tasks: [
      {
        title: 'Structural Glazing & Double-Glazed Facade Cladding',
        description: 'Unitized structural glass facade erection across 5 commercial storeys.',
        assignedTo: 'Horizon Facade Engineering',
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-10-31'),
        status: 'In Progress',
        progress: 80,
        priority: 'Critical',
      },
      {
        title: 'Central VRV/VRF Air Conditioning Ducting & Chillers',
        description: 'Daikin VRV outdoor condenser units placement on dedicated service platforms.',
        assignedTo: 'Daikin Turnkey Systems',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-08-31'), // Delayed
        status: 'Delayed',
        progress: 45,
        priority: 'High',
      },
      {
        title: 'Double Basement Automated Jet Fan Ventilation & Epoxy Flooring',
        description: 'Carbon monoxide sensor driven extraction fans and heavy-duty traffic epoxy.',
        assignedTo: 'AirFlow Dynamics Vadodara',
        startDate: new Date('2026-07-15'),
        dueDate: new Date('2026-11-20'),
        status: 'In Progress',
        progress: 60,
        priority: 'Medium',
      },
      {
        title: 'Fire Hydrant & Sprinkler Grid Pressure Testing',
        description: 'Hydrostatic pressure audit as per National Building Code (NBC) 2016.',
        assignedTo: 'Gujarat Fire Safety Council',
        startDate: new Date('2026-08-10'),
        dueDate: new Date('2026-11-15'),
        status: 'In Progress',
        progress: 50,
        priority: 'Critical',
      },
    ],
    materials: [
      {
        name: 'Saint-Gobain Solar Control Double-Glazed Glass Panels',
        category: 'Facade & Glazing',
        requiredQuantity: 850,
        availableQuantity: 140, // Low stock <= 20%
        usedQuantity: 710,
        unit: 'Panels',
      },
      {
        name: 'Heavy Duty Structural Steel Hollow Sections (IS 4923)',
        category: 'Structural Steel',
        requiredQuantity: 40,
        availableQuantity: 34,
        usedQuantity: 6,
        unit: 'Tons',
      },
      {
        name: 'Commercial Grade 2-Hour Fire-Rated Doors',
        category: 'Fire Safety',
        requiredQuantity: 45,
        availableQuantity: 0, // Out of Stock
        usedQuantity: 0,
        unit: 'Units',
      },
    ],
  },
  {
    name: 'Narayan Green Vistas',
    client: 'Narayan Realty Ltd.',
    location: 'Sama-Savli Road, Vadodara',
    manager: 'Hitesh Sharma',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2027-08-31'),
    progress: 52,
    status: 'In Progress',
    risk: 'Low',
    tasks: [
      {
        title: '6th Floor Beam & Slab Shuttering',
        description: 'Steel prop formwork and shuttering ply assembly for 3 BHK luxury tower.',
        assignedTo: 'Shuttering Masters Vadodara',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-10-15'),
        status: 'In Progress',
        progress: 65,
        priority: 'High',
      },
      {
        title: 'Ready-Mix Concrete Grade M35 Continuous Pump Pour',
        description: 'Monolithic concrete pour of 180 cubic metres for Tower B slab.',
        assignedTo: 'UltraTech RMC Plant Sama',
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-10-25'),
        status: 'In Progress',
        progress: 50,
        priority: 'Critical',
      },
      {
        title: 'Rainwater Harvesting & Stormwater Drainage Interconnect',
        description: 'Dual recharge percolation wells connected to rooftop catchment channels.',
        assignedTo: 'EcoInfrastructure Gujarat',
        startDate: new Date('2026-05-15'),
        dueDate: new Date('2026-08-30'),
        status: 'Completed',
        progress: 100,
        priority: 'Medium',
      },
    ],
    materials: [
      {
        name: 'Ready-Mix Concrete Grade M35',
        category: 'Concrete',
        requiredQuantity: 1800,
        availableQuantity: 1250,
        usedQuantity: 550,
        unit: 'm³',
      },
      {
        name: 'Tata Tiscon Fe550D TMT Bars 16mm & 20mm',
        category: 'Structural Steel',
        requiredQuantity: 110,
        availableQuantity: 85,
        usedQuantity: 25,
        unit: 'Tons',
      },
      {
        name: 'AAC Lightweight Autoclaved Aerated Blocks',
        category: 'Masonry',
        requiredQuantity: 15000,
        availableQuantity: 2500, // Low Stock <= 20%
        usedQuantity: 12500,
        unit: 'Blocks',
      },
    ],
  },
  {
    name: 'Narayan Luxuria',
    client: 'Narayan Realty Ltd.',
    location: 'Dahej Bypass Road, Bharuch',
    manager: 'Pranav Mehta',
    startDate: new Date('2025-10-01'),
    endDate: new Date('2027-11-30'),
    progress: 38,
    status: 'In Progress',
    risk: 'High',
    tasks: [
      {
        title: 'Raft Foundation Waterproofing Membrane Application',
        description: 'High-density APP modified polymer bituminous waterproofing membrane.',
        assignedTo: 'Dr. Fixit Certified Applicators',
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-08-15'), // Delayed
        status: 'Delayed',
        progress: 40,
        priority: 'Critical',
      },
      {
        title: 'Basement Retaining Wall Concrete Pouring & Vibrating',
        description: 'Double-faced shuttering and waterproof concrete casting for 4.2m height wall.',
        assignedTo: 'Bharuch Civil Infratech',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-11-15'),
        status: 'In Progress',
        progress: 35,
        priority: 'High',
      },
      {
        title: 'Diesel Generator Backup Foundation & Acoustic Enclosure',
        description: 'Vibration isolation springs and 250kVA DG set plinth casting.',
        assignedTo: 'Cummins India Approved',
        startDate: new Date('2026-09-01'),
        dueDate: new Date('2026-12-30'),
        status: 'Not Started',
        progress: 0,
        priority: 'Medium',
      },
    ],
    materials: [
      {
        name: 'Portland Pozzolana Cement (PPC) Grade 53',
        category: 'Concrete',
        requiredQuantity: 4000,
        availableQuantity: 600, // Low Stock <= 20%
        usedQuantity: 3400,
        unit: 'Bags',
      },
      {
        name: 'Polymer Waterproofing Membrane (4mm APP)',
        category: 'Waterproofing',
        requiredQuantity: 300,
        availableQuantity: 40, // Low Stock <= 20%
        usedQuantity: 260,
        unit: 'Rolls',
      },
      {
        name: 'Crushed Stone Blue Metal Aggregates 20mm',
        category: 'Aggregates',
        requiredQuantity: 500,
        availableQuantity: 380,
        usedQuantity: 120,
        unit: 'Brass',
      },
    ],
  },
  {
    name: 'Narayan Square',
    client: 'Narayan Realty Ltd.',
    location: 'Link Road, Bharuch',
    manager: 'Ketan Joshi',
    startDate: new Date('2025-01-10'),
    endDate: new Date('2026-11-30'),
    progress: 86,
    status: 'In Progress',
    risk: 'Low',
    tasks: [
      {
        title: 'Main Road Showroom Toughened Glass Frontages & Patch Fittings',
        description: '12mm clear toughened glass shopfronts with Dorma hardware.',
        assignedTo: 'GlassCraft Bharuch',
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-10-20'),
        status: 'In Progress',
        progress: 85,
        priority: 'High',
      },
      {
        title: 'Commercial Corridor False Ceiling & LED Architectural Battens',
        description: 'Moisture-resistant gypsum grid with low-glare commercial LED fixtures.',
        assignedTo: 'BrightWay Interiors',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-09-15'),
        status: 'Completed',
        progress: 100,
        priority: 'Medium',
      },
      {
        title: 'Substation Power Energization & DGVCL Final Approval',
        description: 'High-tension transformer testing, earth-pit resistance verification, and energization.',
        assignedTo: 'VoltTech Electricals / DGVCL',
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-10-31'),
        status: 'In Progress',
        progress: 75,
        priority: 'Critical',
      },
    ],
    materials: [
      {
        name: 'Gypsum Ceiling Boards (12.5mm Saint-Gobain)',
        category: 'False Ceiling',
        requiredQuantity: 1200,
        availableQuantity: 1150,
        usedQuantity: 50,
        unit: 'Sheets',
      },
      {
        name: 'Polycab FR-LSH Copper Electric Wires 2.5 sq.mm',
        category: 'Electrical',
        requiredQuantity: 400,
        availableQuantity: 360,
        usedQuantity: 40,
        unit: 'Coils',
      },
    ],
  },
  {
    name: 'Narayan Aria',
    client: 'Narayan Realty Ltd.',
    location: 'Atladra-Sunpharma Road, Vadodara',
    manager: 'Ankit Shah',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2028-04-30'),
    progress: 22,
    status: 'In Progress',
    risk: 'Low',
    tasks: [
      {
        title: 'Diaphragm Wall Shoring & Soil Strutting',
        description: 'Perimeter concrete diaphragm wall to protect neighboring foundations.',
        assignedTo: 'DeepFoundation Technologies Gujarat',
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2026-09-30'),
        status: 'In Progress',
        progress: 80,
        priority: 'Critical',
      },
      {
        title: 'Excavation for Two-Tier Underground Parking',
        description: 'Removal of 22,000 cubic metres of earth with tracked hydraulic excavators.',
        assignedTo: 'EarthMovers Gujarat',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-11-15'),
        status: 'In Progress',
        progress: 45,
        priority: 'High',
      },
      {
        title: 'Anti-Termite Soil Treatment under Foundation Raft',
        description: 'Chlorpyrifos chemical barrier application across 38,000 sq.ft plinth footprint.',
        assignedTo: 'PestControl India Baroda',
        startDate: new Date('2026-10-01'),
        dueDate: new Date('2026-11-30'),
        status: 'Not Started',
        progress: 0,
        priority: 'Medium',
      },
    ],
    materials: [
      {
        name: 'Bentonite Clay Powder for Diaphragm Trenching',
        category: 'Geotechnical',
        requiredQuantity: 400,
        availableQuantity: 360,
        usedQuantity: 40,
        unit: 'Bags',
      },
      {
        name: 'Structural Steel I-Beams (ISMB 400)',
        category: 'Foundation & Shoring',
        requiredQuantity: 55,
        availableQuantity: 50,
        usedQuantity: 5,
        unit: 'Tons',
      },
    ],
  },
  {
    name: 'Narayan Greenscapes',
    client: 'Narayan Realty Ltd.',
    location: 'Sama-Savli Road, Vadodara',
    manager: 'Darshan Trivedi',
    startDate: new Date('2025-07-01'),
    endDate: new Date('2027-10-31'),
    progress: 58,
    status: 'In Progress',
    risk: 'Medium',
    tasks: [
      {
        title: 'Sewage Treatment Plant (STP) Civil Tanks & Aeration Pumps',
        description: 'MBBR technology 150 KLD effluent treatment plant for water recycling.',
        assignedTo: 'WaterTech Enviro Solutions',
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-10-30'),
        status: 'In Progress',
        progress: 60,
        priority: 'High',
      },
      {
        title: 'Internal 12-Metre Concrete Paved Arterial Roads',
        description: 'Interlocking 80mm M40 high-strength paver blocks over compacted stone dust.',
        assignedTo: 'Roadways Gujarat',
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-08-30'), // Delayed
        status: 'Delayed',
        progress: 35,
        priority: 'Medium',
      },
      {
        title: 'Solar Street Lighting Installation across Township',
        description: 'Standalone 40W LED solar pole lights with lithium iron phosphate batteries.',
        assignedTo: 'Surya Green Power Vadodara',
        startDate: new Date('2026-08-15'),
        dueDate: new Date('2026-11-20'),
        status: 'In Progress',
        progress: 40,
        priority: 'Low',
      },
    ],
    materials: [
      {
        name: 'Precast Interlocking Paver Blocks 80mm M40',
        category: 'Roads & Paving',
        requiredQuantity: 45000,
        availableQuantity: 7500, // Low Stock <= 20%
        usedQuantity: 37500,
        unit: 'Pieces',
      },
      {
        name: 'STP Aeration Diffusers & Submersible Sludge Pumps',
        category: 'Environmental & MEP',
        requiredQuantity: 12,
        availableQuantity: 10,
        usedQuantity: 2,
        unit: 'Units',
      },
    ],
  },
];

export const seedNarayanRealtyData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/BuildFlowAi';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB for Narayan Realty data seeding.');

    let projectCount = 0;
    let taskCount = 0;
    let materialCount = 0;

    for (const prjData of NARAYAN_REALTY_PROJECTS) {
      const { tasks, materials, ...projectFields } = prjData;

      // Upsert project
      let project = await Project.findOne({ name: projectFields.name });
      if (!project) {
        project = await Project.create(projectFields);
        console.log(`✨ [Created Project] ${project.name} (${project.location})`);
      } else {
        Object.assign(project, projectFields);
        await project.save();
        console.log(`🔄 [Updated Project] ${project.name} (${project.location})`);
      }
      projectCount++;

      const projectId = project._id;

      // Seed tasks
      if (tasks && tasks.length > 0) {
        await Task.deleteMany({ projectId });
        const createdTasks = await Task.insertMany(
          tasks.map((t) => ({
            ...t,
            projectId,
          }))
        );
        taskCount += createdTasks.length;
      }

      // Seed materials
      if (materials && materials.length > 0) {
        await Material.deleteMany({ projectId });
        const createdMaterials = await Material.insertMany(
          materials.map((m) => ({
            ...m,
            projectId,
          }))
        );
        materialCount += createdMaterials.length;
      }
    }

    console.log('\n======================================================');
    console.log('✅ NARAYAN REALTY REAL DATA SEEDING COMPLETE');
    console.log('======================================================');
    console.log(`Total Projects Seeded:  ${projectCount}`);
    console.log(`Total Tasks Seeded:     ${taskCount}`);
    console.log(`Total Materials Seeded: ${materialCount}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed cleanly.');
  } catch (error) {
    console.error('❌ Error seeding Narayan Realty data:', error);
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seedNarayanRealtyProjects.js')) {
  seedNarayanRealtyData();
}
