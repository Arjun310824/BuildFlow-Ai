import mongoose from 'mongoose';

export const ALLOWED_PERMISSIONS = [
  'MATERIAL_ORDERS',
  'PURCHASE_ORDERS',
  'DELIVERY_STATUS',
  'DOCUMENTS',
  'PROJECT_MILESTONES',
  'SHARED_TASKS',
];

export const CONNECTION_STATUSES = [
  'Pending',
  'Accepted',
  'Rejected',
  'Suspended',
  'Terminated',
];

/**
 * BusinessConnection Schema for BuildOps AI B2B Network
 * Formalizes explicit business partnerships between organizations with granular data permissions.
 */
const businessConnectionSchema = new mongoose.Schema(
  {
    requestingOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Requesting organization is required'],
      index: true,
    },
    receivingOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Receiving organization is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: CONNECTION_STATUSES,
        message: '{VALUE} is not a valid connection status',
      },
      default: 'Pending',
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user ID is required'],
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    permissions: {
      type: [
        {
          type: String,
          enum: {
            values: ALLOWED_PERMISSIONS,
            message: '{VALUE} is not a recognized data sharing permission',
          },
        },
      ],
      default: ['MATERIAL_ORDERS', 'DELIVERY_STATUS', 'DOCUMENTS'],
    },
    purpose: {
      type: String,
      trim: true,
      default: 'General construction operations collaboration',
      maxlength: [300, 'Purpose cannot exceed 300 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    suspendedReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent self-connection validation
businessConnectionSchema.pre('validate', function (next) {
  if (
    this.requestingOrganization &&
    this.receivingOrganization &&
    this.requestingOrganization.toString() === this.receivingOrganization.toString()
  ) {
    this.invalidate(
      'receivingOrganization',
      'An organization cannot establish a business connection with itself'
    );
  }
  next();
});

// Indexes for query performance and connection lookups
businessConnectionSchema.index({ requestingOrganization: 1, receivingOrganization: 1 });
businessConnectionSchema.index({ status: 1, createdAt: -1 });

const BusinessConnection = mongoose.model('BusinessConnection', businessConnectionSchema);

export default BusinessConnection;
