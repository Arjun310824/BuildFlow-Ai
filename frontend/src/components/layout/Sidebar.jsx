import React, { useState } from 'react';
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconMaterials,
  IconSiteUpdates,
  IconDocuments,
  IconReports,
  IconInsights,
  IconAlerts,
  IconSettings,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
} from '../common/Icons';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  unreadAlertsCount = 3,
}) => {
  // Collapsible state for submenu items
  const [openSubmenus, setOpenSubmenus] = useState({
    projects: true,
    tasks: false,
    materials: false,
  });

  const toggleSubmenu = (key, e) => {
    e.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo" onClick={() => handleNavClick('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
            <span>
              BUILD<span style={{ color: 'var(--color-accent)' }}>FLOW</span> AI
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="sidebar-nav-container">
          {/* Dashboard */}
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <span className="nav-icon"><IconDashboard /></span>
            <span>Dashboard</span>
          </button>

          {/* Projects with Submenu */}
          <div>
            <button
              className={`nav-btn ${
                ['projects', 'add-project', 'project-details'].includes(activeTab) ? 'active' : ''
              }`}
              onClick={() => handleNavClick('projects')}
            >
              <span className="nav-icon"><IconProjects /></span>
              <span>Projects</span>
              <span
                onClick={(e) => toggleSubmenu('projects', e)}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
              >
                {openSubmenus.projects ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            </button>
            {openSubmenus.projects && (
              <div className="nav-sub-items">
                <button
                  className={`subnav-btn ${activeTab === 'projects' ? 'active' : ''}`}
                  onClick={() => handleNavClick('projects')}
                >
                  All Projects
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'add-project' ? 'active' : ''}`}
                  onClick={() => handleNavClick('add-project')}
                >
                  + Add Project
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'project-details' ? 'active' : ''}`}
                  onClick={() => handleNavClick('project-details')}
                >
                  Project Details
                </button>
              </div>
            )}
          </div>

          {/* Tasks with Submenu */}
          <div>
            <button
              className={`nav-btn ${['tasks', 'add-task'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleNavClick('tasks')}
            >
              <span className="nav-icon"><IconTasks /></span>
              <span>Tasks</span>
              <span
                onClick={(e) => toggleSubmenu('tasks', e)}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
              >
                {openSubmenus.tasks ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            </button>
            {openSubmenus.tasks && (
              <div className="nav-sub-items">
                <button
                  className={`subnav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => handleNavClick('tasks')}
                >
                  All Tasks
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'add-task' ? 'active' : ''}`}
                  onClick={() => handleNavClick('add-task')}
                >
                  + Add Task
                </button>
              </div>
            )}
          </div>

          {/* Materials with Submenu */}
          <div>
            <button
              className={`nav-btn ${['materials', 'suppliers'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleNavClick('materials')}
            >
              <span className="nav-icon"><IconMaterials /></span>
              <span>Materials</span>
              <span
                onClick={(e) => toggleSubmenu('materials', e)}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
              >
                {openSubmenus.materials ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            </button>
            {openSubmenus.materials && (
              <div className="nav-sub-items">
                <button
                  className={`subnav-btn ${activeTab === 'materials' ? 'active' : ''}`}
                  onClick={() => handleNavClick('materials')}
                >
                  Inventory
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
                  onClick={() => handleNavClick('suppliers')}
                >
                  Suppliers
                </button>
              </div>
            )}
          </div>

          {/* Site Updates */}
          <button
            className={`nav-btn ${activeTab === 'site-updates' ? 'active' : ''}`}
            onClick={() => handleNavClick('site-updates')}
          >
            <span className="nav-icon"><IconSiteUpdates /></span>
            <span>Site Updates</span>
          </button>

          {/* Documents */}
          <button
            className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => handleNavClick('documents')}
          >
            <span className="nav-icon"><IconDocuments /></span>
            <span>Documents</span>
          </button>

          {/* Reports */}
          <button
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <span className="nav-icon"><IconReports /></span>
            <span>Reports</span>
          </button>

          <div className="nav-divider" />

          {/* AI Insights */}
          <button
            className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleNavClick('insights')}
          >
            <span className="nav-icon" style={{ color: 'var(--color-accent)' }}><IconInsights /></span>
            <span>AI Insights</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              GEMINI
            </span>
          </button>

          {/* Alerts */}
          <button
            className={`nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => handleNavClick('alerts')}
          >
            <span className="nav-icon"><IconAlerts /></span>
            <span>Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="nav-badge-pill" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span className="nav-icon"><IconSettings /></span>
            <span>Settings</span>
          </button>
        </div>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <div
            className="user-profile-card"
            onClick={() => handleNavClick('settings')}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar-circle">
              AM
              <span className="status-indicator-dot" />
            </div>
            <div className="user-meta-info">
              <div className="user-meta-name">Alex Morgan</div>
              <div className="user-meta-role">Project Manager</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
