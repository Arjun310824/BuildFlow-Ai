import React from 'react';
import { PriorityBadge, StatusBadge } from './Badge';
import { IconAlertTriangle, IconClock, IconUser } from './Icons';

/**
 * TaskTimeline: Gantt/Timeline-inspired interactive visual layout.
 * Visualizes scheduled tasks across phases with clear delay flags and one-click drawer inspection.
 */
export const TaskTimeline = ({
  tasks = [],
  onTaskClick,
}) => {
  return (
    <div className="task-timeline-container">
      {/* Timeline Header Track */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 120px 1fr 120px',
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          background: 'var(--bg-subtle)',
        }}
      >
        <span>Task & Assignee</span>
        <span>Priority</span>
        <span>Timeline & Progress Bar</span>
        <span style={{ textAlign: 'right' }}>Deadline</span>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No active tasks matching timeline criteria.
        </div>
      ) : (
        tasks.map((task, idx) => {
          const isDelayed = task.status === 'Delayed';
          const progressVal = Number(task.progress) || 0;
          const dueDateStr = task.dueDate
            ? (typeof task.dueDate === 'string' && task.dueDate.includes('T') ? task.dueDate.slice(0, 10) : task.dueDate)
            : '—';

          // Visual start offset calculation based on index to give a natural Gantt stagger
          const staggerOffset = Math.min(30, (idx % 4) * 8);

          return (
            <div
              key={task._id || task.id || idx}
              className={`timeline-task-row ${isDelayed ? 'delayed-row' : ''}`}
              onClick={() => onTaskClick && onTaskClick(task)}
              title="Click to view contextual detail drawer"
            >
              {/* Task Title & Assignee */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isDelayed && (
                    <IconAlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.title || task.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <IconUser size={12} />
                  <span>{task.assignedTo || 'Unassigned'}</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Visual Gantt Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <span>{task.status}</span>
                  <span style={{ color: isDelayed ? '#DC2626' : 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {progressVal}%
                  </span>
                </div>
                <div className="timeline-bar-track">
                  <div
                    style={{
                      marginLeft: `${staggerOffset}%`,
                      width: `${Math.min(100 - staggerOffset, Math.max(12, progressVal))}%`,
                    }}
                    className={`timeline-bar-progress ${isDelayed ? 'delayed' : ''}`}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    color: isDelayed ? '#DC2626' : 'var(--text-muted)',
                    fontWeight: isDelayed ? 700 : 500,
                  }}
                >
                  {dueDateStr}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
