import { Request, Response, NextFunction } from 'express';
import {
  transactionService,
  rulesEngine,
  errorLogger
} from '../services';
import {
  CreateTransactionRequest,
  TransactionStatus,
  TransactionType,
  ERROR_CODES,
  ErrorSeverity,
  ErrorCategory
} from '../models';

/**
 * Transaction Controller - Handles all transaction-related HTTP requests
 */
export class TransactionController {
  /**
   * Create a new transaction
   * POST /api/transactions
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateTransactionRequest = req.body;

      // Validate request body
      if (!request.type || !Object.values(TransactionType).includes(request.type)) {
        res.status(400).json({
          error: 'Invalid transaction type',
          code: ERROR_CODES.INVALID_TRANSACTION_TYPE,
          validTypes: Object.values(TransactionType)
        });
        return;
      }

      const transaction = await transactionService.createTransaction(request);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all transactions
   * GET /api/transactions
   */
  async getAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, type, limit, offset } = req.query;

      let transactions = transactionService.getAllTransactions();

      // Filter by status
      if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        transactions = transactions.filter(t => t.status === status);
      }

      // Filter by type
      if (type && Object.values(TransactionType).includes(type as TransactionType)) {
        transactions = transactions.filter(t => t.type === type);
      }

      // Pagination
      const limitNum = parseInt(limit as string) || 50;
      const offsetNum = parseInt(offset as string) || 0;
      const paginatedTransactions = transactions.slice(offsetNum, offsetNum + limitNum);

      res.json({
        success: true,
        data: paginatedTransactions,
        pagination: {
          total: transactions.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < transactions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single transaction by ID
   * GET /api/transactions/:id
   */
  async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = transactionService.getTransaction(id);

      if (!transaction) {
        res.status(404).json({
          error: 'Transaction not found',
          code: ERROR_CODES.TRANSACTION_NOT_FOUND
        });
        return;
      }

      // Include status history
      const history = transactionService.getStatusHistory(id);

      res.json({
        success: true,
        data: {
          ...transaction,
          statusHistory: history
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a transaction
   * POST /api/transactions/:id/process
   */
  async processTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.processTransaction(id);

      res.json({
        success: true,
        data: transaction,
        message: `Transaction processed with status: ${transaction.status}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry a failed transaction
   * POST /api/transactions/:id/retry
   */
  async retryTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.retryTransaction(id);

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction retry completed'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a transaction
   * POST /api/transactions/:id/cancel
   */
  async cancelTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const transaction = await transactionService.cancelTransaction(id, reason);

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction cancelled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refund a completed transaction
   * POST /api/transactions/:id/refund
   */
  async refundTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const transaction = await transactionService.refundTransaction(id, reason);

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction refunded'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction statistics
   * GET /api/transactions/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = transactionService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get status history for a transaction
   * GET /api/transactions/:id/history
   */
  async getStatusHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = transactionService.getTransaction(id);

      if (!transaction) {
        res.status(404).json({
          error: 'Transaction not found',
          code: ERROR_CODES.TRANSACTION_NOT_FOUND
        });
        return;
      }

      const history = transactionService.getStatusHistory(id);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
