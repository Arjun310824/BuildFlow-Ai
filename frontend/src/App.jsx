import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ModulePlaceholder } from './pages/ModulePlaceholder';
import {
  IconProjects,
  IconTasks,
  IconMaterials,
  IconReports,
  IconInsights,
} from './components/common/Icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return (
          <ModulePlaceholder
            title="Projects Directory"
            description="Comprehensive portfolio tracking, site blueprints, contractor assignments, and geospatial site coordinates."
            icon={<IconProjects size={28} />}
          />
        );
      case 'tasks':
        return (
          <ModulePlaceholder
            title="Task & Progress Tracking"
            description="Gantt chart timelines, milestone breakdowns, work orders, and field crew activity logs."
            icon={<IconTasks size={28} />}
          />
        );
      case 'materials':
        return (
          <ModulePlaceholder
            title="Material & Inventory Tracking"
            description="On-site stock levels, delivery schedules, vendor PO tracking, and automatic shortage warnings."
            icon={<IconMaterials size={28} />}
          />
        );
      case 'reports':
        return (
          <ModulePlaceholder
            title="Project Reporting"
            description="Automated daily progress reports, safety audit filings, contractor logs, and PDF export facilities."
            icon={<IconReports size={28} />}
          />
        );
      case 'insights':
        return (
          <ModulePlaceholder
            title="AI-Powered Project Insights"
            description="Gemini-assisted delay risk prediction, critical path anomaly detection, and automated resource reallocation suggestions."
            icon={<IconInsights size={28} />}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar onToggleMobileSidebar={toggleMobileSidebar} />
        <main className="main-content">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
