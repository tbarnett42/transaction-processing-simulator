// Error Severity Levels
export enum ErrorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Error Categories
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  PROCESSING = 'PROCESSING',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_RULE = 'BUSINESS_RULE',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

// Error Log Entry
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  transactionId?: string;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Error Statistics
export interface ErrorStats {
  totalErrors: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  unresolvedCount: number;
  last24Hours: number;
}

// Standard Error Codes
export const ERROR_CODES = {
  // Validation Errors (1xxx)
  INVALID_AMOUNT: 'E1001',
  INVALID_CURRENCY: 'E1002',
  INVALID_ACCOUNT: 'E1003',
  MISSING_REQUIRED_FIELD: 'E1004',
  INVALID_TRANSACTION_TYPE: 'E1005',
  
  // Processing Errors (2xxx)
  INSUFFICIENT_FUNDS: 'E2001',
  ACCOUNT_NOT_FOUND: 'E2002',
  DUPLICATE_TRANSACTION: 'E2003',
  PROCESSING_TIMEOUT: 'E2004',
  PROCESSING_FAILED: 'E2005',
  
  // Rule Errors (3xxx)
  RULE_VIOLATION: 'E3001',
  AMOUNT_EXCEEDED: 'E3002',
  BLOCKED_ACCOUNT: 'E3003',
  
  // Status Errors (4xxx)
  INVALID_STATUS_TRANSITION: 'E4001',
  TRANSACTION_NOT_FOUND: 'E4002',
  TRANSACTION_ALREADY_COMPLETED: 'E4003',
  TRANSACTION_CANCELLED: 'E4004',
  
  // System Errors (5xxx)
  INTERNAL_ERROR: 'E5001',
  SERVICE_UNAVAILABLE: 'E5002',
  DATABASE_ERROR: 'E5003'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
