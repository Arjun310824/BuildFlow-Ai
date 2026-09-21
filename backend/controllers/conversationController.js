import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Project from '../models/Project.js';
import { chatWithProject } from '../services/projectAnalysisService.js';

/**
 * Deterministically generates a clean, concise conversation title (max 50 chars) from the first message
 * @param {string} message
 * @param {string} projectName
 * @returns {string}
 */
export const generateConversationTitle = (message, projectName) => {
  if (!message || typeof message !== 'string') {
    return projectName && projectName !== 'All Projects' ? `Project: ${projectName}` : 'New Conversation';
  }

  const m = message.trim();
  const lower = m.toLowerCase();

  let baseTitle = '';
  if (lower.includes('delayed task') || lower.includes('tasks are delayed') || lower.includes('which tasks are delayed')) {
    baseTitle = 'Delayed Tasks';
  } else if (lower.includes('material') && (lower.includes('low') || lower.includes('stock') || lower.includes('shortage'))) {
    baseTitle = 'Material Availability';
  } else if (lower.includes('project summary') || lower.includes('summary of') || lower.includes('give me a project summary')) {
    baseTitle = 'Project Summary';
  } else if (lower.includes('risk') || lower.includes('at risk')) {
    baseTitle = 'Risk Analysis';
  } else if (lower.includes('progress') || lower.includes('current progress')) {
    baseTitle = 'Project Progress';
  } else if (lower.includes('boq')) {
    baseTitle = 'BOQ Inquiry';
  } else if (lower.includes('concrete') || lower.includes('curing')) {
    baseTitle = 'Concrete & Curing';
  } else if (lower.includes('inspection') || lower.includes('site inspection')) {
    baseTitle = 'Site Inspection';
  } else if (lower.includes('document') || lower.includes('pdf') || lower.includes('report')) {
    baseTitle = 'Document Analysis';
  } else {
    // Strip ending punctuation and take short snippet
    const cleaned = m.replace(/[?!.]+$/, '').trim();
    baseTitle = cleaned.length > 38 ? cleaned.slice(0, 35) + '…' : cleaned;
  }

  // Append project name if helpful and fits within length
  if (projectName && projectName !== 'All Projects') {
    const shortProj = projectName.split(' ')[0] || projectName;
    if ((baseTitle + ' — ' + shortProj).length <= 48) {
      return `${baseTitle} — ${shortProj}`;
    }
  }

  return baseTitle.slice(0, 50);
};

