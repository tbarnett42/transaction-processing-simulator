import { Router } from 'express';
import transactionRoutes from './transactionRoutes';
import rulesRoutes from './rulesRoutes';
import errorRoutes from './errorRoutes';
import authRoutes from './authRoutes';
import webhookRoutes from './webhookRoutes';
import batchRoutes from './batchRoutes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/rules', rulesRoutes);
router.use('/errors', errorRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/batch', batchRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

export default router;
