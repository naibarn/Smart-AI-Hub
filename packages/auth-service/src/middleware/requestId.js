/**
 * Request ID middleware for tracking requests across services
 * Follows FR-6 API Standards specification
 */

const { generateRequestId } = require('../utils/response');

/**
 * Middleware to generate and attach request ID to all incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestIdMiddleware = (req, res, next) => {
  // Check if request ID is already present in headers
  let requestId = req.headers['x-request-id'];
  
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

module.exports = requestIdMiddleware;