/**
 * @desc   Get all conversations sorted by last update
 * @route  GET /api/ai/conversations
 * @access Public
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || 'default-user';

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title projectId projectName createdAt updatedAt messages')
      .lean();

    const formatted = conversations.map((c) => ({
      _id: c._id.toString(),
      id: c._id.toString(),
      title: c.title,
      projectId: c.projectId ? c.projectId.toString() : 'all',
      projectName: c.projectName || 'All Projects',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages ? c.messages.length : 0,
      lastMessageSnippet:
        c.messages && c.messages.length > 0
          ? c.messages[c.messages.length - 1].content.slice(0, 60)
          : '',
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single conversation by ID with full message list
 * @route  GET /api/ai/conversations/:id
 * @access Public
 */
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid conversation ID format: ${id}`,
      });
    }

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Conversation not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...conversation,
        id: conversation._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create a new conversation
 * @route  POST /api/ai/conversations
 * @access Public
 */
export const createConversation = async (req, res, next) => {
  try {
    const { title, projectId, projectName, userId = 'default-user' } = req.body;

    let resolvedProjectName = projectName || 'All Projects';
    let validProjectId = null;

    if (projectId && projectId !== 'all' && mongoose.Types.ObjectId.isValid(projectId)) {
      validProjectId = projectId;
      const proj = await Project.findById(projectId).select('name').lean();
      if (proj) {
        resolvedProjectName = proj.name;
      }
    }

    const initialTitle = (title || '').trim() || (resolvedProjectName !== 'All Projects' ? `Project: ${resolvedProjectName}` : 'New Conversation');

    const conversation = await Conversation.create({
      title: initialTitle.slice(0, 100),
      userId,
      projectId: validProjectId,
      projectName: resolvedProjectName,
      messages: [],
    });

    return res.status(201).json({
      success: true,
      data: {
        ...conversation.toObject(),
        id: conversation._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Send a message to an existing conversation (saves user msg, queries Gemini, saves assistant msg)
 * @route  POST /api/ai/conversations/:id/messages
 * @access Public
 */
export const sendMessageToConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, images = [], documents = [], projectId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid conversation ID format: ${id}`,
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Conversation not found with ID: ${id}`,
      });
    }

    const cleanMessage = (message || '').trim();
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasDocs = Array.isArray(documents) && documents.length > 0;

    if (!cleanMessage && !hasImages && !hasDocs) {
      return res.status(400).json({
        success: false,
        error: 'Message, document, or image attachment is required.',
      });
    }

    // Resolve target project context (from payload or conversation record)
    let targetProjectId = projectId !== undefined ? projectId : conversation.projectId;
    if (targetProjectId === 'all') {
      targetProjectId = null;
    }

    // Update conversation project if changed in request
    if (projectId !== undefined) {
      if (projectId && projectId !== 'all' && mongoose.Types.ObjectId.isValid(projectId)) {
        conversation.projectId = projectId;
        const pRecord = await Project.findById(projectId).select('name').lean();
        if (pRecord) conversation.projectName = pRecord.name;
      } else {
        conversation.projectId = null;
        conversation.projectName = 'All Projects';
      }
    }

    // Build image metadata for MongoDB storage (NO large binary storage!)
    const imageMeta = hasImages
      ? images.map((img) => ({
          name: img.name || 'image.png',
          size: img.size || 0,
          mimeType: img.mimeType || 'image/jpeg',
        }))
      : [];

    // Build document metadata for MongoDB storage (NO large binary storage!)
    const documentMeta = hasDocs
      ? documents.map((doc) => ({
          name: doc.name || 'document.pdf',
          size: doc.size || 0,
          mimeType: doc.mimeType || 'application/pdf',
        }))
      : [];

    // 1. Append User Message
    const userMessage = {
      role: 'user',
      content: cleanMessage || (hasDocs ? `Uploaded Document: ${documentMeta[0]?.name}` : `Uploaded Image: ${imageMeta[0]?.name}`),
      projectId: conversation.projectId,
      imageMeta,
      documentMeta,
    };
    conversation.messages.push(userMessage);

    // 2. Fetch recent conversation history for context continuity (last 15 messages)
    const recentHistory = conversation.messages.slice(-15).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 3. Call Gemini with Real Project Context, Images, Documents, and History
    let chatResult = null;
    try {
      chatResult = await chatWithProject(targetProjectId, cleanMessage, images, documents, recentHistory);
    } catch (apiError) {
      console.error(`[Conversation AI Error] ${apiError.message}`);
      // If validation error (400) or not found (404), return immediately WITHOUT saving fake message
      const status = apiError.statusCode || 502;
      return res.status(status).json({
        success: false,
        error: apiError.message || "BuildOps AI couldn't generate a response. Please try again.",
      });
    }

    const aiAnswer = typeof chatResult === 'object' ? chatResult.answer : (chatResult || '');
    const sources = typeof chatResult === 'object' ? (chatResult.sources || []) : [];
    const confidence = typeof chatResult === 'object' ? (chatResult.confidence || 'High') : 'High';

    // 4. Append Assistant Response
    const assistantMessage = {
      role: 'assistant',
      content: aiAnswer,
      sources,
      confidence,
      projectId: conversation.projectId,
    };
    conversation.messages.push(assistantMessage);

    // 5. Update title if this is the first turn or default title
    if (conversation.messages.length <= 2 || conversation.title === 'New Conversation') {
      conversation.title = generateConversationTitle(cleanMessage, conversation.projectName);
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(200).json({
      success: true,
      answer: aiAnswer,
      sources,
      confidence,
      conversation: {
        ...conversation.toObject(),
        id: conversation._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete conversation by ID
 * @route  DELETE /api/ai/conversations/:id
 * @access Public
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid conversation ID format: ${id}`,
      });
    }

    const conversation = await Conversation.findByIdAndDelete(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: `Conversation not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
