import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'completed':
        return 'badge-status-completed';
      case 'in progress':
        return 'badge-status-inprogress';
      case 'on hold':
        return 'badge-status-onhold';
      case 'planning':
        return 'badge-status-planning';
      // Legacy or other mappings
      case 'on track':
        return 'badge-on-track';
      case 'at risk':
        return 'badge-at-risk';
      case 'delayed':
      case 'critical low':
        return 'badge-delayed';
      default:
        return 'badge-status-planning';
    }
  };

  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      <span className="badge-dot">●</span>
      {status}
    </span>
  );
};

export const RiskBadge = ({ riskLevel }) => {
  const getRiskClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'high':
        return 'badge-risk-high';
      case 'medium':
        return 'badge-risk-medium';
      case 'low':
      default:
        return 'badge-risk-low';
    }
  };

  return (
    <span className={`risk-badge ${getRiskClass(riskLevel)}`}>
      <span className="badge-dot">●</span>
      {riskLevel} Risk
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
