import { Router } from 'express';
import { webhookController } from '../controllers/WebhookController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All webhook routes require authentication
router.use(authenticate);

// Get available events (before :id routes)
router.get('/events', webhookController.getAvailableEvents.bind(webhookController));

// Get all logs
router.get('/logs/all', webhookController.getAllLogs.bind(webhookController));

// Webhook CRUD
router.get('/', webhookController.getAllWebhooks.bind(webhookController));
router.post('/', authorize('admin', 'operator'), webhookController.createWebhook.bind(webhookController));
router.get('/:id', webhookController.getWebhook.bind(webhookController));
router.put('/:id', authorize('admin', 'operator'), webhookController.updateWebhook.bind(webhookController));
router.delete('/:id', authorize('admin'), webhookController.deleteWebhook.bind(webhookController));

// Webhook actions
router.get('/:id/logs', webhookController.getWebhookLogs.bind(webhookController));
router.post('/:id/test', authorize('admin', 'operator'), webhookController.testWebhook.bind(webhookController));

export default router;
