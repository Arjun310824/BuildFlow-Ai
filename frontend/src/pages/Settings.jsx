import React, { useState } from 'react';

export const Settings = ({ onSaveFeedback }) => {
  const [activeSection, setActiveSection] = useState('profile');

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    role: 'Project Manager',
    email: 'alex.morgan@buildflow.ai',
    phone: '+1 (555) 019-2834',
    department: 'Commercial & High-Rise Operations',
  });

  // Company State
  const [company, setCompany] = useState({
    name: 'BuildFlow Construction Group Inc.',
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
      onSaveFeedback('Settings updated successfully.');
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'company', label: 'Company' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Settings</h1>
          <p>Manage project manager profile, enterprise organizational metadata, notification webhooks, and security.</p>
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
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Role</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
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
                Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Company Section */}
        {activeSection === 'company' && (
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group full-width">
                <label className="form-label">Company Legal Entity</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">General Contractor License #</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.licenseNumber}
                  onChange={(e) => setCompany({ ...company, licenseNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tax ID / EIN</label>
                <input
                  type="text"
                  className="form-control"
                  value={company.taxId}
                  onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Headquarters Address</label>
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
                Update Company Details
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
                    Email Notifications for Critical Delays
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
                    SMS Urgent Alerts
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Direct SMS message for site safety hazards and material stockouts
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
                    Daily Operations Digest
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Consolidated 07:00 AM summary of daily logs and weather forecasts
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
                Save Notification Preferences
              </button>
            </div>
          </form>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Two-Factor Authentication (2FA)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Require hardware key or authenticator app token on login
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${twoFactor ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTwoFactor((prev) => !prev)}
                >
                  {twoFactor ? 'Enabled (Active)' : 'Disabled'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" placeholder="••••••••••••" className="form-control" />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" placeholder="Minimum 12 characters" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" placeholder="Re-type new password" className="form-control" />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Update Security Credentials
              </button>
            </div>
          </form>
        )}

        {/* Preferences Section */}
        {activeSection === 'preferences' && (
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Date Format</label>
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
                <label className="form-label">Fiscal Currency</label>
                <select
                  className="form-control"
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                >
                  <option value="USD ($)">USD ($) - United States Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Engineering Unit System</label>
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
                <label className="form-label">Interface Theme</label>
                <select
                  className="form-control"
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                >
                  <option value="Light Clean SaaS">B2B SaaS Professional (Neutral Light)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
