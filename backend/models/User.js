import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      default: 'Project Manager',
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe representation without sensitive fields
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    organizationId: this.organizationId ? this.organizationId.toString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
