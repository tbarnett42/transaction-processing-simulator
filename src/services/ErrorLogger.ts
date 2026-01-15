import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import {
  ErrorLogEntry,
  ErrorSeverity,
  ErrorCategory,
  ErrorStats,
  ERROR_CODES
} from '../models';

// In-memory error log storage
const errorLogs: Map<string, ErrorLogEntry> = new Map();

// Winston logger configuration
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'transaction-processor' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error and store it
   */
  logError(
    severity: ErrorSeverity,
    category: ErrorCategory,
    code: string,
    message: string,
    options?: {
      transactionId?: string;
      details?: Record<string, unknown>;
      error?: Error;
    }
  ): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      severity,
      category,
      code,
      message,
      details: options?.details,
      transactionId: options?.transactionId,
      stackTrace: options?.error?.stack,
      resolved: false
    };

    errorLogs.set(entry.id, entry);

    // Log to Winston based on severity
    const logMessage = `[${code}] ${message}`;
    const meta = { errorId: entry.id, ...options?.details };

    switch (severity) {
      case ErrorSeverity.DEBUG:
        logger.debug(logMessage, meta);
        break;
      case ErrorSeverity.INFO:
        logger.info(logMessage, meta);
        break;
      case ErrorSeverity.WARNING:
        logger.warn(logMessage, meta);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        logger.error(logMessage, meta);
        break;
    }

    return entry;
  }

  /**
   * Log a validation error
   */
  logValidationError(
    code: string,
    message: string,
    transactionId?: string,
    details?: Record<string, unknown>
  ): ErrorLogEntry {
    return this.logError(ErrorSeverity.ERROR, ErrorCategory.VALIDATION, code, message, {
      transactionId,
      details
    });
  }

  /**
   * Log a processing error
   */
  logProcessingError(
    code: string,
    message: string,
    transactionId?: string,
    error?: Error
  ): ErrorLogEntry {
    return this.logError(ErrorSeverity.ERROR, ErrorCategory.PROCESSING, code, message, {
      transactionId,
      error
    });
  }

  /**
   * Log a business rule violation
   */
  logRuleViolation(
    ruleName: string,
    message: string,
    transactionId?: string,
    details?: Record<string, unknown>
  ): ErrorLogEntry {
    return this.logError(
      ErrorSeverity.WARNING,
      ErrorCategory.BUSINESS_RULE,
      ERROR_CODES.RULE_VIOLATION,
      `Rule "${ruleName}" violated: ${message}`,
      { transactionId, details }
    );
  }

  /**
   * Log a system error
   */
  logSystemError(message: string, error?: Error): ErrorLogEntry {
    return this.logError(ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM, ERROR_CODES.INTERNAL_ERROR, message, {
      error
    });
  }

  /**
   * Get all error logs
   */
  getAllErrors(): ErrorLogEntry[] {
    return Array.from(errorLogs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get errors by transaction ID
   */
  getErrorsByTransaction(transactionId: string): ErrorLogEntry[] {
    return this.getAllErrors().filter(e => e.transactionId === transactionId);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.getAllErrors().filter(e => e.severity === severity);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorLogEntry[] {
    return this.getAllErrors().filter(e => e.category === category);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorLogEntry[] {
    return this.getAllErrors().filter(e => !e.resolved);
  }

  /**
   * Resolve an error
   */
  resolveError(errorId: string, resolvedBy: string): ErrorLogEntry | null {
    const error = errorLogs.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;
      errorLogs.set(errorId, error);
      logger.info(`Error ${errorId} resolved by ${resolvedBy}`);
      return error;
    }
    return null;
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const errors = this.getAllErrors();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.PROCESSING]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.AUTHORIZATION]: 0,
      [ErrorCategory.BUSINESS_RULE]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.UNKNOWN]: 0
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.DEBUG]: 0,
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    let unresolvedCount = 0;
    let last24Hours = 0;

    errors.forEach(e => {
      byCategory[e.category]++;
      bySeverity[e.severity]++;
      if (!e.resolved) unresolvedCount++;
      if (e.timestamp >= oneDayAgo) last24Hours++;
    });

    return {
      totalErrors: errors.length,
      byCategory,
      bySeverity,
      unresolvedCount,
      last24Hours
    };
  }

  /**
   * Clear all errors (for testing)
   */
  clearAll(): void {
    errorLogs.clear();
    logger.info('All error logs cleared');
  }
}

export const errorLogger = ErrorLogger.getInstance();
