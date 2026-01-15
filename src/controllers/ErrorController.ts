import { Request, Response, NextFunction } from 'express';
import { errorLogger } from '../services';
import { ErrorSeverity, ErrorCategory } from '../models';

/**
 * Error Controller - Handles error log management HTTP requests
 */
export class ErrorController {
  /**
   * Get all error logs
   * GET /api/errors
   */
  async getAllErrors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { severity, category, transactionId, resolved, limit, offset } = req.query;

      let errors = errorLogger.getAllErrors();

      // Filter by severity
      if (severity && Object.values(ErrorSeverity).includes(severity as ErrorSeverity)) {
        errors = errors.filter(e => e.severity === severity);
      }

      // Filter by category
      if (category && Object.values(ErrorCategory).includes(category as ErrorCategory)) {
        errors = errors.filter(e => e.category === category);
      }

      // Filter by transaction ID
      if (transactionId) {
        errors = errors.filter(e => e.transactionId === transactionId);
      }

      // Filter by resolved status
      if (resolved !== undefined) {
        const isResolved = resolved === 'true';
        errors = errors.filter(e => e.resolved === isResolved);
      }

      // Pagination
      const limitNum = parseInt(limit as string) || 100;
      const offsetNum = parseInt(offset as string) || 0;
      const paginatedErrors = errors.slice(offsetNum, offsetNum + limitNum);

      res.json({
        success: true,
        data: paginatedErrors,
        pagination: {
          total: errors.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < errors.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get errors for a specific transaction
   * GET /api/errors/transaction/:transactionId
   */
  async getErrorsByTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactionId } = req.params;
      const errors = errorLogger.getErrorsByTransaction(transactionId);

      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unresolved errors
   * GET /api/errors/unresolved
   */
  async getUnresolvedErrors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = errorLogger.getUnresolvedErrors();

      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get error statistics
   * GET /api/errors/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = errorLogger.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve an error
   * POST /api/errors/:id/resolve
   */
  async resolveError(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { resolvedBy } = req.body;

      if (!resolvedBy) {
        res.status(400).json({
          error: 'resolvedBy is required'
        });
        return;
      }

      const error = errorLogger.resolveError(id, resolvedBy);

      if (!error) {
        res.status(404).json({
          error: 'Error log not found'
        });
        return;
      }

      res.json({
        success: true,
        data: error,
        message: 'Error marked as resolved'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get errors by severity level
   * GET /api/errors/severity/:severity
   */
  async getErrorsBySeverity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { severity } = req.params;

      if (!Object.values(ErrorSeverity).includes(severity as ErrorSeverity)) {
        res.status(400).json({
          error: 'Invalid severity level',
          validLevels: Object.values(ErrorSeverity)
        });
        return;
      }

      const errors = errorLogger.getErrorsBySeverity(severity as ErrorSeverity);

      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get errors by category
   * GET /api/errors/category/:category
   */
  async getErrorsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;

      if (!Object.values(ErrorCategory).includes(category as ErrorCategory)) {
        res.status(400).json({
          error: 'Invalid category',
          validCategories: Object.values(ErrorCategory)
        });
        return;
      }

      const errors = errorLogger.getErrorsByCategory(category as ErrorCategory);

      res.json({
        success: true,
        data: errors,
        count: errors.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export const errorController = new ErrorController();
