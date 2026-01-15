# Transaction Processing Simulator

A backend service that simulates real-world transaction processing workflows with authentication, webhooks, and batch processing.

![Swagger UI](./docs/screenshots/swagger-ui.png)

## ✨ Features

- **🔐 JWT Authentication** - Secure login/register with role-based access control (admin, operator, user)
- **💳 Transaction Management** - Full lifecycle: create, process, cancel, refund, retry
- **⚙️ Rules Engine** - Define business rules to evaluate and validate transactions
- **🔔 Webhooks** - Subscribe to transaction events with automatic retries and HMAC signatures
- **📦 Batch Processing** - Bulk operations for high-volume scenarios
- **🛡️ Rate Limiting** - API protection against abuse
- **📖 Swagger/OpenAPI** - Interactive API documentation
- **🗄️ MongoDB Support** - Optional persistence with in-memory fallback
- **📊 Error Logging** - Comprehensive error tracking with Winston

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/transaction-processing-simulator.git
cd transaction-processing-simulator

# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test
```

The server will start at **http://localhost:3000**

### 🔑 Default Login
```
Email: admin@example.com
Password: admin123
```

## 📖 API Documentation

Visit **http://localhost:3000/api-docs** for interactive Swagger documentation.

![API Endpoints](./docs/screenshots/api-endpoints.png)

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create a new transaction |
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/:id` | Get a specific transaction |
| POST | `/api/transactions/:id/process` | Process a pending transaction |
| POST | `/api/transactions/:id/retry` | Retry a failed transaction |
| POST | `/api/transactions/:id/cancel` | Cancel a transaction |
| POST | `/api/transactions/:id/refund` | Refund a completed transaction |
| GET | `/api/transactions/stats` | Get transaction statistics |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rules` | List all rules |
| POST | `/api/rules` | Create a new rule |
| GET | `/api/rules/:id` | Get a specific rule |
| PUT | `/api/rules/:id` | Update a rule |
| DELETE | `/api/rules/:id` | Delete a rule |
| POST | `/api/rules/:id/enable` | Enable a rule |
| POST | `/api/rules/:id/disable` | Disable a rule |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks` | List all webhooks |
| POST | `/api/webhooks` | Create a new webhook subscription |
| GET | `/api/webhooks/:id` | Get a specific webhook |
| DELETE | `/api/webhooks/:id` | Delete a webhook |

### Batch Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/batch/create` | Create multiple transactions |
| POST | `/api/batch/process` | Process multiple transactions |
| POST | `/api/batch/cancel` | Cancel multiple transactions |
| POST | `/api/batch/retry` | Retry multiple failed transactions |

### Errors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/errors` | List all errors |
| GET | `/api/errors/unresolved` | List unresolved errors |
| GET | `/api/errors/stats` | Get error statistics |
| POST | `/api/errors/:id/resolve` | Mark error as resolved |

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB (optional - uses in-memory if not set)
MONGODB_URI=mongodb://localhost:27017/transaction-simulator

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

## 💡 Usage Examples

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Create a Transaction (with auth)

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "PAYMENT",
    "amount": 150.00,
    "currency": "USD",
    "sourceAccount": "ACC-001",
    "destinationAccount": "ACC-002",
    "description": "Test payment"
  }'
```

### Process a Transaction

```bash
curl -X POST http://localhost:3000/api/transactions/{id}/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a Webhook Subscription

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["transaction.completed", "transaction.failed"],
    "secret": "your-webhook-secret"
  }'
```

### Create a Custom Rule

```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Block Large Transfers",
    "description": "Block transfers over $50,000",
    "condition": {
      "type": "COMPOSITE",
      "operator": "AND",
      "children": [
        { "type": "TRANSACTION_TYPE", "operator": "EQ", "value": "TRANSFER", "field": "type" },
        { "type": "AMOUNT_THRESHOLD", "operator": "GT", "value": 50000, "field": "amount" }
      ]
    },
    "action": "DENY",
    "severity": "CRITICAL",
    "priority": 0
  }'
```

## Transaction Types

- `PAYMENT` - Standard payment transaction
- `TRANSFER` - Transfer between accounts
- `WITHDRAWAL` - Withdrawal from account
- `DEPOSIT` - Deposit to account
- `REFUND` - Refund transaction

## Transaction Status Lifecycle

```
PENDING → VALIDATING → PROCESSING → COMPLETED
    ↓         ↓            ↓
CANCELLED   FAILED       FAILED
              ↓
           PENDING (retry)

COMPLETED → REFUNDED
```

## Default Rules

1. **Very High Amount Block**: Blocks transactions over $100,000
2. **High Amount Threshold**: Flags transactions over $10,000
3. **Minimum Amount**: Rejects transactions below $0.01
4. **Supported Currencies**: Only allows USD, EUR, GBP

## 📁 Project Structure

```
src/
├── config/              # Configuration
│   ├── index.ts         # Main config
│   ├── database.ts      # MongoDB connection
│   └── swagger.ts       # OpenAPI specification
├── controllers/         # Request handlers
├── middleware/          # Express middleware
│   ├── auth.ts          # JWT authentication
│   ├── rateLimiter.ts   # Rate limiting
│   ├── logging.ts       # Request logging
│   ├── validation.ts    # Input validation
│   └── errorHandler.ts  # Error handling
├── models/              # TypeScript interfaces & types
│   └── schemas/         # Mongoose schemas
├── routes/              # API route definitions
├── services/            # Business logic
│   ├── AuthService.ts   # JWT & user management
│   ├── TransactionService.ts
│   ├── RulesEngine.ts
│   ├── WebhookService.ts
│   ├── BatchService.ts
│   └── ErrorLogger.ts
└── index.ts             # Application entry point
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with configurable salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Role-Based Access** - admin, operator, user roles
- **Rate Limiting** - Configurable per-endpoint limits
- **HMAC Signatures** - Webhook payload verification
- **Input Validation** - Request payload validation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📜 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Made with ❤️ using Node.js, TypeScript, and Express
