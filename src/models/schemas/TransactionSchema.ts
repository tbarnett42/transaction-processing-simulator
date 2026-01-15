import mongoose, { Schema, Document } from 'mongoose';
import { Transaction, TransactionStatus, TransactionType, TransactionPriority } from '../Transaction';

export interface TransactionDocument extends Omit<Transaction, 'id'>, Document {}

const TransactionSchema = new Schema<TransactionDocument>({
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING
  },
  priority: {
    type: String,
    enum: Object.values(TransactionPriority),
    default: TransactionPriority.NORMAL
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  sourceAccount: {
    type: String,
    required: true
  },
  destinationAccount: {
    type: String
  },
  description: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  completedAt: {
    type: Date
  },
  errorCode: {
    type: String
  },
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      const { _id, __v, ...rest } = ret;
      return { id: _id.toString(), ...rest };
    }
  }
});

// Indexes for common queries
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ sourceAccount: 1 });

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
