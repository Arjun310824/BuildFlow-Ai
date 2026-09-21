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
    financialAccessPasswordHash: {
      type: String,
      select: false,
      default: null,
    },
    financialFailedAttempts: {
      type: Number,
      default: 0,
    },
    financialLockUntil: {
      type: Date,
      default: null,
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

// Set and hash Financial Security Password
userSchema.methods.setFinancialPassword = async function (newPassword) {
  const salt = await bcrypt.genSalt(10);
  this.financialAccessPasswordHash = await bcrypt.hash(newPassword, salt);
  this.financialFailedAttempts = 0;
  this.financialLockUntil = null;
  return this.save();
};

// Compare candidate Financial Security Password
userSchema.methods.compareFinancialPassword = async function (candidatePassword) {
  if (!this.financialAccessPasswordHash) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.financialAccessPasswordHash);
};

// Check if financial unlock is temporarily locked out due to failed attempts
userSchema.methods.isFinancialRateLimited = function () {
  return Boolean(this.financialLockUntil && this.financialLockUntil > new Date());
};

// Record failed financial unlock attempt and trigger 15-min cooldown if >= 5 attempts
userSchema.methods.recordFailedFinancialAttempt = async function () {
  this.financialFailedAttempts = (this.financialFailedAttempts || 0) + 1;
  if (this.financialFailedAttempts >= 5) {
    this.financialLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute cooldown
  }
  return this.save();
};

// Reset failed attempts upon successful financial unlock
userSchema.methods.resetFinancialAttempts = async function () {
  if (this.financialFailedAttempts > 0 || this.financialLockUntil) {
    this.financialFailedAttempts = 0;
    this.financialLockUntil = null;
    return this.save();
  }
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
    hasFinancialPassword: Boolean(this.financialAccessPasswordHash),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
