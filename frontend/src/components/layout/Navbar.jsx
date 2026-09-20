import React, { useState } from 'react';
import {
  IconSearch,
  IconMenu,
  IconAlerts,
  IconPlus,
  IconChevronDown,
  IconCheck,
  IconAlertTriangle,
} from '../common/Icons';

export const Navbar = ({
  pageTitle = 'Dashboard',
  pageSubtitle = '',
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  onNavigate,
  recentAlerts = [],
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="nav-icon-action-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          style={{ display: 'none' }}
          id="mobile-nav-btn"
        >
          <IconMenu />
        </button>

        <div className="page-title-crumb">
          <span className="page-title-main">{pageTitle}</span>
          {pageSubtitle && (
            <span className="page-title-badge">{pageSubtitle}</span>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {/* Global Search */}
        <div className="search-bar-box">
          <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Search projects, tasks, materials..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        {/* Quick Add Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-quick-create"
            onClick={() => setShowQuickAdd((prev) => !prev)}
          >
            <IconPlus size={16} />
            <span>New</span>
            <IconChevronDown size={14} />
          </button>

          {showQuickAdd && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '180px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate('add-project');
                }}
              >
                + Add Project
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate('add-task');
                }}
              >
                + Add Task
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate('site-updates');
                }}
              >
                + Daily Log Update
              </button>
            </div>
          )}
        </div>

        {/* Notification Icon */}
        <div style={{ position: 'relative' }}>
          <button
            className="nav-icon-action-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="View notifications"
          >
            <IconAlerts size={18} />
            <span className="nav-notification-dot" />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '320px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '12px 16px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Alerts</span>
                <button
                  style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentAlerts.slice(0, 3).map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('alerts');
                    }}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {alt.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {alt.project} • {alt.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="navbar-user-trigger"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <div
              className="user-avatar-circle"
              style={{ width: '32px', height: '32px', fontSize: '0.78rem' }}
            >
              AM
            </div>
            <IconChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '200px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Alex Morgan</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>alex@buildflow.ai</div>
              </div>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('settings');
                }}
              >
                Profile & Settings
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('dashboard');
                }}
              >
                Project Hub
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '6px 10px', color: 'var(--color-danger)' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  alert('Session logged out.');
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
