import mongoose from 'mongoose';

/**
 * Helper function to determine material status based on available vs required quantities
 * @param {number} availableQuantity
 * @param {number} requiredQuantity
 * @returns {'Available' | 'Low Stock' | 'Out of Stock'}
 */
export const computeMaterialStatus = (availableQuantity, requiredQuantity) => {
  const avail = Number(availableQuantity);
  const req = Number(requiredQuantity);

  if (avail <= 0) {
    return 'Out of Stock';
  }
  if (req > 0 && avail <= 0.2 * req) {
    return 'Low Stock';
  }
  return 'Available';
};

/**
 * Material Schema for BuildOps AI Smart Construction Data Management
 */
const materialSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Material category is required'],
      trim: true,
    },
    requiredQuantity: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [0, 'Required quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    usedQuantity: {
      type: Number,
      required: [true, 'Used quantity is required'],
      min: [0, 'Used quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Low Stock', 'Out of Stock'],
        message: '{VALUE} is not a valid material status. Allowed: Available, Low Stock, Out of Stock',
      },
      default: 'Available',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validation hook: automatically compute status based on available & required quantities
materialSchema.pre('validate', function (next) {
  if (this.availableQuantity !== undefined && this.requiredQuantity !== undefined) {
    this.status = computeMaterialStatus(this.availableQuantity, this.requiredQuantity);
  }
  next();
});

const Material = mongoose.model('Material', materialSchema);

export default Material;
