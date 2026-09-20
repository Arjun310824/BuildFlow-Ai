import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'on track':
      case 'completed':
        return 'badge-on-track';
      case 'at risk':
        return 'badge-at-risk';
      case 'delayed':
      case 'critical low':
        return 'badge-delayed';
      case 'in progress':
        return 'badge-in-progress';
      default:
        return 'badge-in-progress';
    }
  };

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      <span style={{ fontSize: '10px' }}>●</span>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const getPriorityClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
      default:
        return 'priority-low';
    }
  };

  return (
    <span className={`priority-pill ${getPriorityClass(priority)}`}>
      {priority}
    </span>
  );
};
