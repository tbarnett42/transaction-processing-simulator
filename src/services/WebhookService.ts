import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { WebhookModel, WebhookLogModel, Webhook, WebhookLog } from '../models/schemas/WebhookSchema';
import { isMongoConnected } from '../config/database';
import { errorLogger } from './ErrorLogger';
import { ErrorSeverity, ErrorCategory } from '../models';

// In-memory storage (fallback)
const inMemoryWebhooks: Map<string, Webhook> = new Map();
const inMemoryWebhookLogs: Map<string, WebhookLog> = new Map();

// Event types
export const WEBHOOK_EVENTS = {
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_PROCESSING: 'transaction.processing',
  TRANSACTION_COMPLETED: 'transaction.completed',
  TRANSACTION_FAILED: 'transaction.failed',
  TRANSACTION_CANCELLED: 'transaction.cancelled',
  TRANSACTION_REFUNDED: 'transaction.refunded',
  RULE_TRIGGERED: 'rule.triggered',
  ERROR_CRITICAL: 'error.critical'
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

export class WebhookService {
  private static instance: WebhookService;

  private constructor() {}

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<Webhook> {
    const now = new Date();
    const webhook: Webhook = {
      id: uuidv4(),
      name: data.name,
      url: data.url,
      secret: data.secret,
      events: data.events,
      isActive: true,
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now
    };

    if (isMongoConnected()) {
      const doc = await WebhookModel.create(webhook);
      return {
        ...webhook,
        id: doc._id.toString()
      };
    } else {
      inMemoryWebhooks.set(webhook.id, webhook);
      return webhook;
    }
  }

  /**
   * Get all webhooks
   */
  async getAllWebhooks(): Promise<Webhook[]> {
    if (isMongoConnected()) {
      const docs = await WebhookModel.find();
      return docs.map(d => ({
        id: d._id.toString(),
        name: d.name,
        url: d.url,
        secret: d.secret,
        events: d.events,
        isActive: d.isActive,
        retryCount: d.retryCount,
        maxRetries: d.maxRetries,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }));
    } else {
      return Array.from(inMemoryWebhooks.values());
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(id: string): Promise<Webhook | null> {
    if (isMongoConnected()) {
      const doc = await WebhookModel.findById(id);
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        name: doc.name,
        url: doc.url,
        secret: doc.secret,
        events: doc.events,
        isActive: doc.isActive,
        retryCount: doc.retryCount,
        maxRetries: doc.maxRetries,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    } else {
      return inMemoryWebhooks.get(id) || null;
    }
  }

  /**
   * Update webhook
   */
  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook | null> {
    if (isMongoConnected()) {
      const doc = await WebhookModel.findByIdAndUpdate(id, updates, { new: true });
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        name: doc.name,
        url: doc.url,
        secret: doc.secret,
        events: doc.events,
        isActive: doc.isActive,
        retryCount: doc.retryCount,
        maxRetries: doc.maxRetries,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    } else {
      const webhook = inMemoryWebhooks.get(id);
      if (!webhook) return null;
      const updated = { ...webhook, ...updates, updatedAt: new Date() };
      inMemoryWebhooks.set(id, updated);
      return updated;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    if (isMongoConnected()) {
      const result = await WebhookModel.findByIdAndDelete(id);
      return !!result;
    } else {
      return inMemoryWebhooks.delete(id);
    }
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.getActiveWebhooksForEvent(event);

    const promises = webhooks.map(webhook => this.sendWebhook(webhook, event, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Get active webhooks for a specific event
   */
  private async getActiveWebhooksForEvent(event: string): Promise<Webhook[]> {
    const allWebhooks = await this.getAllWebhooks();
    return allWebhooks.filter(w => w.isActive && w.events.includes(event));
  }

  /**
   * Send webhook request
   */
  private async sendWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, unknown>,
    attempt: number = 1
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const body = {
      event,
      timestamp,
      payload
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': timestamp
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const signature = this.generateSignature(JSON.stringify(body), webhook.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    let log: WebhookLog;

    try {
      const response = await axios.post(webhook.url, body, {
        headers,
        timeout: 10000 // 10 second timeout
      });

      log = {
        id: uuidv4(),
        webhookId: webhook.id,
        event,
        payload,
        response: {
          status: response.status,
          body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        },
        success: true,
        attempts: attempt,
        createdAt: new Date()
      };

      console.log(`✓ Webhook ${webhook.name} delivered: ${event}`);
    } catch (error: any) {
      log = {
        id: uuidv4(),
        webhookId: webhook.id,
        event,
        payload,
        response: error.response ? {
          status: error.response.status,
          body: error.response.data
        } : undefined,
        success: false,
        error: error.message,
        attempts: attempt,
        createdAt: new Date()
      };

      errorLogger.logError(
        ErrorSeverity.WARNING,
        ErrorCategory.NETWORK,
        'WEBHOOK_FAILED',
        `Webhook ${webhook.name} failed: ${error.message}`,
        { details: { webhookId: webhook.id, event, attempt } }
      );

      // Retry logic
      if (attempt < webhook.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        setTimeout(() => {
          this.sendWebhook(webhook, event, payload, attempt + 1);
        }, delay);
      }
    }

    // Save log
    await this.saveLog(log);
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Save webhook log
   */
  private async saveLog(log: WebhookLog): Promise<void> {
    if (isMongoConnected()) {
      await WebhookLogModel.create(log);
    } else {
      inMemoryWebhookLogs.set(log.id, log);
    }
  }

  /**
   * Get webhook logs
   */
  async getLogs(webhookId?: string, limit: number = 100): Promise<WebhookLog[]> {
    if (isMongoConnected()) {
      const query = webhookId ? { webhookId } : {};
      const docs = await WebhookLogModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      return docs.map(d => ({
        id: d._id.toString(),
        webhookId: d.webhookId,
        event: d.event,
        payload: d.payload,
        response: d.response,
        success: d.success,
        error: d.error,
        attempts: d.attempts,
        createdAt: d.createdAt
      }));
    } else {
      let logs = Array.from(inMemoryWebhookLogs.values());
      if (webhookId) {
        logs = logs.filter(l => l.webhookId === webhookId);
      }
      return logs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
  }

  /**
   * Get available webhook events
   */
  getAvailableEvents(): string[] {
    return Object.values(WEBHOOK_EVENTS);
  }
}

export const webhookService = WebhookService.getInstance();
