import mongoose from 'mongoose';

/**
 * Notification Schema for BuildOps AI B2B Network
 * Informs organizations and their members about business connection events.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Recipient organization is required'],
      index: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Sender organization is required'],
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'BUSINESS_CONNECTION_REQUEST',
        'BUSINESS_CONNECTION_ACCEPTED',
        'BUSINESS_CONNECTION_REJECTED',
        'BUSINESS_CONNECTION_SUSPENDED',
        'BUSINESS_TRANSACTION_REQUEST',
        'BUSINESS_TRANSACTION_ACCEPTED',
        'BUSINESS_TRANSACTION_REJECTED',
        'BUSINESS_TRANSACTION_STARTED',
        'BUSINESS_TRANSACTION_COMPLETED',
        'BUSINESS_TRANSACTION_CANCELLED',
        'SYSTEM',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: '/network',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientOrganization: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
