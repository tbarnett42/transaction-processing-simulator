import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFoundHandler, requestLogger, requestTiming, standardLimiter, authLimiter } from './middleware';
import { config } from './config';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';

// Create Express application
const app: Application = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestLogger);
app.use(requestTiming);

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', standardLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Transaction Simulator API'
}));

// API routes
app.use(config.apiPrefix, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Transaction Processing Simulator',
    version: '2.0.0',
    description: 'A backend service that simulates real-world transaction processing workflows',
    documentation: '/api-docs',
    endpoints: {
      health: `${config.apiPrefix}/health`,
      auth: `${config.apiPrefix}/auth`,
      transactions: `${config.apiPrefix}/transactions`,
      rules: `${config.apiPrefix}/rules`,
      errors: `${config.apiPrefix}/errors`,
      webhooks: `${config.apiPrefix}/webhooks`,
      batch: `${config.apiPrefix}/batch`
    },
    features: [
      'JWT Authentication',
      'Transaction Lifecycle Management',
      'Rules Engine',
      'Webhook Notifications',
      'Batch Processing',
      'Rate Limiting',
      'Error Logging',
      'OpenAPI/Swagger Documentation'
    ]
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  // Connect to database (optional - falls back to in-memory if not configured)
  await connectDatabase();
  
  const PORT = config.port;
  const HOST = config.host;

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       Transaction Processing Simulator v2.0                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Server:      http://${HOST}:${PORT}                              ║
║  Environment: ${config.nodeEnv.padEnd(44)}║
║  Swagger:     http://${HOST}:${PORT}/api-docs                     ║
╠═══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                               ║
║    • Auth:         /api/auth                                  ║
║    • Transactions: /api/transactions                          ║
║    • Rules:        /api/rules                                 ║
║    • Webhooks:     /api/webhooks                              ║
║    • Batch:        /api/batch                                 ║
║    • Errors:       /api/errors                                ║
║    • Health:       /api/health                                ║
╠═══════════════════════════════════════════════════════════════╣
║  Default Login: admin@example.com / admin123                  ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
