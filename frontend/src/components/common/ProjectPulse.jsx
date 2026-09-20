import React from 'react';

/**
 * ProjectPulse: Executive Health Gauge & Real-Time Operational Satellites.
 * Computes live project health score (0-100) based on MongoDB tasks, materials, and projects.
 */
export const ProjectPulse = ({
  projects = [],
  tasks = [],
  materials = [],
  onNavigate,
}) => {
  // Compute real dimensional scores
  const totalTasks = tasks.length || 1;
  const delayedTasks = tasks.filter((t) => t.status === 'Delayed').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;

  const totalMaterials = materials.length || 1;
  const lowMaterials = materials.filter(
    (m) =>
      m.status === 'Low Stock' ||
      m.status === 'LOW STOCK' ||
      m.status === 'Out of Stock' ||
      m.status === 'OUT OF STOCK'
  ).length;

  const totalProjects = projects.length || 1;
  const highRiskProjects = projects.filter((p) => p.risk === 'High').length;

  // Task health: 100 - (delayed / total * 80)
  const taskHealth = Math.max(10, Math.round(100 - (delayedTasks / totalTasks) * 70));

  // Material health: 100 - (low / total * 60)
  const materialHealth = Math.max(15, Math.round(100 - (lowMaterials / totalMaterials) * 65));

  // Schedule health
  const scheduleHealth = Math.max(20, Math.round(100 - (delayedTasks / totalTasks) * 50 - (highRiskProjects / totalProjects) * 30));

  // Overall Project Health composite score (0-100)
  const overallHealth = Math.min(
    100,
    Math.max(15, Math.round(scheduleHealth * 0.35 + taskHealth * 0.35 + materialHealth * 0.3))
  );

  // Overall progress
  const avgProgress = Math.round(
    projects.reduce((acc, p) => acc + (Number(p.progress) || 0), 0) / totalProjects
  ) || 0;

  // Health classification
  const getStatus = (score) => {
    if (score >= 80) return { label: 'OPTIMAL', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.12)' };
    if (score >= 65) return { label: 'STABLE', color: 'var(--accent-cyan)', bg: 'rgba(0, 217, 255, 0.12)' };
    if (score >= 50) return { label: 'ATTENTION REQUIRED', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.12)' };
    return { label: 'CRITICAL HAZARDS', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  const statusMeta = getStatus(overallHealth);

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallHealth / 100) * circumference;

  return (
    <div
      className="card"
      style={{
        marginBottom: '28px',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(18, 27, 45, 0.95) 0%, rgba(11, 18, 32, 0.98) 100%)',
        border: '1px solid rgba(0, 217, 255, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 217, 255, 0.03)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '32px',
          alignItems: 'center',
        }}
      >
        {/* Left: Health Radial Gauge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid var(--border-color)',
            paddingRight: '24px',
          }}
        >
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="12"
              />
              {/* Active progress arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={statusMeta.color}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                  filter: `drop-shadow(0 0 8px ${statusMeta.color})`,
                }}
              />
            </svg>

            {/* Inner Center Metrics */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}
              >
                {overallHealth}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
                Health Score
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: statusMeta.bg,
              border: `1px solid ${statusMeta.color}`,
              color: statusMeta.color,
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            ● {statusMeta.label}
          </div>
        </div>

        {/* Right: Operational Satellites */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                Project Portfolio Pulse & Telemetry
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Aggregated cross-collection diagnostics across {projects.length} sites and {tasks.length} trade milestones
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('insights')}
              style={{ borderColor: 'rgba(0, 217, 255, 0.35)', color: 'var(--accent-cyan)' }}
            >
              Gemini AI Diagnostic &rarr;
            </button>
          </div>

          {/* 4 Dimension Satellite Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
            }}
          >
            {/* Satellite 1: Schedule Health */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate && onNavigate('tasks')}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Schedule Health
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {scheduleHealth}%
                </span>
                <span style={{ fontSize: '0.74rem', color: delayedTasks > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {delayedTasks > 0 ? `${delayedTasks} Delayed` : 'On Schedule'}
                </span>
              </div>
            </div>

            {/* Satellite 2: Tasks Health */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate && onNavigate('tasks')}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Tasks Execution
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {taskHealth}%
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {completedTasks}/{totalTasks} Done
                </span>
              </div>
            </div>

            {/* Satellite 3: Materials Health */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate && onNavigate('materials')}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Materials Inventory
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: lowMaterials > 0 ? 'var(--color-warning)' : 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
                  {materialHealth}%
                </span>
                <span style={{ fontSize: '0.74rem', color: lowMaterials > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {lowMaterials > 0 ? `${lowMaterials} Low Stock` : 'Healthy'}
                </span>
              </div>
            </div>

            {/* Satellite 4: Portfolio Progress */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate && onNavigate('projects')}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Portfolio Progress
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {avgProgress}%
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {projects.length} Active Sites
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
