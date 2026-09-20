import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  analyzeProjectApi,
  chatWithProjectApi,
  getAiProjectsApi,
} from '../services/api';
import {
  IconInsights,
  IconSparkles,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMaterials,
  IconTasks,
  IconSearch,
} from '../components/common/Icons';

export const AIInsights = ({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onTriggerAction,
}) => {
  const { t } = useTranslation();

  // Project selection state
  const [dbProjects, setDbProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [projectMeta, setProjectMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState(null);

  // Project-Aware Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Suggested prompt pills
  const suggestedPrompts = [
    'Which tasks are delayed?',
    'What materials are low?',
    'Why is this project at risk?',
    'What should I prioritize?',
    'Give me a project summary.',
  ];

  // 1. Load real projects from MongoDB on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const res = await getAiProjectsApi();
        if (res.success && res.data?.length > 0 && isMounted) {
          setDbProjects(res.data);
          // Set initial project ID to the first MongoDB project or matching selectedId
          const initialId = res.data.find((p) => p._id === selectedProjectId)?._id || res.data[0]._id;
          setActiveProjectId(initialId);
        } else if (projects.length > 0 && isMounted) {
          // Fallback to passed projects if DB route returns empty
          setActiveProjectId(projects[0].id || projects[0]._id);
        }
      } catch (err) {
        console.warn('Failed to load DB projects list for AI Insights, using local fallback:', err);
        if (projects.length > 0 && isMounted) {
          setActiveProjectId(projects[0].id || projects[0]._id);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  // 2. Trigger analysis whenever activeProjectId is set or changed
  const runAnalysis = async (projId) => {
    const idToUse = projId || activeProjectId;
    if (!idToUse) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await analyzeProjectApi(idToUse);
      if (response.success && response.data) {
        setAnalysisData(response.data);
        setProjectMeta(response.projectMeta);
        setLastAnalyzedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Add welcome message in chat grounded in this project
        setChatMessages([
          {
            sender: 'ai',
            text: `Hello! I have loaded and analyzed the real-time database records for "${response.projectMeta?.name || 'this project'}". Ask me anything about tasks, materials, critical path delays, or risk factors.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (onTriggerAction) {
          onTriggerAction(`Live Gemini Intelligence Analysis completed for ${response.projectMeta?.name}.`);
        }
      } else {
        throw new Error(response.error || 'Invalid response received from AI engine.');
      }
    } catch (err) {
      console.error('Error running AI project analysis:', err);
      setErrorMessage(err.message || 'Failed to connect to the Gemini AI Analysis Engine. Please verify backend service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      runAnalysis(activeProjectId);
    }
  }, [activeProjectId]);

  // Handle Project Dropdown Switch
  const handleProjectChange = (newId) => {
    setActiveProjectId(newId);
    if (onSelectProject) onSelectProject(newId);
  };

  // 3. Handle Project-Aware Chat
  const handleSendMessage = async (customMessage) => {
    const messageToSend = typeof customMessage === 'string' ? customMessage : chatInput;
    if (!messageToSend || !messageToSend.trim() || !activeProjectId || isChatLoading) return;

    const userMsg = {
      sender: 'user',
      text: messageToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const chatRes = await chatWithProjectApi(activeProjectId, userMsg.text);
      if (chatRes.success && chatRes.answer) {
        const aiMsg = {
          sender: 'ai',
          text: chatRes.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(chatRes.error || 'Failed to get answer from Gemini.');
      }
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: `⚠️ Error retrieving project intelligence: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Helper for Health badge styling
  const getHealthBadgeStyle = (status) => {
    switch (status) {
      case 'Healthy':
        return {
          badgeClass: 'badge-on-track',
          textColor: 'var(--color-success-text)',
          borderColor: 'var(--color-success-border)',
          bg: 'var(--color-success-bg)',
          label: 'HEALTHY',
        };
      case 'Attention Required':
        return {
          badgeClass: 'badge-at-risk',
          textColor: '#b45309',
          borderColor: '#fde68a',
          bg: '#fffbeb',
          label: 'ATTENTION REQUIRED',
        };
      case 'At Risk':
        return {
          badgeClass: 'badge-at-risk',
          textColor: 'var(--color-warning-text)',
          borderColor: 'var(--color-warning-border)',
          bg: 'var(--color-warning-bg)',
          label: 'AT RISK',
        };
      case 'Critical':
      default:
        return {
          badgeClass: 'badge-delayed',
          textColor: 'var(--color-danger-text)',
          borderColor: 'var(--color-danger-border)',
          bg: 'var(--color-danger-bg)',
          label: 'CRITICAL',
        };
    }
  };

  // Helper for Risk severity badge
  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'badge-delayed';
      case 'high':
        return 'badge-delayed';
      case 'medium':
        return 'badge-at-risk';
      case 'low':
      default:
        return 'badge-on-track';
    }
  };

  const projectListToDisplay = dbProjects.length > 0 ? dbProjects : projects;
  const currentProjectName = projectMeta?.name || projectListToDisplay.find((p) => (p._id || p.id) === activeProjectId)?.name || 'Selected Project';
  const healthStyle = getHealthBadgeStyle(analysisData?.overallHealth?.status || 'Attention Required');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1>{t('aiInsights.title')}</h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <IconSparkles size={12} />
              {t('aiInsights.geminiBadge')}
            </span>
          </div>
          <p>{t('aiInsights.subtitle')}</p>
        </div>

        {/* Top Controls: Real Project selector + Analyze Project Button */}
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              id="ai-project-select"
              className="filter-select"
              value={activeProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              style={{ minWidth: '240px', fontWeight: 600 }}
              disabled={isAnalyzing}
            >
              {projectListToDisplay.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.progress !== undefined ? `${p.progress}%` : p.code || 'Live DB'})
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={() => runAnalysis(activeProjectId)}
              disabled={isAnalyzing}
            >
              <IconSparkles size={16} />
              <span>{isAnalyzing ? 'Analyzing project data...' : t('aiInsights.analyzeBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            borderLeft: '4px solid var(--color-danger)',
            background: 'var(--color-danger-bg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong style={{ color: 'var(--color-danger-text)' }}>AI Analysis Notice: </strong>
              <span style={{ fontSize: '0.86rem', color: 'var(--color-danger-text)' }}>{errorMessage}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => runAnalysis(activeProjectId)}>
            Retry Analysis
          </button>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing ? (
        <div
          className="card"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--color-accent)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Analyzing project data...
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Querying MongoDB tasks, materials stock ratios, and milestones for <strong>{currentProjectName}</strong>...
            </div>
          </div>
        </div>
      ) : analysisData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Executive Project Health & AI Summary */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              border: `1px solid ${healthStyle.borderColor}`,
              boxShadow: 'var(--shadow-card)',
              padding: '24px 28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {t('aiInsights.projectHealth')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className={`badge ${healthStyle.badgeClass}`}
                    style={{ fontSize: '0.88rem', padding: '4px 12px', fontWeight: 800 }}
                  >
                    ● {analysisData.overallHealth?.status || 'Attention Required'}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Analyzed for <strong>{currentProjectName}</strong> • {lastAnalyzedTime || 'Live'}
                  </span>
                </div>
              </div>

              {projectMeta?.progress !== undefined && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Database Progress</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {projectMeta.progress}%
                  </div>
                </div>
              )}
            </div>

            {/* Factual Health Reason */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: healthStyle.bg,
                border: `1px solid ${healthStyle.borderColor}`,
                color: healthStyle.textColor,
                fontSize: '0.88rem',
                lineHeight: '1.5',
                marginBottom: '16px',
              }}
            >
              <strong>Evaluation Justification: </strong>
              {analysisData.overallHealth?.reason}
            </div>

            {/* AI Executive Summary */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Executive Intelligence Summary:
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
                {analysisData.summary}
              </p>
            </div>
          </div>

          {/* Section 2: Identified Project Risks */}
          <div>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconAlertTriangle size={18} color="var(--color-warning)" />
                  <span>Risk Analysis</span>
                </div>
                <div className="card-subtitle">Grounded operational and supply chain vulnerabilities</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {analysisData.risks && analysisData.risks.length > 0 ? (
                analysisData.risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      borderTop: `4px solid ${
                        risk.severity === 'Critical' || risk.severity === 'High'
                          ? 'var(--color-danger)'
                          : risk.severity === 'Medium'
                          ? 'var(--color-warning)'
                          : 'var(--color-success)'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {risk.type}
                      </span>
                      <span className={`badge ${getSeverityBadgeClass(risk.severity)}`}>
                        {risk.severity} Severity
                      </span>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>EVIDENCE:</span>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.45', marginTop: '2px' }}>
                        {risk.evidence}
                      </p>
                    </div>

                    <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-accent)', fontWeight: 600, display: 'block' }}>RECOMMENDATION:</span>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', marginTop: '2px' }}>
                        {risk.recommendation}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No major critical risks identified in current project telemetry.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Two Column Row - Delayed Tasks & Material Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Left Column: Delayed Tasks */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconClock size={16} color="var(--color-danger)" />
                    <span>Delayed Tasks</span>
                  </div>
                  <div className="card-subtitle">Critical path work orders needing schedule float recovery</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysisData.delays && analysisData.delays.length > 0 ? (
                  analysisData.delays.map((delay, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--color-danger)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {delay.task}
                        </span>
                        <span className="badge badge-delayed">{delay.status || 'Delayed'} ({delay.progress || 0}%)</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.4' }}>
                        {delay.reason}
                      </p>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                        → Action: {delay.recommendation}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-success-text)', fontSize: '0.86rem' }}>
                    ✓ Zero delayed tasks recorded for this project.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Material Alerts */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconMaterials size={16} color="var(--color-warning)" />
                    <span>Material Alerts</span>
                  </div>
                  <div className="card-subtitle">Stockpile depletion thresholds and replenishment notices</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysisData.materialAlerts && analysisData.materialAlerts.length > 0 ? (
                  analysisData.materialAlerts.map((mat, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${mat.status === 'Out of Stock' ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {mat.material}
                        </span>
                        <span className={`badge ${mat.status === 'Out of Stock' ? 'badge-delayed' : 'badge-at-risk'}`}>
                          {mat.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Available: <strong>{mat.available} {mat.unit}</strong> | Required: <strong>{mat.required} {mat.unit}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                        → Guidance: {mat.recommendation}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-success-text)', fontSize: '0.86rem' }}>
                    ✓ All inventory levels are currently sufficient.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Prioritized Recommended Actions */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconCheck size={18} color="var(--color-success)" />
                  <span>{t('aiInsights.recommendations')}</span>
                </div>
                <div className="card-subtitle">{t('aiInsights.recommendationsSub')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysisData.recommendations && analysisData.recommendations.length > 0 ? (
                analysisData.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background:
                          rec.priority === 'High'
                            ? 'var(--color-danger-bg)'
                            : rec.priority === 'Medium'
                            ? 'var(--color-warning-bg)'
                            : 'var(--color-success-bg)',
                        color:
                          rec.priority === 'High'
                            ? 'var(--color-danger-text)'
                            : rec.priority === 'Medium'
                            ? 'var(--color-warning-text)'
                            : 'var(--color-success-text)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {rec.priority?.toUpperCase()} PRIORITY
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '3px' }}>
                        {rec.action}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <strong>Justification:</strong> {rec.reason}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No immediate interventions required at this time.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Project-Aware Gemini AI Assistant Chat (Requirement 10) */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <span>Ask BuildOps AI Assistant (Project-Aware)</span>
                </div>
                <div className="card-subtitle">
                  Ask specific questions grounded strictly in <strong>{currentProjectName}</strong> database records.
                </div>
              </div>
            </div>

            {/* Quick Prompt Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {suggestedPrompts.map((promptText, i) => (
                <button
                  key={i}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isChatLoading}
                >
                  💡 {promptText}
                </button>
              ))}
            </div>

            {/* Chat History Box */}
            <div
              style={{
                minHeight: '180px',
                maxHeight: '340px',
                overflowY: 'auto',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: msg.sender === 'user' ? 'var(--color-accent)' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.86rem',
                    lineHeight: '1.45',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      opacity: 0.7,
                      marginTop: '4px',
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 14px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid var(--border-color)',
                      borderTopColor: 'var(--color-accent)',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Querying project database with Gemini...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                className="form-control"
                placeholder={`Ask about ${currentProjectName} tasks, materials, delays...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!chatInput.trim() || isChatLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
