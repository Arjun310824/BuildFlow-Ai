import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
} from '../common/Icons';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  unreadAlertsCount = 3,
}) => {
  const { t } = useTranslation();

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
            <span>{t('navigation.dashboard')}</span>
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
              <span>{t('navigation.projects')}</span>
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
                  {t('navigation.allProjects')}
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'add-project' ? 'active' : ''}`}
                  onClick={() => handleNavClick('add-project')}
                >
                  + {t('projects.addProject')}
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'project-details' ? 'active' : ''}`}
                  onClick={() => handleNavClick('project-details')}
                >
                  {t('navigation.projectDetails')}
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
              <span>{t('navigation.tasks')}</span>
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
                  {t('navigation.allTasks')}
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'add-task' ? 'active' : ''}`}
                  onClick={() => handleNavClick('add-task')}
                >
                  + {t('tasks.addTask')}
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
              <span>{t('navigation.materials')}</span>
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
                  {t('navigation.inventory')}
                </button>
                <button
                  className={`subnav-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
                  onClick={() => handleNavClick('suppliers')}
                >
                  {t('navigation.suppliers')}
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
            <span>{t('navigation.siteUpdates')}</span>
          </button>

          {/* Documents */}
          <button
            className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => handleNavClick('documents')}
          >
            <span className="nav-icon"><IconDocuments /></span>
            <span>{t('navigation.documents')}</span>
          </button>

          {/* Reports */}
          <button
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <span className="nav-icon"><IconReports /></span>
            <span>{t('navigation.reports')}</span>
          </button>

          <div className="nav-divider" />

          {/* AI Insights */}
          <button
            className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => handleNavClick('insights')}
          >
            <span className="nav-icon" style={{ color: 'var(--color-accent)' }}><IconInsights /></span>
            <span>{t('navigation.aiInsights')}</span>
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
            <span>{t('navigation.alerts')}</span>
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
            <span>{t('navigation.settings')}</span>
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
              <div className="user-meta-role">{t('common.manager')}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
