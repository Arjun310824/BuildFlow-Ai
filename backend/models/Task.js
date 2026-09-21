import mongoose from 'mongoose';

/**
 * Task Schema for BuildOps AI Smart Construction Data Management
 */
const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      required: [true, 'Task status is required'],
      enum: {
        values: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
        message: '{VALUE} is not a valid task status. Allowed: Not Started, In Progress, Completed, Delayed',
      },
      default: 'Not Started',
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress must be at least 0%'],
      max: [100, 'Progress cannot exceed 100%'],
    },
    priority: {
      type: String,
      required: [true, 'Task priority is required'],
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority. Allowed: Low, Medium, High, Critical',
      },
      default: 'Medium',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validation hook: ensure dueDate is not earlier than startDate if startDate is provided
taskSchema.pre('validate', function (next) {
  if (this.startDate && this.dueDate) {
    const start = new Date(this.startDate);
    const due = new Date(this.dueDate);
    if (due < start) {
      this.invalidate('dueDate', 'Due date cannot be earlier than start date');
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
