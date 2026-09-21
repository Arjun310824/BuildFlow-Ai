import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected auth endpoints
router.get('/me', protect, getMe);

export default router;
