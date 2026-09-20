import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconSearch,
  IconMenu,
  IconAlerts,
  IconChevronDown,
} from '../common/Icons';

/**
 * Clean White Top Navbar for BuildOps AI
 * Matches reference visual design with minimal styling, search, AI online status,
 * language switcher, notification bell, and user profile avatar.
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
}) => {
  const { t, i18n } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
  const userEmail = currentUser?.email || 'alex@buildops.ai';
  const userAvatar = currentUser?.avatar || 'AM';

  return (
    <header className="clean-top-navbar">
      <style>{`
        .clean-top-navbar {
          height: 64px;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 30;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .clean-nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .clean-nav-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .clean-nav-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748B;
          background: #F1F5F9;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }

        .clean-nav-center {
          flex: 1;
          max-width: 440px;
          margin: 0 24px;
        }

        .clean-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.18s ease;
          width: 100%;
        }

        .clean-search-box:focus-within {
          background: #FFFFFF;
          border-color: #1677D2;
          box-shadow: 0 0 0 3px rgba(22, 119, 210, 0.1);
        }

        .clean-search-box input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.88rem;
          color: #0F172A;
        }

        .clean-search-box input::placeholder {
          color: #94A3B8;
        }

        .clean-search-shortcut {
          font-size: 0.68rem;
          color: #64748B;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .clean-nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .clean-ai-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #16A34A;
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .clean-ai-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16A34A;
        }

        .clean-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          position: relative;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clean-action-btn:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .clean-notif-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
        }

        .clean-avatar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
        }

        .clean-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #DBEAFE;
          color: #1677D2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
        }

        .clean-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          padding: 8px;
          z-index: 100;
        }

        .clean-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.84rem;
          color: #0F172A;
          border-radius: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }

        .clean-dropdown-item:hover {
          background: #F8FAFC;
        }
      `}</style>

      {/* Left: Title + Badge */}
      <div className="clean-nav-left">
        <button
          className="clean-action-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          style={{ display: 'none' }}
        >
          <IconMenu />
        </button>

        <span className="clean-nav-title">{pageTitle || 'Dashboard'}</span>
        <span className="clean-nav-badge">Smart Construction Suite</span>
      </div>

      {/* Center: Search Box */}
      <div className="clean-nav-center">
        <div className="clean-search-box">
          <span style={{ color: '#94A3B8', display: 'flex' }}>
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder="Search projects, tasks, materials..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          <span className="clean-search-shortcut">Ctrl K</span>
        </div>
      </div>

      {/* Right: AI Online, Language, Notification Bell, User Avatar */}
      <div className="clean-nav-right">
        {/* AI Status */}
        <div className="clean-ai-status" title="Gemini AI Engine Online">
          <span className="clean-ai-dot" />
          <span>● AI Online</span>
        </div>

        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="clean-action-btn"
            style={{ width: 'auto', padding: '0 10px', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setShowLangMenu((prev) => !prev)}
            title="Switch Language"
          >
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.label}</span>
            <IconChevronDown size={12} />
          </button>

          {showLangMenu && (
            <div className="clean-dropdown-menu" style={{ width: '150px' }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className="clean-dropdown-item"
                  style={{ fontWeight: currentLang === lang.code ? 700 : 500 }}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLang === lang.code && (
                    <span style={{ marginLeft: 'auto', color: '#1677D2' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="clean-action-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="View notifications"
          >
            <IconAlerts size={17} />
            <span className="clean-notif-badge">4</span>
          </button>

          {showNotifications && (
            <div className="clean-dropdown-menu" style={{ width: '300px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderBottom: '1px solid #E2E8F0',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>Notifications</span>
                <span
                  style={{ fontSize: '0.74rem', color: '#1677D2', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate && onNavigate('alerts');
                  }}
                >
                  View All &rarr;
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FEF2F2',
                    borderLeft: '3px solid #EF4444',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate && onNavigate('alerts');
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0F172A' }}>
                    Critical trade delay detected
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    Electrical Substation Conduit is 6 days late
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FFFBEB',
                    borderLeft: '3px solid #F59E0B',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate && onNavigate('materials');
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0F172A' }}>
                    Low stock threshold alert
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    Portland Cement stock below minimum required
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="clean-avatar-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="User account menu"
          >
            <div className="clean-avatar-circle">{userAvatar}</div>
            <IconChevronDown size={13} color="#64748B" />
          </button>

          {showProfileMenu && (
            <div className="clean-dropdown-menu">
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', marginBottom: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>{userName}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{userEmail}</div>
              </div>

              <button
                type="button"
                className="clean-dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate && onNavigate('settings');
                }}
              >
                Settings & Preferences
              </button>

              <button
                type="button"
                className="clean-dropdown-item"
                style={{ color: '#EF4444' }}
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
