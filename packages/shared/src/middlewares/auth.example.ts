/**
 * Example usage of JWT Authentication Middleware
 *
 * This file demonstrates how to use the authenticateJWT middleware
 * in an Express application.
 */

import express from 'express';
import {
  authenticateJWT,
  requireRole,
  connectAuthRedis,
  AuthenticatedRequest,
} from './auth.middleware';

const app = express();

// Initialize Redis connection for auth middleware
connectAuthRedis().catch(console.error);

// Example routes
app.get('/users/me', authenticateJWT, (req: AuthenticatedRequest, res: express.Response) => {
  // User is authenticated and req.user is available
  res.json({
    message: 'User profile',
    user: req.user,
  });
});

// Admin-only route
app.get(
  '/admin/dashboard',
  authenticateJWT,
  requireRole('admin'),
  (req: AuthenticatedRequest, res: express.Response) => {
    // User is authenticated and has admin role
    res.json({
      message: 'Admin dashboard',
      user: req.user,
    });
  }
);

// Public route (no authentication required)
app.get('/public', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Public content - no authentication required',
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
