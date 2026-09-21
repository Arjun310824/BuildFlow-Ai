import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'BUSINESS_CONNECTION_REQUESTED',
  'BUSINESS_CONNECTION_ACCEPTED',
  'BUSINESS_CONNECTION_REJECTED',
  'BUSINESS_CONNECTION_SUSPENDED',
  'BUSINESS_CONNECTION_TERMINATED',
  'DATA_PERMISSION_GRANTED',
  'DATA_PERMISSION_REVOKED',
  'SHARED_DATA_ACCESSED',
  'BUSINESS_TRANSACTION_CREATED',
  'BUSINESS_TRANSACTION_VIEWED',
  'BUSINESS_TRANSACTION_ACCEPTED',
  'BUSINESS_TRANSACTION_REJECTED',
  'BUSINESS_TRANSACTION_STARTED',
  'BUSINESS_TRANSACTION_COMPLETED',
  'BUSINESS_TRANSACTION_CANCELLED',
  'FINANCIAL_ACCESS_UNLOCK_SUCCESS',
  'FINANCIAL_ACCESS_UNLOCK_FAILED',
  'FINANCIAL_ACCESS_EXPIRED',
  'FINANCIAL_ACCESS_LOCKED',
  'FINANCIAL_TRANSACTION_CREATED',
  'FINANCIAL_TRANSACTION_UPDATED',
  'FINANCIAL_TRANSACTION_DELETED',
];

/**
 * AuditLog Schema for BuildOps AI B2B Network
 * Maintains an immutable audit trail of all business relationship changes and data access events.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit actor is required'],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Actor organization is required'],
      index: true,
    },
    action: {
      type: String,
      enum: {
        values: AUDIT_ACTIONS,
        message: '{VALUE} is not a valid audit action',
      },
      required: [true, 'Audit action is required'],
    },
    targetOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    targetResource: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
