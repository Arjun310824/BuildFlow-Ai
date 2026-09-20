import React, { useState, useEffect } from 'react';
import { aiInsightProfiles } from '../mock/constructionData';
import { getProjectAIInsights } from '../services/api';
import {
  IconInsights,
  IconSparkles,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMaterials,
  IconTasks,
  IconTrendingUp,
} from '../components/common/Icons';

export const AIInsights = ({
  projects = [],
  selectedProjectId = 'PRJ-101',
  onSelectProject,
  onTriggerAction,
}) => {
  const [activeProjectId, setActiveProjectId] = useState(selectedProjectId || 'PRJ-101');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState('Today at 11:45 AM');
  const [liveData, setLiveData] = useState(null);
  const [apiNotice, setApiNotice] = useState(null);

  const fallbackProfile =
    aiInsightProfiles[activeProjectId] ||
    aiInsightProfiles['PRJ-101'];

  // Fetch real Gemini AI insights from backend
  const fetchGeminiAnalysis = async (projectId) => {
    setIsAnalyzing(true);
    setApiNotice(null);
    try {
      const response = await getProjectAIInsights(projectId);
      if (response && response.success && response.data) {
        setLiveData(response.data);
        setAnalysisTimestamp(`Just now (Live Gemini 3.6 inference)`);
        if (onTriggerAction) {
          onTriggerAction(`Live Gemini AI analysis refreshed for ${projectId}.`);
        }
      } else {
        throw new Error(response.message || 'Invalid response from AI service');
      }
    } catch (err) {
      console.warn('[AI Insights] Using fallback profile:', err.message);
      setApiNotice(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      fetchGeminiAnalysis(activeProjectId);
    }
  }, [activeProjectId]);

  const handleAnalyze = () => {
    fetchGeminiAnalysis(activeProjectId);
  };

  // Derive effective profile blending live Gemini data with fallback structure
  const currentProjectName = projects.find(p => p.id === activeProjectId)?.name || fallbackProfile.projectName;

  const effectiveRiskLevel = liveData ? liveData.riskLevel : (fallbackProfile.overallScore < 75 ? 'HIGH' : 'LOW');
  const effectiveRiskScore = liveData ? liveData.riskScore : (100 - fallbackProfile.overallScore);
  const effectiveHealthStatus = effectiveRiskLevel === 'HIGH' ? 'Immediate Attention' : effectiveRiskLevel === 'MEDIUM' ? 'Moderate Risk' : 'On Track';
  const isHighRisk = effectiveRiskLevel === 'HIGH';

  const effectiveRecommendations = (liveData && liveData.recommendedActions && liveData.recommendedActions.length > 0)
    ? liveData.recommendedActions
    : fallbackProfile.recommendations;

  const effectiveSummary = liveData ? liveData.summary : (fallbackProfile.keyInsights[0]?.detail || 'Project telemetry evaluated.');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1>AI Project Insights</h1>
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
              {liveData ? 'LIVE GEMINI 3.6 PRO' : 'GEMINI POWERED'}
            </span>
          </div>
          <p>Real-time predictive analytics, critical path bottleneck forecasting, and material deficit mitigation.</p>
        </div>

        {/* Top Controls: Select Project dropdown + Analyze Project Button */}
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="filter-select"
              value={activeProjectId}
              onChange={(e) => {
                setActiveProjectId(e.target.value);
                if (onSelectProject) onSelectProject(e.target.value);
              }}
              style={{ minWidth: '220px', fontWeight: 600 }}
            >
              {projects.length > 0 ? (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || p.id})
                  </option>
                ))
              ) : (
                <>
                  <option value="PRJ-101">Skyline Commercial Tower B (PRJ-101)</option>
                  <option value="PRJ-102">Riverfront Residential Phase II (PRJ-102)</option>
                  <option value="PRJ-103">Apex Logistics Distribution Hub (PRJ-103)</option>
                  <option value="PRJ-104">Metro Hospital Expansion Wing (PRJ-104)</option>
                </>
              )}
            </select>

            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <IconSparkles size={16} />
              <span>{isAnalyzing ? 'Analyzing Site Telemetry...' : 'Analyze Project'}</span>
            </button>
          </div>
        </div>
      </div>

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
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Synthesizing Construction Telemetry with Gemini AI
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Evaluating critical path milestones, trade dependencies, and supply chain buffer thresholds for {currentProjectName}...
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Panel: Project Health Score Card */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent bar at top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isHighRisk ? 'var(--color-danger)' : 'var(--color-success)',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                paddingTop: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  PROJECT RISK ASSESSMENT
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: isHighRisk ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span>{effectiveHealthStatus}</span>
                  <span
                    className={`badge ${isHighRisk ? 'badge-delayed' : 'badge-on-track'}`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Risk Level: {effectiveRiskLevel}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Analyzed for <strong>{currentProjectName}</strong> • {analysisTimestamp}
                </div>
              </div>

              {/* Overall Risk Score Dial */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-subtle)',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Calculated Risk Score:
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isHighRisk ? 'var(--color-danger)' : 'var(--color-success)', lineHeight: 1.1 }}>
                    {effectiveRiskScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/100</span>
                  </div>
                </div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: `4px solid ${isHighRisk ? 'var(--color-danger)' : 'var(--color-success)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: isHighRisk ? 'var(--color-danger)' : 'var(--color-success)',
                    fontSize: '1rem',
                  }}
                >
                  {effectiveRiskScore}%
                </div>
              </div>
            </div>

            {/* AI Executive Summary Banner */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                background: 'rgba(0, 102, 255, 0.04)',
                border: '1px solid rgba(0, 102, 255, 0.15)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                <IconSparkles size={14} />
                <span>EXECUTIVE GEMINI SUMMARY</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>
                {effectiveSummary}
              </p>
            </div>
          </div>

          {/* 3 Core Risk Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {/* 1. Schedule / Delay Risk */}
            <div
              className="card"
              style={{
                borderLeft: `4px solid ${liveData?.delays?.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Task Delays
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: liveData?.delays?.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', marginBottom: '8px' }}>
                {liveData
                  ? (liveData.delays.length > 0 ? `${liveData.delays.length} task(s) behind schedule` : 'No task delays detected')
                  : `Project is ${fallbackProfile.scheduleRisk.percentage}.`}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {liveData && liveData.delays.length > 0
                  ? `${liveData.delays[0].task}: ${liveData.delays[0].reason}`
                  : (liveData ? 'All milestones are currently progressing on schedule.' : fallbackProfile.scheduleRisk.summary)}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {liveData && liveData.delays.length > 0
                  ? <span>Max Overrun: <strong style={{ color: 'var(--color-danger)' }}>+{liveData.delays[0].delayDays} days</strong></span>
                  : <span>Critical Path: <strong>Nominal</strong></span>}
              </div>
            </div>

            {/* 2. Material Deficits */}
            <div
              className="card"
              style={{
                borderLeft: `4px solid ${liveData?.materialShortages?.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📦</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Material Deficits
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: liveData?.materialShortages?.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', marginBottom: '8px' }}>
                {liveData
                  ? (liveData.materialShortages.length > 0 ? `${liveData.materialShortages.length} shortage alert(s)` : 'Supply buffers adequate')
                  : 'Cement and steel inventory are below expected levels.'}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {liveData && liveData.materialShortages.length > 0
                  ? `${liveData.materialShortages[0].material} deficit of ${liveData.materialShortages[0].shortage} ${liveData.materialShortages[0].unit} (Avail: ${liveData.materialShortages[0].available} / Req: ${liveData.materialShortages[0].required}).`
                  : (liveData ? 'On-site stockpiles meet active production rates.' : fallbackProfile.materialRisk.summary)}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {liveData && liveData.materialShortages.length > 0
                  ? <span>Action: <strong style={{ color: 'var(--color-danger)' }}>Expedite Reorder</strong></span>
                  : <span>Shortage Risk: <strong>None</strong></span>}
              </div>
            </div>

            {/* 3. Operational Issues */}
            <div
              className="card"
              style={{
                borderLeft: `4px solid ${liveData?.issues?.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Identified Issues
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: liveData?.issues?.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', marginBottom: '8px' }}>
                {liveData ? `${liveData.issues.length} active issue(s) identified` : `${fallbackProfile.taskRisk.delayedCount || 3} critical tasks delayed`}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {liveData && liveData.issues.length > 0
                  ? liveData.issues[0]
                  : (liveData ? 'No critical operational risks or site safety blockers flagged.' : fallbackProfile.taskRisk.summary)}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Priority: <strong>{isHighRisk ? 'Immediate Review' : 'Routine Monitoring'}</strong>
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconSparkles size={18} color="var(--color-accent)" />
                  <span>AI Recommended Directives</span>
                </div>
                <div className="card-subtitle">Prioritized interventions synthesized to recover project float and mitigate procurement risk</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {effectiveRecommendations.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {rec.replace(/^[0-9]+\.\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tables: Task Delays Breakdown & Material Deficit Breakdown */}
          {liveData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              {/* Task Delays Detail */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconClock size={16} color="var(--color-danger)" />
                    <span>Task Delays Detail</span>
                  </div>
                </div>
                {liveData.delays && liveData.delays.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {liveData.delays.map((d, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>{d.task}</span>
                          <span className="badge badge-delayed" style={{ fontSize: '0.72rem' }}>+{d.delayDays}d Overdue</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)' }}>
                    ✔ No task delays detected.
                  </div>
                )}
              </div>

              {/* Material Shortages Detail */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconMaterials size={16} color="var(--color-warning)" />
                    <span>Material Deficits Detail</span>
                  </div>
                </div>
                {liveData.materialShortages && liveData.materialShortages.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {liveData.materialShortages.map((m, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>{m.material}</span>
                          <span className="badge badge-delayed" style={{ fontSize: '0.72rem' }}>Deficit: -{m.shortage} {m.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Available: {m.available} {m.unit} • Required: {m.required} {m.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)' }}>
                    ✔ No material shortages detected.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
