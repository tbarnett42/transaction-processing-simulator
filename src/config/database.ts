import mongoose from 'mongoose';
import { config } from './index';

export async function connectDatabase(): Promise<void> {
  try {
    if (config.mongodb.uri) {
      await mongoose.connect(config.mongodb.uri);
      console.log('✓ Connected to MongoDB');
    } else {
      console.log('⚠ MongoDB URI not configured, using in-memory storage');
    }
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    console.log('⚠ Falling back to in-memory storage');
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (isMongoConnected()) {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}
