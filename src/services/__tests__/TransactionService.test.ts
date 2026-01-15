import { transactionService } from '../TransactionService';
import { rulesEngine } from '../RulesEngine';
import { errorLogger } from '../ErrorLogger';
import {
  TransactionType,
  TransactionStatus,
  TransactionPriority,
  CreateTransactionRequest
} from '../../models';

describe('TransactionService', () => {
  beforeEach(() => {
    // Clear all transactions before each test
    transactionService.clearAll();
    errorLogger.clearAll();
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid data', async () => {
      const request: CreateTransactionRequest = {
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001',
        destinationAccount: 'ACC-002',
        description: 'Test payment'
      };

      const transaction = await transactionService.createTransaction(request);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe(TransactionType.PAYMENT);
      expect(transaction.status).toBe(TransactionStatus.PENDING);
      expect(transaction.amount).toBe(100);
      expect(transaction.currency).toBe('USD');
      expect(transaction.sourceAccount).toBe('ACC-001');
      expect(transaction.retryCount).toBe(0);
    });

    it('should throw error for invalid amount', async () => {
      const request: CreateTransactionRequest = {
        type: TransactionType.PAYMENT,
        amount: -100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      };

      await expect(transactionService.createTransaction(request))
        .rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error for missing currency', async () => {
      const request = {
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: '',
        sourceAccount: 'ACC-001'
      } as CreateTransactionRequest;

      await expect(transactionService.createTransaction(request))
        .rejects.toThrow('Currency is required');
    });

    it('should throw error for missing source account', async () => {
      const request = {
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: ''
      } as CreateTransactionRequest;

      await expect(transactionService.createTransaction(request))
        .rejects.toThrow('Source account is required');
    });

    it('should set default priority to NORMAL', async () => {
      const request: CreateTransactionRequest = {
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      };

      const transaction = await transactionService.createTransaction(request);
      expect(transaction.priority).toBe(TransactionPriority.NORMAL);
    });

    it('should use provided priority', async () => {
      const request: CreateTransactionRequest = {
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001',
        priority: TransactionPriority.URGENT
      };

      const transaction = await transactionService.createTransaction(request);
      expect(transaction.priority).toBe(TransactionPriority.URGENT);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction by ID', async () => {
      const created = await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      const retrieved = transactionService.getTransaction(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent transaction', () => {
      const transaction = transactionService.getTransaction('non-existent-id');
      expect(transaction).toBeUndefined();
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      await transactionService.createTransaction({
        type: TransactionType.TRANSFER,
        amount: 200,
        currency: 'EUR',
        sourceAccount: 'ACC-002'
      });

      const transactions = transactionService.getAllTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should return empty array when no transactions', () => {
      const transactions = transactionService.getAllTransactions();
      expect(transactions).toHaveLength(0);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel a pending transaction', async () => {
      const created = await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      const cancelled = await transactionService.cancelTransaction(created.id, 'User requested');
      expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
    });

    it('should throw error when cancelling completed transaction', async () => {
      const created = await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 50,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      // Manually set to completed for test
      await transactionService.updateStatus(created.id, TransactionStatus.VALIDATING, 'test');
      await transactionService.updateStatus(created.id, TransactionStatus.PROCESSING, 'test');
      await transactionService.updateStatus(created.id, TransactionStatus.COMPLETED, 'test');

      await expect(transactionService.cancelTransaction(created.id))
        .rejects.toThrow('Cannot cancel a completed transaction');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 100,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      await transactionService.createTransaction({
        type: TransactionType.TRANSFER,
        amount: 200,
        currency: 'USD',
        sourceAccount: 'ACC-002'
      });

      const stats = transactionService.getStats();

      expect(stats.total).toBe(2);
      expect(stats.totalAmount).toBe(300);
      expect(stats.averageAmount).toBe(150);
      expect(stats.byStatus[TransactionStatus.PENDING]).toBe(2);
      expect(stats.byType[TransactionType.PAYMENT]).toBe(1);
      expect(stats.byType[TransactionType.TRANSFER]).toBe(1);
    });
  });

  describe('getStatusHistory', () => {
    it('should track status transitions', async () => {
      const created = await transactionService.createTransaction({
        type: TransactionType.PAYMENT,
        amount: 50,
        currency: 'USD',
        sourceAccount: 'ACC-001'
      });

      await transactionService.updateStatus(created.id, TransactionStatus.VALIDATING, 'test');
      
      const history = transactionService.getStatusHistory(created.id);
      
      expect(history).toHaveLength(1);
      expect(history[0].fromStatus).toBe(TransactionStatus.PENDING);
      expect(history[0].toStatus).toBe(TransactionStatus.VALIDATING);
    });
  });
});
