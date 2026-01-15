import { errorLogger } from '../ErrorLogger';
import { ErrorSeverity, ErrorCategory, ERROR_CODES } from '../../models';

describe('ErrorLogger', () => {
  beforeEach(() => {
    errorLogger.clearAll();
  });

  describe('logError', () => {
    it('should log an error and return entry', () => {
      const entry = errorLogger.logError(
        ErrorSeverity.ERROR,
        ErrorCategory.VALIDATION,
        ERROR_CODES.INVALID_AMOUNT,
        'Test error message'
      );

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.severity).toBe(ErrorSeverity.ERROR);
      expect(entry.category).toBe(ErrorCategory.VALIDATION);
      expect(entry.code).toBe(ERROR_CODES.INVALID_AMOUNT);
      expect(entry.message).toBe('Test error message');
      expect(entry.resolved).toBe(false);
    });

    it('should include transaction ID when provided', () => {
      const entry = errorLogger.logError(
        ErrorSeverity.ERROR,
        ErrorCategory.PROCESSING,
        ERROR_CODES.PROCESSING_FAILED,
        'Processing failed',
        { transactionId: 'tx-123' }
      );

      expect(entry.transactionId).toBe('tx-123');
    });

    it('should include stack trace when error object provided', () => {
      const error = new Error('Test error');
      const entry = errorLogger.logError(
        ErrorSeverity.ERROR,
        ErrorCategory.SYSTEM,
        ERROR_CODES.INTERNAL_ERROR,
        'System error',
        { error }
      );

      expect(entry.stackTrace).toBeDefined();
    });
  });

  describe('logValidationError', () => {
    it('should log validation error with correct category', () => {
      const entry = errorLogger.logValidationError(
        ERROR_CODES.INVALID_CURRENCY,
        'Invalid currency code',
        'tx-123'
      );

      expect(entry.category).toBe(ErrorCategory.VALIDATION);
      expect(entry.severity).toBe(ErrorSeverity.ERROR);
      expect(entry.transactionId).toBe('tx-123');
    });
  });

  describe('logProcessingError', () => {
    it('should log processing error with correct category', () => {
      const entry = errorLogger.logProcessingError(
        ERROR_CODES.PROCESSING_TIMEOUT,
        'Processing timeout',
        'tx-456'
      );

      expect(entry.category).toBe(ErrorCategory.PROCESSING);
      expect(entry.transactionId).toBe('tx-456');
    });
  });

  describe('logRuleViolation', () => {
    it('should log rule violation as warning', () => {
      const entry = errorLogger.logRuleViolation(
        'High Amount',
        'Amount exceeded threshold',
        'tx-789'
      );

      expect(entry.category).toBe(ErrorCategory.BUSINESS_RULE);
      expect(entry.severity).toBe(ErrorSeverity.WARNING);
      expect(entry.message).toContain('High Amount');
    });
  });

  describe('getAllErrors', () => {
    it('should return all logged errors', () => {
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E001', 'Error 1');
      errorLogger.logError(ErrorSeverity.WARNING, ErrorCategory.VALIDATION, 'E002', 'Error 2');

      const errors = errorLogger.getAllErrors();
      expect(errors).toHaveLength(2);
    });

    it('should return errors sorted by timestamp (newest first)', () => {
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E001', 'First');
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E002', 'Second');

      const errors = errorLogger.getAllErrors();
      expect(errors[0].message).toBe('Second');
      expect(errors[1].message).toBe('First');
    });
  });

  describe('getErrorsByTransaction', () => {
    it('should return errors for specific transaction', () => {
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.PROCESSING, 'E001', 'Error 1', { transactionId: 'tx-123' });
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.PROCESSING, 'E002', 'Error 2', { transactionId: 'tx-456' });
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.PROCESSING, 'E003', 'Error 3', { transactionId: 'tx-123' });

      const errors = errorLogger.getErrorsByTransaction('tx-123');
      expect(errors).toHaveLength(2);
    });
  });

  describe('getErrorsBySeverity', () => {
    it('should filter errors by severity', () => {
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E001', 'Error');
      errorLogger.logError(ErrorSeverity.WARNING, ErrorCategory.SYSTEM, 'E002', 'Warning');
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E003', 'Another Error');

      const errors = errorLogger.getErrorsBySeverity(ErrorSeverity.ERROR);
      expect(errors).toHaveLength(2);
    });
  });

  describe('resolveError', () => {
    it('should mark error as resolved', () => {
      const entry = errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E001', 'Test');
      
      const resolved = errorLogger.resolveError(entry.id, 'admin@example.com');

      expect(resolved).not.toBeNull();
      expect(resolved?.resolved).toBe(true);
      expect(resolved?.resolvedBy).toBe('admin@example.com');
      expect(resolved?.resolvedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent error', () => {
      const resolved = errorLogger.resolveError('non-existent-id', 'admin');
      expect(resolved).toBeNull();
    });
  });

  describe('getUnresolvedErrors', () => {
    it('should return only unresolved errors', () => {
      const entry1 = errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E001', 'Error 1');
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.SYSTEM, 'E002', 'Error 2');

      errorLogger.resolveError(entry1.id, 'admin');

      const unresolved = errorLogger.getUnresolvedErrors();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].message).toBe('Error 2');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.VALIDATION, 'E001', 'Error 1');
      errorLogger.logError(ErrorSeverity.WARNING, ErrorCategory.PROCESSING, 'E002', 'Error 2');
      errorLogger.logError(ErrorSeverity.ERROR, ErrorCategory.VALIDATION, 'E003', 'Error 3');

      const stats = errorLogger.getStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(2);
      expect(stats.byCategory[ErrorCategory.PROCESSING]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.ERROR]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.WARNING]).toBe(1);
      expect(stats.unresolvedCount).toBe(3);
    });
  });
});
