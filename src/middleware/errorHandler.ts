import { Request, Response, NextFunction } from 'express';
import { errorLogger } from '../services';
import { ErrorSeverity, ErrorCategory, ERROR_CODES } from '../models';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  const errorEntry = errorLogger.logError(
    ErrorSeverity.ERROR,
    ErrorCategory.SYSTEM,
    ERROR_CODES.INTERNAL_ERROR,
    err.message,
    {
      error: err,
      details: {
        path: req.path,
        method: req.method,
        body: req.body
      }
    }
  );

  // Determine status code from error message
  let statusCode = 500;
  if (err.message.includes('not found')) {
    statusCode = 404;
  } else if (err.message.includes('Invalid') || err.message.includes('required')) {
    statusCode = 400;
  } else if (err.message.includes('already')) {
    statusCode = 409;
  }

  res.status(statusCode).json({
    success: false,
    error: err.message,
    errorId: errorEntry.id,
    timestamp: new Date().toISOString()
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.path
  });
}
