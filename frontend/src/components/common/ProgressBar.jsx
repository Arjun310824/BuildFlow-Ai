import React from 'react';

export const ProgressBar = ({ progress, showLabel = true, height = 7 }) => {
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <div className="progress-container">
      {showLabel && (
        <div className="progress-info">
          <span>Completion</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {clampedProgress}%
          </span>
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div
          className="progress-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
