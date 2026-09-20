import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastNotification } from './components/common/ToastNotification';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { AddProject } from './pages/AddProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { Tasks } from './pages/Tasks';
import { AddTask } from './pages/AddTask';
import { Materials } from './pages/Materials';
import { Suppliers } from './pages/Suppliers';
import { SiteUpdates } from './pages/SiteUpdates';
import { Documents } from './pages/Documents';
import { Reports } from './pages/Reports';
import { AIInsights } from './pages/AIInsights';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

// Mock Data
import {
  initialProjects,
  initialTasks,
  initialMaterials,
  initialSuppliers,
  initialSiteUpdates,
  initialDocuments,
  initialAlerts,
} from './mock/constructionData';

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ-101');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Reactive Application Data Stores
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [materials, setMaterials] = useState(initialMaterials);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [siteUpdates, setSiteUpdates] = useState(initialSiteUpdates);
  const [documents, setDocuments] = useState(initialDocuments);
  const [alerts, setAlerts] = useState(initialAlerts);

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State Mutators
  const handleAddProject = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    addToast(`Project "${newProject.name}" created successfully!`, 'success');
  };

  const handleAddTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    addToast(`Task "${newTask.name}" assigned successfully!`, 'success');
  };

  const handleAddMaterial = (newMat) => {
    setMaterials((prev) => [newMat, ...prev]);
    addToast(`Material "${newMat.material}" logged into inventory.`, 'success');
  };

  const handleAddSupplier = (newSup) => {
    setSuppliers((prev) => [newSup, ...prev]);
    addToast(`Supplier "${newSup.name}" registered.`, 'success');
  };

  const handleAddSiteUpdate = (newUpdate) => {
    setSiteUpdates((prev) => [newUpdate, ...prev]);
    addToast(`Daily log for ${newUpdate.project} saved.`, 'success');
  };

  const handleUploadDocument = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    addToast(`Document "${newDoc.name}" uploaded to repository.`, 'success');
  };

  const handleDeleteDocument = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    addToast('Document deleted from archive.', 'warning');
  };

  const handleExportReport = (format) => {
    addToast(`Generating ${format} report... Download started.`, 'success');
  };

  const handleReorderMaterial = (mat) => {
    addToast(`Emergency PO drafted for ${mat.material}. Sent to ${mat.supplier}.`, 'success');
  };

  const handleDownloadFeedback = (fileName) => {
    addToast(`Downloading ${fileName}...`, 'info');
  };

  // Title mappings
  const getHeaderMeta = () => {
    const selectedPrj = projects.find((p) => p.id === selectedProjectId) || projects[0];

    switch (activeTab) {
      case 'dashboard':
        return { title: t('navigation.dashboard'), subtitle: `Alex Morgan • ${t('dashboard.title')}` };
      case 'projects':
        return { title: t('navigation.projects'), subtitle: `${projects.length} ${t('projects.title')}` };
      case 'add-project':
        return { title: t('projects.addProject'), subtitle: t('projects.formSubtitle') };
      case 'project-details':
        return { title: selectedPrj?.name || t('navigation.projectDetails'), subtitle: selectedPrj?.code || t('common.viewDetails') };
      case 'tasks':
        return { title: t('navigation.tasks'), subtitle: `${tasks.length} ${t('tasks.title')}` };
      case 'add-task':
        return { title: t('tasks.addTask'), subtitle: t('tasks.formSubtitle') };
      case 'materials':
        return { title: t('materials.title'), subtitle: `${materials.length} ${t('navigation.materials')}` };
      case 'suppliers':
        return { title: t('suppliers.title'), subtitle: `${suppliers.length} ${t('navigation.suppliers')}` };
      case 'site-updates':
        return { title: t('siteUpdates.title'), subtitle: t('siteUpdates.subtitle') };
      case 'documents':
        return { title: t('documents.title'), subtitle: `${documents.length} ${t('navigation.documents')}` };
      case 'reports':
        return { title: t('reports.title'), subtitle: t('reports.subtitle') };
      case 'insights':
        return { title: t('aiInsights.title'), subtitle: 'Gemini AI' };
      case 'alerts':
        return { title: t('alerts.title'), subtitle: `${alerts.length} ${t('alerts.title')}` };
      case 'settings':
        return { title: t('settings.title'), subtitle: t('settings.subtitle') };
      default:
        return { title: 'BuildFlow AI', subtitle: 'Smart Construction Suite' };
    }
  };

  const { title, subtitle } = getHeaderMeta();
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            projects={projects}
            tasks={tasks}
            materials={materials}
            siteUpdates={siteUpdates}
            onNavigate={setActiveTab}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={projects}
            onNavigate={setActiveTab}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'add-project':
        return (
          <AddProject
            onAddProject={handleAddProject}
            onNavigate={setActiveTab}
          />
        );
      case 'project-details':
        return (
          <ProjectDetails
            project={selectedProject}
            allProjects={projects}
            tasks={tasks}
            materials={materials}
            siteUpdates={siteUpdates}
            documents={documents}
            onNavigate={setActiveTab}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            projects={projects}
            onNavigate={setActiveTab}
          />
        );
      case 'add-task':
        return (
          <AddTask
            projects={projects}
            onAddTask={handleAddTask}
            onNavigate={setActiveTab}
          />
        );
      case 'materials':
        return (
          <Materials
            materials={materials}
            projects={projects}
            onAddMaterial={handleAddMaterial}
            onReorder={handleReorderMaterial}
          />
        );
      case 'suppliers':
        return (
          <Suppliers
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
          />
        );
      case 'site-updates':
        return (
          <SiteUpdates
            siteUpdates={siteUpdates}
            projects={projects}
            onAddUpdate={handleAddSiteUpdate}
          />
        );
      case 'documents':
        return (
          <Documents
            documents={documents}
            projects={projects}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onDownloadFeedback={handleDownloadFeedback}
          />
        );
      case 'reports':
        return (
          <Reports
            projects={projects}
            tasks={tasks}
            materials={materials}
            onExportReport={handleExportReport}
          />
        );
      case 'insights':
        return (
          <AIInsights
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onTriggerAction={(msg) => addToast(msg, 'success')}
          />
        );
      case 'alerts':
        return (
          <Alerts
            alerts={alerts}
            onNavigate={setActiveTab}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'settings':
        return (
          <Settings
            onSaveFeedback={(msg) => addToast(msg, 'success')}
          />
        );
      default:
        return (
          <Dashboard
            projects={projects}
            tasks={tasks}
            materials={materials}
            siteUpdates={siteUpdates}
            onNavigate={setActiveTab}
            onSelectProject={setSelectedProjectId}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        unreadAlertsCount={alerts.filter((a) => a.type === 'Critical' || a.type === 'Warning').length}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Navbar
          pageTitle={title}
          pageSubtitle={subtitle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigate={setActiveTab}
          recentAlerts={alerts}
        />
        <main>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
