import BusinessConnection, {
  ALLOWED_PERMISSIONS,
} from '../models/BusinessConnection.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { sharedDataService } from '../services/sharedDataService.js';

/**
 * Controller handling B2B Business Connections and Controlled Data Sharing
 */
export const businessConnectionController = {
  /**
   * @route   POST /api/business-connections
   * @desc    Request a new business connection with another organization
   * @access  Private
   */
  async createConnection(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(400).json({
          success: false,
          message: 'Your user account must be associated with an organization to connect with partners.',
        });
      }

      const { receivingOrganizationId, permissions, purpose } = req.body || {};

      if (!receivingOrganizationId) {
        return res.status(400).json({
          success: false,
          message: 'Receiving organization ID is required.',
        });
      }

      // Prevent self-connection
      if (myOrgId.toString() === receivingOrganizationId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'An organization cannot establish a business connection with itself.',
        });
      }

      // Verify receiving organization exists
      const receivingOrg = await Organization.findById(receivingOrganizationId);
      if (!receivingOrg) {
        return res.status(404).json({
          success: false,
          message: 'Target organization not found.',
        });
      }

      const requestingOrg = await Organization.findById(myOrgId);
      if (!requestingOrg) {
        return res.status(404).json({
          success: false,
          message: 'Your organization record could not be found.',
        });
      }

      // Check for existing active or pending connection between the two organizations
      const existingConnection = await BusinessConnection.findOne({
        $or: [
          { requestingOrganization: myOrgId, receivingOrganization: receivingOrganizationId },
          { requestingOrganization: receivingOrganizationId, receivingOrganization: myOrgId },
        ],
        status: { $in: ['Pending', 'Accepted', 'Suspended'] },
      });

      if (existingConnection) {
        return res.status(400).json({
          success: false,
          message: `A connection already exists between these organizations (Status: ${existingConnection.status}).`,
        });
      }

      // Validate permissions if provided
      let cleanPermissions = ['MATERIAL_ORDERS', 'DELIVERY_STATUS', 'DOCUMENTS'];
      if (Array.isArray(permissions) && permissions.length > 0) {
        cleanPermissions = permissions.filter((p) => ALLOWED_PERMISSIONS.includes(p));
      }

      const connection = await BusinessConnection.create({
        requestingOrganization: myOrgId,
        receivingOrganization: receivingOrganizationId,
        requestedBy: req.user._id,
        permissions: cleanPermissions,
        purpose: purpose ? purpose.trim() : 'General construction operations collaboration',
        status: 'Pending',
      });

      // Populate for response
      const populated = await BusinessConnection.findById(connection._id)
        .populate('requestingOrganization', 'name location type code')
        .populate('receivingOrganization', 'name location type code')
        .populate('requestedBy', 'name email role');

      // Create Notification for the receiving organization
      await Notification.create({
        recipientOrganization: receivingOrganizationId,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_CONNECTION_REQUEST',
        title: 'New Business Connection Request',
        message: `${requestingOrg.name} (${requestingOrg.location}) has sent a business collaboration request.`,
        link: '/network',
      });

      // Create Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_CONNECTION_REQUESTED',
        targetOrganization: receivingOrganizationId,
        targetResource: connection._id.toString(),
        details: {
          permissions: cleanPermissions,
          purpose: connection.purpose,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Business connection request sent successfully.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/business-connections
   * @desc    Retrieve all business connections for caller's organization
   * @access  Private
   */
  async getConnections(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: 'User has no organization affiliation.',
        });
      }

      const { status } = req.query;
      const query = {
        $or: [{ requestingOrganization: myOrgId }, { receivingOrganization: myOrgId }],
      };

      if (status && status !== 'ALL') {
        query.status = status;
      }

      const connections = await BusinessConnection.find(query)
        .populate('requestingOrganization', 'name location type code')
        .populate('receivingOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('acceptedBy', 'name email role')
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        count: connections.length,
        data: connections,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/business-connections/:id
   * @desc    Get specific business connection details
   * @access  Private
   */
  async getConnectionById(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;

      const connection = await BusinessConnection.findById(id)
        .populate('requestingOrganization', 'name location type code')
        .populate('receivingOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('acceptedBy', 'name email role');

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      // Verify authorization: caller's organization must be a participant
      const reqId = connection.requestingOrganization._id.toString();
      const recId = connection.receivingOrganization._id.toString();
      if (!myOrgId || (myOrgId.toString() !== reqId && myOrgId.toString() !== recId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not belong to an organization in this connection.',
        });
      }

      res.status(200).json({
        success: true,
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-connections/:id/accept
   * @desc    Accept a pending connection request
   * @access  Private (Receiving organization only)
   */
  async acceptConnection(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;

      const connection = await BusinessConnection.findById(id)
        .populate('requestingOrganization', 'name location')
        .populate('receivingOrganization', 'name location');

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      // Crucial Security Rule: Only the RECEIVING organization can accept a request!
      const recOrgId = connection.receivingOrganization._id.toString();
      if (!myOrgId || myOrgId.toString() !== recOrgId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only members of the receiving organization can accept this connection.',
        });
      }

      if (connection.status === 'Accepted') {
        return res.status(400).json({
          success: false,
          message: 'This business connection is already accepted.',
        });
      }

      connection.status = 'Accepted';
      connection.acceptedBy = req.user._id;
      await connection.save();

      // Notify the requesting organization
      await Notification.create({
        recipientOrganization: connection.requestingOrganization._id,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_CONNECTION_ACCEPTED',
        title: 'Business Connection Accepted',
        message: `${connection.receivingOrganization.name} (${connection.receivingOrganization.location}) has accepted your partnership request.`,
        link: '/network',
      });

      // Create Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_CONNECTION_ACCEPTED',
        targetOrganization: connection.requestingOrganization._id,
        targetResource: connection._id.toString(),
        details: {
          acceptedPermissions: connection.permissions,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Business connection accepted. Data sharing is now active.',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-connections/:id/reject
   * @desc    Reject a pending connection request
   * @access  Private (Receiving organization only)
   */
  async rejectConnection(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;
      const { reason } = req.body || {};

      const connection = await BusinessConnection.findById(id)
        .populate('requestingOrganization', 'name location')
        .populate('receivingOrganization', 'name location');

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      // Security: Only receiving organization can reject
      const recOrgId = connection.receivingOrganization._id.toString();
      if (!myOrgId || myOrgId.toString() !== recOrgId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only members of the receiving organization can reject this connection.',
        });
      }

      connection.status = 'Rejected';
      if (reason) connection.rejectionReason = reason.trim();
      await connection.save();

      // Notify requesting organization
      await Notification.create({
        recipientOrganization: connection.requestingOrganization._id,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_CONNECTION_REJECTED',
        title: 'Business Connection Declined',
        message: `${connection.receivingOrganization.name} was unable to accept your connection request.`,
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_CONNECTION_REJECTED',
        targetOrganization: connection.requestingOrganization._id,
        targetResource: connection._id.toString(),
        details: { reason: connection.rejectionReason },
      });

      res.status(200).json({
        success: true,
        message: 'Business connection rejected.',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-connections/:id/suspend
   * @desc    Temporarily suspend an active connection
   * @access  Private (Either participating organization)
   */
  async suspendConnection(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;
      const { reason } = req.body || {};

      const connection = await BusinessConnection.findById(id);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      const reqId = connection.requestingOrganization.toString();
      const recId = connection.receivingOrganization.toString();
      if (!myOrgId || (myOrgId.toString() !== reqId && myOrgId.toString() !== recId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not belong to an organization in this connection.',
        });
      }

      connection.status = 'Suspended';
      if (reason) connection.suspendedReason = reason.trim();
      await connection.save();

      const otherOrgId = myOrgId.toString() === reqId ? recId : reqId;

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_CONNECTION_SUSPENDED',
        targetOrganization: otherOrgId,
        targetResource: connection._id.toString(),
        details: { reason: connection.suspendedReason },
      });

      res.status(200).json({
        success: true,
        message: 'Business connection suspended. Data sharing paused.',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-connections/:id/permissions
   * @desc    Update data sharing permissions for an active connection
   * @access  Private
   */
  async updatePermissions(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;
      const { permissions } = req.body || {};

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be provided as an array.',
        });
      }

      const connection = await BusinessConnection.findById(id);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      const reqId = connection.requestingOrganization.toString();
      const recId = connection.receivingOrganization.toString();
      if (!myOrgId || (myOrgId.toString() !== reqId && myOrgId.toString() !== recId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not belong to an organization in this connection.',
        });
      }

      const cleanPermissions = permissions.filter((p) => ALLOWED_PERMISSIONS.includes(p));
      const oldPermissions = [...connection.permissions];
      connection.permissions = cleanPermissions;
      await connection.save();

      const otherOrgId = myOrgId.toString() === reqId ? recId : reqId;

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'DATA_PERMISSION_GRANTED',
        targetOrganization: otherOrgId,
        targetResource: connection._id.toString(),
        details: {
          previousPermissions: oldPermissions,
          updatedPermissions: cleanPermissions,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Data sharing permissions updated successfully.',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/business-connections/:id
   * @desc    Terminate a business connection
   * @access  Private
   */
  async deleteConnection(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      const { id } = req.params;

      const connection = await BusinessConnection.findById(id);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Business connection not found.',
        });
      }

      const reqId = connection.requestingOrganization.toString();
      const recId = connection.receivingOrganization.toString();
      if (!myOrgId || (myOrgId.toString() !== reqId && myOrgId.toString() !== recId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not belong to an organization in this connection.',
        });
      }

      connection.status = 'Terminated';
      await connection.save();

      const otherOrgId = myOrgId.toString() === reqId ? recId : reqId;

      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_CONNECTION_TERMINATED',
        targetOrganization: otherOrgId,
        targetResource: connection._id.toString(),
      });

      res.status(200).json({
        success: true,
        message: 'Business connection terminated.',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/business-connections/:id/shared-data
   * @desc    Access controlled shared data from partner organization
   * @access  Private
   */
  async getSharedData(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(400).json({
          success: false,
          message: 'User is not associated with an organization.',
        });
      }

      const { id } = req.params;
      const { category } = req.query;

      const sharedData = await sharedDataService.getSharedDataForConnection(
        id,
        myOrgId,
        category
      );

      res.status(200).json({
        success: true,
        data: sharedData,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  /**
   * @route   GET /api/business-connections/audit-logs
   * @desc    Retrieve B2B collaboration audit trail for caller's organization
   * @access  Private
   */
  async getAuditLogs(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const logs = await AuditLog.find({
        $or: [{ organization: myOrgId }, { targetOrganization: myOrgId }],
      })
        .populate('actor', 'name email role')
        .populate('organization', 'name location')
        .populate('targetOrganization', 'name location')
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },
};
