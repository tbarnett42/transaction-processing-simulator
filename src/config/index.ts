export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',  // Changed from 'localhost' for cloud deployment
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // API configuration
  apiPrefix: '/api',
  apiVersion: 'v1',
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || '', // Leave empty for in-memory mode
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Transaction defaults
  transaction: {
    maxRetries: 3,
    defaultPriority: 'NORMAL',
    processingDelays: {
      URGENT: 500,
      HIGH: 1000,
      NORMAL: 2000,
      LOW: 3000
    }
  },
  
  // Rules engine configuration
  rules: {
    stopOnFirstDeny: true,
    logAllEvaluations: true,
    defaultAction: 'ALLOW'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // max requests per window
  }
};