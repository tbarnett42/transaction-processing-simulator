import mongoose, { Schema, Document } from 'mongoose';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[]; // e.g., ['transaction.created', 'transaction.completed']
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  response?: {
    status: number;
    body?: string;
  };
  success: boolean;
  error?: string;
  attempts: number;
  createdAt: Date;
}

export interface WebhookDocument extends Omit<Webhook, 'id'>, Document {}
export interface WebhookLogDocument extends Omit<WebhookLog, 'id'>, Document {}

const WebhookSchema = new Schema<WebhookDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  secret: {
    type: String
  },
  events: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      const { _id, __v, ...rest } = ret;
      return { id: _id.toString(), ...rest };
    }
  }
});

const WebhookLogSchema = new Schema<WebhookLogDocument>({
  webhookId: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  response: {
    status: Number,
    body: String
  },
  success: {
    type: Boolean,
    required: true
  },
  error: {
    type: String
  },
  attempts: {
    type: Number,
    default: 1
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      const { _id, __v, ...rest } = ret;
      return { id: _id.toString(), ...rest };
    }
  }
});

WebhookSchema.index({ isActive: 1 });
WebhookLogSchema.index({ webhookId: 1 });
WebhookLogSchema.index({ createdAt: -1 });

export const WebhookModel = mongoose.model<WebhookDocument>('Webhook', WebhookSchema);
export const WebhookLogModel = mongoose.model<WebhookLogDocument>('WebhookLog', WebhookLogSchema);
