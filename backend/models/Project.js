import mongoose from 'mongoose';

/**
 * Project Schema for BuildOps AI Smart Construction Data Management
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Site location is required'],
      trim: true,
    },
    manager: {
      type: String,
      required: [true, 'Project manager is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Expected end date is required'],
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress must be at least 0%'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    status: {
      type: String,
      required: [true, 'Project status is required'],
      enum: {
        values: ['Planning', 'In Progress', 'On Hold', 'Completed'],
        message: '{VALUE} is not a valid project status. Allowed: Planning, In Progress, On Hold, Completed',
      },
      default: 'Planning',
    },
    risk: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid risk level. Allowed: Low, Medium, High',
      },
      default: 'Low',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validation hook: ensure endDate is not earlier than startDate
projectSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (end < start) {
      this.invalidate('endDate', 'Expected end date cannot be earlier than start date');
    }
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
