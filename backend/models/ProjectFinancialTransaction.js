import mongoose from 'mongoose';

export const REVENUE_CATEGORIES = [
  'Contract Value',
  'Additional Work',
  'Other Revenue',
  'Client Billing',
  'Milestone Payment',
];

export const EXPENSE_CATEGORIES = [
  'Material',
  'Labour',
  'Equipment',
  'Transportation',
  'Subcontractor',
  'Utilities',
  'Site Expense',
  'Permits & Fees',
  'Overhead',
  'Other',
];

export const FINANCIAL_TYPES = ['Revenue', 'Expense'];
export const FINANCIAL_CATEGORIES = [...new Set([...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES])];

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partially Paid', 'Overdue'];
export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Online',
  'Credit',
  'Wire',
  'Other',
];

/**
 * ProjectFinancialTransaction Schema for BuildOps AI Project Financial Management
 * Tracks Revenue, Bills, and detailed Category-wise Expenses for each individual project.
 */
const projectFinancialTransactionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: FINANCIAL_TYPES,
        message: '{VALUE} is not a valid transaction type. Must be Revenue or Expense.',
      },
      required: [true, 'Transaction type is required.'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Financial category is required.'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
      min: [0.01, 'Amount must be greater than 0.'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Transaction date is required.'],
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    vendorOrClient: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: '{VALUE} is not a valid payment status.',
      },
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method.',
      },
      default: 'Bank Transfer',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual syncing for vendor / vendorOrClient
projectFinancialTransactionSchema.pre('save', function (next) {
  if (this.vendor && !this.vendorOrClient) {
    this.vendorOrClient = this.vendor;
  } else if (this.vendorOrClient && !this.vendor) {
    this.vendor = this.vendorOrClient;
  }

  if (this.createdBy && !this.recordedBy) {
    this.recordedBy = this.createdBy;
  } else if (this.recordedBy && !this.createdBy) {
    this.createdBy = this.recordedBy;
  }
  next();
});

// Indexes for high-performance financial aggregation and querying
projectFinancialTransactionSchema.index({ projectId: 1, type: 1, date: -1 });
projectFinancialTransactionSchema.index({ projectId: 1, category: 1 });
projectFinancialTransactionSchema.index({ organizationId: 1, projectId: 1 });
projectFinancialTransactionSchema.index({ date: -1 });

export const ProjectFinancialTransaction =
  mongoose.models.ProjectFinancialTransaction ||
  mongoose.model('ProjectFinancialTransaction', projectFinancialTransactionSchema, 'financialrecords');

export default ProjectFinancialTransaction;
