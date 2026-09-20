import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'completed':
        return 'badge-status-completed';
      case 'in progress':
      case 'active':
        return 'badge-status-inprogress';
      case 'on hold':
        return 'badge-status-onhold';
      case 'planning':
        return 'badge-status-planning';
      case 'healthy':
      case 'in stock':
      case 'approved':
      case 'executed':
      case 'paid':
      case 'on track':
        return 'badge-on-track';
      case 'at risk':
      case 'low stock':
      case 'under review':
      case 'flagged':
        return 'badge-at-risk';
      case 'delayed':
      case 'critical':
      case 'out of stock':
      case 'high risk':
        return 'badge-delayed';
      case 'pending':
        return 'badge-pending';
      default:
        return 'badge-status-planning';
    }
  };

  return (
    <span className={`status-badge badge ${getBadgeClass(status)}`}>
      <span className="badge-dot" style={{ fontSize: '7px' }}>●</span>
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
    <span className={`risk-badge badge ${getRiskClass(riskLevel)}`}>
      <span className="badge-dot" style={{ fontSize: '7px' }}>●</span>
      {riskLevel} Risk
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'critical':
        return 'badge-delayed';
      case 'high':
        return 'badge-at-risk';
      case 'medium':
        return 'badge-in-progress';
      case 'low':
      default:
        return 'badge-pending';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(priority)}`}>
      {priority}
    </span>
  );
};

export const TypeBadge = ({ type }) => {
  return (
    <span className="badge badge-neutral" style={{ fontWeight: 500 }}>
      {type}
    </span>
  );
};
