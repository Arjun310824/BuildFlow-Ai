import mongoose from 'mongoose';

export const TRANSACTION_STATUSES = [
  'Draft',
  'Sent',
  'Viewed',
  'Accepted',
  'Rejected',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const REQUEST_TYPES = ['Material Request', 'Service Request'];

/**
 * BusinessTransaction Schema for BuildOps AI B2B Network
 * Manages inter-organization procurement/material requests within a shared workspace.
 */
const businessTransactionSchema = new mongoose.Schema(
  {
    requesterOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Requester organization is required'],
      index: true,
    },
    recipientOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Recipient organization is required'],
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user ID is required'],
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessConnection',
      required: [true, 'Business connection ID is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    requestType: {
      type: String,
      enum: {
        values: REQUEST_TYPES,
        message: '{VALUE} is not a valid request type',
      },
      default: 'Material Request',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    materialName: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
      default: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: 'Units',
    },
    items: [
      {
        name: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'Units' },
        category: { type: String, default: 'General' },
        notes: { type: String, default: '' },
      },
    ],
    requestedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, 'Expected delivery date is required'],
    },
    status: {
      type: String,
      enum: {
        values: TRANSACTION_STATUSES,
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'Sent',
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    dispatchDetails: {
      carrier: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      dispatchedAt: { type: Date },
      notes: { type: String, default: '' },
    },
    activityTimeline: [
      {
        status: { type: String, required: true },
        actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Date validation hook: expectedDeliveryDate >= requestedDate
businessTransactionSchema.pre('validate', function (next) {
  if (this.requestedDate && this.expectedDeliveryDate) {
    const reqD = new Date(this.requestedDate);
    const delD = new Date(this.expectedDeliveryDate);
    if (delD < reqD) {
      this.invalidate(
        'expectedDeliveryDate',
        'Expected delivery date cannot be earlier than requested date'
      );
    }
  }
  next();
});

// Performance and isolation indexes
businessTransactionSchema.index({ requesterOrganization: 1, recipientOrganization: 1, status: 1 });
businessTransactionSchema.index({ status: 1, createdAt: -1 });

const BusinessTransaction = mongoose.model('BusinessTransaction', businessTransactionSchema);

export default BusinessTransaction;
