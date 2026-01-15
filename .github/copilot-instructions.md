<!-- Custom instructions for this Transaction Processing Simulator project -->

## Project Overview
This is a Node.js/TypeScript backend service that simulates transaction processing workflows.

## Architecture
- **Models**: TypeScript interfaces in `src/models/`
- **Services**: Business logic layer with singleton pattern
- **Controllers**: HTTP request handlers
- **Routes**: Express route definitions
- **Middleware**: Request logging, validation, error handling

## Key Services
1. **TransactionService**: Manages transaction lifecycle
2. **RulesEngine**: Evaluates business rules against transactions
3. **ErrorLogger**: Centralized error logging with Winston

## Development Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

## Coding Guidelines
- Use async/await for asynchronous operations
- Follow singleton pattern for services
- Use TypeScript strict mode
- Handle errors with proper HTTP status codes
