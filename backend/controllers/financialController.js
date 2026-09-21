import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import {
  ProjectFinancialTransaction,
  FINANCIAL_CATEGORIES,
  FINANCIAL_TYPES,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
} from '../models/ProjectFinancialTransaction.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Calculates complete, strictly grounded financial metrics from an array of transaction documents
 */
export const calculateFinancialMetrics = (records = []) => {
  let totalRevenue = 0;
  let totalExpenses = 0;

  const expenseBreakdown = {
    Material: 0,
    Labour: 0,
    Equipment: 0,
    Transportation: 0,
    Subcontractor: 0,
    Utilities: 0,
    'Site Expense': 0,
    Other: 0,
  };

  const monthlyMap = {};

  for (const rec of records) {
    const amt = Number(rec.amount) || 0;
    const monthKey = rec.date ? new Date(rec.date).toISOString().slice(0, 7) : 'Unknown';

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0, loss: 0 };
    }

    if (rec.type === 'Revenue') {
      totalRevenue += amt;
      monthlyMap[monthKey].revenue += amt;
    } else {
      totalExpenses += amt;
      monthlyMap[monthKey].expenses += amt;

      const cat = rec.category;
      if (expenseBreakdown[cat] !== undefined) {
        expenseBreakdown[cat] += amt;
      } else if (cat === 'Permits & Fees' || cat === 'Overhead') {
        expenseBreakdown['Site Expense'] += amt;
      } else {
        expenseBreakdown.Other += amt;
      }
    }
  }

  // Calculate Profit, Loss, and Profit Margin safely
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;
  const profit = isProfit ? netProfit : 0;
  const loss = !isProfit ? Math.abs(netProfit) : 0;

  // Division-by-zero protection
  const profitMargin =
    totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

  // Determine Project Financial Status
  let financialStatus = 'No Financial Data';
  if (totalRevenue > 0 || totalExpenses > 0) {
    financialStatus = totalRevenue >= totalExpenses ? 'Profitable' : 'Loss';
  }

  // Calculate monthly profit/loss
  const monthlyBreakdown = Object.values(monthlyMap)
    .map((m) => ({
      ...m,
      profit: m.revenue >= m.expenses ? m.revenue - m.expenses : 0,
      loss: m.expenses > m.revenue ? m.expenses - m.revenue : 0,
      net: m.revenue - m.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalRevenue,
    totalExpenses,
    profit,
    loss,
    netProfit,
    isProfit,
    profitMargin,
    financialStatus,
    expenseBreakdown,
    monthlyBreakdown,
    transactionCount: records.length,
  };
};

export const financialController = {
  /**
   * @route   GET /api/financials/status
   * @desc    Check whether current user has configured Financial Security Password and lockout status
   * @access  Private (JWT)
   */
  async getFinancialStatus(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select('+financialAccessPasswordHash');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isConfigured = Boolean(user.financialAccessPasswordHash);
      const isLockedOut = user.isFinancialRateLimited ? user.isFinancialRateLimited() : false;
      const lockoutRemainingMs =
        isLockedOut && user.financialLockUntil
          ? Math.max(0, user.financialLockUntil.getTime() - Date.now())
          : 0;

      return res.status(200).json({
        success: true,
        isConfigured,
        isLockedOut,
        lockoutRemainingMs,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/financials/setup-password
   * @desc    First-time configuration of Financial Security Password
   * @access  Private (JWT)
   */
  async setupFinancialPassword(req, res, next) {
    try {
      const { password, confirmPassword } = req.body;

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Financial security password must be at least 8 characters long.',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation does not match.',
        });
      }

      const user = await User.findById(req.user._id).select('+financialAccessPasswordHash');
      if (user.financialAccessPasswordHash) {
        return res.status(400).json({
          success: false,
          message: 'Financial security password is already configured. Use change password instead.',
        });
      }

      await user.setFinancialPassword(password);

      return res.status(200).json({
        success: true,
        message: 'Financial security password configured successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/financials/change-password
   * @desc    Update existing Financial Security Password
   * @access  Private (JWT)
   */
  async changeFinancialPassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current financial security password is required.',
        });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New financial security password must be at least 8 characters long.',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match.',
        });
      }

      const user = await User.findById(req.user._id).select('+financialAccessPasswordHash');
      if (!user.financialAccessPasswordHash) {
        return res.status(400).json({
          success: false,
          message: 'No financial security password set. Use first-time setup instead.',
        });
      }

      const isMatch = await user.compareFinancialPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current financial security password is incorrect.',
        });
      }

      await user.setFinancialPassword(newPassword);

      return res.status(200).json({
        success: true,
        message: 'Financial security password updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/projects/:projectId/financials/unlock
   * @desc    Verify Financial Password, enforce rate limiting, log audit, and issue 15-min JWT
   * @access  Private (JWT)
   */
  async unlockFinancials(req, res, next) {
    try {
      const { projectId } = req.params;
      const { password } = req.body;

      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'A valid Project ID is required.',
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Financial security password is required.',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: `Project with ID ${projectId} not found.`,
        });
      }

      // Check IDOR between user and project organization
      const user = await User.findById(req.user._id).select('+financialAccessPasswordHash');
      if (project.organizationId && user.organizationId) {
        if (project.organizationId.toString() !== user.organizationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission for this project.',
          });
        }
      }

      // Check Rate Limiting
      if (user.isFinancialRateLimited && user.isFinancialRateLimited()) {
        const remainingMinutes = Math.ceil(
          (user.financialLockUntil.getTime() - Date.now()) / (60 * 1000)
        );
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Security cooldown active. Please try again in ${remainingMinutes} minute(s).`,
          lockoutRemainingMs: Math.max(0, user.financialLockUntil.getTime() - Date.now()),
        });
      }

      // Check if password has been configured
      if (!user.financialAccessPasswordHash) {
        return res.status(400).json({
          success: false,
          isNotConfigured: true,
          message: 'No financial security password has been configured yet.',
        });
      }

      // Verify password
      const isMatch = await user.compareFinancialPassword(password);

      if (!isMatch) {
        if (user.recordFailedFinancialAttempt) {
          await user.recordFailedFinancialAttempt();
        }

        try {
          if (user.organizationId || project.organizationId) {
            await AuditLog.create({
              actor: user._id,
              organization: user.organizationId || project.organizationId,
              action: 'FINANCIAL_ACCESS_UNLOCK_FAILED',
              targetResource: `Project:${projectId}`,
              details: {
                projectId,
                projectName: project.name,
                failedAttempts: user.financialFailedAttempts,
              },
              ipAddress: req.ip || '',
            });
          }
        } catch (logErr) {
          console.error('[Financial Unlock] AuditLog error:', logErr.message);
        }

        return res.status(401).json({
          success: false,
          message: 'Incorrect financial security password.',
        });
      }

      // Reset attempts
      if (user.resetFinancialAttempts) {
        await user.resetFinancialAttempts();
      }

      // Write FINANCIAL_ACCESS_UNLOCK_SUCCESS to AuditLog
      try {
        if (user.organizationId || project.organizationId) {
          await AuditLog.create({
            actor: user._id,
            organization: user.organizationId || project.organizationId,
            action: 'FINANCIAL_ACCESS_UNLOCK_SUCCESS',
            targetResource: `Project:${projectId}`,
            details: {
              projectId,
              projectName: project.name,
              sessionDurationMinutes: 15,
            },
            ipAddress: req.ip || '',
          });
        }
      } catch (logErr) {
        console.error('[Financial Unlock] AuditLog error:', logErr.message);
      }

      // Issue signed 15-minute Financial Access Token
      const financialToken = jwt.sign(
        {
          userId: user._id.toString(),
          organizationId: user.organizationId ? user.organizationId.toString() : null,
          projectId: projectId.toString(),
          scope: 'financial_access',
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.status(200).json({
        success: true,
        message: 'Financials unlocked successfully. Session active for 15 minutes.',
        financialToken,
        expiresIn: 15 * 60,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/projects/:projectId/financials/lock
   * @desc    Manually lock financials and record audit event
   * @access  Private (JWT)
   */
  async lockFinancials(req, res, next) {
    try {
      const { projectId } = req.params;
      const user = req.user;

      try {
        if (user.organizationId) {
          await AuditLog.create({
            actor: user._id,
            organization: user.organizationId,
            action: 'FINANCIAL_ACCESS_LOCKED',
            targetResource: `Project:${projectId}`,
            details: {
              projectId,
              reason: 'Manual lock requested by user',
            },
            ipAddress: req.ip || '',
          });
        }
      } catch (logErr) {
        console.error('[Financial Lock] AuditLog error:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Financials locked successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   GET /api/projects/:projectId/financials
   * @desc    Get project financial summary, KPI calculations, and filtered transactions
   * @access  Private (JWT + Financial Authorization)
   */
  async getProjectFinancials(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = req.project;
      const { type, category, paymentStatus, search, startDate, endDate } = req.query;

      // 1. Fetch all records for metrics computation
      const allRecords = await ProjectFinancialTransaction.find({ projectId }).sort({ date: -1 });

      // 2. Compute live aggregates from MongoDB records
      const summary = calculateFinancialMetrics(allRecords);

      // 3. Apply optional filtering on returned transactions list
      const queryFilter = { projectId };
      if (type && type !== 'All') {
        queryFilter.type = type;
      }
      if (category && category !== 'All') {
        queryFilter.category = category;
      }
      if (paymentStatus && paymentStatus !== 'All') {
        queryFilter.paymentStatus = paymentStatus;
      }
      if (startDate || endDate) {
        queryFilter.date = {};
        if (startDate) queryFilter.date.$gte = new Date(startDate);
        if (endDate) queryFilter.date.$lte = new Date(endDate);
      }
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        queryFilter.$or = [
          { description: searchRegex },
          { vendor: searchRegex },
          { vendorOrClient: searchRegex },
          { referenceNumber: searchRegex },
          { notes: searchRegex },
        ];
      }

      const filteredRecords = await ProjectFinancialTransaction.find(queryFilter)
        .populate('createdBy', 'name email role')
        .sort({ date: -1 });

      return res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            name: project.name,
            client: project.client,
            location: project.location,
            status: project.status,
          },
          summary,
          transactions: filteredRecords,
          totalTransactionsCount: allRecords.length,
          filteredTransactionsCount: filteredRecords.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   GET /api/projects/:projectId/financials/summary
   * @desc    Get only financial summary and category-wise analysis
   * @access  Private (JWT + Financial Authorization)
   */
  async getProjectFinancialSummary(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = req.project;

      const records = await ProjectFinancialTransaction.find({ projectId });
      const summary = calculateFinancialMetrics(records);

      return res.status(200).json({
        success: true,
        projectId,
        projectName: project.name,
        ...summary,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   GET /api/projects/:projectId/financials/expenses
   * @desc    List only expense transactions for project
   * @access  Private (JWT + Financial Authorization)
   */
  async getExpensesOnly(req, res, next) {
    try {
      const { projectId } = req.params;
      const expenses = await ProjectFinancialTransaction.find({ projectId, type: 'Expense' })
        .populate('createdBy', 'name email')
        .sort({ date: -1 });

      const totalExpenseAmount = expenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      return res.status(200).json({
        success: true,
        count: expenses.length,
        totalExpenseAmount,
        data: expenses,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   GET /api/projects/:projectId/financials/revenue
   * @desc    List only revenue transactions for project
   * @access  Private (JWT + Financial Authorization)
   */
  async getRevenueOnly(req, res, next) {
    try {
      const { projectId } = req.params;
      const revenues = await ProjectFinancialTransaction.find({ projectId, type: 'Revenue' })
        .populate('createdBy', 'name email')
        .sort({ date: -1 });

      const totalRevenueAmount = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      return res.status(200).json({
        success: true,
        count: revenues.length,
        totalRevenueAmount,
        data: revenues,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/projects/:projectId/financials/transactions
   * @desc    Record a new financial transaction (Revenue or Expense)
   * @access  Private (JWT + Financial Authorization)
   */
  async createTransaction(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = req.project;
      const user = req.user;

      const {
        type,
        category,
        amount,
        description,
        date,
        referenceNumber,
        vendor,
        vendorOrClient,
        paymentStatus,
        paymentMethod,
        notes,
      } = req.body;

      if (!type || !FINANCIAL_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Valid transaction type ("Revenue" or "Expense") is required.',
        });
      }

      if (!category || typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Valid category is required.',
        });
      }

      if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid positive amount greater than 0 is required.',
        });
      }

      if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Transaction description is required.',
        });
      }

      const txDate = date ? new Date(date) : new Date();
      if (isNaN(txDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Valid transaction date is required.',
        });
      }

      const cleanVendor = (vendor || vendorOrClient || '').trim();

      const transaction = await ProjectFinancialTransaction.create({
        projectId,
        organizationId: project.organizationId || user.organizationId,
        type,
        category: category.trim(),
        amount: Number(amount),
        description: description.trim(),
        date: txDate,
        referenceNumber: (referenceNumber || '').trim(),
        vendor: cleanVendor,
        vendorOrClient: cleanVendor,
        paymentStatus: paymentStatus || 'Paid',
        paymentMethod: paymentMethod || 'Bank Transfer',
        notes: (notes || '').trim(),
        createdBy: user._id,
        recordedBy: user._id,
      });

      // Log to AuditLog
      try {
        if (user.organizationId || project.organizationId) {
          await AuditLog.create({
            actor: user._id,
            organization: user.organizationId || project.organizationId,
            action: 'FINANCIAL_TRANSACTION_CREATED',
            targetResource: `FinancialTransaction:${transaction._id}`,
            details: {
              projectId,
              projectName: project.name,
              type,
              category,
              amount: Number(amount),
              description: description.trim(),
            },
            ipAddress: req.ip || '',
          });
        }
      } catch (logErr) {
        console.error('[Financial Audit] Transaction creation log error:', logErr.message);
      }

      return res.status(201).json({
        success: true,
        message: `${type} transaction recorded successfully.`,
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   POST /api/projects/:projectId/financials/expense
   * @desc    Dedicated endpoint to record an Expense
   */
  async createExpense(req, res, next) {
    req.body.type = 'Expense';
    return financialController.createTransaction(req, res, next);
  },

  /**
   * @route   POST /api/projects/:projectId/financials/revenue
   * @desc    Dedicated endpoint to record Revenue
   */
  async createRevenue(req, res, next) {
    req.body.type = 'Revenue';
    return financialController.createTransaction(req, res, next);
  },

  /**
   * @route   PUT /api/projects/:projectId/financials/transactions/:txId
   * @desc    Update a transaction under a specific project with IDOR check
   */
  async updateTransaction(req, res, next) {
    try {
      const { projectId, txId } = req.params;
      const user = req.user;

      if (!mongoose.Types.ObjectId.isValid(txId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID format.' });
      }

      const transaction = await ProjectFinancialTransaction.findOne({ _id: txId, projectId });
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Financial transaction not found for this project.',
        });
      }

      const updates = req.body;
      if (updates.type && FINANCIAL_TYPES.includes(updates.type)) {
        transaction.type = updates.type;
      }
      if (updates.category && updates.category.trim()) {
        transaction.category = updates.category.trim();
      }
      if (updates.amount !== undefined) {
        if (isNaN(Number(updates.amount)) || Number(updates.amount) <= 0) {
          return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
        }
        transaction.amount = Number(updates.amount);
      }
      if (updates.description) {
        transaction.description = updates.description.trim();
      }
      if (updates.date) {
        if (isNaN(new Date(updates.date).getTime())) {
          return res.status(400).json({ success: false, message: 'Valid date is required.' });
        }
        transaction.date = new Date(updates.date);
      }
      if (updates.referenceNumber !== undefined) {
        transaction.referenceNumber = updates.referenceNumber.trim();
      }
      if (updates.vendor !== undefined || updates.vendorOrClient !== undefined) {
        const v = (updates.vendor || updates.vendorOrClient || '').trim();
        transaction.vendor = v;
        transaction.vendorOrClient = v;
      }
      if (updates.paymentStatus && PAYMENT_STATUSES.includes(updates.paymentStatus)) {
        transaction.paymentStatus = updates.paymentStatus;
      }
      if (updates.paymentMethod && PAYMENT_METHODS.includes(updates.paymentMethod)) {
        transaction.paymentMethod = updates.paymentMethod;
      }
      if (updates.notes !== undefined) {
        transaction.notes = updates.notes.trim();
      }

      await transaction.save();

      // Audit Log
      try {
        if (user.organizationId || transaction.organizationId) {
          await AuditLog.create({
            actor: user._id,
            organization: user.organizationId || transaction.organizationId,
            action: 'FINANCIAL_TRANSACTION_UPDATED',
            targetResource: `FinancialTransaction:${transaction._id}`,
            details: { projectId, transactionId: txId, updates },
            ipAddress: req.ip || '',
          });
        }
      } catch (logErr) {
        console.error('[Financial Audit] Transaction update log error:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Financial transaction updated successfully.',
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   DELETE /api/projects/:projectId/financials/transactions/:txId
   * @desc    Delete a transaction under a specific project with IDOR check
   */
  async deleteTransaction(req, res, next) {
    try {
      const { projectId, txId } = req.params;
      const user = req.user;

      if (!mongoose.Types.ObjectId.isValid(txId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID format.' });
      }

      const deleted = await ProjectFinancialTransaction.findOneAndDelete({ _id: txId, projectId });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Financial transaction not found for this project.',
        });
      }

      // Audit Log
      try {
        if (user.organizationId || deleted.organizationId) {
          await AuditLog.create({
            actor: user._id,
            organization: user.organizationId || deleted.organizationId,
            action: 'FINANCIAL_TRANSACTION_DELETED',
            targetResource: `FinancialTransaction:${txId}`,
            details: {
              projectId,
              transactionId: txId,
              amount: deleted.amount,
              type: deleted.type,
            },
            ipAddress: req.ip || '',
          });
        }
      } catch (logErr) {
        console.error('[Financial Audit] Transaction delete log error:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Financial transaction deleted successfully.',
        data: { id: txId },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   PUT /api/financials/:transactionId
   * @desc    Direct route to update transaction with IDOR check against user's organization
   */
  async directUpdateTransaction(req, res, next) {
    try {
      const { transactionId } = req.params;
      const user = req.user;

      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID format.' });
      }

      const transaction = await ProjectFinancialTransaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Financial transaction not found.' });
      }

      // IDOR check
      if (user.organizationId && transaction.organizationId) {
        if (user.organizationId.toString() !== transaction.organizationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to modify this financial record.',
          });
        }
      }

      req.params.projectId = transaction.projectId.toString();
      req.params.txId = transactionId;
      return financialController.updateTransaction(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   DELETE /api/financials/:transactionId
   * @desc    Direct route to delete transaction with IDOR check
   */
  async directDeleteTransaction(req, res, next) {
    try {
      const { transactionId } = req.params;
      const user = req.user;

      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID format.' });
      }

      const transaction = await ProjectFinancialTransaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Financial transaction not found.' });
      }

      // IDOR check
      if (user.organizationId && transaction.organizationId) {
        if (user.organizationId.toString() !== transaction.organizationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to delete this financial record.',
          });
        }
      }

      req.params.projectId = transaction.projectId.toString();
      req.params.txId = transactionId;
      return financialController.deleteTransaction(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @route   GET /api/projects/:projectId/financials/report-pdf
   * @desc    Generate authorized financial report payload for PDF rendering
   * @access  Private (JWT + Financial Authorization)
   */
  async getFinancialPdfReport(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = req.project;

      const records = await ProjectFinancialTransaction.find({ projectId }).sort({ date: -1 });
      const summary = calculateFinancialMetrics(records);

      return res.status(200).json({
        success: true,
        reportTitle: `Project Financial Audit Report — ${project.name}`,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalRevenue: summary.totalRevenue,
          totalExpenses: summary.totalExpenses,
          profit: summary.profit,
          loss: summary.loss,
          netProfit: summary.netProfit,
          profitMargin: `${summary.profitMargin}%`,
          financialStatus: summary.financialStatus,
        },
        expenseBreakdown: summary.expenseBreakdown,
        monthlyBreakdown: summary.monthlyBreakdown,
        transactions: records,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default financialController;
