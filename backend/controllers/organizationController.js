import Organization from '../models/Organization.js';
import User from '../models/User.js';
import BusinessConnection from '../models/BusinessConnection.js';

/**
 * Controller for Organization management & directory search
 */
export const organizationController = {
  /**
   * @route   GET /api/organizations
   * @desc    List registered organizations for discovery & partnership
   * @access  Private (JWT protected)
   */
  async getOrganizations(req, res, next) {
    try {
      const { search, type, location } = req.query;
      const filter = {};

      // Exclude caller's own organization if known
      if (req.user?.organizationId) {
        filter._id = { $ne: req.user.organizationId };
      }

      if (type && type !== 'All') {
        filter.type = type;
      }

      if (location && location !== 'All') {
        filter.location = new RegExp(location.trim(), 'i');
      }

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { name: searchRegex },
          { location: searchRegex },
          { type: searchRegex },
          { code: searchRegex },
        ];
      }

      const organizations = await Organization.find(filter)
        .select('name type location code description createdAt isVerified')
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        count: organizations.length,
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/organizations/my
   * @desc    Get caller's own organization details
   * @access  Private
   */
  async getMyOrganization(req, res, next) {
    try {
      if (!req.user?.organizationId) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'User is not currently assigned to an organization.',
        });
      }

      const organization = await Organization.findById(req.user.organizationId)
        .populate('adminUser', 'name email role')
        .populate('members.user', 'name email role');

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization record not found.',
        });
      }

      // Count active connections
      const activeConnectionsCount = await BusinessConnection.countDocuments({
        $or: [
          { requestingOrganization: organization._id },
          { receivingOrganization: organization._id },
        ],
        status: 'Accepted',
      });

      const pendingRequestsCount = await BusinessConnection.countDocuments({
        receivingOrganization: organization._id,
        status: 'Pending',
      });

      res.status(200).json({
        success: true,
        data: {
          ...organization.toObject(),
          stats: {
            activeConnectionsCount,
            pendingRequestsCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/organizations
   * @desc    Create or update organization for authenticated user
   * @access  Private
   */
  async createOrganization(req, res, next) {
    try {
      const { name, type, location, code, description } = req.body || {};

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Organization name is required.',
        });
      }

      if (!location || !location.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Organization location/city is required.',
        });
      }

      const cleanName = name.trim();
      const cleanLocation = location.trim();

      // Check if user already has an organization
      if (req.user.organizationId) {
        const existing = await Organization.findById(req.user.organizationId);
        if (existing) {
          existing.name = cleanName;
          if (type) existing.type = type;
          existing.location = cleanLocation;
          if (code) existing.code = code.trim().toUpperCase();
          if (description !== undefined) existing.description = description.trim();
          await existing.save();

          return res.status(200).json({
            success: true,
            message: 'Organization updated successfully.',
            data: existing,
          });
        }
      }

      // Create new organization
      const newOrg = await Organization.create({
        name: cleanName,
        type: type || 'General Contractor',
        location: cleanLocation,
        code: code ? code.trim().toUpperCase() : undefined,
        description: description ? description.trim() : '',
        adminUser: req.user._id,
        members: [
          {
            user: req.user._id,
            role: req.user.role || 'Admin',
            joinedAt: new Date(),
          },
        ],
      });

      // Update user's organizationId
      req.user.organizationId = newOrg._id;
      await User.findByIdAndUpdate(req.user._id, { organizationId: newOrg._id });

      res.status(201).json({
        success: true,
        message: 'Organization created successfully.',
        data: newOrg,
      });
    } catch (error) {
      next(error);
    }
  },
};
