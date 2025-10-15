/**
 * Response utility functions for standardized API responses
 * Follows FR-6 API Standards specification
 */

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a standardized success response
 * @param {Object} data - Response data
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} requestId - Request ID (auto-generated if not provided)
 */
const successResponse = (data, res, statusCode = 200, requestId = null) => {
  const id = requestId || generateRequestId();
  const response = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id
    }
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);
  
  return res.status(statusCode).json(response);
};

/**
 * Create a standardized error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details (optional)
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} requestId - Request ID (auto-generated if not provided)
 */
const errorResponse = (code, message, res, statusCode = 500, details = null, requestId = null) => {
  const id = requestId || generateRequestId();
  const response = {
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      request_id: id
    }
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);
  
  return res.status(statusCode).json(response);
};

/**
 * Create a standardized paginated response
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} requestId - Request ID (auto-generated if not provided)
 */
const paginatedResponse = (data, pagination, res, statusCode = 200, requestId = null) => {
  const id = requestId || generateRequestId();
  const response = {
    data,
    pagination: {
      page: pagination.page,
      per_page: pagination.per_page || pagination.limit,
      total: pagination.total,
      total_pages: pagination.total_pages || Math.ceil(pagination.total / (pagination.per_page || pagination.limit))
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id
    }
  };

  // Set request ID header
  res.setHeader('X-Request-ID', id);
  
  return res.status(statusCode).json(response);
};

/**
 * Create a deprecation response for backward compatibility
 * @param {Object} data - Response data
 * @param {string} deprecationMessage - Deprecation message
 * @param {string} newEndpoint - New endpoint URL
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} requestId - Request ID (auto-generated if not provided)
 */
const deprecationResponse = (data, deprecationMessage, newEndpoint, res, statusCode = 200, requestId = null) => {
  const id = requestId || generateRequestId();
  const response = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: id,
      deprecated: true,
      deprecation_message: deprecationMessage,
      new_endpoint: newEndpoint
    }
  };

  // Set headers for deprecation
  res.setHeader('X-Request-ID', id);
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', `<${newEndpoint}>; rel="successor-version"`);
  
  return res.status(statusCode).json(response);
};

module.exports = {
  generateRequestId,
  successResponse,
  errorResponse,
  paginatedResponse,
  deprecationResponse
};