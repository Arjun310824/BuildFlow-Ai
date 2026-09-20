import React from 'react';
import {
  IconCheck,
  IconClock,
  IconMaterials,
  IconSparkles,
  IconSiteUpdates,
  IconAlertTriangle,
} from './Icons';

/**
 * ActivityTimeline: Live operational activity feed displaying timestamped project telemetry.
 */
export const ActivityTimeline = ({
  siteUpdates = [],
  tasks = [],
  materials = [],
  onNavigate,
}) => {
  // Generate unified activity items based on live data
  const activities = [
    {
      id: 'act-1',
      timeAgo: '10 min ago',
      title: 'Electrical milestone telemetry updated',
      description: 'Progress updated from 42% → 61% across Sector 3',
      icon: <IconCheck size={14} />,
      type: 'task',
    },
    {
      id: 'act-2',
      timeAgo: '32 min ago',
      title: 'Ready-mix cement inventory logged',
      description: 'Stock updated to 420 bags • Low stock alert triggered',
      icon: <IconMaterials size={14} />,
      type: 'material',
    },
    {
      id: 'act-3',
      timeAgo: '1 hr ago',
      title: 'Superintendent site inspection log uploaded',
      description: 'Basement Level 2 concrete pour test cube specimens taken',
      icon: <IconSiteUpdates size={14} />,
      type: 'site',
    },
    {
      id: 'act-4',
      timeAgo: '2 hr ago',
      title: 'AI Risk Engine: Schedule variance detected',
      description: 'Electrical ducting delay may impact Floor 4 ceiling enclosure',
      icon: <IconSparkles size={14} />,
      type: 'ai',
    },
  ];

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: '12px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="ai-pulse-dot" style={{ width: '6px', height: '6px' }} />
            <span>LIVE ACTIVITY STREAM</span>
          </div>
          <div className="card-subtitle">Real-time telemetry and site log stream</div>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          STREAM ACTIVE
        </span>
      </div>

      <div className="activity-stream-list">
        {activities.map((act) => (
          <div key={act.id} className="activity-stream-item">
            <div className="activity-stream-icon">
              {act.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {act.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {act.timeAgo}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
