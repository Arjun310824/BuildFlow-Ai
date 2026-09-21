import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BuildFlowLogo } from '../components/common/BuildFlowLogo';
import { IconEye } from '../components/common/Icons';

export const Login = ({ onLoginSuccess, onRegisterSuccess, initialMode = 'login' }) => {
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex.morgan@buildops.ai');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState('Project Manager');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  const currentLang = i18n.language || 'en';
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };

  const validate = () => {
    const errs = {};
    if (mode === 'register') {
      if (!name.trim()) {
        errs.name = 'Full name is required.';
      }
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      if (mode === 'register') {
        if (onRegisterSuccess) {
          await onRegisterSuccess({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
          });
        }
      } else {
        if (onLoginSuccess) {
          await onLoginSuccess({
            email: email.trim(),
            password,
            rememberMe,
          });
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setErrors({ form: err.message || 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      if (onLoginSuccess) {
        await onLoginSuccess({
          email: 'alex.morgan@buildops.ai',
          password: 'Password123!',
        });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Demo login failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-canvas-wrapper">
      <style>{`
        .login-canvas-wrapper {
          min-height: 100vh;
          width: 100vw;
          background-color: #F5F8FC;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(22, 119, 210, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(255, 106, 0, 0.03) 0%, transparent 40%),
            linear-gradient(135deg, #F8FAFC 0%, #F5F8FC 50%, #EDF3FA 100%);
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0F172A;
        }

        /* Ambient Construction Photo Layer on Right */
        .login-bg-photo {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 52%;
          background-image: url('/images/login_construction_bg.jpg');
          background-size: cover;
          background-position: center right;
          opacity: 0.95;
          pointer-events: none;
          z-index: 1;
          mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 18%, rgba(0,0,0,0.95) 45%, rgba(0,0,0,1) 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 18%, rgba(0,0,0,0.95) 45%, rgba(0,0,0,1) 100%);
        }

        /* Top Bar Header */
        .login-topbar {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 44px;
        }

        .login-brand-group {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .login-brand-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: #0B1220;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .login-brand-tagline {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        /* Segmented Language Selector in Top Right */
        .login-lang-pill-container {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
        }

        .login-lang-btn {
          border: none;
          background: transparent;
          color: #475569;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }

        .login-lang-btn:hover {
          color: #0B1220;
          background: rgba(226, 232, 240, 0.5);
        }

        .login-lang-btn.active {
          background: #0B192C;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(11, 25, 44, 0.25);
        }

        /* Main Tri-Panel Grid */
        .login-main-grid {
          position: relative;
          z-index: 10;
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 430px 1.1fr;
          gap: 36px;
          align-items: center;
          padding: 10px 44px 36px;
          max-width: 1540px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        /* Left Brand Marketing Panel */
        .login-left-panel {
          max-width: 440px;
          animation: fadeInLeft 0.6s ease-out;
        }

        .login-welcome-tag {
          font-size: 0.82rem;
          font-weight: 800;
          color: #FF6A00;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .login-hero-heading {
          font-size: 2.85rem;
          font-weight: 800;
          color: #0B1220;
          letter-spacing: -0.035em;
          line-height: 1.12;
          margin: 0 0 16px 0;
        }

        .login-hero-description {
          font-size: 1.15rem;
          color: #475569;
          line-height: 1.48;
          font-weight: 500;
          margin: 0 0 32px 0;
        }

        .login-capability-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-capability-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .login-capability-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .login-capability-item:hover .login-capability-icon {
          transform: scale(1.06);
        }

        .login-capability-title {
          font-weight: 700;
          font-size: 0.96rem;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .login-capability-desc {
          font-size: 0.84rem;
          color: #64748B;
        }

        .login-bottom-strip {
          margin-top: 36px;
        }

        .login-bottom-bar {
          width: 52px;
          height: 4px;
          background: #FF6A00;
          border-radius: 2px;
          margin-bottom: 12px;
        }

        .login-bottom-statement {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94A3B8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Center White Login Card */
        .login-card-container {
          animation: fadeInUp 0.65s ease-out;
          width: 100%;
        }

        .login-card-box {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 38px 34px;
          box-shadow: 
            0 24px 50px -12px rgba(15, 23, 42, 0.09),
            0 0 1px 1px rgba(15, 23, 42, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-sizing: border-box;
          position: relative;
        }

        .login-card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .login-card-logo-wrap {
          display: inline-flex;
          justify-content: center;
          margin-bottom: 12px;
          transition: transform 0.25s ease;
        }

        .login-card-logo-wrap:hover {
          transform: translateY(-2px);
        }

        .login-card-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: #0B4F9C;
          letter-spacing: -0.025em;
          margin: 0 0 5px 0;
        }

        .login-card-subtitle {
          font-size: 0.83rem;
          color: #64748B;
          margin: 0;
          font-weight: 500;
        }

        /* Form Controls */
        .login-field-group {
          margin-bottom: 16px;
        }

        .login-field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .login-field-label {
          font-size: 0.83rem;
          font-weight: 600;
          color: #1E293B;
        }

        .login-forgot-link {
          font-size: 0.78rem;
          font-weight: 600;
          color: #FF6A00;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .login-forgot-link:hover {
          text-decoration: underline;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #64748B;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-input-box {
          width: 100%;
          height: 44px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 0 14px 0 42px;
          font-size: 0.9rem;
          color: #0F172A;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .login-input-box::placeholder {
          color: #94A3B8;
        }

        .login-input-box:focus {
          border-color: #1677D2;
          box-shadow: 0 0 0 3px rgba(22, 119, 210, 0.16);
        }

        .login-input-box.error {
          border-color: #EF4444;
          background-color: #FFF8F8;
        }

        .login-eye-toggle {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .login-eye-toggle:hover {
          color: #0F172A;
        }

        .login-error-text {
          display: block;
          font-size: 0.74rem;
          color: #EF4444;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Remember Checkbox */
        .login-remember-row {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          font-size: 0.82rem;
          color: #475569;
          font-weight: 500;
        }

        .login-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .login-checkbox-input {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          accent-color: #FF6A00;
          cursor: pointer;
        }

        /* Orange Primary Button */
        .login-btn-primary {
          width: 100%;
          height: 46px;
          background: linear-gradient(180deg, #FF720B 0%, #FF6A00 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 0.94rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(255, 106, 0, 0.35);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-btn-primary:hover {
          background: #E85E00;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 106, 0, 0.45);
        }

        .login-btn-primary:active {
          transform: translateY(0);
        }

        .login-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        /* Divider */
        .login-divider-row {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: #94A3B8;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .login-divider-text {
          padding: 0 12px;
        }

        /* Demo Button */
        .login-btn-demo {
          width: 100%;
          height: 44px;
          background: #FFF7ED;
          border: 1px solid #FFEDD5;
          border-radius: 10px;
          color: #EA580C;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .login-btn-demo:hover {
          background: #FFEDD5;
          border-color: #FDBA74;
          color: #C2410C;
          transform: translateY(-1px);
        }

        .login-btn-demo:active {
          transform: translateY(0);
        }

        /* Enterprise Guard Badge at Bottom of Card */
        .login-card-security {
          margin-top: 22px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
        }

        /* Right Side Construction Visual & Floating Intelligence Panels */
        .login-right-visual-panel {
          position: relative;
          height: 520px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
          padding-right: 20px;
          animation: fadeInRight 0.7s ease-out;
        }

        /* Floating HUD Cards */
        .login-hud-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
          position: absolute;
          z-index: 5;
          color: #FFFFFF;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .login-hud-card:hover {
          transform: translateY(-3px) scale(1.02);
          border-color: rgba(0, 217, 255, 0.4);
        }

        /* Card 1: Project Progress */
        .hud-card-progress {
          top: 30px;
          right: 35px;
          padding: 16px 20px;
          width: 175px;
          text-align: center;
          animation: floatPulseA 5s ease-in-out infinite alternate;
        }

        /* Card 2: AI Insights */
        .hud-card-insights {
          top: 215px;
          right: 185px;
          padding: 14px 18px;
          width: 210px;
          animation: floatPulseB 6s ease-in-out infinite alternate;
        }

        /* Card 3: Materials at Risk */
        .hud-card-materials {
          bottom: 55px;
          right: 45px;
          padding: 14px 18px;
          width: 195px;
          animation: floatPulseA 5.5s ease-in-out infinite alternate;
        }

        /* Keyframes */
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatPulseA {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-7px); }
        }

        @keyframes floatPulseB {
          0% { transform: translateY(0px); }
          100% { transform: translateY(6px); }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1240px) {
          .login-main-grid {
            grid-template-columns: 1fr 400px;
          }
          .login-right-visual-panel {
            display: none;
          }
          .login-bg-photo {
            width: 40%;
            opacity: 0.4;
          }
        }

        @media (max-width: 880px) {
          .login-topbar {
            padding: 18px 20px;
          }
          .login-main-grid {
            grid-template-columns: 1fr;
            padding: 10px 20px 30px;
            gap: 28px;
          }
          .login-left-panel {
            max-width: 100%;
            text-align: center;
          }
          .login-hero-heading {
            font-size: 2.2rem;
          }
          .login-capability-list {
            display: none;
          }
          .login-bottom-strip {
            display: none;
          }
          .login-card-container {
            max-width: 440px;
            margin: 0 auto;
          }
          .login-bg-photo {
            display: none;
          }
        }
      `}</style>

      {/* Atmospheric Background Photo on Right */}
      <div className="login-bg-photo" />

      {/* Top Header Bar */}
      <header className="login-topbar">
        {/* Top-Left Brand Logo & Tagline */}
        <div className="login-brand-group">
          <BuildFlowLogo size={46} />
          <div>
            <div className="login-brand-title">
              BuildOps <span style={{ color: '#1677D2' }}>A</span><span style={{ color: '#FF6A00' }}>I</span>
            </div>
            <div className="login-brand-tagline">
              AI-POWERED CONSTRUCTION OPERATIONS
            </div>
          </div>
        </div>

        {/* Top-Right Language Segmented Control */}
        <div className="login-lang-pill-container" role="radiogroup" aria-label="Language selection">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLanguageChange(l.code)}
              className={`login-lang-btn ${currentLang === l.code ? 'active' : ''}`}
              aria-pressed={currentLang === l.code}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Tri-Panel Grid Composition */}
      <main className="login-main-grid">
        {/* LEFT: Brand Story & 4 Product Capabilities */}
        <section className="login-left-panel">
          <div className="login-welcome-tag">WELCOME TO</div>
          <h1 className="login-hero-heading">
            BuildOps <span style={{ color: '#1677D2' }}>AI</span>
          </h1>
          <p className="login-hero-description">
            Your Construction Intelligence<br />
            Hub for Smarter, Faster,<br />
            More Connected Projects.
          </p>

          {/* 4 Feature Items with Modern Soft Badges */}
          <div className="login-capability-list">
            {/* 1. Project Intelligence */}
            <div className="login-capability-item">
              <div
                className="login-capability-icon"
                style={{
                  background: '#EBF5FF',
                  color: '#1677D2',
                  boxShadow: '0 2px 8px rgba(22, 119, 210, 0.12)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div>
                <div className="login-capability-title">Project Intelligence</div>
                <div className="login-capability-desc">Real-time project insights</div>
              </div>
            </div>

            {/* 2. AI-Powered Analysis */}
            <div className="login-capability-item">
              <div
                className="login-capability-icon"
                style={{
                  background: '#FFF4ED',
                  color: '#FF6A00',
                  boxShadow: '0 2px 8px rgba(255, 106, 0, 0.12)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.39 8.26L21 9.27L16.2 13.97L17.34 20.73L12 17.27L6.66 20.73L7.8 13.97L3 9.27L9.61 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <div className="login-capability-title">AI-Powered Analysis</div>
                <div className="login-capability-desc">Predict risks, prevent delays</div>
              </div>
            </div>

            {/* 3. End-to-End Management */}
            <div className="login-capability-item">
              <div
                className="login-capability-icon"
                style={{
                  background: '#E6FAF5',
                  color: '#00A884',
                  boxShadow: '0 2px 8px rgba(0, 168, 132, 0.12)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div>
                <div className="login-capability-title">End-to-End Management</div>
                <div className="login-capability-desc">Projects, tasks, materials & more</div>
              </div>
            </div>

            {/* 4. Built for the Future */}
            <div className="login-capability-item">
              <div
                className="login-capability-icon"
                style={{
                  background: '#F3E8FF',
                  color: '#8B5CF6',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.12)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="4" />
                  <circle cx="9" cy="9" r="2" fill="currentColor" />
                  <circle cx="15" cy="15" r="2" fill="currentColor" />
                  <path d="M9 11v2a2 2 0 0 0 2 2h2" />
                </svg>
              </div>
              <div>
                <div className="login-capability-title">Built for the Future</div>
                <div className="login-capability-desc">Smarter construction, powered by AI</div>
              </div>
            </div>
          </div>

          {/* Bottom Nav Statement */}
          <div className="login-bottom-strip">
            <div className="login-bottom-bar" />
            <div className="login-bottom-statement">
              PEOPLE &nbsp;|&nbsp; PROJECTS &nbsp;|&nbsp; PROGRESS &nbsp;|&nbsp; A SMARTER TOMORROW
            </div>
          </div>
        </section>

        {/* CENTER: White Enterprise Login Card */}
        <section className="login-card-container">
          <div className="login-card-box">
            {/* Card Brand Header */}
            <div className="login-card-header">
              <div className="login-card-logo-wrap">
                <BuildFlowLogo size={52} />
              </div>
              <h2 className="login-card-title">
                BuildOps <span style={{ color: '#FF6A00' }}>AI</span>
              </h2>
              <p className="login-card-subtitle">
                AI-Powered Construction Operations
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F1F5F9',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrors({});
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  background: mode === 'login' ? '#FFFFFF' : 'transparent',
                  color: mode === 'login' ? '#0B4F9C' : '#64748B',
                  boxShadow: mode === 'login' ? '0 2px 6px rgba(11, 79, 156, 0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrors({});
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  background: mode === 'register' ? '#FFFFFF' : 'transparent',
                  color: mode === 'register' ? '#FF6A00' : '#64748B',
                  boxShadow: mode === 'register' ? '0 2px 6px rgba(255, 106, 0, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {errors.form && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  color: '#B91C1C',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span>{errors.form}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name (Only in Register Mode) */}
              {mode === 'register' && (
                <div className="login-field-group">
                  <div className="login-field-label-row">
                    <label htmlFor="registerName" className="login-field-label">
                      Full Name
                    </label>
                  </div>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="registerName"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. Alex Morgan"
                      className={`login-input-box ${errors.name ? 'error' : ''}`}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <span className="login-error-text">{errors.name}</span>
                  )}
                </div>
              )}

              {/* Operational Role (Only in Register Mode) */}
              {mode === 'register' && (
                <div className="login-field-group">
                  <div className="login-field-label-row">
                    <label htmlFor="registerRole" className="login-field-label">
                      Operational Role
                    </label>
                  </div>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                    <select
                      id="registerRole"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="login-input-box"
                      style={{ cursor: 'pointer', appearance: 'auto' }}
                      disabled={isLoading}
                    >
                      {OPERATIONAL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Work Email */}
              <div className="login-field-group">
                <div className="login-field-label-row">
                  <label htmlFor="loginEmail" className="login-field-label">
                    Work Email
                  </label>
                </div>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="loginEmail"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="alex.morgan@buildops.ai"
                    className={`login-input-box ${errors.email ? 'error' : ''}`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="login-error-text">{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="login-field-group">
                <div className="login-field-label-row">
                  <label htmlFor="loginPassword" className="login-field-label">
                    Password {mode === 'register' && <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 400 }}>(min. 6 chars)</span>}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="login-forgot-link"
                      onClick={() => setShowForgotModal(true)}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Enter password"
                    className={`login-input-box ${errors.password ? 'error' : ''}`}
                    style={{ paddingRight: '42px' }}
                    disabled={isLoading}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="login-eye-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <IconEye size={17} />
                  </button>
                </div>
                {errors.password && (
                  <span className="login-error-text">{errors.password}</span>
                )}
              </div>

              {/* Remember Me (Login Mode Only) */}
              {mode === 'login' && (
                <div className="login-remember-row">
                  <label className="login-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="login-checkbox-input"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>
              )}

              {/* Submit Primary Button */}
              <button
                type="submit"
                className="login-btn-primary"
                disabled={isLoading}
                style={{ marginTop: mode === 'register' ? '8px' : '0' }}
              >
                <span>
                  {isLoading
                    ? mode === 'register'
                      ? 'Creating account...'
                      : 'Signing in...'
                    : mode === 'register'
                    ? 'Create BuildOps Account'
                    : 'Sign In to Workspace'}
                </span>
                <span>&rarr;</span>
              </button>

              {/* Switch Mode Prompt */}
              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.82rem', color: '#64748B' }}>
                {mode === 'login' ? (
                  <span>
                    New to BuildOps AI?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrors({});
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#FF6A00',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrors({});
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#1677D2',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </form>

            {/* Divider */}
            <div className="login-divider-row">
              <div className="login-divider-line" />
              <span className="login-divider-text">OR DEMO ACCESS</span>
              <div className="login-divider-line" />
            </div>

            {/* One-Click Demo Access Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="login-btn-demo"
              disabled={isLoading}
            >
              <span>⚡ One-Click Demo (Alex Morgan • Director)</span>
            </button>

            {/* Bottom Enterprise Protected Tag */}
            <div className="login-card-security">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>BuildOps AI Smart Construction Suite • Protected Enterprise System</span>
            </div>
          </div>
        </section>

        {/* RIGHT: Construction Site Visual & Floating Intelligence Panels */}
        <section className="login-right-visual-panel">
          {/* Floating Card 1: Project Progress 68% */}
          <div className="login-hud-card hud-card-progress">
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, marginBottom: '8px' }}>
              Project Progress
            </div>
            
            {/* Circular Donut Gauge */}
            <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto 8px' }}>
              <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="35"
                  cy="35"
                  r="28"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="5"
                />
                <circle
                  cx="35"
                  cy="35"
                  r="28"
                  fill="transparent"
                  stroke="#FF6A00"
                  strokeWidth="5"
                  strokeDasharray="175.9"
                  strokeDashoffset="56.2"
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                }}
              >
                68%
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 600, textAlign: 'center' }}>
              Structural Steel Phase
            </div>
          </div>

          {/* Floating Card 2: AI Telemetry Analysis */}
          <div className="login-hud-card hud-card-insights">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', lineHeight: '1.25' }}>
                2 potential<br />delays detected
              </div>
            </div>
          </div>

          {/* Floating Card 3: Materials at Risk */}
          <div className="login-hud-card hud-card-materials">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span>Materials</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Stock at Risk</span>
                <span style={{ color: '#F59E0B' }}>⚠️</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF4ED', color: '#FF6A00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                Reset Workspace Credentials
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
              For enterprise security, password resets are handled via your organization's BuildOps AI administrator or SSO directory. Please contact your site superintendent or IT helpdesk.
            </p>
            <button
              type="button"
              className="login-btn-primary"
              style={{ height: '40px', fontSize: '0.88rem' }}
              onClick={() => setShowForgotModal(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
