import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const OPERATIONAL_ROLES = [
  'Project Manager',
  'Site Engineer',
  'Construction Manager',
  'Project Coordinator',
  'Site Supervisor',
  'Civil Engineer',
  'Structural Engineer',
  'Architect',
  'Quantity Surveyor',
  'Planning Engineer',
  'Safety Officer',
  'Procurement Manager',
  'Contracts Manager',
  'Operations Manager',
  'Other',
];

const PROFILE_STORAGE_KEY = 'buildops_user_profile';

export const Settings = ({ onSaveFeedback }) => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  // Profile State initialized from localStorage / AuthContext
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            name: parsed.name || user?.name || 'Alex Morgan',
            role: parsed.role || user?.role || 'Project Manager',
            email: parsed.email || user?.email || 'alex.morgan@buildops.ai',
            phone: parsed.phone || '+91 98250 12345',
            department: parsed.department || 'Commercial & High-Rise Operations',
            customRole: parsed.customRole || '',
          };
        }
      }
    } catch (e) {}
    return {
      name: user?.name || 'Alex Morgan',
      role: user?.role || 'Project Manager',
      email: user?.email || 'alex.morgan@buildops.ai',
      phone: '+91 98250 12345',
      department: 'Commercial & High-Rise Operations',
      customRole: '',
    };
  });

  const isInitialPredefined = OPERATIONAL_ROLES.filter((r) => r !== 'Other').includes(profile.role);
  const [selectedRole, setSelectedRole] = useState(isInitialPredefined ? profile.role : 'Other');
  const [customRole, setCustomRole] = useState(isInitialPredefined ? '' : (profile.customRole || profile.role || ''));
  const [roleError, setRoleError] = useState('');

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

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    // Strip any leading +91 or non-digits, extract up to 10 digits
    const digits = raw.replace(/^\+?91\s*/, '').replace(/\D/g, '').slice(0, 10);
    let formatted = '+91';
    if (digits.length > 0) {
      if (digits.length <= 5) {
        formatted += ' ' + digits;
      } else {
        formatted += ` ${digits.slice(0, 5)} ${digits.slice(5)}`;
      }
    } else {
      formatted += ' ';
    }
    setProfile((prev) => ({ ...prev, phone: formatted }));
  };

  const handlePhoneKeyDown = (e) => {
    // If backspacing while at or before position 4 ("+91 "), prevent deleting "+91 "
    if (e.key === 'Backspace' && e.target.selectionStart <= 4 && e.target.selectionEnd <= 4) {
      e.preventDefault();
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    setRoleError('');
    if (newRole !== 'Other') {
      setProfile((prev) => ({ ...prev, role: newRole }));
    } else {
      setProfile((prev) => ({ ...prev, role: customRole.trim() || 'Other' }));
    }
  };

  const handleCustomRoleChange = (e) => {
    const val = e.target.value;
    setCustomRole(val);
    if (roleError && val.trim()) {
      setRoleError('');
    }
    setProfile((prev) => ({ ...prev, role: val.trim() || 'Other' }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();

    // 1. Role validation
    let finalRole = selectedRole;
    if (selectedRole === 'Other') {
      if (!customRole || !customRole.trim()) {
        setRoleError('Please specify your operational role.');
        return;
      }
      finalRole = customRole.trim();
    } else if (!selectedRole || !selectedRole.trim()) {
      setRoleError('Please select your operational role.');
      return;
    }

    setRoleError('');

    // 2. Phone validation (+91 format)
    const digits = profile.phone.replace(/^\+91\s*/, '').replace(/\D/g, '');
    if (digits.length < 10) {
      if (onSaveFeedback) {
        onSaveFeedback('Please enter a valid 10-digit phone number starting with compulsory +91');
      }
      return;
    }

    // 3. Update profile state
    const updatedProfile = {
      ...profile,
      role: finalRole,
      customRole: selectedRole === 'Other' ? finalRole : '',
    };
    setProfile(updatedProfile);

    // 4. Persist to localStorage
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (err) {
      console.warn('Failed to save profile to localStorage:', err);
    }

    // 5. Update AuthContext & auth localStorage
    if (updateUser) {
      updateUser({
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: finalRole,
      });
    }

    // 6. User feedback toast
    if (onSaveFeedback) {
      onSaveFeedback(t('settings.saveProfile') + ' - ' + t('common.success'));
    }
  };

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

  const displayedRole =
    selectedRole === 'Other'
      ? (customRole.trim() || 'Other')
      : (selectedRole || profile.role);

  const userAvatar = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'
    : 'AM';

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
          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div
                className="user-avatar-circle"
                style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}
              >
                {userAvatar}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {profile.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  {displayedRole} • {profile.department}
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
                <label htmlFor="operationalRoleSelect" className="form-label">{t('settings.profileRole')}</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="operationalRoleSelect"
                    className="form-control"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    style={{
                      width: '100%',
                      height: '38px',
                      lineHeight: '20px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      paddingRight: '36px',
                      cursor: 'pointer',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px 16px',
                    }}
                  >
                    {OPERATIONAL_ROLES.map((roleOpt) => (
                      <option key={roleOpt} value={roleOpt}>
                        {roleOpt}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole === 'Other' && (
                  <div style={{ marginTop: '10px' }}>
                    <label
                      htmlFor="specifyRoleInput"
                      className="form-label"
                      style={{ fontSize: '0.80rem', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}
                    >
                      Specify Role <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="specifyRoleInput"
                      type="text"
                      className={`form-control ${roleError ? 'input-error' : ''}`}
                      placeholder="Enter your operational role"
                      value={customRole}
                      onChange={handleCustomRoleChange}
                      style={{
                        width: '100%',
                        height: '38px',
                      }}
                      autoFocus
                    />
                    {roleError && (
                      <div className="error-message">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{roleError}</span>
                      </div>
                    )}
                  </div>
                )}
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{t('settings.profilePhone')}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary, #1677D2)' }}>
                    🇮🇳 Compulsory +91
                  </span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="tel"
                    className="form-control"
                    value={profile.phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="+91 98250 12345"
                    style={{ fontWeight: 500, letterSpacing: '0.5px' }}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Standard Indian mobile format starting with mandatory +91 country code.
                </span>
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
