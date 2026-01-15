import { transactionService } from './TransactionService';
import { webhookService, WEBHOOK_EVENTS } from './WebhookService';
import { errorLogger } from './ErrorLogger';
import {
  Transaction,
  CreateTransactionRequest,
  TransactionStatus,
  ErrorSeverity,
  ErrorCategory
} from '../models';

export interface BatchCreateResult {
  successful: Transaction[];
  failed: Array<{
    index: number;
    request: CreateTransactionRequest;
    error: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
    successRate: string;
  };
}

export interface BatchProcessResult {
  processed: Transaction[];
  failed: Array<{
    transactionId: string;
    error: string;
  }>;
  summary: {
    total: number;
    completed: number;
    failed: number;
    successRate: string;
  };
}

export class BatchService {
  private static instance: BatchService;
  private maxBatchSize = 100;

  private constructor() {}

  static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService();
    }
    return BatchService.instance;
  }

  /**
   * Create multiple transactions in batch
   */
  async batchCreate(requests: CreateTransactionRequest[]): Promise<BatchCreateResult> {
    if (requests.length > this.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum of ${this.maxBatchSize}`);
    }

    const successful: Transaction[] = [];
    const failed: BatchCreateResult['failed'] = [];

    const promises = requests.map(async (request, index) => {
      try {
        const transaction = await transactionService.createTransaction(request);
        successful.push(transaction);
        
        // Trigger webhook
        await webhookService.triggerEvent(WEBHOOK_EVENTS.TRANSACTION_CREATED, {
          transaction,
          batchIndex: index
        });
      } catch (error: any) {
        failed.push({
          index,
          request,
          error: error.message
        });
      }
    });

    await Promise.allSettled(promises);

    return {
      successful,
      failed,
      summary: {
        total: requests.length,
        success: successful.length,
        failed: failed.length,
        successRate: `${((successful.length / requests.length) * 100).toFixed(1)}%`
      }
    };
  }

  /**
   * Process multiple transactions in batch
   */
  async batchProcess(transactionIds: string[]): Promise<BatchProcessResult> {
    if (transactionIds.length > this.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum of ${this.maxBatchSize}`);
    }

    const processed: Transaction[] = [];
    const failed: BatchProcessResult['failed'] = [];

    // Process sequentially to avoid race conditions
    for (const transactionId of transactionIds) {
      try {
        const transaction = await transactionService.processTransaction(transactionId);
        processed.push(transaction);

        // Trigger appropriate webhook based on status
        const event = transaction.status === TransactionStatus.COMPLETED
          ? WEBHOOK_EVENTS.TRANSACTION_COMPLETED
          : WEBHOOK_EVENTS.TRANSACTION_FAILED;
        
        await webhookService.triggerEvent(event, { transaction });
      } catch (error: any) {
        failed.push({
          transactionId,
          error: error.message
        });
        errorLogger.logError(
          ErrorSeverity.ERROR,
          ErrorCategory.PROCESSING,
          'BATCH_PROCESS_FAILED',
          `Batch processing failed for transaction ${transactionId}`,
          { transactionId, error }
        );
      }
    }

    const completed = processed.filter(t => t.status === TransactionStatus.COMPLETED).length;

    return {
      processed,
      failed,
      summary: {
        total: transactionIds.length,
        completed,
        failed: failed.length + (processed.length - completed),
        successRate: `${((completed / transactionIds.length) * 100).toFixed(1)}%`
      }
    };
  }

  /**
   * Cancel multiple transactions in batch
   */
  async batchCancel(
    transactionIds: string[],
    reason?: string
  ): Promise<{ cancelled: Transaction[]; failed: Array<{ transactionId: string; error: string }> }> {
    const cancelled: Transaction[] = [];
    const failed: Array<{ transactionId: string; error: string }> = [];

    for (const transactionId of transactionIds) {
      try {
        const transaction = await transactionService.cancelTransaction(transactionId, reason);
        cancelled.push(transaction);
        await webhookService.triggerEvent(WEBHOOK_EVENTS.TRANSACTION_CANCELLED, { transaction });
      } catch (error: any) {
        failed.push({ transactionId, error: error.message });
      }
    }

    return { cancelled, failed };
  }

  /**
   * Retry multiple failed transactions in batch
   */
  async batchRetry(transactionIds: string[]): Promise<BatchProcessResult> {
    const processed: Transaction[] = [];
    const failed: BatchProcessResult['failed'] = [];

    for (const transactionId of transactionIds) {
      try {
        const transaction = await transactionService.retryTransaction(transactionId);
        processed.push(transaction);
      } catch (error: any) {
        failed.push({ transactionId, error: error.message });
      }
    }

    const completed = processed.filter(t => t.status === TransactionStatus.COMPLETED).length;

    return {
      processed,
      failed,
      summary: {
        total: transactionIds.length,
        completed,
        failed: failed.length + (processed.length - completed),
        successRate: `${((completed / transactionIds.length) * 100).toFixed(1)}%`
      }
    };
  }

  /**
   * Get pending transactions and process them
   */
  async processPendingTransactions(limit: number = 50): Promise<BatchProcessResult> {
    const pending = transactionService.getTransactionsByStatus(TransactionStatus.PENDING);
    const toProcess = pending.slice(0, limit).map(t => t.id);
    return this.batchProcess(toProcess);
  }

  /**
   * Get configuration
   */
  getConfig(): { maxBatchSize: number } {
    return { maxBatchSize: this.maxBatchSize };
  }

  /**
   * Update configuration
   */
  setMaxBatchSize(size: number): void {
    if (size < 1 || size > 1000) {
      throw new Error('Batch size must be between 1 and 1000');
    }
    this.maxBatchSize = size;
  }
}

export const batchService = BatchService.getInstance();
