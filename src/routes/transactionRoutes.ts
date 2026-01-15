import { Router } from 'express';
import { transactionController } from '../controllers';

const router = Router();

// Transaction statistics (must be before :id routes)
router.get('/stats', transactionController.getStats.bind(transactionController));

// Transaction CRUD
router.post('/', transactionController.createTransaction.bind(transactionController));
router.get('/', transactionController.getAllTransactions.bind(transactionController));
router.get('/:id', transactionController.getTransaction.bind(transactionController));

// Transaction lifecycle operations
router.post('/:id/process', transactionController.processTransaction.bind(transactionController));
router.post('/:id/retry', transactionController.retryTransaction.bind(transactionController));
router.post('/:id/cancel', transactionController.cancelTransaction.bind(transactionController));
router.post('/:id/refund', transactionController.refundTransaction.bind(transactionController));

// Status history
router.get('/:id/history', transactionController.getStatusHistory.bind(transactionController));

export default router;
