import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Helper to generate signed JWT for authenticated user
 * @param {Object} user
 * @returns {string}
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'buildflow_super_secret_jwt_key_2025_secure_auth_token';
  if (!secret) {
    throw new Error('JWT_SECRET is missing in server environment.');
  }
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : null,
    },
    secret,
    { expiresIn: '30d' }
  );
};

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizationName, organizationLocation } = req.body || {};

    // 1. Validation: Required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // 3. Create user (password is automatically hashed via User schema pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role && typeof role === 'string' ? role.trim() : 'Project Manager',
    });

    // 4. Guarantee isolated Organization workspace for every new user
    const Organization = (await import('../models/Organization.js')).default;
    const resolvedOrgName = (organizationName && organizationName.trim()) || `${name.trim()}'s Organization`;
    const resolvedOrgLocation = (organizationLocation && organizationLocation.trim()) || 'Ahmedabad';

    const newOrg = await Organization.create({
      name: resolvedOrgName,
      location: resolvedOrgLocation,
      type: 'General Contractor',
      adminUser: user._id,
      members: [{ user: user._id, role: user.role, joinedAt: new Date() }],
    });

    user.organizationId = newOrg._id;
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Authenticate user & return JWT token
 * @route  POST /api/auth/login
 * @access Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user and explicitly include password field
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Ensure user always has an associated organizationId
    if (!user.organizationId) {
      const Organization = (await import('../models/Organization.js')).default;
      let org = await Organization.findOne({ adminUser: user._id });
      if (!org) {
        org = await Organization.create({
          name: `${user.name}'s Organization`,
          location: 'Ahmedabad',
          type: 'General Contractor',
          adminUser: user._id,
          members: [{ user: user._id, role: user.role, joinedAt: new Date() }],
        });
      }
      user.organizationId = org._id;
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? user.organizationId.toString() : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get authenticated user profile
 * @route  GET /api/auth/me
 * @access Private (Requires JWT)
 */
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User context not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId ? req.user.organizationId.toString() : null,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Logout user & invalidate session
 * @route  POST /api/auth/logout
 * @access Public / Authenticated
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

