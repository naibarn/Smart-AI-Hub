import { Router } from 'express';
import { internalController } from '../controllers/internal.controller';
import { authenticateInternal } from '../middleware/auth.middleware';
import { internalRateLimiter } from '../middleware/rateLimiter.middleware';
import Joi from 'joi';

const router = Router();

// Apply internal authentication to all internal routes
router.use(authenticateInternal);
router.use(internalRateLimiter);

// Validation schema for webhook trigger
const triggerWebhookSchema = Joi.object({
  eventType: Joi.string()
    .valid('user.created', 'credit.depleted', 'credit.low', 'service.completed', 'service.failed')
    .required()
    .messages({
      'any.only': 'Invalid event type',
      'any.required': 'Event type is required',
    }),
  userId: Joi.string().uuid().required().messages({
    'string.uuid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required',
  }),
  data: Joi.object().required().messages({
    'any.required': 'Data is required',
  }),
  metadata: Joi.object().optional(),
});

// Middleware for validation
const validateTriggerWebhook = (req: any, res: any, next: any) => {
  const { error } = triggerWebhookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
    });
  }
  next();
};

// Internal webhook trigger endpoint
router.post(
  '/webhooks/trigger',
  validateTriggerWebhook,
  internalController.triggerWebhook.bind(internalController)
);

// Internal health check endpoint
router.get('/health', internalController.healthCheck.bind(internalController));

// Internal statistics endpoint
router.get('/stats', internalController.getStats.bind(internalController));

export default router;
