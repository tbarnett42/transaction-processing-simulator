import { Request, Response, NextFunction } from 'express';
import { TransactionType, TransactionPriority } from '../models';

/**
 * Validate transaction creation request
 */
export function validateTransactionRequest(req: Request, res: Response, next: NextFunction): void {
  const { type, amount, currency, sourceAccount } = req.body;
  const errors: string[] = [];

  // Validate type
  if (!type) {
    errors.push('type is required');
  } else if (!Object.values(TransactionType).includes(type)) {
    errors.push(`Invalid type. Must be one of: ${Object.values(TransactionType).join(', ')}`);
  }

  // Validate amount
  if (amount === undefined || amount === null) {
    errors.push('amount is required');
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.push('amount must be a positive number');
  }

  // Validate currency
  if (!currency) {
    errors.push('currency is required');
  } else if (typeof currency !== 'string' || currency.length !== 3) {
    errors.push('currency must be a 3-letter code (e.g., USD, EUR)');
  }

  // Validate source account
  if (!sourceAccount) {
    errors.push('sourceAccount is required');
  }

  // Validate priority if provided
  if (req.body.priority && !Object.values(TransactionPriority).includes(req.body.priority)) {
    errors.push(`Invalid priority. Must be one of: ${Object.values(TransactionPriority).join(', ')}`);
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
    return;
  }

  next();
}

/**
 * Validate rule creation request
 */
export function validateRuleRequest(req: Request, res: Response, next: NextFunction): void {
  const { name, condition } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!condition || typeof condition !== 'object') {
    errors.push('condition is required and must be an object');
  } else {
    if (!condition.type) {
      errors.push('condition.type is required');
    }
    if (!condition.operator) {
      errors.push('condition.operator is required');
    }
    if (condition.value === undefined) {
      errors.push('condition.value is required');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
    return;
  }

  next();
}

/**
 * Validate UUID parameter
 */
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid || !uuidRegex.test(uuid)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format. Must be a valid UUID.`
      });
      return;
    }

    next();
  };
}
