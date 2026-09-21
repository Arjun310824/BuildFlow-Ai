import mongoose from 'mongoose';

/**
 * SiteUpdate Schema for BuildOps AI
 * Represents chronological daily construction logs, shift reports, and telemetry.
 * Strictly isolated by organizationId and projectId.
 */
const siteUpdateSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    shift: {
      type: String,
      trim: true,
      default: 'Day Shift',
    },
    workers: {
      type: Number,
      default: 0,
      min: [0, 'Workers count cannot be negative'],
    },
    milestoneProgress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    supervisor: {
      type: String,
      required: [true, 'Supervisor name is required'],
      trim: true,
    },
    workSummary: {
      type: String,
      trim: true,
      default: '',
    },
    workCompleted: {
      type: String,
      trim: true,
      default: '',
    },
    issues: {
      type: String,
      trim: true,
      default: 'None reported',
    },
    weather: {
      type: String,
      trim: true,
      default: 'Clear',
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    photos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

siteUpdateSchema.pre('validate', function (next) {
  if (this.workCompleted && !this.workSummary) {
    this.workSummary = this.workCompleted;
  } else if (this.workSummary && !this.workCompleted) {
    this.workCompleted = this.workSummary;
  }
  if (this.progress !== undefined && (this.milestoneProgress === undefined || this.milestoneProgress === 0)) {
    this.milestoneProgress = this.progress;
  } else if (this.milestoneProgress !== undefined && (this.progress === undefined || this.progress === 0)) {
    this.progress = this.milestoneProgress;
  }
  next();
});

siteUpdateSchema.index({ organizationId: 1, projectId: 1, date: -1 });

const SiteUpdate = mongoose.model('SiteUpdate', siteUpdateSchema);
export default SiteUpdate;
