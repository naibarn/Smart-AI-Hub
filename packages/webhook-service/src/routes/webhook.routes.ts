import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { apiRateLimiter, webhookUrlValidator, payloadSizeLimiter } from '../middleware/rateLimiter.middleware';
import Joi from 'joi';

const router = Router();

// Apply authentication and rate limiting to all webhook routes
router.use(authenticateJWT);
router.use(apiRateLimiter);

// Validation schemas
const createWebhookSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL must be a valid URI',
    'any.required': 'URL is required',
  }),
  events: Joi.array().items(Joi.string().valid(
    'user.created',
    'credit.depleted',
    'credit.low',
    'service.completed',
    'service.failed'
  )).min(1).required().messages({
    'array.min': 'At least one event type is required',
    'any.only': 'Invalid event type',
    'any.required': 'Events are required',
  }),
  description: Joi.string().optional().max(500).messages({
    'string.max': 'Description must be less than 500 characters',
  }),
});

const updateWebhookSchema = Joi.object({
  url: Joi.string().uri().optional().messages({
    'string.uri': 'URL must be a valid URI',
  }),
  events: Joi.array().items(Joi.string().valid(
    'user.created',
    'credit.depleted',
    'credit.low',
    'service.completed',
    'service.failed'
  )).min(1).optional().messages({
    'array.min': 'At least one event type is required',
    'any.only': 'Invalid event type',
  }),
  description: Joi.string().optional().max(500).allow('').messages({
    'string.max': 'Description must be less than 500 characters',
  }),
  isActive: Joi.boolean().optional(),
});

const testWebhookSchema = Joi.object({
  eventType: Joi.string().valid(
    'user.created',
    'credit.depleted',
    'credit.low',
    'service.completed',
    'service.failed'
  ).required().messages({
    'any.only': 'Invalid event type',
    'any.required': 'Event type is required',
  }),
  payload: Joi.object().optional(),
});

// Middleware for validation
const validateCreateWebhook = (req: any, res: any, next: any) => {
  const { error } = createWebhookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
    });
  }
  next();
};

const validateUpdateWebhook = (req: any, res: any, next: any) => {
  const { error } = updateWebhookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
    });
  }
  next();
};

const validateTestWebhook = (req: any, res: any, next: any) => {
  const { error } = testWebhookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
    });
  }
  next();
};

// Webhook CRUD routes
router.get('/', webhookController.getWebhooks.bind(webhookController));

router.post(
  '/',
  payloadSizeLimiter(),
  validateCreateWebhook,
  webhookUrlValidator,
  webhookController.createWebhook.bind(webhookController)
);

router.get('/:id', webhookController.getWebhookById.bind(webhookController));

router.put(
  '/:id',
  payloadSizeLimiter(),
  validateUpdateWebhook,
  webhookUrlValidator,
  webhookController.updateWebhook.bind(webhookController)
);

router.delete('/:id', webhookController.deleteWebhook.bind(webhookController));

// Webhook management routes
router.post(
  '/:id/test',
  payloadSizeLimiter(),
  validateTestWebhook,
  webhookController.testWebhook.bind(webhookController)
);

router.post('/:id/toggle', webhookController.toggleWebhook.bind(webhookController));

router.get('/:id/logs', webhookController.getWebhookLogs.bind(webhookController));

// Statistics route
router.get('/stats', webhookController.getWebhookStats.bind(webhookController));

export default router;