import React from 'react';

export const ProgressBar = ({ progress, showLabel = true, height = 6, variant }) => {
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  let fillClass = 'progress-fill';
  if (variant) {
    fillClass += ` ${variant}`;
  } else {
    if (clampedProgress >= 80) fillClass += ' success';
    else if (clampedProgress >= 40) fillClass += '';
    else fillClass += ' warning';
  }

  return (
    <div className="progress-bar-container">
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div
          className={fillClass}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label-val">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};
