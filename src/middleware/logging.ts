import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path, query } = req;

  // Log request
  console.log(`--> ${method} ${path}`, Object.keys(query).length > 0 ? query : '');

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusEmoji = statusCode < 400 ? '✓' : '✗';
    console.log(`<-- ${statusEmoji} ${method} ${path} ${statusCode} (${duration}ms)`);
  });

  next();
}

/**
 * Request timing middleware
 */
export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Store start time on request object instead of using headers
  (req as Request & { startTime?: number }).startTime = startTime;
  
  // Set header before sending response
  const originalSend = res.send;
  res.send = function(body): Response {
    const duration = Date.now() - startTime;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    return originalSend.call(this, body);
  };

  next();
}
