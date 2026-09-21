import mongoose from 'mongoose';

/**
 * Document Schema for BuildOps AI
 * Stores project documents, drawings, invoices, and contracts.
 * Strictly isolated by organizationId and projectId.
 */
const documentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    project: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: 'Contract',
    },
    size: {
      type: String,
      trim: true,
      default: '1.5 MB',
    },
    uploadedBy: {
      type: String,
      trim: true,
      default: 'Project Manager',
    },
    status: {
      type: String,
      trim: true,
      default: 'Approved',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

documentSchema.index({ organizationId: 1, projectId: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;
