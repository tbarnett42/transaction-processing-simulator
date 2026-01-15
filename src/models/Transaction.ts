// Transaction Status Lifecycle
export enum TransactionStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Transaction Types
export enum TransactionType {
  PAYMENT = 'PAYMENT',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  REFUND = 'REFUND'
}

// Transaction Priority
export enum TransactionPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Main Transaction Interface
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  priority: TransactionPriority;
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

// Transaction Creation Request
export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  currency: string;
  sourceAccount: string;
  destinationAccount?: string;
  description?: string;
  priority?: TransactionPriority;
  metadata?: Record<string, unknown>;
}

// Transaction Update Request
export interface UpdateTransactionRequest {
  status?: TransactionStatus;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Status Transition History
export interface StatusTransition {
  transactionId: string;
  fromStatus: TransactionStatus;
  toStatus: TransactionStatus;
  timestamp: Date;
  reason?: string;
  triggeredBy: string;
}

// Valid status transitions map
export const VALID_STATUS_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.PENDING]: [TransactionStatus.VALIDATING, TransactionStatus.CANCELLED],
  [TransactionStatus.VALIDATING]: [TransactionStatus.PROCESSING, TransactionStatus.FAILED, TransactionStatus.CANCELLED],
  [TransactionStatus.PROCESSING]: [TransactionStatus.COMPLETED, TransactionStatus.FAILED],
  [TransactionStatus.COMPLETED]: [TransactionStatus.REFUNDED],
  [TransactionStatus.FAILED]: [TransactionStatus.PENDING], // Allow retry
  [TransactionStatus.CANCELLED]: [],
  [TransactionStatus.REFUNDED]: []
};
