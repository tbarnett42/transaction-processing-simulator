import { Request, Response, NextFunction } from 'express';
import { batchService } from '../services/BatchService';
import { CreateTransactionRequest, TransactionType, TransactionPriority } from '../models';

/**
 * Batch Controller - Handles batch operations
 */
export class BatchController {
  /**
   * Create multiple transactions
   * POST /api/batch/transactions
   */
  async batchCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactions } = req.body;

      if (!transactions || !Array.isArray(transactions)) {
        res.status(400).json({
          success: false,
          error: 'transactions array is required'
        });
        return;
      }

      if (transactions.length === 0) {
        res.status(400).json({
          success: false,
          error: 'transactions array cannot be empty'
        });
        return;
      }

      // Validate each transaction
      const errors: string[] = [];
      transactions.forEach((t: any, i: number) => {
        if (!t.type || !Object.values(TransactionType).includes(t.type)) {
          errors.push(`Transaction ${i}: invalid type`);
        }
        if (!t.amount || t.amount <= 0) {
          errors.push(`Transaction ${i}: invalid amount`);
        }
        if (!t.currency) {
          errors.push(`Transaction ${i}: currency required`);
        }
        if (!t.sourceAccount) {
          errors.push(`Transaction ${i}: sourceAccount required`);
        }
      });

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      const result = await batchService.batchCreate(transactions as CreateTransactionRequest[]);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process multiple transactions
   * POST /api/batch/process
   */
  async batchProcess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactionIds } = req.body;

      if (!transactionIds || !Array.isArray(transactionIds)) {
        res.status(400).json({
          success: false,
          error: 'transactionIds array is required'
        });
        return;
      }

      const result = await batchService.batchProcess(transactionIds);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel multiple transactions
   * POST /api/batch/cancel
   */
  async batchCancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactionIds, reason } = req.body;

      if (!transactionIds || !Array.isArray(transactionIds)) {
        res.status(400).json({
          success: false,
          error: 'transactionIds array is required'
        });
        return;
      }

      const result = await batchService.batchCancel(transactionIds, reason);

      res.json({
        success: true,
        data: {
          ...result,
          summary: {
            total: transactionIds.length,
            cancelled: result.cancelled.length,
            failed: result.failed.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry multiple failed transactions
   * POST /api/batch/retry
   */
  async batchRetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactionIds } = req.body;

      if (!transactionIds || !Array.isArray(transactionIds)) {
        res.status(400).json({
          success: false,
          error: 'transactionIds array is required'
        });
        return;
      }

      const result = await batchService.batchRetry(transactionIds);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process all pending transactions
   * POST /api/batch/process-pending
   */
  async processPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await batchService.processPendingTransactions(limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get batch configuration
   * GET /api/batch/config
   */
  async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = batchService.getConfig();

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
}

export const batchController = new BatchController();
