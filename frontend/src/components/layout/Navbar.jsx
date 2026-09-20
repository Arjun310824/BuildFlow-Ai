import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconSearch,
  IconMenu,
  IconAlerts,
  IconPlus,
  IconChevronDown,
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
            placeholder={t('navbar.searchPlaceholder')}
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        {/* Global Language Quick Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowLangMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
            }}
            title={t('settings.languageLabel')}
          >
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.label}</span>
            <IconChevronDown size={13} />
          </button>

          {showLangMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '160px',
                background: '#ffffff',
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
                    fontSize: '0.84rem',
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
                    <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>
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
            <IconPlus size={16} />
            <span>{t('navbar.quickAdd')}</span>
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
                + {t('projects.addProject')}
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate('add-task');
                }}
              >
                + {t('tasks.addTask')}
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                onClick={() => {
                  setShowQuickAdd(false);
                  onNavigate('site-updates');
                }}
              >
                + {t('navbar.siteUpdate')}
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
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('navbar.recentAlerts')}</span>
                <button
                  style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                >
                  {t('common.viewAll')}
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
                {t('navbar.profileSettings')}
              </button>
              <button
                className="nav-btn"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('dashboard');
                }}
              >
                {t('navbar.projectHub')}
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
                {t('navbar.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
