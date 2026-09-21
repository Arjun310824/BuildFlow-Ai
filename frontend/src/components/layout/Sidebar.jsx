import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconMaterials,
  IconSiteUpdates,
  IconDocuments,
  IconReports,
  IconInsights,
  IconChevronRight,
  IconNetwork,
} from '../common/Icons';

/**
 * Clean White Sidebar for BuildOps AI
 * Matches reference visual design with light surfaces, subtle borders,
 * and blue active states.
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
  const { user } = useAuth();
  const userName = user?.name || 'Alex Morgan';
  const userRole = user?.role || 'Project Manager';
  const userAvatar = user?.avatar || 'AM';

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard size={19} /> },
    { id: 'projects', label: 'Projects', icon: <IconProjects size={19} /> },
    { id: 'tasks', label: 'Tasks', icon: <IconTasks size={19} /> },
    { id: 'materials', label: 'Materials', icon: <IconMaterials size={19} /> },
    { id: 'site-updates', label: 'Site Updates', icon: <IconSiteUpdates size={19} /> },
    { id: 'documents', label: 'Documents', icon: <IconDocuments size={19} /> },
    { id: 'network', label: 'Business Network', icon: <IconNetwork size={19} /> },
  ];

  const secondaryNavItems = [
    { id: 'insights', label: 'AI Insights', icon: <IconInsights size={19} /> },
    { id: 'reports', label: 'Reports', icon: <IconReports size={19} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`sidebar clean-sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <style>{`
          .clean-sidebar {
            background: #FFFFFF !important;
            border-right: 1px solid #E2E8F0 !important;
            display: flex;
            flex-direction: column;
            width: 240px;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 40;
            box-shadow: none;
            transition: transform 0.18s ease-in-out !important;
          }

          .clean-sidebar.collapsed {
            transform: translateX(-240px) !important;
          }

          .sidebar-edge-toggle {
            position: absolute;
            top: 72px;
            right: -13px;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            cursor: pointer;
            z-index: 50;
            padding: 0;
            outline: none;
            transition: right 0.18s ease-in-out, background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
          }

          .sidebar-edge-toggle:hover {
            background: #F8FAFC;
            color: #1677D2;
            border-color: #94A3B8;
            box-shadow: 0 2px 6px rgba(22, 119, 210, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08);
            transform: scale(1.06);
          }

          .sidebar-edge-toggle:active {
            transform: scale(0.96);
          }

          .clean-sidebar.collapsed .sidebar-edge-toggle {
            right: -36px;
          }

          @media (max-width: 768px) {
            .sidebar-edge-toggle {
              display: none !important;
            }
          }

          .clean-sidebar-header {
            padding: 24px 20px 20px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .clean-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            text-decoration: none;
          }

          .clean-brand-logo-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .clean-brand-text-wrap {
            display: flex;
            flex-direction: column;
          }

          .clean-brand-name {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }

          .clean-brand-name span {
            color: #FF6A00;
          }

          .clean-brand-tagline {
            font-size: 0.62rem;
            font-weight: 700;
            color: #94A3B8;
            letter-spacing: 0.08em;
            margin-top: 3px;
          }

          .clean-nav-body {
            flex: 1;
            padding: 10px 14px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .clean-nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 8px;
            color: #64748B;
            font-size: 0.92rem;
            font-weight: 500;
            text-align: left;
            transition: all 0.15s ease;
            position: relative;
            background: transparent;
            border: none;
            cursor: pointer;
          }

          .clean-nav-item:hover {
            background: #F8FAFC;
            color: #0F172A;
          }

          .clean-nav-item.active {
            background: #EFF6FF !important;
            color: #1677D2 !important;
            font-weight: 600;
          }

          .clean-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 6px;
            bottom: 6px;
            width: 3.5px;
            border-radius: 0 4px 4px 0;
            background: #1677D2;
          }

          .clean-nav-item .nav-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            color: inherit;
          }

          .clean-nav-divider {
            height: 1px;
            background: #E2E8F0;
            margin: 14px 8px;
          }

          .clean-sidebar-footer {
            padding: 14px 16px;
            border-top: 1px solid #E2E8F0;
            background: #FFFFFF;
          }

          .clean-user-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.15s ease;
          }

          .clean-user-card:hover {
            background: #F8FAFC;
          }

          .clean-user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #DBEAFE;
            color: #1677D2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            flex-shrink: 0;
          }

          .clean-user-meta {
            min-width: 0;
            flex: 1;
          }

          .clean-user-name {
            font-size: 0.88rem;
            font-weight: 600;
            color: #0F172A;
            line-height: 1.2;
          }

          .clean-user-role {
            font-size: 0.74rem;
            color: #64748B;
            margin-top: 2px;
          }

          .clean-user-chevron {
            color: #94A3B8;
            font-size: 0.85rem;
          }
        `}</style>

        {/* Left Sidebar Edge Toggle Button (Hide / Show) */}
        <button
          type="button"
          id="sidebarToggleBtn"
          className="sidebar-edge-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isCollapsed ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>

        {/* Brand Header */}
        <div className="clean-sidebar-header">
          <div
            className="clean-brand"
            onClick={() => handleNavClick('dashboard')}
            title="BuildOps AI"
          >
            <div className="clean-brand-logo-icon">
              {/* Construction silhouette logo */}
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="14" width="8" height="22" rx="1.5" fill="#1677D2" />
                <rect x="15" y="8" width="8" height="28" rx="1.5" fill="#FF6A00" />
                <rect x="26" y="18" width="8" height="18" rx="1.5" fill="#1677D2" />
                {/* Windows/grids on buildings */}
                <rect x="6.5" y="17" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.8" />
                <rect x="6.5" y="23" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.8" />
                <rect x="17.5" y="11" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
                <rect x="17.5" y="17" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
                <rect x="17.5" y="23" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
                <rect x="28.5" y="21" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.8" />
                <rect x="28.5" y="27" width="3" height="3" rx="0.5" fill="#FFFFFF" fillOpacity="0.8" />
              </svg>
            </div>
            <div className="clean-brand-text-wrap">
              <span className="clean-brand-name">
                BuildOps <span>AI</span>
              </span>
              <span className="clean-brand-tagline">AI-POWERED CONSTRUCTION OPERATIONS</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="clean-nav-body">
          {primaryNavItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'projects' && ['add-project', 'project-details'].includes(activeTab)) ||
              (item.id === 'tasks' && activeTab === 'add-task') ||
              (item.id === 'materials' && activeTab === 'suppliers');

            return (
              <button
                key={item.id}
                type="button"
                className={`clean-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="clean-nav-divider" />

          {secondaryNavItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`clean-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="clean-sidebar-footer">
          <div
            className="clean-user-card"
            onClick={() => handleNavClick('settings')}
            title={`${userName} — ${userRole}`}
          >
            <div className="clean-user-avatar">{userAvatar}</div>
            <div className="clean-user-meta">
              <div className="clean-user-name">{userName}</div>
              <div className="clean-user-role">{userRole}</div>
            </div>
            <div className="clean-user-chevron">
              <IconChevronRight size={14} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
