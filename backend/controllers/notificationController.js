import Notification from '../models/Notification.js';

export const notificationController = {
  /**
   * @route   GET /api/notifications
   * @desc    Get all notifications for caller's organization
   * @access  Private
   */
  async getNotifications(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(200).json({
          success: true,
          count: 0,
          unreadCount: 0,
          data: [],
        });
      }

      const notifications = await Notification.find({
        recipientOrganization: myOrgId,
      })
        .populate('senderOrganization', 'name location type')
        .populate('senderUser', 'name email role')
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = await Notification.countDocuments({
        recipientOrganization: myOrgId,
        read: false,
      });

      res.status(200).json({
        success: true,
        count: notifications.length,
        unreadCount,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/notifications/:id/read
   * @desc    Mark a notification as read
   * @access  Private
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const myOrgId = req.user?.organizationId;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientOrganization: myOrgId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied.',
        });
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PATCH /api/notifications/read-all
   * @desc    Mark all notifications for caller's organization as read
   * @access  Private
   */
  async markAllAsRead(req, res, next) {
    try {
      const myOrgId = req.user?.organizationId;
      if (!myOrgId) {
        return res.status(200).json({ success: true, count: 0 });
      }

      const result = await Notification.updateMany(
        { recipientOrganization: myOrgId, read: false },
        { read: true }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        count: result.modifiedCount,
      });
    } catch (error) {
      next(error);
    }
  },
};
