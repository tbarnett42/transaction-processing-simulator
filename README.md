# Transaction Processing Simulator

A backend service that simulates real-world transaction processing workflows with authentication, webhooks, and batch processing.

## Live Demo (Production)
- Swagger API Docs: https://transaction-processing-simulator-production.up.railway.app/api-docs

## Why I Built This

I built this project based on my 7 years of experience in payments operations at Navy Federal Credit Union. I'm transitioning into application engineering, and I wanted to demonstrate that I understand not just the operations side, but the technical systems behind it.

The design decisions — the rules engine, transaction lifecycle, webhook system — are based on patterns I've worked with in production financial systems. This simulator mirrors real-world payment workflows including fraud detection, compliance checks, and settlement processes.

**Tech Stack:** TypeScript, Node.js, Express, MongoDB

![Swagger UI](./docs/screenshots/swagger-ui.png)

---

## Features

- **JWT Authentication** - Secure login/register with role-based access control (admin, operator, user)
- **Transaction Management** - Full lifecycle: create, process, cancel, refund, retry
- **Rules Engine** - Define business rules to evaluate and validate transactions
- **Webhooks** - Subscribe to transaction events with automatic retries and HMAC signatures
- **Batch Processing** - Bulk operations for high-volume scenarios
- **Rate Limiting** - API protection against abuse
- **Swagger/OpenAPI** - Interactive API documentation
- **MongoDB Support** - Optional persistence with in-memory fallback
- **Error Logging** - Comprehensive error tracking with Winston

---

## Recruiter Snapshot
This project demonstrates:
- Secure authentication (JWT + RBAC)
- Transaction lifecycle management + business rules engine validation
- Event-driven integrations via webhooks (HMAC + retries)
- Production deployment with live API documentation

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/tbarnett42/transaction-processing-simulator.git
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

### Demo Access
Create a test user via `POST /api/auth/register` or configure credentials securely in a local `.env` file.

---


## API Documentation
- Local Swagger: http://localhost:3000/api-docs
- Production Swagger: https://transaction-processing-simulator-production.up.railway.app/api-docs

## Deployment
Deployed on Railway with MongoDB Atlas. Includes environment-based configuration, rate limiting, structured logging, and live Swagger documentation.

---

## Architecture

```
src/
├── config/                 # Configuration
│   ├── index.ts            # Main config (port, env, JWT settings)
│   ├── database.ts         # MongoDB connection with in-memory fallback
│   └── swagger.ts          # OpenAPI specification
│
├── middleware/             # Express middleware (runs on every request)
│   ├── auth.ts             # JWT token verification
│   ├── rateLimiter.ts      # Prevents abuse (stricter on login endpoints)
│   ├── logging.ts          # Request/response logging
│   ├── validation.ts       # Input validation
│   └── errorHandler.ts     # Catches errors, returns clean responses
│
├── routes/                 # API route definitions (traffic directors)
│   ├── index.ts            # Mounts all route modules
│   ├── authRoutes.ts       # /api/auth/*
│   ├── transactionRoutes.ts# /api/transactions/*
│   ├── rulesRoutes.ts      # /api/rules/*
│   ├── webhookRoutes.ts    # /api/webhooks/*
│   └── batchRoutes.ts      # /api/batch/*
│
├── controllers/            # Request handlers (validate input, call services)
│
├── services/               # Business logic (where the real work happens)
│   ├── AuthService.ts      # Login, registration, JWT generation
│   ├── TransactionService.ts # Transaction lifecycle management
│   ├── RulesEngine.ts      # Evaluates fraud/compliance rules
│   ├── WebhookService.ts   # Notifies external systems
│   ├── BatchService.ts     # Bulk operations
│   └── ErrorLogger.ts      # Structured error tracking
│
├── models/                 # TypeScript interfaces & types
│   └── schemas/            # Mongoose schemas for MongoDB
│
└── index.ts                # Application entry point
```

### Request Flow

```
User Request (POST /api/transactions)
         │
         ▼
    index.ts ──────────────── Middleware runs (logging, rate limiting, auth)
         │
         ▼
    routes/index.ts ───────── Directs to transactionRoutes.ts
         │
         ▼
    transactionRoutes.ts ──── Matches endpoint, calls controller
         │
         ▼
    controller ────────────── Validates input, calls service
         │
         ▼
    TransactionService.ts ─── Creates transaction, calls RulesEngine
         │
         ▼
    RulesEngine.ts ────────── Evaluates rules, returns ALLOW/DENY
         │
         ▼
    Response to user
         │
         ▼
    WebhookService.ts ──────── Notifies subscribed external systems (async)
```

---

## Transaction Lifecycle

```
PENDING ──▶ VALIDATING ──▶ PROCESSING ──▶ COMPLETED
   │            │              │              │
   ▼            ▼              ▼              ▼
CANCELLED    FAILED         FAILED       REFUNDED
                │
                ▼
          PENDING (retry, max 3 attempts)
```

| Status | Description |
|--------|-------------|
| PENDING | Transaction created, waiting to be processed |
| VALIDATING | Rules engine checking fraud/compliance |
| PROCESSING | Transaction in progress |
| COMPLETED | Successfully finished |
| FAILED | Something went wrong (can be retried) |
| CANCELLED | Stopped before completion |
| REFUNDED | Reversed after completion |

---

## Rules Engine

The rules engine evaluates every transaction against configurable business rules.

### Rule Actions

| Action | Behavior | Example Use Case |
|--------|----------|------------------|
| ALLOW | Transaction proceeds | Normal transaction |
| DENY | Transaction blocked | Exceeds $100k limit |
| FLAG | Proceeds but marked for review | Unusual pattern |
| REQUIRE_APPROVAL | Needs supervisor approval | Large transfer |

### Default Rules

1. **Very High Amount Block** - Blocks transactions over $100,000
2. **High Amount Threshold** - Flags transactions over $10,000
3. **Minimum Amount** - Rejects transactions below $0.01
4. **Supported Currencies** - Only allows USD, EUR, GBP

---

## API Endpoints

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

---

## Configuration

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

---

## Usage Examples

### Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
          "email": "YOUR_EMAIL",
          "password": "YOUR_PASSWORD"
     }'
```

### Create a Transaction

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

---

## Security Features

- **Password Hashing** - bcrypt with configurable salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Role-Based Access** - admin, operator, user roles
- **Rate Limiting** - Configurable per-endpoint limits
- **HMAC Signatures** - Webhook payload verification
- **Input Validation** - Request payload validation

---

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## License

MIT
