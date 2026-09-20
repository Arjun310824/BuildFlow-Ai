import React, { useState } from 'react';
import { aiInsightProfiles } from '../mock/constructionData';
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

  const currentProfile =
    aiInsightProfiles[activeProjectId] ||
    aiInsightProfiles['PRJ-101'];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisTimestamp('Just now (Live Gemini 1.5 Pro inference)');
      if (onTriggerAction) {
        onTriggerAction('AI Analysis Completed: Risk indicators and critical path recalculated.');
      }
    }, 900);
  };

  const isHighRisk = currentProfile.overallScore < 75;

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
              GEMINI POWERED
            </span>
          </div>
          <p>AI-powered analysis of your construction projects.</p>
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
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <IconSparkles size={16} />
              <span>{isAnalyzing ? 'Analyzing Site Data...' : 'Analyze Project'}</span>
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
              Synthesizing Construction Telemetry
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Evaluating critical path dependencies, material procurement thresholds, and meteorological forecasts...
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
            {/* Subtle accent bar at top */}
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
                  PROJECT HEALTH
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
                  <span>{currentProfile.healthStatus}</span>
                  <span
                    className={`badge ${isHighRisk ? 'badge-delayed' : 'badge-on-track'}`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {isHighRisk ? 'Immediate Attention' : 'On Track'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Analyzed for {currentProfile.projectName} • Last updated: {analysisTimestamp}
                </div>
              </div>

              {/* Overall Score Dial */}
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
                    Overall Score:
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {currentProfile.overallScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/100</span>
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
                  {currentProfile.overallScore}%
                </div>
              </div>
            </div>
          </div>

          {/* 3 Core Risk Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {/* 1. Schedule Risk */}
            <div
              className="card"
              style={{
                borderLeft: '4px solid var(--color-warning)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Schedule Risk
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-warning-text)', marginBottom: '8px' }}>
                Project is {currentProfile.scheduleRisk.percentage}.
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {currentProfile.scheduleRisk.summary}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Impact: <strong>{currentProfile.scheduleRisk.criticalPathImpact}</strong>
              </div>
            </div>

            {/* 2. Material Risk */}
            <div
              className="card"
              style={{
                borderLeft: '4px solid var(--color-danger)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📦</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Material Risk
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-danger-text)', marginBottom: '8px' }}>
                Cement and steel inventory are below expected levels.
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {currentProfile.materialRisk.summary}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Shortage Risk: <strong>Projected halt in 2.5 shifts</strong>
              </div>
            </div>

            {/* 3. Task Risk */}
            <div
              className="card"
              style={{
                borderLeft: '4px solid var(--color-danger)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🔴</span>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                  Task Risk
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-danger-text)', marginBottom: '8px' }}>
                {currentProfile.taskRisk.delayedCount || 3} critical tasks are delayed.
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                {currentProfile.taskRisk.summary}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Key blocker: <strong>Fire Suppression Hydrostatic Test</strong>
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconSparkles size={18} color="var(--color-accent)" />
                  <span>AI Recommendations</span>
                </div>
                <div className="card-subtitle">Strategic prioritized interventions calculated to recover schedule float</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentProfile.recommendations.map((rec, index) => (
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

          {/* Bottom 3 Sections: Key Insights, Potential Delays, Recommended Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {/* Key Insights */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Key Insights</div>
                  <div className="card-subtitle">Predictive models</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentProfile.keyInsights.map((ki, i) => (
                  <div key={i} style={{ borderBottom: i < currentProfile.keyInsights.length - 1 ? '1px solid var(--border-light)' : 'none', paddingBottom: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)', marginBottom: '3px' }}>
                      {ki.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {ki.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Potential Delays */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Potential Delays</div>
                  <div className="card-subtitle">Probability risk matrix</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentProfile.potentialDelays.map((del, i) => (
                  <div key={i} style={{ padding: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {del.cause}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Probability: <strong style={{ color: 'var(--color-danger)' }}>{del.probability}</strong></span>
                      <span>Impact: <strong>{del.impact}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recommended Actions</div>
                  <div className="card-subtitle">1-Click operational execution</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentProfile.recommendedActions.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {act.title}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ alignSelf: 'flex-start', color: 'var(--color-accent)', borderColor: 'var(--color-accent-border)' }}
                      onClick={() => onTriggerAction && onTriggerAction(`Executed: ${act.title}`)}
                    >
                      {act.button} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
