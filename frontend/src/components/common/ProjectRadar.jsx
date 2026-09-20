import React from 'react';

/**
 * ProjectRadar: Interactive multi-dimensional visualization representing
 * Project Health, Schedule, Tasks, Materials, and Risk.
 * Clicking a dimension navigates or filters to that module.
 */
export const ProjectRadar = ({
  projects = [],
  tasks = [],
  materials = [],
  onDimensionClick,
  onNavigate,
}) => {
  // Dimension computations from live MongoDB data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const delayedTasks = tasks.filter((t) => t.status === 'Delayed').length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;

  const totalMaterials = materials.length;
  const lowStock = materials.filter(
    (m) => m.status === 'Low Stock' || m.status === 'LOW STOCK' || m.status === 'Out of Stock' || m.status === 'OUT OF STOCK'
  ).length;
  const materialPct = totalMaterials > 0 ? Math.max(10, Math.round(100 - (lowStock / totalMaterials) * 60)) : 80;

  const totalProjects = projects.length;
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (Number(p.progress) || 0), 0) / totalProjects)
    : 65;

  const highRisk = projects.filter((p) => p.risk === 'High').length;
  const riskPct = highRisk > 0 ? 35 : (delayedTasks > 0 ? 65 : 90);

  // Overall Health
  const healthScore = Math.round((taskPct + materialPct + avgProgress + riskPct) / 4);

  const handleClick = (dim) => {
    if (onDimensionClick) {
      onDimensionClick(dim);
    } else if (onNavigate) {
      onNavigate(dim);
    }
  };

  // 4 Radar Coordinates (Center: 130, 130; max radius 90)
  // Top: Schedule
  // Right: Tasks
  // Bottom: Materials
  // Left: Risk
  const cx = 130;
  const cy = 130;
  const maxR = 85;

  const getCoord = (pct, angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const r = (pct / 100) * maxR;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const ptSchedule = getCoord(avgProgress, 0);      // Top
  const ptTasks = getCoord(taskPct, 90);           // Right
  const ptMaterials = getCoord(materialPct, 180);   // Bottom
  const ptRisk = getCoord(riskPct, 270);           // Left

  const polygonPoints = `${ptSchedule.x},${ptSchedule.y} ${ptTasks.x},${ptTasks.y} ${ptMaterials.x},${ptMaterials.y} ${ptRisk.x},${ptRisk.y}`;

  return (
    <div className="project-radar-card">
      <div className="card-header" style={{ marginBottom: '8px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>◈</span>
            <span>PROJECT RADAR</span>
          </div>
          <div className="card-subtitle">Multi-dimensional operational telemetry</div>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--color-accent-subtle)',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
          }}
        >
          HEALTH: {healthScore}
        </span>
      </div>

      {/* SVG Interactive Radar Mesh */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '4px 0' }}>
        <svg width="260" height="260" viewBox="0 0 260 260">
          {/* Concentric Reference Rings */}
          <circle cx={cx} cy={cy} r="25" stroke="rgba(255,255,255,0.06)" fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="50" stroke="rgba(255,255,255,0.08)" fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="75" stroke="rgba(0,217,255,0.12)" fill="none" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={maxR} stroke="rgba(0,217,255,0.2)" fill="none" strokeWidth="1" strokeDasharray="3,3" />

          {/* Crosshairs */}
          <line x1={cx} y1="35" x2={cx} y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1="35" y1={cy} x2="225" y2={cy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Polygon Data Web */}
          <polygon
            points={polygonPoints}
            fill="rgba(0, 217, 255, 0.18)"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(0,217,255,0.4))',
              transition: 'all 0.5s ease',
            }}
          />

          {/* Dimension Data Nodes */}
          <circle
            cx={ptSchedule.x}
            cy={ptSchedule.y}
            r="5"
            fill="#00D9FF"
            stroke="#0B1220"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick('tasks')}
          />
          <circle
            cx={ptTasks.x}
            cy={ptTasks.y}
            r="5"
            fill="#00D9FF"
            stroke="#0B1220"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick('tasks')}
          />
          <circle
            cx={ptMaterials.x}
            cy={ptMaterials.y}
            r="5"
            fill="#00D9FF"
            stroke="#0B1220"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick('materials')}
          />
          <circle
            cx={ptRisk.x}
            cy={ptRisk.y}
            r="5"
            fill={highRisk > 0 ? '#EF4444' : '#00D9FF'}
            stroke="#0B1220"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => handleClick('insights')}
          />

          {/* Center Point */}
          <circle cx={cx} cy={cy} r="3" fill="#FFFFFF" />

          {/* Labels on SVG */}
          <text x={cx} y="22" textAnchor="middle" fill="#9AA4B2" fontSize="10" fontWeight="700">
            SCHEDULE ({avgProgress}%)
          </text>
          <text x="240" y={cy + 4} textAnchor="end" fill="#9AA4B2" fontSize="10" fontWeight="700">
            TASKS ({taskPct}%)
          </text>
          <text x={cx} y="246" textAnchor="middle" fill="#9AA4B2" fontSize="10" fontWeight="700">
            MATERIALS ({materialPct}%)
          </text>
          <text x="18" y={cy + 4} textAnchor="start" fill="#9AA4B2" fontSize="10" fontWeight="700">
            RISK ({riskPct}%)
          </text>
        </svg>
      </div>

      {/* Interactive Navigation Shortcuts */}
      <div className="radar-dimensions-row">
        <div className="radar-dimension-btn" onClick={() => handleClick('tasks')} title="Jump to Schedule & Tasks">
          <span className="radar-dimension-name">Schedule</span>
          <span className="radar-dimension-val">{avgProgress}%</span>
        </div>
        <div className="radar-dimension-btn" onClick={() => handleClick('tasks')} title="Jump to Task Matrix">
          <span className="radar-dimension-name">Tasks</span>
          <span className="radar-dimension-val">{taskPct}%</span>
        </div>
        <div className="radar-dimension-btn" onClick={() => handleClick('materials')} title="Jump to Materials Inventory">
          <span className="radar-dimension-name">Materials</span>
          <span className="radar-dimension-val">{materialPct}%</span>
        </div>
        <div className="radar-dimension-btn" onClick={() => handleClick('insights')} title="Jump to AI Risk Radar">
          <span className="radar-dimension-name">Risk Index</span>
          <span
            className="radar-dimension-val"
            style={{ color: highRisk > 0 ? '#F87171' : (delayedTasks > 0 ? '#FBBF24' : '#34D399') }}
          >
            {highRisk > 0 ? 'HIGH' : (delayedTasks > 0 ? 'MED' : 'LOW')}
          </span>
        </div>
      </div>
    </div>
  );
};
