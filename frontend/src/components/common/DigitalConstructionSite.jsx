import React, { useState } from 'react';
import { ProgressBar } from './ProgressBar';
import {
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconMaterials,
  IconSparkles,
} from './Icons';

/**
 * DigitalConstructionSite: Signature visual building/floor progression component.
 * Displays interactive vertical tower stages: Foundation, Structure, Electrical, Plumbing, Finishing.
 * Clicking a stage reveals real connected tasks, delayed alerts, materials, and AI health assessment.
 */
export const DigitalConstructionSite = ({
  project,
  tasks = [],
  materials = [],
  onNavigate,
}) => {
  // Define default construction stages
  const stages = [
    {
      id: 'foundation',
      name: 'Foundation & Substructure',
      floorLevel: 'Basement & L1',
      defaultProgress: 100,
      icon: '🏗️',
      trade: 'Civil & Earthworks',
      keywords: ['foundation', 'concrete', 'excavation', 'basement', 'piles', 'rebar'],
    },
    {
      id: 'structure',
      name: 'Superstructure & Framing',
      floorLevel: 'Floors 2 - 14',
      defaultProgress: 82,
      icon: '🏢',
      trade: 'Structural Concrete & Steel',
      keywords: ['structure', 'frame', 'slab', 'column', 'beam', 'steel'],
    },
    {
      id: 'electrical',
      name: 'Electrical Infrastructure & Cabling',
      floorLevel: 'All Zones',
      defaultProgress: 61,
      icon: '⚡',
      trade: 'Electrical & Power Distribution',
      keywords: ['electric', 'wiring', 'cable', 'switch', 'power', 'hvac'],
    },
    {
      id: 'plumbing',
      name: 'Plumbing & Fire Suppression',
      floorLevel: 'Risers & Core',
      defaultProgress: 48,
      icon: '🚰',
      trade: 'Mechanical & Fire Systems',
      keywords: ['plumbing', 'pipe', 'drainage', 'sprinkler', 'water', 'sanitary'],
    },
    {
      id: 'finishing',
      name: 'Interior Finishing & Facade',
      floorLevel: 'Upper Levels',
      defaultProgress: 24,
      icon: '🎨',
      trade: 'Architectural Glazing & Fitout',
      keywords: ['finish', 'facade', 'glass', 'drywall', 'paint', 'curtain wall', 'tile'],
    },
  ];

  const [selectedStageId, setSelectedStageId] = useState('structure');
  const currentStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  // Match real project tasks to the selected stage
  const stageTasks = tasks.filter((t) => {
    const title = (t.title || t.name || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return currentStage.keywords.some((k) => title.includes(k) || desc.includes(k));
  });

  const delayedStageTasks = stageTasks.filter((t) => t.status === 'Delayed');

  // Match materials to the selected stage
  const stageMaterials = materials.filter((m) => {
    const name = (m.name || m.material || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    return currentStage.keywords.some((k) => name.includes(k) || cat.includes(k));
  });

  // Dynamic stage progress calculation
  const computedProgress = stageTasks.length > 0
    ? Math.round(stageTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / stageTasks.length)
    : currentStage.defaultProgress;

  return (
    <div className="digital-site-container">
      {/* Left: Vertical Building / Tower Visualization */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            DIGITAL TWIN • {project?.name || 'High-Rise Tower'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#0369A1', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            5 STAGES
          </span>
        </div>

        <div className="building-vertical-tower">
          {stages.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            const pct = stage.defaultProgress;
            let statusBorder = 'var(--border-color)';

            if (pct === 100) {
              statusBorder = '#A7F3D0';
            } else if (pct < 50) {
              statusBorder = '#FDE68A';
            }

            return (
              <div
                key={stage.id}
                className={`tower-stage-segment ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedStageId(stage.id)}
                style={{
                  borderColor: isSelected ? '#0284C7' : statusBorder,
                  background: isSelected ? '#EAF8FC' : '#F8FAFC',
                  boxShadow: isSelected ? '0 0 0 1px #0284C7' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{stage.icon}</span>
                  <div>
                    <div className="stage-name" style={{ color: '#172033', fontWeight: 600, fontSize: '0.88rem' }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                      {stage.floorLevel}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="stage-pct" style={{ color: '#172033', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                    {pct}%
                  </span>
                  <div style={{ width: '60px', marginTop: '4px' }}>
                    <ProgressBar progress={pct} height={4} showLabel={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Stage Telemetry Inspector Panel */}
      <div className="stage-inspector-panel">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>{currentStage.icon}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#172033' }}>
                {currentStage.name}
              </h3>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
              Discipline: <strong style={{ color: '#0369A1' }}>{currentStage.trade}</strong> • Zone: <span style={{ color: '#334155' }}>{currentStage.floorLevel}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Stage Progress
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#172033', fontFamily: 'var(--font-mono)' }}>
              {computedProgress}%
            </div>
          </div>
        </div>

        {/* AI Insight Box for this stage */}
        <div
          style={{
            background: '#EAF8FC',
            border: '1px solid #BAE6FD',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <IconSparkles size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gemini Site Assessment
            </div>
            <p style={{ fontSize: '0.86rem', color: '#334155', marginTop: '4px', lineHeight: '1.5' }}>
              {delayedStageTasks.length > 0
                ? `Critical path bottleneck detected: ${delayedStageTasks.length} task(s) currently delayed in ${currentStage.name}. Material deliveries must be synchronized to prevent shift standby.`
                : `${currentStage.name} is progressing within target schedule boundaries. Milestone signoff on track.`}
            </p>
          </div>
        </div>

        {/* Connected Tasks Strip */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Connected Tasks ({stageTasks.length})
            </span>
            {onNavigate && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('tasks')}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              >
                View in Tasks &rarr;
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stageTasks.length === 0 ? (
              <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#64748B' }}>
                No specific task logged for this construction milestone.
              </div>
            ) : (
              stageTasks.slice(0, 3).map((tsk) => (
                <div
                  key={tsk._id || tsk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: tsk.status === 'Completed' ? '#10B981' : (tsk.status === 'Delayed' ? '#EF4444' : '#0284C7'),
                      }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#172033' }}>
                      {tsk.title || tsk.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: tsk.status === 'Delayed' ? '#DC2626' : '#64748B',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                    }}
                  >
                    {tsk.status} • {tsk.progress}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Required Materials Linked to Stage */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.03em' }}>
            Stage Material Inventory
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {stageMaterials.length === 0 ? (
              <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#64748B' }}>
                General material inventory standard.
              </div>
            ) : (
              stageMaterials.slice(0, 3).map((mat) => (
                <div
                  key={mat._id || mat.id}
                  style={{
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#172033' }}>
                    {mat.name || mat.material}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#0369A1', fontFamily: 'var(--font-mono)', marginTop: '4px', fontWeight: 600 }}>
                    Avail: {mat.availableQuantity ?? mat.available}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
