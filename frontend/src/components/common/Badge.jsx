import React from 'react';
import { useTranslation } from 'react-i18next';

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();

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
      case 'available':
      case 'approved':
      case 'executed':
      case 'paid':
      case 'on track':
      case 'optimal':
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

  const getTranslatedStatus = (val) => {
    if (!val) return '';
    switch (val.toLowerCase()) {
      case 'completed':
        return t('status.completed');
      case 'in progress':
        return t('status.inProgress');
      case 'active':
        return t('status.active');
      case 'on hold':
        return t('status.onHold');
      case 'planning':
        return t('status.planning');
      case 'on track':
        return t('status.onTrack');
      case 'at risk':
        return t('status.atRisk');
      case 'delayed':
        return t('status.delayed');
      case 'critical':
        return t('status.critical');
      case 'pending':
        return t('status.pending');
      case 'available':
        return t('status.available');
      case 'in stock':
        return t('status.inStock');
      case 'low stock':
        return t('status.lowStock');
      case 'out of stock':
        return t('status.outOfStock');
      case 'approved':
        return t('status.approved');
      case 'optimal':
        return t('status.optimal');
      default:
        return val;
    }
  };

  return (
    <span className={`status-badge badge ${getBadgeClass(status)}`}>
      <span className="badge-dot" style={{ fontSize: '7px' }}>●</span>
      {getTranslatedStatus(status)}
    </span>
  );
};

export const RiskBadge = ({ riskLevel }) => {
  const { t } = useTranslation();

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

  const getRiskLabel = (val) => {
    switch (val?.toLowerCase()) {
      case 'high':
        return `${t('status.high')} ${t('projects.riskLevel')}`;
      case 'medium':
        return `${t('status.medium')} ${t('projects.riskLevel')}`;
      case 'low':
      default:
        return `${t('status.low')} ${t('projects.riskLevel')}`;
    }
  };

  return (
    <span className={`risk-badge badge ${getRiskClass(riskLevel)}`}>
      <span className="badge-dot" style={{ fontSize: '7px' }}>●</span>
      {getRiskLabel(riskLevel)}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation();

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

  const getPriorityLabel = (val) => {
    switch (val?.toLowerCase()) {
      case 'critical':
        return t('status.critical');
      case 'high':
        return t('status.high');
      case 'medium':
        return t('status.medium');
      case 'low':
      default:
        return t('status.low');
    }
  };

  return (
    <span className={`badge ${getBadgeClass(priority)}`}>
      {getPriorityLabel(priority)}
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
