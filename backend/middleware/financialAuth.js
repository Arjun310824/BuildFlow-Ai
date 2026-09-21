import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const AUTHORIZED_FINANCIAL_ROLES = [
  'Admin',
  'Project Manager',
  'Construction Manager',
  'Project Coordinator',
  'Financial Manager',
  'Owner',
  'General Contractor',
  'Site Engineer',
];

/**
 * Middleware to enforce Project Financial authorization & IDOR protection
 * Verifies:
 * 1. User Authentication (JWT)
 * 2. RBAC: User has an authorized operational role
 * 3. Project validity: Project exists in MongoDB
 * 4. IDOR Protection: Caller's organization owns the project
 * 5. Optional Secondary Security: If user configured a master financial password, requires active 15m financialToken
 */
export const protectFinancialAccess = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in first.',
    });
  }

  // 1. RBAC check
  if (user.role && !AUTHORIZED_FINANCIAL_ROLES.includes(user.role)) {
    return res.status(403).json({
      success: false,
      isFinancialLocked: true,
      message: `Access denied. Role "${user.role}" is not authorized to access project financials.`,
    });
  }

  // 2. Resolve project ID from params, body, or query
  const projectId =
    req.params.projectId ||
    req.body.projectId ||
    req.query.projectId ||
    (req.params.id && req.baseUrl.includes('projects') ? req.params.id : null);

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid Project ID is required for financial operations.',
    });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found.`,
      });
    }

    // Server-side Organization Ownership check (Prevent IDOR across organizations)
    if (project.organizationId && user.organizationId) {
      if (project.organizationId.toString() !== user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          isFinancialLocked: true,
          message: 'Access denied. You do not have permission to access financials for this project.',
        });
      }
    }

    // 3. Extract and verify secondary Financial Access Token (if provided or required)
    const financialToken =
      req.headers['x-financial-access-token'] ||
      req.headers['financial-token'] ||
      req.query.financialToken;

    if (financialToken) {
      try {
        const decoded = jwt.verify(financialToken, process.env.JWT_SECRET);

        // Verify scope
        if (decoded.scope !== 'financial_access') {
          return res.status(403).json({
            success: false,
            isFinancialLocked: true,
            message: 'Invalid financial token scope.',
          });
        }

        // Verify user identity match
        if (decoded.userId !== user._id.toString()) {
          return res.status(403).json({
            success: false,
            isFinancialLocked: true,
            message: 'Financial token belongs to a different user session.',
          });
        }

        // Project-Specific Security (Prevent IDOR between projects):
        // Token for Project A CANNOT be used to access Project B
        if (decoded.projectId !== projectId.toString()) {
          return res.status(403).json({
            success: false,
            isFinancialLocked: true,
            message: 'Financial authorization token is not valid for this project.',
          });
        }

        req.project = project;
        req.financialAccess = decoded;
        return next();
      } catch (tokenErr) {
        if (tokenErr.name === 'TokenExpiredError') {
          try {
            if (user.organizationId || project.organizationId) {
              await AuditLog.create({
                actor: user._id,
                organization: user.organizationId || project.organizationId,
                action: 'FINANCIAL_ACCESS_EXPIRED',
                targetResource: `Project:${projectId}`,
                details: { projectId, message: 'Financial access session expired' },
                ipAddress: req.ip || '',
              });
            }
          } catch (logErr) {
            console.error('[Financial Auth] AuditLog error:', logErr.message);
          }
          return res.status(403).json({
            success: false,
            isFinancialLocked: true,
            isExpired: true,
            message: 'Financial access session has expired. Please unlock again.',
          });
        }

        return res.status(403).json({
          success: false,
          isFinancialLocked: true,
          message: 'Invalid or malformed financial authorization token.',
        });
      }
    }

    // If no secondary token is supplied, check if user has set up a secondary password lock
    const userDoc = await User.findById(user._id).select('+financialAccessPasswordHash');
    if (userDoc && userDoc.financialAccessPasswordHash) {
      return res.status(403).json({
        success: false,
        isFinancialLocked: true,
        message: 'Financial authorization required. Please unlock project financials with your password.',
      });
    }

    // User is authorized via standard authenticated RBAC & Organization membership
    req.project = project;
    return next();
  } catch (err) {
    next(err);
  }
};

export default protectFinancialAccess;
