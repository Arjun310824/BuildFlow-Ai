import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastNotification } from './components/common/ToastNotification';
import {
  getProjectsApi,
  createProjectApi,
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  getMaterialsApi,
  createMaterialApi,
  updateMaterialApi,
  deleteMaterialApi,
} from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
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

// Route Mappings
const TAB_TO_PATH = {
  login: '/login',
  dashboard: '/dashboard',
  projects: '/projects',
  'add-project': '/add-project',
  'project-details': '/project-details',
  tasks: '/tasks',
  'add-task': '/add-task',
  materials: '/materials',
  suppliers: '/suppliers',
  'site-updates': '/site-updates',
  documents: '/documents',
  reports: '/reports',
  insights: '/insights',
  alerts: '/alerts',
  settings: '/settings',
};

const PATH_TO_TAB = {
  '/login': 'login',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/add-project': 'add-project',
  '/project-details': 'project-details',
  '/tasks': 'tasks',
  '/add-task': 'add-task',
  '/materials': 'materials',
  '/suppliers': 'suppliers',
  '/site-updates': 'site-updates',
  '/documents': 'documents',
  '/reports': 'reports',
  '/insights': 'insights',
  '/alerts': 'alerts',
  '/settings': 'settings',
};

function AppContent() {
  const { t } = useTranslation();
  const { user, isAuthenticated, login, logout } = useAuth();

  // Route & Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (!isAuthenticated) {
      if (path !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return 'login';
    } else {
      if (path === '/login' || path === '/') {
        window.history.replaceState(null, '', '/dashboard');
        return 'dashboard';
      }
      return PATH_TO_TAB[path] || 'dashboard';
    }
  });

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
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Protected Route Guard & URL Synchronization
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!isAuthenticated) {
      if (activeTab !== 'login') {
        setActiveTab('login');
      }
      if (currentPath !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
    } else {
      if (activeTab === 'login') {
        setActiveTab('dashboard');
        window.history.replaceState(null, '', '/dashboard');
      } else {
        const expectedPath = TAB_TO_PATH[activeTab] || '/dashboard';
        if (currentPath !== expectedPath) {
          window.history.replaceState(null, '', expectedPath);
        }
      }
    }
  }, [isAuthenticated, activeTab]);

  // Browser Back/Forward Popstate Listener
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (!isAuthenticated) {
        if (currentPath !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
        setActiveTab('login');
      } else {
        if (currentPath === '/login') {
          window.history.replaceState(null, '', '/dashboard');
          setActiveTab('dashboard');
        } else {
          const targetTab = PATH_TO_TAB[currentPath] || 'dashboard';
          setActiveTab(targetTab);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Initial data fetch from MongoDB (Projects, Tasks, Materials)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [projRes, taskRes, matRes] = await Promise.allSettled([
          getProjectsApi(),
          getTasksApi(),
          getMaterialsApi(),
        ]);

        if (projRes.status === 'fulfilled' && projRes.value?.success && Array.isArray(projRes.value.data) && projRes.value.data.length > 0) {
          setProjects(projRes.value.data);
          const firstId = projRes.value.data[0]._id || projRes.value.data[0].id;
          if (firstId) {
            setSelectedProjectId(firstId);
          }
        }

        if (taskRes.status === 'fulfilled' && taskRes.value?.success && Array.isArray(taskRes.value.data) && taskRes.value.data.length > 0) {
          setTasks(taskRes.value.data);
        }

        if (matRes.status === 'fulfilled' && matRes.value?.success && Array.isArray(matRes.value.data) && matRes.value.data.length > 0) {
          setMaterials(matRes.value.data);
        }
      } catch (err) {
        console.warn('Initial MongoDB data fetch encountered error:', err);
      }
    };
    loadInitialData();
  }, []);

  // Central Navigation Handler with Protected Route Checks
  const handleNavigate = (targetTab) => {
    if (!isAuthenticated && targetTab !== 'login') {
      setActiveTab('login');
      window.history.replaceState(null, '', '/login');
      return;
    }

    if (isAuthenticated && targetTab === 'login') {
      setActiveTab('dashboard');
      window.history.replaceState(null, '', '/dashboard');
      return;
    }

    const targetPath = TAB_TO_PATH[targetTab] || `/${targetTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: targetTab }, '', targetPath);
    }
    setActiveTab(targetTab);
  };

  // Auth Action Handlers
  const handleLoginSuccess = async (credentials) => {
    const loggedInUser = await login(credentials);
    window.history.replaceState(null, '', '/dashboard');
    setActiveTab('dashboard');
    addToast(`Welcome back, ${loggedInUser.name}!`, 'success');
  };

  const handleSignOut = () => {
    logout();
    window.history.replaceState(null, '', '/login');
    setActiveTab('login');
    addToast('You have been logged out successfully.', 'info');
  };

  // State Mutators connected to MongoDB
  const handleAddProject = async (newProject) => {
    try {
      const payload = {
        name: newProject.name,
        client: newProject.client || newProject.clientName || 'Strategic Client',
        location: newProject.location || 'Construction Site',
        manager: newProject.manager || newProject.projectManager || user?.name || 'Alex Morgan',
        startDate: newProject.startDate || new Date().toISOString().slice(0, 10),
        endDate: newProject.endDate || newProject.expectedCompletion || newProject.expectedEndDate || new Date(Date.now() + 86400000 * 180).toISOString().slice(0, 10),
        progress: Number(newProject.progress) || 0,
        status: ['Planning', 'In Progress', 'On Hold', 'Completed'].includes(newProject.status) ? newProject.status : 'Planning',
        risk: ['Low', 'Medium', 'High'].includes(newProject.risk) ? newProject.risk : 'Low',
      };
      const res = await createProjectApi(payload);
      if (res && res.success && res.data) {
        setProjects((prev) => [res.data, ...prev]);
        addToast(`Project "${res.data.name}" created successfully!`, 'success');
      }
    } catch (err) {
      console.error('Error creating project in App.jsx:', err);
      addToast(err.message || 'Failed to create project in database', 'error');
    }
  };

  const handleAddTask = async (newTask) => {
    // If newTask was already persisted to MongoDB by AddTask.jsx
    if (newTask && newTask._id) {
      setTasks((prev) => [newTask, ...prev]);
      addToast(`Task "${newTask.title || newTask.name}" assigned successfully!`, 'success');
      return;
    }

    try {
      // Find a valid 24-character ObjectId for projectId
      let targetProjectId = newTask.projectId;
      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        const matched = projects.find(
          (p) => (p.name === newTask.project) || (p._id && p._id.toString() === targetProjectId)
        ) || projects[0];
        targetProjectId = matched?._id || matched?.id;
      }

      const payload = {
        projectId: targetProjectId,
        title: newTask.title || newTask.name,
        description: newTask.description || '',
        assignedTo: newTask.assignedTo || '',
        startDate: newTask.startDate || new Date().toISOString().slice(0, 10),
        dueDate: newTask.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: ['Not Started', 'In Progress', 'Completed', 'Delayed'].includes(newTask.status)
          ? newTask.status
          : 'Not Started',
        progress: Number(newTask.progress) || 0,
        priority: ['Low', 'Medium', 'High', 'Critical'].includes(newTask.priority)
          ? newTask.priority
          : 'Medium',
      };

      const res = await createTaskApi(payload);
      if (res && res.success && res.data) {
        setTasks((prev) => [res.data, ...prev]);
        addToast(`Task "${res.data.title || res.data.name}" assigned successfully!`, 'success');
      } else {
        setTasks((prev) => [newTask, ...prev]);
        addToast(`Task "${newTask.name || newTask.title}" assigned locally.`, 'info');
      }
    } catch (err) {
      console.error('Error creating task in MongoDB:', err);
      setTasks((prev) => [newTask, ...prev]);
      addToast(err.message || 'Task saved locally (MongoDB sync warning)', 'warning');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      if (taskId && /^[0-9a-fA-F]{24}$/.test(taskId)) {
        await updateTaskApi(taskId, { status: newStatus });
      }
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t))
      );
      addToast(`Task status updated to ${newStatus}.`, 'success');
    } catch (err) {
      console.error('Error updating task status:', err);
      addToast('Failed to update task status in database.', 'error');
    }
  };

  const handleAddMaterial = async (newMat) => {
    try {
      let targetProjectId = newMat.projectId;
      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        const matched = projects.find(
          (p) => (p.name === newMat.project) || (p._id && p._id.toString() === targetProjectId)
        ) || projects[0];
        targetProjectId = matched?._id || matched?.id;
      }

      const payload = {
        projectId: targetProjectId,
        name: newMat.name || newMat.material,
        category: newMat.category || 'General',
        requiredQuantity: Number(newMat.requiredQuantity) || 100,
        availableQuantity: Number(newMat.availableQuantity) || 0,
        usedQuantity: Number(newMat.usedQuantity) || 0,
        unit: newMat.unit || 'units',
      };

      const res = await createMaterialApi(payload);
      if (res && res.success && res.data) {
        setMaterials((prev) => [res.data, ...prev]);
        addToast(`Material "${res.data.name}" logged into inventory.`, 'success');
      } else {
        setMaterials((prev) => [newMat, ...prev]);
        addToast(`Material "${newMat.name || newMat.material}" logged locally.`, 'info');
      }
    } catch (err) {
      console.error('Error creating material in MongoDB:', err);
      setMaterials((prev) => [newMat, ...prev]);
      addToast(err.message || 'Material logged locally (MongoDB sync warning)', 'warning');
    }
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
    const selectedPrj = projects.find((p) => (p._id || p.id) === selectedProjectId) || projects[0];
    const userDisplayName = user?.name || 'Alex Morgan';

    switch (activeTab) {
      case 'dashboard':
        return { title: t('navigation.dashboard'), subtitle: `${userDisplayName} • ${t('dashboard.title')}` };
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
        return { title: t('siteUpdates.title', 'Site Updates'), subtitle: t('siteUpdates.badge', 'Daily Field Telemetry') };
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
        return { title: 'BuildOps AI', subtitle: 'Smart Construction Suite' };
    }
  };

  const { title, subtitle } = getHeaderMeta();
  const selectedProject = projects.find((p) => (p._id || p.id) === selectedProjectId) || projects[0];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            projects={projects}
            tasks={tasks}
            materials={materials}
            siteUpdates={siteUpdates}
            onNavigate={handleNavigate}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={projects}
            onNavigate={handleNavigate}
            onSelectProject={setSelectedProjectId}
            onProjectsUpdated={setProjects}
          />
        );
      case 'add-project':
        return (
          <AddProject
            onAddProject={handleAddProject}
            onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
            onSelectProject={setSelectedProjectId}
          />
        );
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            projects={projects}
            onNavigate={handleNavigate}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        );
      case 'add-task':
        return (
          <AddTask
            projects={projects}
            onAddTask={handleAddTask}
            onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
            onSelectProject={setSelectedProjectId}
          />
        );
    }
  };

  // If unauthenticated or explicitly on login, show Login Page only (Protected routes completely blocked)
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <div className="login-root">
        <ToastNotification toasts={toasts} onDismiss={removeToast} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Authenticated Protected View
  return (
    <div className="app-layout">
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
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
          onNavigate={handleNavigate}
          recentAlerts={alerts}
          currentUser={user}
          onSignOut={handleSignOut}
        />
        <main>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
