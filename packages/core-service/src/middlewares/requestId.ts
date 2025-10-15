import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/response';

/**
 * Extend Express Request interface to include requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware to generate and attach request ID to all incoming requests
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request ID is already present in headers
  let requestId = req.headers['x-request-id'] as string;

  // If not present, generate a new one
  if (!requestId) {
    requestId = generateRequestId();
  }

  // Attach request ID to request object for use in other middleware/controllers
  req.requestId = requestId;

  // Set request ID header in response
  res.setHeader('X-Request-ID', requestId);

  next();
};
