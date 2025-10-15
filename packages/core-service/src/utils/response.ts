import { Response } from 'express';

/**
 * Response utility functions for standardized API responses
 * Follows FR-6 API Standards specification
 */

/**
 * Generate a unique request ID
 * @returns string Unique request ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a standardized success response
 * @param data - Response data
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 200)
 * @param requestId - Request ID (auto-generated if not provided)
 */
export const successResponse = <T>(
  data: T,
  res: Response,
  statusCode: number = 200,
  requestId?: string
): Response => {
  const id = requestId || generateRequestId();
  const response = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id,
    },
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);

  return res.status(statusCode).json(response);
};

/**
 * Create a standardized error response
 * @param code - Error code
 * @param message - Error message
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 500)
 * @param details - Additional error details (optional)
 * @param requestId - Request ID (auto-generated if not provided)
 */
export const errorResponse = (
  code: string,
  message: string,
  res: Response,
  statusCode: number = 500,
  details?: any,
  requestId?: string
): Response => {
  const id = requestId || generateRequestId();
  const response = {
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      request_id: id,
    },
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);

  return res.status(statusCode).json(response);
};

/**
 * Create a standardized paginated response
 * @param data - Response data array
 * @param pagination - Pagination metadata
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 200)
 * @param requestId - Request ID (auto-generated if not provided)
 */
export const paginatedResponse = <T>(
  data: T[],
  pagination: {
    page: number;
    per_page?: number;
    limit?: number;
    total: number;
    total_pages?: number;
  },
  res: Response,
  statusCode: number = 200,
  requestId?: string
): Response => {
  const id = requestId || generateRequestId();
  const perPage = pagination.per_page || pagination.limit || 20;
  const totalPages = pagination.total_pages || Math.ceil(pagination.total / perPage);

  const response = {
    data,
    pagination: {
      page: pagination.page,
      per_page: perPage,
      total: pagination.total,
      total_pages: totalPages,
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id,
    },
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);

  return res.status(statusCode).json(response);
};

/**
 * Create a deprecation response for backward compatibility
 * @param data - Response data
 * @param deprecationMessage - Deprecation message
 * @param newEndpoint - New endpoint URL
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 200)
 * @param requestId - Request ID (auto-generated if not provided)
 */
export const deprecationResponse = <T>(
  data: T,
  deprecationMessage: string,
  newEndpoint: string,
  res: Response,
  statusCode: number = 200,
  requestId?: string
): Response => {
  const id = requestId || generateRequestId();
  const response = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id,
      deprecated: true,
      deprecation_message: deprecationMessage,
      new_endpoint: newEndpoint,
    },
  };

  // Set headers for deprecation
  res.setHeader('X-Request-ID', id);
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', `<${newEndpoint}>; rel="successor-version"`);

  return res.status(statusCode).json(response);
};
