import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables before any other module initialization
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import businessConnectionRoutes from './routes/businessConnectionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import businessTransactionRoutes from './routes/businessTransactionRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import { protect } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB database
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Public Authentication & Monitoring Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

// Protected Core Application Routes
app.use('/api/projects', protect, projectRoutes);
app.use('/api/tasks', protect, taskRoutes);
app.use('/api/materials', protect, materialRoutes);
app.use('/api/ai', protect, aiRoutes);
app.use('/api/organizations', protect, organizationRoutes);
app.use('/api/business-connections', protect, businessConnectionRoutes);
app.use('/api/notifications', protect, notificationRoutes);
app.use('/api/business-transactions', protect, businessTransactionRoutes);
app.use('/api/financials', protect, financialRoutes);

// Fallback for undefined routes (404)
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 [BuildOps AI] Backend server running on port ${PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`📁 Projects API available at: http://localhost:${PORT}/api/projects`);
  console.log(`📋 Tasks API available at: http://localhost:${PORT}/api/tasks`);
  console.log(`📦 Materials API available at: http://localhost:${PORT}/api/materials`);
  console.log(`🧠 AI Intelligence Engine API available at: http://localhost:${PORT}/api/ai/analyze-project`);
});

export default app;
