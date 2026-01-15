import { Router } from 'express';
import { batchController } from '../controllers/BatchController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All batch routes require authentication
router.use(authenticate);

// Get configuration
router.get('/config', batchController.getConfig.bind(batchController));

// Batch operations
router.post('/transactions', batchController.batchCreate.bind(batchController));
router.post('/process', authorize('admin', 'operator'), batchController.batchProcess.bind(batchController));
router.post('/cancel', authorize('admin', 'operator'), batchController.batchCancel.bind(batchController));
router.post('/retry', authorize('admin', 'operator'), batchController.batchRetry.bind(batchController));
router.post('/process-pending', authorize('admin', 'operator'), batchController.processPending.bind(batchController));

export default router;
