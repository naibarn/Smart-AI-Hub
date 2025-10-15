import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { createLogger, createRequestLoggingMiddleware, createErrorLoggingMiddleware } from '@smart-ai-hub/shared-logger';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Initialize logger
const logger = createLogger({
  service: 'auth-service',
  level: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '/var/log/auth-service'
});

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use(createRequestLoggingMiddleware(logger));

// Add error logging middleware
app.use(createErrorLoggingMiddleware(logger));

// Health check
app.get('/health', (req: Request, res: Response) => {
  logger.info('Health check accessed', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id']
  });
  res.json({ status: 'OK' });
});

// Placeholder auth routes
app.post('/register', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const startTime = Date.now();
  
  try {
    // Placeholder for registration logic
    logger.info('User registration attempt', {
      email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id']
    });
    
    // Simulate registration
    if (!email || !password) {
      logger.warn('Registration failed - missing fields', {
        email: !!email,
        password: !!password,
        requestId: req.headers['x-request-id']
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const duration = Date.now() - startTime;
    logger.logEvent('user_registered', { email }, {
      requestId: req.headers['x-request-id'],
      duration
    });
    
    res.json({ message: 'User registered', email });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError('Registration failed', error as Error, {
      email,
      requestId: req.headers['x-request-id'],
      duration
    });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const startTime = Date.now();
  
  try {
    // Placeholder for login logic
    logger.info('User login attempt', {
      email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id']
    });
    
    // Simulate login
    if (!email || !password) {
      logger.logSecurity('login_failed_missing_fields', {
        email: !!email,
        password: !!password,
        ip: req.ip,
        requestId: req.headers['x-request-id']
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Simulate authentication failure for demo
    if (email === 'fail@example.com') {
      const duration = Date.now() - startTime;
      logger.logSecurity('login_failed_invalid_credentials', {
        email,
        ip: req.ip,
        requestId: req.headers['x-request-id'],
        duration
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const duration = Date.now() - startTime;
    logger.logEvent('user_login', { email }, {
      requestId: req.headers['x-request-id'],
      duration
    });
    
    logger.info('User logged in successfully', {
      email,
      requestId: req.headers['x-request-id'],
      duration
    });
    
    res.json({ message: 'User logged in', token: 'jwt_token_placeholder' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError('Login failed', error as Error, {
      email,
      requestId: req.headers['x-request-id'],
      duration
    });
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(PORT, () => {
  logger.info(`Auth Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default app;
