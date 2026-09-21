# 🏗️ BuildOps AI

> AI-Powered Construction Operations Platform  
> **Hackathon Task 07** — End-to-end technology solution for managing, organizing, and utilizing construction and real-estate data.

BuildOps AI is an AI-powered construction operations platform designed to centralize project data, track construction activities, monitor materials, analyze project risks, and support better decision-making.

The platform brings critical construction information such as projects, tasks, materials, progress, reports, and AI-generated insights into one unified system.

---

## 🎯 Problem Statement

Construction projects generate a large amount of information related to:

- Project progress
- Tasks and deadlines
- Construction materials
- Site activities
- Project reports & documents
- Project risks & delays
- Resource availability

In many organizations, this information is scattered across spreadsheets, documents, messages, and disconnected teams. This makes it difficult for project managers to get a clear, real-time view of site operations.

### Key Pain Points

- Difficult project progress tracking
- Delayed task identification
- Poor visibility of material availability & inventory stockouts
- Scattered project information
- Time-consuming manual reporting
- Inability to forecast project risks early
- Delayed decision-making and lack of centralized project data

---

## 💡 Our Solution

BuildOps AI provides a centralized platform where construction project managers can manage, track, and analyze project information from a single dashboard.

The platform combines:

$$\text{Construction Data} + \text{Project Tracking} + \text{Analytics} + \text{Artificial Intelligence}$$

to provide actionable project insights.

---

## ✨ Core Features & MVP Modules

### 1. 📊 Project Dashboard
Provides a holistic operational summary of active construction projects from a single dashboard:
- Total & Active Projects
- Delayed Tasks requiring attention
- Material & Inventory Shortage Alerts
- Overall Construction Progress & Budget Utilization
- Site Risk Analysis & Mitigation

### 2. 🏗️ Project Management
Centralized repository for construction sites:
- Project Name, Client, Location, and Project Manager
- Schedules, Milestones, and Progress Percentages
- Health Status (`Planning`, `In Progress`, `On Hold`, `Completed`)
- Risk Levels (`Low`, `Medium`, `High`)

### 3. 📋 Task & Progress Tracking
Track on-site construction tasks and trades:
- Task name, assigned team/contractor, milestone deadlines
- Real-time status (`In Progress`, `Completed`, `Delayed`)
- Priority rankings (`Critical`, `High`, `Medium`, `Low`)

### 4. 📦 Material Tracking
Monitor construction inventory and consumption:
- Structural rebar, ready-mix concrete, glazing, electrical components
- Required vs. available stock levels
- Automated low-stock and shipment delay warnings

### 5. 📈 Project Reports
Centralized operational intelligence:
- Daily progress reports & contractor performance logs
- Safety & quality audit filings
- Exportable summary reports

### 6. 🤖 AI-Powered Project Insights
Powered by **Google Gemini API** to analyze construction project data and surface predictive intelligence:
- Early identification of schedule delay risks
- Anomaly detection across trade dependencies
- Material shortage impact forecasting
- Recommended corrective actions for project directors

---

## 🛠️ Technology Stack

- **Frontend**: React + Vite (Custom Enterprise CSS Design System)
- **Backend**: Node.js + Express (RESTful API)
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: Google Gemini API
- **API Testing**: Postman
- **Version Control**: Git + GitHub

---

## 📂 Repository Structure

```
BuildOpsAI/
├── .gitignore              # Global git ignore (node_modules, .env, dist)
├── README.md               # Project documentation and developer setup
│
├── backend/                # Node.js + Express backend service
│   ├── .env.example        # Environment variable template (PORT, MONGODB_URI, GEMINI_API_KEY)
│   ├── package.json        # Backend dependencies and scripts
│   └── src/
│       ├── config/         # Database and third-party configurations (db.js)
│       ├── controllers/    # Route controllers for modules
│       ├── middlewares/    # Centralized error handling and validators
│       ├── models/         # Mongoose schemas (Projects, Tasks, Materials, Reports)
│       ├── routes/         # Express API route declarations
│       ├── services/       # Core business logic & Gemini AI services
│       ├── utils/          # Shared helper functions
│       └── server.js       # Express server initialization entrypoint
│
└── frontend/               # React + Vite frontend application
    ├── .env.example        # Frontend environment variable template
    ├── index.html          # HTML entrypoint
    ├── package.json        # Frontend dependencies and scripts
    ├── vite.config.js      # Vite build and dev configuration
    └── src/
        ├── assets/         # Static assets (images, icons)
        ├── components/     # UI primitives & layout (Navbar, Sidebar, MetricCard, Badges)
        ├── hooks/          # Custom React hooks
        ├── mock/           # Realistic construction demo data for UI
        ├── pages/          # Application views (Dashboard, ModulePlaceholders)
        ├── services/       # API client & backend service integration
        ├── utils/          # Frontend helpers and formatters
        ├── App.jsx         # Root layout orchestrator
        ├── index.css       # Global design system tokens & styles
        └── main.jsx        # React DOM entrypoint
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)
- Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Configure PORT, MONGODB_URI, and GEMINI_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env     # Configure VITE_API_BASE_URL
npm run dev
```
Open `http://localhost:5173/` in your browser to view the application.
