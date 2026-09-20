import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'on track':
      case 'completed':
      case 'healthy':
      case 'in stock':
      case 'approved':
      case 'executed':
      case 'paid':
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
      case 'in progress':
      case 'active':
        return 'badge-in-progress';
      case 'pending':
      default:
        return 'badge-pending';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      <span style={{ fontSize: '7px' }}>●</span>
      {status}
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
