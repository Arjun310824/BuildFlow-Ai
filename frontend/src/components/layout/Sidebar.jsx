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
  IconChevronRight,
  IconChevronDown,
} from '../common/Icons';

/**
 * Sidebar: Professional Construction Intelligence Command Center Navigation.
 * Sections: COMMAND CENTER, OPERATIONS, INTELLIGENCE, REPORTING.
 * Supports expanded and collapsed states, active indicators, and smooth micro-interactions.
 */
export const Sidebar = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  unreadAlertsCount = 4,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navSections = [
    {
      label: 'COMMAND CENTER',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard size={18} /> },
        { id: 'projects', label: 'Projects', icon: <IconProjects size={18} /> },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'tasks', label: 'Tasks', icon: <IconTasks size={18} /> },
        { id: 'materials', label: 'Materials', icon: <IconMaterials size={18} /> },
        { id: 'site-updates', label: 'Site Updates', icon: <IconSiteUpdates size={18} /> },
        { id: 'documents', label: 'Documents', icon: <IconDocuments size={18} /> },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        {
          id: 'insights',
          label: 'AI Insights',
          icon: <IconInsights size={18} />,
          badge: 'GEMINI',
          badgeColor: 'var(--accent-cyan)',
        },
        {
          id: 'risk-radar',
          label: 'Risk Radar',
          icon: <span style={{ fontSize: '15px' }}>◈</span>,
        },
        {
          id: 'alerts',
          label: 'Action Center',
          icon: <IconAlerts size={18} />,
          badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
          badgeColor: '#EF4444',
        },
      ],
    },
    {
      label: 'REPORTING',
      items: [
        { id: 'reports', label: 'Reports', icon: <IconReports size={18} /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div
            className="brand-logo"
            onClick={() => handleNavClick('dashboard')}
            style={{ cursor: 'pointer', overflow: 'hidden' }}
          >
            <div className="brand-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </div>
            {!isCollapsed && (
              <span style={{ whiteSpace: 'nowrap' }}>
                BUILD<span style={{ color: 'var(--accent-cyan)' }}>FLOW</span> AI
              </span>
            )}
          </div>

          {onToggleCollapse && (
            <button
              className="sidebar-collapse-toggle"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? <IconChevronRight size={14} /> : <span style={{ fontSize: '12px' }}>◀</span>}
            </button>
          )}
        </div>

        {/* Sidebar Nav Sections */}
        <div className="sidebar-nav-container">
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: '8px' }}>
              {!isCollapsed && (
                <div className="nav-group-label">{section.label}</div>
              )}

              {section.items.map((item) => {
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'projects' && ['add-project', 'project-details'].includes(activeTab)) ||
                  (item.id === 'tasks' && activeTab === 'add-task') ||
                  (item.id === 'materials' && activeTab === 'suppliers') ||
                  (item.id === 'risk-radar' && activeTab === 'risk-radar');

                return (
                  <button
                    key={item.id}
                    className={`nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}

                    {!isCollapsed && item.badge && (
                      <span
                        className="nav-badge-pill"
                        style={{
                          background: item.badgeColor === '#EF4444' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 217, 255, 0.12)',
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <div
            className="user-profile-card"
            onClick={() => handleNavClick('settings')}
            style={{ cursor: 'pointer' }}
            title={isCollapsed ? 'Alex Morgan — Project Director' : undefined}
          >
            <div className="user-avatar-circle">
              AM
              <span className="status-indicator-dot" />
            </div>
            {!isCollapsed && (
              <div className="user-meta-info">
                <div className="user-meta-name">Alex Morgan</div>
                <div className="user-meta-role">Project Director</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
