import React from 'react';
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconMaterials,
  IconReports,
  IconInsights,
} from '../common/Icons';

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onCloseMobile }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'projects', label: 'Projects', icon: <IconProjects /> },
    { id: 'tasks', label: 'Tasks', icon: <IconTasks />, badge: '5' },
    { id: 'materials', label: 'Materials', icon: <IconMaterials />, badge: '3' },
    { id: 'reports', label: 'Reports', icon: <IconReports /> },
    { id: 'insights', label: 'AI Insights', icon: <IconInsights />, isAI: true },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="brand-text-wrapper">
          <div className="brand-title">
            Build<span>Flow</span> AI
          </div>
          <div className="brand-subtitle">Smart Construction Suite</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Management Modules</div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
              {item.isAI && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 217, 255, 0.15)',
                    color: '#00D9FF',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                  }}
                >
                  GEMINI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <div className="pulse-dot" />
          <span>System Online • v1.0.0-MVP</span>
        </div>
      </div>
    </aside>
  );
};
