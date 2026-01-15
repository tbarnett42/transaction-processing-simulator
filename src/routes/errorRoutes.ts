import { Router } from 'express';
import { errorController } from '../controllers';

const router = Router();

// Error statistics (must be before other routes)
router.get('/stats', errorController.getStats.bind(errorController));

// Unresolved errors
router.get('/unresolved', errorController.getUnresolvedErrors.bind(errorController));

// Get all errors with filters
router.get('/', errorController.getAllErrors.bind(errorController));

// Get errors by transaction
router.get('/transaction/:transactionId', errorController.getErrorsByTransaction.bind(errorController));

// Get errors by severity
router.get('/severity/:severity', errorController.getErrorsBySeverity.bind(errorController));

// Get errors by category
router.get('/category/:category', errorController.getErrorsByCategory.bind(errorController));

// Resolve an error
router.post('/:id/resolve', errorController.resolveError.bind(errorController));

export default router;
