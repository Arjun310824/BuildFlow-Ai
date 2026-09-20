import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Settings = ({ onSaveFeedback }) => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('profile');

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    role: 'Project Manager',
    email: 'alex.morgan@buildops.ai',
    phone: '+1 (555) 019-2834',
    department: 'Commercial & High-Rise Operations',
  });

  // Company State
  const [company, setCompany] = useState({
    name: 'BuildOps Construction Group Inc.',
    licenseNumber: 'GC-99482-A',
    taxId: 'XX-XXX4920',
    headquarters: '100 Enterprise Way, Suite 400, Chicago, IL',
  });

  // Notifications Toggle State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsCritical: true,
    dailyDigest: true,
    aiRiskAlerts: true,
  });

  // Security State
  const [twoFactor, setTwoFactor] = useState(true);

  // Preferences State
  const [preferences, setPreferences] = useState({
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD ($)',
    unitSystem: 'Metric (m, m³, Tons)',
    theme: 'Light Clean SaaS',
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (onSaveFeedback) {
      onSaveFeedback(t('settings.savePreferences') + ' - ' + t('common.success'));
    }
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    if (onSaveFeedback) {
      const msg =
        langCode === 'hi'
          ? 'भाषा बदलकर हिन्दी कर दी गई है।'
          : langCode === 'gu'
          ? 'ભાષા બદલીને ગુજરાતી કરવામાં આવી છે.'
          : 'Language changed to English.';
      onSaveFeedback(msg);
    }
  };

  const sections = [
    { id: 'profile', label: t('settings.tabProfile') },
    { id: 'company', label: t('settings.tabCompany') },
    { id: 'notifications', label: t('settings.tabNotifications') },
    { id: 'security', label: t('settings.tabSecurity') },
    { id: 'preferences', label: t('settings.tabPreferences') },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Global Language Selector Banner */}
      <div
        className="form-card"
        style={{
          maxWidth: '820px',
          marginBottom: '24px',
          padding: '20px 24px',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--color-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              <span style={{ fontSize: '1.2rem' }}>🌐</span>
              <span>{t('settings.languageSection')}</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('settings.languageDesc')}
            </div>
          </div>

          <div style={{ minWidth: '220px' }}>
            <label
              htmlFor="settings-language-select"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
            >
              {t('settings.languageLabel')}
            </label>
            <select
              id="settings-language-select"
              className="form-control"
              value={i18n.language || 'en'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              <option value="en" style={{ background: '#ffffff', color: '#0f172a' }}>🇬🇧 English</option>
              <option value="hi" style={{ background: '#ffffff', color: '#0f172a' }}>🇮🇳 हिन्दी (Hindi)</option>
              <option value="gu" style={{ background: '#ffffff', color: '#0f172a' }}>🇮🇳 ગુજરાતી (Gujarati)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections Tab Bar */}
      <div className="tab-pills-bar">
        {sections.map((sec) => (
          <button
            key={sec.id}
            className={`tab-pill-btn ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </div>

      <div className="form-card" style={{ maxWidth: '820px' }}>
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div
                className="user-avatar-circle"
                style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}
              >
                AM
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  {profile.role} • {profile.department}
                </p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('settings.profileName')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.profileRole')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.profileEmail')}</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.profilePhone')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('settings.saveProfile')}
              </button>
            </div>
          </form>
        )}

        {/* Company Section */}
        {activeSection === 'company' && (
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group full-width">
                <label className="form-label">{t('settings.companyName')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.licenseNumber')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.licenseNumber}
                  onChange={(e) => setCompany({ ...company, licenseNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.taxId')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.taxId}
                  onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">{t('settings.headquarters')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.headquarters}
                  onChange={(e) => setCompany({ ...company, headquarters: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('settings.saveCompany')}
              </button>
            </div>
          </form>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {t('settings.emailAlerts')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Immediate alert dispatch when schedule variance exceeds 10%
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {t('settings.smsAlerts')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    High-priority dispatch to field superintendents
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.smsCritical}
                  onChange={(e) => setNotifications({ ...notifications, smsCritical: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {t('settings.dailyDigest')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Delivered daily at 07:00 AM local site time
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.dailyDigest}
                  onChange={(e) => setNotifications({ ...notifications, dailyDigest: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {t('settings.twoFactor')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Requires authenticator app token or hardware security key
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Preferences Section */}
        {activeSection === 'preferences' && (
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group full-width">
                <label className="form-label">{t('settings.languageLabel')}</label>
                <select
                  className="form-control"
                  value={i18n.language || 'en'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="en" style={{ background: '#ffffff', color: '#0f172a' }}>🇬🇧 English</option>
                  <option value="hi" style={{ background: '#ffffff', color: '#0f172a' }}>🇮🇳 हिन्दी (Hindi)</option>
                  <option value="gu" style={{ background: '#ffffff', color: '#0f172a' }}>🇮🇳 ગુજરાતી (Gujarati)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.dateFormat')}</label>
                <select
                  className="form-control"
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (20/09/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (09/20/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-20)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.currency')}</label>
                <select
                  className="form-control"
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                >
                  <option value="USD ($)">USD ($) - United States Dollar</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.unitSystem')}</label>
                <select
                  className="form-control"
                  value={preferences.unitSystem}
                  onChange={(e) => setPreferences({ ...preferences, unitSystem: e.target.value })}
                >
                  <option value="Metric">Metric (m, m³, Tons, Celsius)</option>
                  <option value="Imperial">Imperial (ft, yd³, lbs, Fahrenheit)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('settings.interfaceTheme')}</label>
                <select
                  className="form-control"
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                >
                  <option value="Light Clean SaaS">B2B SaaS Professional (Dark Cyan Glow)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {t('settings.savePreferences')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
