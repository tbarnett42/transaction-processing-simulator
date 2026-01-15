import { Request, Response, NextFunction } from 'express';
import { webhookService, WEBHOOK_EVENTS } from '../services/WebhookService';

/**
 * Webhook Controller - Handles webhook management HTTP requests
 */
export class WebhookController {
  /**
   * Get all webhooks
   * GET /api/webhooks
   */
  async getAllWebhooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhooks = await webhookService.getAllWebhooks();

      res.json({
        success: true,
        data: webhooks,
        count: webhooks.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a webhook by ID
   * GET /api/webhooks/:id
   */
  async getWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const webhook = await webhookService.getWebhook(id);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      res.json({
        success: true,
        data: webhook
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new webhook
   * POST /api/webhooks
   */
  async createWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, url, events, secret } = req.body;

      if (!name || !url || !events || !Array.isArray(events)) {
        res.status(400).json({
          success: false,
          error: 'name, url, and events (array) are required'
        });
        return;
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        });
        return;
      }

      // Validate events
      const validEvents = webhookService.getAvailableEvents();
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        res.status(400).json({
          success: false,
          error: `Invalid events: ${invalidEvents.join(', ')}`,
          validEvents
        });
        return;
      }

      const webhook = await webhookService.createWebhook({ name, url, events, secret });

      res.status(201).json({
        success: true,
        data: webhook,
        message: 'Webhook created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a webhook
   * PUT /api/webhooks/:id
   */
  async updateWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const webhook = await webhookService.updateWebhook(id, updates);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      res.json({
        success: true,
        data: webhook,
        message: 'Webhook updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a webhook
   * DELETE /api/webhooks/:id
   */
  async deleteWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await webhookService.deleteWebhook(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get webhook logs
   * GET /api/webhooks/:id/logs
   */
  async getWebhookLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const logs = await webhookService.getLogs(id, limit);

      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all logs
   * GET /api/webhooks/logs/all
   */
  async getAllLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await webhookService.getLogs(undefined, limit);

      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available webhook events
   * GET /api/webhooks/events
   */
  async getAvailableEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = webhookService.getAvailableEvents();

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test a webhook (send test event)
   * POST /api/webhooks/:id/test
   */
  async testWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const webhook = await webhookService.getWebhook(id);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found'
        });
        return;
      }

      // Send a test event
      await webhookService.triggerEvent('test.ping', {
        message: 'This is a test webhook',
        webhookId: id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Test webhook sent'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const webhookController = new WebhookController();
