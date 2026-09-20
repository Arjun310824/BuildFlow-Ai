import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconSearch,
  IconMenu,
  IconAlerts,
  IconPlus,
  IconChevronDown,
} from '../common/Icons';

/**
 * Top Navbar: Professional Construction Intelligence Command Center Top Bar.
 * Global Search (⌘K), Project Context Switcher, ● AI ONLINE status, Notifications, User Profile.
 */
export const Navbar = ({
  pageTitle = 'Dashboard',
  pageSubtitle = '',
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  onNavigate,
  recentAlerts = [],
  currentUser = null,
  onSignOut,
  projects = [],
  selectedProjectId,
  onSelectProject,
}) => {
  const { t, i18n } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLang = i18n.language || 'en';

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  const activeLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  const handleLanguageSelect = (code) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  const userName = currentUser?.name || 'Alex Morgan';
  const userEmail = currentUser?.email || 'alex@buildflow.ai';
  const userAvatar = currentUser?.avatar || 'AM';

  const selectedProjectObj = projects.find(
    (p) => (p._id || p.id) === selectedProjectId
  ) || projects[0] || { name: 'All Sites Portfolio' };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="nav-icon-action-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          id="mobile-nav-btn"
          style={{ display: 'none' }}
        >
          <IconMenu />
        </button>

        <div className="page-title-crumb">
          <span className="page-title-main">{pageTitle}</span>
          {pageSubtitle && (
            <span className="page-title-badge">{pageSubtitle}</span>
          )}
        </div>

        {/* Current Project Context Selector Dropdown */}
        {projects.length > 0 && (
          <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              SITE:
            </span>
            <select
              className="filter-select"
              value={selectedProjectId || ''}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '4px 10px',
                height: '32px',
                maxWidth: '220px',
                background: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: '#FFFFFF',
              }}
              title="Switch Active Project Context"
            >
              {projects.map((p) => {
                const id = p._id || p.id;
                return (
                  <option key={id} value={id}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
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

        {/* AI Status Indicator */}
        <div className="ai-status-pill" title="Gemini AI Intelligence Engine is connected and monitoring live telemetry">
          <span className="ai-pulse-dot" />
          <span>● AI ONLINE</span>
        </div>

        {/* Global Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowLangMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              padding: '6px 10px',
            }}
            title="Switch Language"
          >
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.label}</span>
            <IconChevronDown size={12} />
          </button>

          {showLangMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '160px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`nav-btn ${currentLang === lang.code ? 'active' : ''}`}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontWeight: currentLang === lang.code ? 700 : 500,
                  }}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLang === lang.code && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent-cyan)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-quick-create"
            onClick={() => setShowQuickAdd((prev) => !prev)}
          >
            <IconPlus size={15} />
            <span>New</span>
            <IconChevronDown size={13} />
          </button>

          {showQuickAdd && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '180px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate && onNavigate('add-project');
                }}
              >
                + New Project
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate && onNavigate('add-task');
                }}
              >
                + Assign Task
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate && onNavigate('materials');
                }}
              >
                + Log Material
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate && onNavigate('site-updates');
                }}
              >
                + Daily Site Log
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Unread Dot */}
        <div style={{ position: 'relative' }}>
          <button
            className="nav-icon-action-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="View notifications"
          >
            <IconAlerts size={17} />
            {recentAlerts.length > 0 && <span className="nav-notification-dot" />}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '320px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '14px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>Action Items</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => { setShowNotifications(false); onNavigate('alerts'); }}>
                  View All &rarr;
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {recentAlerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      borderLeft: a.type === 'Critical' ? '3px solid #EF4444' : '3px solid #F59E0B',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate && onNavigate('alerts');
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#FFFFFF' }}>{a.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>{a.message}</div>
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
            aria-label="User account menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.74rem' }}>
              {userAvatar}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
              {userName}
            </span>
            <IconChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '210px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF' }}>{userName}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{userEmail}</div>
              </div>

              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 10px' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate && onNavigate('settings');
                }}
              >
                Settings & Preferences
              </button>

              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '8px 10px', color: '#F87171' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onSignOut) onSignOut();
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
