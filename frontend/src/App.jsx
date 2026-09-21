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
  getSiteUpdatesApi,
  createSiteUpdateApi,
  deleteSiteUpdateApi,
  getDocumentsApi,
  createDocumentApi,
  deleteDocumentApi,
} from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

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
import { BusinessNetwork } from './pages/BusinessNetwork';
import { downloadVaultDocument, exportRealReport } from './utils/fileDownloader';

// Unconnected Demo Data for static modules
import {
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
  network: '/network',
  alerts: '/alerts',
  settings: '/settings',
};

const PATH_TO_TAB = {
  '/login': 'login',
  '/register': 'login',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/risk-radar': 'dashboard',
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
  '/ai': 'insights',
  '/network': 'network',
  '/alerts': 'alerts',
  '/settings': 'settings',
};

function AppContent() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  // Route & Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path === '/login' || path === '/register') return 'login';
    return PATH_TO_TAB[path] || 'dashboard';
  });

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('buildops_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('buildops_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Reactive Application Data Stores — Populated directly from MongoDB backend
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [siteUpdates, setSiteUpdates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [alerts, setAlerts] = useState([]);

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
    if (isLoading) return;

    const currentPath = window.location.pathname;
    if (!isAuthenticated) {
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Retain attempted private route for post-login redirect (Section 12)
        sessionStorage.setItem('buildops_redirect_path', currentPath);
        window.history.replaceState(null, '', '/login');
      }
      if (activeTab !== 'login') {
        setActiveTab('login');
      }
    } else {
      if (activeTab === 'login') {
        const savedRedirect = sessionStorage.getItem('buildops_redirect_path');
        sessionStorage.removeItem('buildops_redirect_path');
        const targetTab = savedRedirect && PATH_TO_TAB[savedRedirect] ? PATH_TO_TAB[savedRedirect] : 'dashboard';
        const expectedPath = TAB_TO_PATH[targetTab] || '/dashboard';
        setActiveTab(targetTab);
        window.history.replaceState(null, '', expectedPath);
      } else if (currentPath === '/login' || currentPath === '/register' || currentPath === '/risk-radar') {
        window.history.replaceState(null, '', '/dashboard');
        setActiveTab('dashboard');
      } else {
        const expectedPath = TAB_TO_PATH[activeTab] || '/dashboard';
        if (currentPath !== expectedPath) {
          window.history.replaceState(null, '', expectedPath);
        }
      }
    }
  }, [isAuthenticated, isLoading, activeTab]);

  // Browser Back/Forward Popstate Listener
  useEffect(() => {
    if (isLoading) return;

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (!isAuthenticated) {
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('buildops_redirect_path', currentPath);
          window.history.replaceState(null, '', '/login');
        }
        setActiveTab('login');
      } else {
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/risk-radar') {
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
  }, [isAuthenticated, isLoading]);

  // Initial data fetch from MongoDB — only runs when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setTasks([]);
      setMaterials([]);
      setSiteUpdates([]);
      setDocuments([]);
      setAlerts([]);
      setSelectedProjectId(null);
      return;
    }

    const loadInitialData = async () => {
      try {
        const [projRes, taskRes, matRes, siteRes, docRes] = await Promise.allSettled([
          getProjectsApi(),
          getTasksApi(),
          getMaterialsApi(),
          getSiteUpdatesApi(),
          getDocumentsApi(),
        ]);

        if (projRes.status === 'fulfilled' && projRes.value?.success && Array.isArray(projRes.value.data)) {
          setProjects(projRes.value.data);
          const firstId = projRes.value.data[0]?._id || projRes.value.data[0]?.id;
          if (firstId) {
            setSelectedProjectId((prev) => (prev && /^[0-9a-fA-F]{24}$/.test(prev) ? prev : firstId));
          } else {
            setSelectedProjectId(null);
          }
        } else {
          setProjects([]);
          setSelectedProjectId(null);
        }

        if (taskRes.status === 'fulfilled' && taskRes.value?.success && Array.isArray(taskRes.value.data)) {
          setTasks(taskRes.value.data);
        } else {
          setTasks([]);
        }

        if (matRes.status === 'fulfilled' && matRes.value?.success && Array.isArray(matRes.value.data)) {
          setMaterials(matRes.value.data);
        } else {
          setMaterials([]);
        }

        if (siteRes.status === 'fulfilled' && siteRes.value?.success && Array.isArray(siteRes.value.data)) {
          setSiteUpdates(siteRes.value.data);
        } else {
          setSiteUpdates([]);
        }

        if (docRes.status === 'fulfilled' && docRes.value?.success && Array.isArray(docRes.value.data)) {
          setDocuments(docRes.value.data);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.warn('Initial MongoDB data fetch encountered error:', err);
      }
    };
    loadInitialData();
  }, [isAuthenticated, user?._id, user?.id, user?.organizationId]);

  // Central Navigation Handler with Protected Route Checks
  const handleNavigate = (targetTab) => {
    if (targetTab === 'risk-radar') {
      targetTab = 'dashboard';
    }

    if (!isAuthenticated && targetTab !== 'login') {
      sessionStorage.setItem('buildops_redirect_path', TAB_TO_PATH[targetTab] || `/${targetTab}`);
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
    const savedRedirect = sessionStorage.getItem('buildops_redirect_path');
    sessionStorage.removeItem('buildops_redirect_path');
    const targetTab = savedRedirect && PATH_TO_TAB[savedRedirect] ? PATH_TO_TAB[savedRedirect] : 'dashboard';
    const targetPath = TAB_TO_PATH[targetTab] || '/dashboard';
    window.history.replaceState(null, '', targetPath);
    setActiveTab(targetTab);
    addToast(`Welcome back, ${loggedInUser.name}!`, 'success');
  };

  const handleRegisterSuccess = async (userData) => {
    const registeredUser = await register(userData);
    const savedRedirect = sessionStorage.getItem('buildops_redirect_path');
    sessionStorage.removeItem('buildops_redirect_path');
    const targetTab = savedRedirect && PATH_TO_TAB[savedRedirect] ? PATH_TO_TAB[savedRedirect] : 'dashboard';
    const targetPath = TAB_TO_PATH[targetTab] || '/dashboard';
    window.history.replaceState(null, '', targetPath);
    setActiveTab(targetTab);
    addToast(`Welcome to BuildOps AI, ${registeredUser.name}!`, 'success');
  };

  const handleSignOut = () => {
    logout();
    setProjects([]);
    setTasks([]);
    setMaterials([]);
    setSiteUpdates([]);
    setDocuments([]);
    setAlerts([]);
    setSelectedProjectId(null);
    sessionStorage.removeItem('buildops_redirect_path');
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
      setTasks((prev) => [newTask, ...prev.filter((t) => (t._id || t.id) !== newTask._id)]);
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

      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        addToast('Cannot assign task: valid project ObjectId is required.', 'error');
        return;
      }

      const payload = {
        projectId: targetProjectId,
        title: newTask.title || newTask.name,
        description: newTask.description || '',
        assignedTo: newTask.assignedTo || '',
        startDate: newTask.startDate || undefined,
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
        addToast(res?.message || 'Failed to create task.', 'error');
      }
    } catch (err) {
      console.error('Error creating task in MongoDB:', err);
      addToast(err.message || 'Failed to create task in MongoDB', 'error');
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

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => ((t._id || t.id) === (updatedTask._id || updatedTask.id) ? updatedTask : t))
    );
  };

  const handleAddMaterial = async (newMat) => {
    if (newMat && newMat._id) {
      setMaterials((prev) => [newMat, ...prev.filter((m) => (m._id || m.id) !== newMat._id)]);
      addToast(`Material "${newMat.name || newMat.material}" logged into inventory.`, 'success');
      return;
    }

    try {
      let targetProjectId = newMat.projectId;
      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        const matched = projects.find(
          (p) => (p.name === newMat.project) || (p._id && p._id.toString() === targetProjectId)
        ) || projects[0];
        targetProjectId = matched?._id || matched?.id;
      }

      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        addToast('Cannot log material: valid project ObjectId is required.', 'error');
        return;
      }

      const payload = {
        projectId: targetProjectId,
        name: newMat.name || newMat.material,
        category: newMat.category || 'General',
        requiredQuantity: Number(newMat.requiredQuantity) || 0,
        availableQuantity: Number(newMat.availableQuantity) || 0,
        usedQuantity: Number(newMat.usedQuantity) || 0,
        unit: newMat.unit || 'units',
      };

      const res = await createMaterialApi(payload);
      if (res && res.success && res.data) {
        setMaterials((prev) => [res.data, ...prev]);
        addToast(`Material "${res.data.name}" logged into inventory.`, 'success');
      } else {
        addToast(res?.message || 'Failed to create material record.', 'error');
      }
    } catch (err) {
      console.error('Error creating material in MongoDB:', err);
      addToast(err.message || 'Failed to log material in MongoDB', 'error');
    }
  };

  const handleDeleteMaterial = (materialId) => {
    setMaterials((prev) => prev.filter((m) => (m._id || m.id) !== materialId));
  };

  const handleUpdateMaterial = (updatedMat) => {
    setMaterials((prev) =>
      prev.map((m) => ((m._id || m.id) === (updatedMat._id || updatedMat.id) ? updatedMat : m))
    );
  };

  const handleAddSupplier = (newSup) => {
    setSuppliers((prev) => [newSup, ...prev]);
    addToast(`Supplier "${newSup.name}" registered.`, 'success');
  };

  const handleAddSiteUpdate = async (newUpdate) => {
    try {
      let targetProjectId = newUpdate.projectId;
      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        const matched = projects.find(
          (p) => (p.name === newUpdate.project) || (p._id && p._id.toString() === targetProjectId)
        ) || projects[0];
        targetProjectId = matched?._id || matched?.id;
      }

      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        addToast('Cannot save site update: valid project is required.', 'error');
        return;
      }

      const projName = newUpdate.project || projects.find(p => (p._id || p.id) === targetProjectId)?.name || 'Project';

      const payload = {
        projectId: targetProjectId,
        project: projName,
        supervisor: newUpdate.supervisor || user?.name || 'Site Supervisor',
        workCompleted: newUpdate.workCompleted || newUpdate.workSummary || 'Field progress update',
        progress: Number(newUpdate.progress) || 0,
        workers: Number(newUpdate.workers) || 0,
        issues: newUpdate.issues || 'None reported',
        weather: newUpdate.weather || 'Clear',
        tags: Array.isArray(newUpdate.tags) ? newUpdate.tags : ['Field Telemetry'],
        image: newUpdate.image || '',
        date: newUpdate.date ? new Date(newUpdate.date) : new Date(),
      };

      const res = await createSiteUpdateApi(payload);
      if (res && res.success && res.data) {
        setSiteUpdates((prev) => [res.data, ...prev]);
        addToast(`Daily log for ${projName} saved.`, 'success');
      } else {
        addToast(res?.message || 'Failed to save site update.', 'error');
      }
    } catch (err) {
      console.error('Error saving site update:', err);
      addToast(err.message || 'Failed to save site update.', 'error');
    }
  };

  const handleUploadDocument = async (newDoc) => {
    try {
      let targetProjectId = newDoc.projectId;
      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        const matched = projects.find(
          (p) => (p.name === newDoc.project) || (p._id && p._id.toString() === targetProjectId)
        ) || projects[0];
        targetProjectId = matched?._id || matched?.id;
      }

      if (!targetProjectId || !/^[0-9a-fA-F]{24}$/.test(targetProjectId)) {
        addToast('Cannot upload document: valid project is required.', 'error');
        return;
      }

      const projName = newDoc.project || projects.find(p => (p._id || p.id) === targetProjectId)?.name || 'Project';

      const payload = {
        projectId: targetProjectId,
        project: projName,
        name: newDoc.name,
        type: newDoc.type || 'Contract',
        size: newDoc.size || '2.5 MB',
        uploadedBy: newDoc.uploadedBy || user?.name || 'Project Manager',
        status: newDoc.status || 'Approved',
        date: newDoc.date ? new Date(newDoc.date) : new Date(),
      };

      const res = await createDocumentApi(payload);
      if (res && res.success && res.data) {
        setDocuments((prev) => [res.data, ...prev]);
        addToast(`Document "${res.data.name}" uploaded to repository.`, 'success');
      } else {
        addToast(res?.message || 'Failed to save document.', 'error');
      }
    } catch (err) {
      console.error('Error saving document:', err);
      addToast(err.message || 'Failed to save document.', 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      if (docId && /^[0-9a-fA-F]{24}$/.test(docId)) {
        await deleteDocumentApi(docId);
      }
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== docId));
      addToast('Document deleted from archive.', 'warning');
    } catch (err) {
      console.error('Error deleting document:', err);
      addToast(err.message || 'Failed to delete document.', 'error');
    }
  };

  const handleExportReport = (format) => {
    exportRealReport(format, { projects, tasks, materials });
    addToast(`Exported ${format} report successfully! Download started.`, 'success');
  };

  const handleReorderMaterial = (mat) => {
    addToast(`Emergency PO drafted for ${mat.material}. Sent to ${mat.supplier}.`, 'success');
  };

  const handleDownloadFeedback = (docOrName) => {
    downloadVaultDocument(docOrName);
    const fileName = typeof docOrName === 'string' ? docOrName : (docOrName?.name || 'Document');
    addToast(`Downloaded "${fileName}" successfully!`, 'success');
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
        return { title: selectedPrj?.name || t('navigation.projectDetails'), subtitle: selectedPrj?.client || t('common.viewDetails') };
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
      case 'network':
        return { title: 'Business Network', subtitle: 'B2B Collaboration & Controlled Partner Data Sharing' };
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
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
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
            onDeleteMaterial={handleDeleteMaterial}
            onUpdateMaterial={handleUpdateMaterial}
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
      case 'network':
        return (
          <BusinessNetwork
            onTriggerToast={(msg, type) => addToast(msg, type || 'success')}
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

  // While verifying auth token against /api/auth/me on startup
  if (isLoading) {
    return <ProtectedRoute />;
  }

  // If unauthenticated or explicitly on login/register, show Login/Register Page only (Protected routes completely blocked)
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <div className="login-root">
        <ToastNotification toasts={toasts} onDismiss={removeToast} />
        <Login
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
          initialMode={window.location.pathname === '/register' ? 'register' : 'login'}
        />
      </div>
    );
  }

  // Authenticated Protected View
  return (
    <ProtectedRoute onRedirectToLogin={() => setActiveTab('login')}>
      <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Toast Notification Container */}
        <ToastNotification toasts={toasts} onDismiss={removeToast} />

        {/* Persistent Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          unreadAlertsCount={alerts.filter((a) => a.type === 'Critical' || a.type === 'Warning').length}
        />

        {/* Main Wrapper */}
        <div className={`main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
