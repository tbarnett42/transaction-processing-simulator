import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transaction Processing Simulator API',
      version: '2.0.0',
      description: 'A backend service that simulates real-world transaction processing workflows with authentication, webhooks, and batch processing.',
      contact: {
        name: 'API Support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['PAYMENT', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT', 'REFUND'] },
            status: { type: 'string', enum: ['PENDING', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'] },
            priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
            amount: { type: 'number', minimum: 0.01 },
            currency: { type: 'string', minLength: 3, maxLength: 3 },
            sourceAccount: { type: 'string' },
            destinationAccount: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            errorCode: { type: 'string' },
            errorMessage: { type: 'string' },
            retryCount: { type: 'integer' },
            maxRetries: { type: 'integer' }
          }
        },
        CreateTransactionRequest: {
          type: 'object',
          required: ['type', 'amount', 'currency', 'sourceAccount'],
          properties: {
            type: { type: 'string', enum: ['PAYMENT', 'TRANSFER', 'WITHDRAWAL', 'DEPOSIT', 'REFUND'] },
            amount: { type: 'number', minimum: 0.01 },
            currency: { type: 'string', minLength: 3, maxLength: 3 },
            sourceAccount: { type: 'string' },
            destinationAccount: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
            metadata: { type: 'object' }
          }
        },
        Rule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            enabled: { type: 'boolean' },
            priority: { type: 'integer' },
            condition: { type: 'object' },
            action: { type: 'string', enum: ['ALLOW', 'DENY', 'FLAG', 'REQUIRE_APPROVAL'] },
            severity: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Webhook: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user', 'operator'] },
            isActive: { type: 'boolean' },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' },
            expiresIn: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            code: { type: 'string' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Transactions', description: 'Transaction management' },
      { name: 'Rules', description: 'Rules engine management' },
      { name: 'Webhooks', description: 'Webhook management' },
      { name: 'Batch', description: 'Batch operations' },
      { name: 'Errors', description: 'Error log management' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/swagger/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
