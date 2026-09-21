import mongoose from 'mongoose';

/**
 * Organization Schema for BuildOps AI B2B Network
 * Represents a builder, contractor, supplier, or infrastructure company.
 */
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [150, 'Organization name cannot exceed 150 characters'],
    },
    type: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: {
        values: [
          'General Contractor',
          'Subcontractor',
          'Material Supplier',
          'Infrastructure Developer',
          'Engineering Consultant',
          'Village Builder',
          'Commercial Builder',
        ],
        message: '{VALUE} is not a supported organization type',
      },
      default: 'General Contractor',
    },
    location: {
      type: String,
      required: [true, 'Organization location/city is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          default: 'Member',
          trim: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Search and lookup index
organizationSchema.index({ name: 'text', location: 'text' });
organizationSchema.index({ code: 1 });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
