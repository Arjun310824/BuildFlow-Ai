import mongoose from 'mongoose';

/**
 * Message Schema embedded within Conversation
 */
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    imageMeta: [
      {
        name: { type: String, trim: true },
        size: { type: Number },
        mimeType: { type: String, trim: true },
      },
    ],
    documentMeta: [
      {
        name: { type: String, trim: true },
        size: { type: Number },
        mimeType: { type: String, trim: true },
      },
    ],
    sources: [
      {
        type: { type: String, trim: true },
        label: { type: String, trim: true },
      },
    ],
    confidence: {
      type: String,
      enum: ['High', 'Medium', 'Low', null],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Conversation Schema for persistent ChatGPT-style AI Workspace
 */
const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    projectName: {
      type: String,
      default: 'All Projects',
      trim: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimize query sorting by updated time
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
