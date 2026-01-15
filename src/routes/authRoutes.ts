import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', optionalAuth, authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.get('/users', authenticate, authorize('admin'), authController.getUsers.bind(authController));

export default router;
