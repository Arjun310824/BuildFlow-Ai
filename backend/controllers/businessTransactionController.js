import BusinessTransaction from '../models/BusinessTransaction.js';
import BusinessConnection from '../models/BusinessConnection.js';
import Organization from '../models/Organization.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Safely extract string representation of an ID from raw ObjectId or populated document
 */
const toIdString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  if (typeof val.toString === 'function') return val.toString();
  return String(val);
};

/**
 * Controller for BuildOps AI B2B Business Transactions & Shared Workspace
 */
export const businessTransactionController = {
  /**
   * @route   POST /api/business-transactions
   * @desc    Create a new business transaction (Material Request / Service Request)
   * @access  Private
   */
  async createTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(400).json({
          success: false,
          message: 'Your user account must belong to an organization to initiate business requests.',
        });
      }

      const {
        recipientOrganizationId,
        connectionId,
        projectId,
        requestType,
        title,
        description,
        materialName,
        quantity,
        unit,
        items,
        requestedDate,
        expectedDeliveryDate,
      } = req.body || {};

      if (!recipientOrganizationId || !title || !expectedDeliveryDate) {
        return res.status(400).json({
          success: false,
          message: 'Recipient organization, title, and expected delivery date are required fields.',
        });
      }

      const myOrgStr = toIdString(myOrgId);
      const recipientOrgStr = toIdString(recipientOrganizationId);

      // Date Validation: expectedDeliveryDate >= requestedDate
      const reqD = requestedDate ? new Date(requestedDate) : new Date();
      const delD = new Date(expectedDeliveryDate);
      if (isNaN(delD.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid expected delivery date.',
        });
      }
      if (delD < reqD) {
        return res.status(400).json({
          success: false,
          message: 'Expected delivery date cannot be earlier than requested date.',
        });
      }

      // Prevent self-transaction
      if (myOrgStr === recipientOrgStr) {
        return res.status(400).json({
          success: false,
          message: 'An organization cannot create a business transaction with itself.',
        });
      }

      // Verify connection between organizations
      let connection;
      if (connectionId) {
        connection = await BusinessConnection.findById(connectionId);
      } else {
        connection = await BusinessConnection.findOne({
          $or: [
            { requestingOrganization: myOrgId, receivingOrganization: recipientOrganizationId },
            { requestingOrganization: recipientOrganizationId, receivingOrganization: myOrgId },
          ],
          status: 'Accepted',
        });
      }

      if (!connection) {
        return res.status(400).json({
          success: false,
          message: 'No active business connection exists with the selected organization.',
        });
      }

      if (connection.status !== 'Accepted') {
        return res.status(400).json({
          success: false,
          message: `Cannot issue request: Business connection status is '${connection.status}'. Connection must be Accepted.`,
        });
      }

      // Verify connection involvement
      const connReqStr = toIdString(connection.requestingOrganization);
      const connRecStr = toIdString(connection.receivingOrganization);

      if (myOrgStr !== connReqStr && myOrgStr !== connRecStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not part of the specified business connection.',
        });
      }

      // Check organization records
      const requesterOrg = await Organization.findById(myOrgId);
      const recipientOrg = await Organization.findById(recipientOrganizationId);

      if (!requesterOrg || !recipientOrg) {
        return res.status(404).json({
          success: false,
          message: 'One or both organization records could not be found.',
        });
      }

      // Project verification (if specified)
      let verifiedProjectId = null;
      if (projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Referenced project not found.',
          });
        }

        // Security check: Project must belong to requester's organization
        const projOrgStr = toIdString(project.organizationId);
        if (!projOrgStr || projOrgStr !== myOrgStr) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only link projects belonging to your own organization.',
          });
        }

        verifiedProjectId = project._id;
      }

      // Create Business Transaction
      const transaction = await BusinessTransaction.create({
        requesterOrganization: myOrgId,
        recipientOrganization: recipientOrganizationId,
        requestedBy: req.user._id,
        connectionId: connection._id,
        projectId: verifiedProjectId,
        requestType: requestType || 'Material Request',
        title: title.trim(),
        description: description ? description.trim() : '',
        materialName: materialName ? materialName.trim() : '',
        quantity: typeof quantity === 'number' ? quantity : Number(quantity) || 1,
        unit: unit ? unit.trim() : 'Units',
        items: Array.isArray(items) ? items : [],
        requestedDate: reqD,
        expectedDeliveryDate: delD,
        status: 'Sent',
        activityTimeline: [
          {
            status: 'Sent',
            actionBy: req.user._id,
            organization: myOrgId,
            note: 'Business transaction request created and sent',
            timestamp: new Date(),
          },
        ],
      });

      // Populate response
      const populated = await BusinessTransaction.findById(transaction._id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      // Create Notification for recipient organization
      await Notification.create({
        recipientOrganization: recipientOrganizationId,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_REQUEST',
        title: `New ${transaction.requestType}`,
        message: `${requesterOrg.name} (${requesterOrg.location}) sent you a ${transaction.requestType.toLowerCase()}: "${transaction.title}".`,
        link: '/network',
      });

      // Create Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_CREATED',
        targetOrganization: recipientOrganizationId,
        targetResource: transaction._id.toString(),
        details: {
          title: transaction.title,
          requestType: transaction.requestType,
          quantity: transaction.quantity,
          unit: transaction.unit,
          materialName: transaction.materialName,
          expectedDeliveryDate: transaction.expectedDeliveryDate,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Business transaction request created successfully.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/business-transactions
   * @desc    Get all business transactions for caller's organization
   * @access  Private
   */
  async getTransactions(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
          message: 'User is not associated with an organization.',
        });
      }

      const { status, requestType, role } = req.query;
      const query = {};
      const myOrgStr = toIdString(myOrgId);

      if (role === 'sent') {
        query.requesterOrganization = myOrgStr;
      } else if (role === 'received') {
        query.recipientOrganization = myOrgStr;
      } else {
        query.$or = [{ requesterOrganization: myOrgStr }, { recipientOrganization: myOrgStr }];
      }

      if (status && status !== 'ALL') {
        query.status = status;
      }

      if (requestType && requestType !== 'ALL') {
        query.requestType = requestType;
      }

      const transactions = await BusinessTransaction.find(query)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status')
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/business-transactions/:id
   * @desc    Get single business transaction detail (triggers auto 'Viewed' transition for recipient)
   * @access  Private
   */
  async getTransactionById(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Organization membership required.',
        });
      }

      const { id } = req.params;
      let transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Business transaction not found.',
        });
      }

      // IDOR Defense: Caller's org must be requester or recipient
      const reqOrgStr = toIdString(transaction.requesterOrganization);
      const recOrgStr = toIdString(transaction.recipientOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== reqOrgStr && myOrgStr !== recOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not belong to an organization authorized to view this transaction.',
        });
      }

      // Auto-transition to 'Viewed' if caller is recipient and current status is 'Sent'
      if (myOrgStr === recOrgStr && transaction.status === 'Sent') {
        transaction.status = 'Viewed';
        transaction.activityTimeline.push({
          status: 'Viewed',
          actionBy: req.user._id,
          organization: myOrgId,
          note: 'Request viewed by recipient organization',
          timestamp: new Date(),
        });
        await transaction.save();

        // Audit Log
        await AuditLog.create({
          actor: req.user._id,
          organization: myOrgId,
          action: 'BUSINESS_TRANSACTION_VIEWED',
          targetOrganization: transaction.requesterOrganization._id || transaction.requesterOrganization,
          targetResource: transaction._id.toString(),
        });

        // Re-query populated transaction
        transaction = await BusinessTransaction.findById(id)
          .populate('requesterOrganization', 'name location type code')
          .populate('recipientOrganization', 'name location type code')
          .populate('requestedBy', 'name email role')
          .populate('projectId', 'name location client startDate endDate status');
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-transactions/:id/view
   * @desc    Explicitly mark transaction as viewed
   * @access  Private
   */
  async markViewed(req, res, next) {
    return this.getTransactionById(req, res, next);
  },

  /**
   * @route   PATCH /api/business-transactions/:id/accept
   * @desc    Accept a business transaction request
   * @access  Private (Recipient organization only)
   */
  async acceptTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({ success: false, message: 'Organization required.' });
      }

      const { id } = req.params;
      const { responseMessage } = req.body || {};

      const transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location')
        .populate('recipientOrganization', 'name location');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      // Security: Only recipient organization can accept!
      const recOrgStr = toIdString(transaction.recipientOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== recOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only members of the recipient organization can accept this transaction.',
        });
      }

      // Validate lifecycle state transition
      if (!['Sent', 'Viewed'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept transaction with current status '${transaction.status}'. Must be Sent or Viewed.`,
        });
      }

      transaction.status = 'Accepted';
      if (responseMessage) {
        transaction.responseMessage = responseMessage.trim();
      }
      transaction.activityTimeline.push({
        status: 'Accepted',
        actionBy: req.user._id,
        organization: myOrgId,
        note: responseMessage ? responseMessage.trim() : 'Transaction request accepted',
        timestamp: new Date(),
      });
      await transaction.save();

      // Notify Requester
      await Notification.create({
        recipientOrganization: transaction.requesterOrganization._id || transaction.requesterOrganization,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_ACCEPTED',
        title: 'Business Request Accepted',
        message: `${transaction.recipientOrganization.name || 'Partner'} accepted your ${transaction.requestType.toLowerCase()}: "${transaction.title}".`,
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_ACCEPTED',
        targetOrganization: transaction.requesterOrganization._id || transaction.requesterOrganization,
        targetResource: transaction._id.toString(),
        details: { responseMessage: transaction.responseMessage },
      });

      const populated = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      res.status(200).json({
        success: true,
        message: 'Transaction accepted successfully.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-transactions/:id/reject
   * @desc    Reject a business transaction request
   * @access  Private (Recipient organization only)
   */
  async rejectTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({ success: false, message: 'Organization required.' });
      }

      const { id } = req.params;
      const { reason, responseMessage } = req.body || {};

      const transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location')
        .populate('recipientOrganization', 'name location');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      // Security: Only recipient organization can reject!
      const recOrgStr = toIdString(transaction.recipientOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== recOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only members of the recipient organization can reject this transaction.',
        });
      }

      if (!['Sent', 'Viewed'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reject transaction with status '${transaction.status}'.`,
        });
      }

      const rejectNote = reason || responseMessage || 'Declined by recipient organization';
      transaction.status = 'Rejected';
      transaction.rejectionReason = rejectNote.trim();
      transaction.activityTimeline.push({
        status: 'Rejected',
        actionBy: req.user._id,
        organization: myOrgId,
        note: rejectNote.trim(),
        timestamp: new Date(),
      });
      await transaction.save();

      // Notify Requester
      await Notification.create({
        recipientOrganization: transaction.requesterOrganization._id || transaction.requesterOrganization,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_REJECTED',
        title: 'Business Request Rejected',
        message: `${transaction.recipientOrganization.name || 'Partner'} rejected your ${transaction.requestType.toLowerCase()}: "${transaction.title}".`,
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_REJECTED',
        targetOrganization: transaction.requesterOrganization._id || transaction.requesterOrganization,
        targetResource: transaction._id.toString(),
        details: { rejectionReason: transaction.rejectionReason },
      });

      const populated = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      res.status(200).json({
        success: true,
        message: 'Transaction rejected.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-transactions/:id/start
   * @desc    Start delivery / execution of an accepted transaction
   * @access  Private (Either participating organization)
   */
  async startTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({ success: false, message: 'Organization required.' });
      }

      const { id } = req.params;
      const { note, carrier, vehicleNumber, trackingNumber } = req.body || {};

      const transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location')
        .populate('recipientOrganization', 'name location');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      const reqOrgStr = toIdString(transaction.requesterOrganization);
      const recOrgStr = toIdString(transaction.recipientOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== reqOrgStr && myOrgStr !== recOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You do not belong to an organization in this transaction.',
        });
      }

      if (transaction.status !== 'Accepted') {
        return res.status(400).json({
          success: false,
          message: `Cannot start execution on transaction with status '${transaction.status}'. Status must be Accepted.`,
        });
      }

      transaction.status = 'In Progress';
      if (carrier || vehicleNumber || trackingNumber) {
        transaction.dispatchDetails = {
          carrier: carrier || '',
          vehicleNumber: vehicleNumber || '',
          trackingNumber: trackingNumber || '',
          dispatchedAt: new Date(),
          notes: note || '',
        };
      }

      transaction.activityTimeline.push({
        status: 'In Progress',
        actionBy: req.user._id,
        organization: myOrgId,
        note: note ? note.trim() : 'Delivery and operational execution started',
        timestamp: new Date(),
      });
      await transaction.save();

      const partnerOrgId = myOrgStr === reqOrgStr ? transaction.recipientOrganization._id || transaction.recipientOrganization : transaction.requesterOrganization._id || transaction.requesterOrganization;

      // Notify Partner
      await Notification.create({
        recipientOrganization: partnerOrgId,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_STARTED',
        title: 'Delivery / Execution Started',
        message: `Delivery/execution started for "${transaction.title}".`,
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_STARTED',
        targetOrganization: partnerOrgId,
        targetResource: transaction._id.toString(),
      });

      const populated = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      res.status(200).json({
        success: true,
        message: 'Transaction execution started.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-transactions/:id/complete
   * @desc    Mark a transaction as completed
   * @access  Private (Either participating organization)
   */
  async completeTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({ success: false, message: 'Organization required.' });
      }

      const { id } = req.params;
      const { note } = req.body || {};

      const transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location')
        .populate('recipientOrganization', 'name location');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      const reqOrgStr = toIdString(transaction.requesterOrganization);
      const recOrgStr = toIdString(transaction.recipientOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== reqOrgStr && myOrgStr !== recOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You do not belong to an organization in this transaction.',
        });
      }

      if (!['In Progress', 'Accepted'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot complete transaction with status '${transaction.status}'.`,
        });
      }

      transaction.status = 'Completed';
      transaction.activityTimeline.push({
        status: 'Completed',
        actionBy: req.user._id,
        organization: myOrgId,
        note: note ? note.trim() : 'Business transaction marked as completed',
        timestamp: new Date(),
      });
      await transaction.save();

      const partnerOrgId = myOrgStr === reqOrgStr ? transaction.recipientOrganization._id || transaction.recipientOrganization : transaction.requesterOrganization._id || transaction.requesterOrganization;

      // Notify partner
      await Notification.create({
        recipientOrganization: partnerOrgId,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_COMPLETED',
        title: 'Business Transaction Completed',
        message: 'Your business transaction has been marked completed.',
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_COMPLETED',
        targetOrganization: partnerOrgId,
        targetResource: transaction._id.toString(),
      });

      const populated = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      res.status(200).json({
        success: true,
        message: 'Transaction completed successfully.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/business-transactions/:id/cancel
   * @desc    Cancel a business transaction request
   * @access  Private (Requester organization only)
   */
  async cancelTransaction(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(403).json({ success: false, message: 'Organization required.' });
      }

      const { id } = req.params;
      const { reason } = req.body || {};

      const transaction = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location')
        .populate('recipientOrganization', 'name location');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      // Security: Only requester organization can cancel!
      const reqOrgStr = toIdString(transaction.requesterOrganization);
      const myOrgStr = toIdString(myOrgId);

      if (myOrgStr !== reqOrgStr) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Only the requesting organization can cancel this transaction.',
        });
      }

      if (['Completed', 'Rejected', 'Cancelled'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel transaction with status '${transaction.status}'.`,
        });
      }

      transaction.status = 'Cancelled';
      transaction.activityTimeline.push({
        status: 'Cancelled',
        actionBy: req.user._id,
        organization: myOrgId,
        note: reason ? reason.trim() : 'Request cancelled by requesting organization',
        timestamp: new Date(),
      });
      await transaction.save();

      // Notify Recipient
      await Notification.create({
        recipientOrganization: transaction.recipientOrganization._id || transaction.recipientOrganization,
        senderOrganization: myOrgId,
        senderUser: req.user._id,
        type: 'BUSINESS_TRANSACTION_CANCELLED',
        title: 'Business Request Cancelled',
        message: `${transaction.requesterOrganization.name || 'Requester'} cancelled the ${transaction.requestType.toLowerCase()}: "${transaction.title}".`,
        link: '/network',
      });

      // Audit Log
      await AuditLog.create({
        actor: req.user._id,
        organization: myOrgId,
        action: 'BUSINESS_TRANSACTION_CANCELLED',
        targetOrganization: transaction.recipientOrganization._id || transaction.recipientOrganization,
        targetResource: transaction._id.toString(),
        details: { reason },
      });

      const populated = await BusinessTransaction.findById(id)
        .populate('requesterOrganization', 'name location type code')
        .populate('recipientOrganization', 'name location type code')
        .populate('requestedBy', 'name email role')
        .populate('projectId', 'name location client startDate endDate status');

      res.status(200).json({
        success: true,
        message: 'Transaction cancelled.',
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  },
};
