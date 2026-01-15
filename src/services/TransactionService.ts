import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  TransactionPriority,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  StatusTransition,
  VALID_STATUS_TRANSITIONS,
  ERROR_CODES
} from '../models';
import { rulesEngine } from './RulesEngine';
import { errorLogger } from './ErrorLogger';
import { ErrorCategory, ErrorSeverity } from '../models/Error';

// In-memory storage
const transactions: Map<string, Transaction> = new Map();
const statusHistory: Map<string, StatusTransition[]> = new Map();

// Processing simulation delays (ms)
const PROCESSING_DELAYS: Record<TransactionPriority, number> = {
  [TransactionPriority.URGENT]: 500,
  [TransactionPriority.HIGH]: 1000,
  [TransactionPriority.NORMAL]: 2000,
  [TransactionPriority.LOW]: 3000
};

export class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    // Validate required fields
    if (!request.amount || request.amount <= 0) {
      errorLogger.logValidationError(
        ERROR_CODES.INVALID_AMOUNT,
        'Amount must be greater than 0'
      );
      throw new Error('Amount must be greater than 0');
    }

    if (!request.currency) {
      errorLogger.logValidationError(
        ERROR_CODES.INVALID_CURRENCY,
        'Currency is required'
      );
      throw new Error('Currency is required');
    }

    if (!request.sourceAccount) {
      errorLogger.logValidationError(
        ERROR_CODES.INVALID_ACCOUNT,
        'Source account is required'
      );
      throw new Error('Source account is required');
    }

    // Create transaction object
    const transaction: Transaction = {
      id: uuidv4(),
      type: request.type,
      status: TransactionStatus.PENDING,
      priority: request.priority || TransactionPriority.NORMAL,
      amount: request.amount,
      currency: request.currency.toUpperCase(),
      sourceAccount: request.sourceAccount,
      destinationAccount: request.destinationAccount,
      description: request.description,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // Store transaction
    transactions.set(transaction.id, transaction);
    statusHistory.set(transaction.id, []);

    console.log(`Transaction ${transaction.id} created with status ${transaction.status}`);

    return transaction;
  }

  /**
   * Process a transaction through its lifecycle
   */
  async processTransaction(transactionId: string): Promise<Transaction> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      errorLogger.logProcessingError(
        ERROR_CODES.TRANSACTION_NOT_FOUND,
        `Transaction ${transactionId} not found`,
        transactionId
      );
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Move to VALIDATING
    await this.updateStatus(transactionId, TransactionStatus.VALIDATING, 'system', 'Starting validation');

    // Evaluate rules
    const evaluation = rulesEngine.evaluateTransaction(transaction);

    if (!evaluation.allowed) {
      await this.updateStatus(
        transactionId,
        TransactionStatus.FAILED,
        'rules-engine',
        evaluation.denyReason || 'Rule validation failed'
      );
      const failedTx = transactions.get(transactionId)!;
      failedTx.errorCode = ERROR_CODES.RULE_VIOLATION;
      failedTx.errorMessage = evaluation.denyReason;
      transactions.set(transactionId, failedTx);
      return failedTx;
    }

    // Move to PROCESSING
    await this.updateStatus(transactionId, TransactionStatus.PROCESSING, 'system', 'Processing transaction');

    // Simulate processing delay based on priority
    const delay = PROCESSING_DELAYS[transaction.priority];
    await this.simulateProcessing(delay);

    // Simulate random processing outcomes (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      await this.updateStatus(transactionId, TransactionStatus.COMPLETED, 'system', 'Transaction completed successfully');
      const completedTx = transactions.get(transactionId)!;
      completedTx.completedAt = new Date();
      transactions.set(transactionId, completedTx);
      return completedTx;
    } else {
      await this.updateStatus(transactionId, TransactionStatus.FAILED, 'system', 'Processing failed');
      const failedTx = transactions.get(transactionId)!;
      failedTx.errorCode = ERROR_CODES.PROCESSING_FAILED;
      failedTx.errorMessage = 'Simulated processing failure';
      errorLogger.logProcessingError(
        ERROR_CODES.PROCESSING_FAILED,
        'Simulated processing failure',
        transactionId
      );
      transactions.set(transactionId, failedTx);
      return failedTx;
    }
  }

  /**
   * Update transaction status with validation
   */
  async updateStatus(
    transactionId: string,
    newStatus: TransactionStatus,
    triggeredBy: string,
    reason?: string
  ): Promise<Transaction> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const currentStatus = transaction.status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!validTransitions.includes(newStatus)) {
      errorLogger.logError(
        ErrorSeverity.ERROR,
        ErrorCategory.VALIDATION,
        ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        { transactionId }
      );
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Update transaction
    transaction.status = newStatus;
    transaction.updatedAt = new Date();
    transactions.set(transactionId, transaction);

    // Record status transition
    const transition: StatusTransition = {
      transactionId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      timestamp: new Date(),
      reason,
      triggeredBy
    };

    const history = statusHistory.get(transactionId) || [];
    history.push(transition);
    statusHistory.set(transactionId, history);

    console.log(`Transaction ${transactionId}: ${currentStatus} -> ${newStatus}`);

    return transaction;
  }

  /**
   * Retry a failed transaction
   */
  async retryTransaction(transactionId: string): Promise<Transaction> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== TransactionStatus.FAILED) {
      throw new Error('Only failed transactions can be retried');
    }

    if (transaction.retryCount >= transaction.maxRetries) {
      throw new Error(`Maximum retry attempts (${transaction.maxRetries}) exceeded`);
    }

    // Reset to pending
    transaction.retryCount++;
    transaction.errorCode = undefined;
    transaction.errorMessage = undefined;
    await this.updateStatus(transactionId, TransactionStatus.PENDING, 'retry-system', 'Retry initiated');

    // Process again
    return this.processTransaction(transactionId);
  }

  /**
   * Cancel a transaction
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<Transaction> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed transaction. Use refund instead.');
    }

    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new Error('Transaction is already cancelled');
    }

    return this.updateStatus(transactionId, TransactionStatus.CANCELLED, 'user', reason || 'Cancelled by user');
  }

  /**
   * Refund a completed transaction
   */
  async refundTransaction(transactionId: string, reason?: string): Promise<Transaction> {
    const transaction = transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new Error('Only completed transactions can be refunded');
    }

    return this.updateStatus(transactionId, TransactionStatus.REFUNDED, 'user', reason || 'Refunded by user');
  }

  /**
   * Get a transaction by ID
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return transactions.get(transactionId);
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(transactions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get transactions by status
   */
  getTransactionsByStatus(status: TransactionStatus): Transaction[] {
    return this.getAllTransactions().filter(t => t.status === status);
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: TransactionType): Transaction[] {
    return this.getAllTransactions().filter(t => t.type === type);
  }

  /**
   * Get status history for a transaction
   */
  getStatusHistory(transactionId: string): StatusTransition[] {
    return statusHistory.get(transactionId) || [];
  }

  /**
   * Get transaction statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<TransactionStatus, number>;
    byType: Record<TransactionType, number>;
    totalAmount: number;
    averageAmount: number;
  } {
    const allTransactions = this.getAllTransactions();

    const byStatus: Record<TransactionStatus, number> = {
      [TransactionStatus.PENDING]: 0,
      [TransactionStatus.VALIDATING]: 0,
      [TransactionStatus.PROCESSING]: 0,
      [TransactionStatus.COMPLETED]: 0,
      [TransactionStatus.FAILED]: 0,
      [TransactionStatus.CANCELLED]: 0,
      [TransactionStatus.REFUNDED]: 0
    };

    const byType: Record<TransactionType, number> = {
      [TransactionType.PAYMENT]: 0,
      [TransactionType.TRANSFER]: 0,
      [TransactionType.WITHDRAWAL]: 0,
      [TransactionType.DEPOSIT]: 0,
      [TransactionType.REFUND]: 0
    };

    let totalAmount = 0;

    allTransactions.forEach(t => {
      byStatus[t.status]++;
      byType[t.type]++;
      totalAmount += t.amount;
    });

    return {
      total: allTransactions.length,
      byStatus,
      byType,
      totalAmount,
      averageAmount: allTransactions.length > 0 ? totalAmount / allTransactions.length : 0
    };
  }

  /**
   * Simulate processing delay
   */
  private simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all transactions (for testing)
   */
  clearAll(): void {
    transactions.clear();
    statusHistory.clear();
    console.log('All transactions cleared');
  }
}

export const transactionService = TransactionService.getInstance();
