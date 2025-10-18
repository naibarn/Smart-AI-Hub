import { Router } from 'express';
import { PricingController } from '@/controllers/PricingController';
import { authenticate, authenticateAdmin } from '@/middleware';
import { validateRequest, ValidationSchema } from '@/middleware';
import { rateLimit } from '@/middleware';

const router = Router();
const pricingController = new PricingController({} as any); // Mock service instance

// Validation schemas
const estimateCostSchema: ValidationSchema = {
  body: {
    platformId: { type: 'string', required: true },
    modelId: { type: 'string', required: true },
    estimatedInputTokens: { type: 'number', required: true, min: 0 },
    estimatedOutputTokens: { type: 'number', required: true, min: 0 },
    ragOperations: { type: 'object', required: false },
    toolCalls: { type: 'object', required: false }
  }
};

const executeAgentSchema: ValidationSchema = {
  body: {
    platformId: { type: 'string', required: true },
    modelId: { type: 'string', required: true },
    agentId: { type: 'string', required: false },
    sessionId: { type: 'string', required: false },
    parentCallId: { type: 'string', required: false },
    input: { type: 'string', required: true }
  }
};

const updatePricingRuleSchema: ValidationSchema = {
  params: {
    ruleId: { type: 'string', required: true }
  },
  body: {
    componentType: { type: 'string', required: false },
    unitType: { type: 'string', required: false },
    unitPrice: { type: 'number', required: false, min: 0 },
    isActive: { type: 'boolean', required: false }
  }
};

/**
 * @route GET /api/pricing/platforms
 * @desc Get all platforms
 * @access Private
 */
router.get(
  '/platforms',
  authenticate,
  pricingController.getPlatforms.bind(pricingController)
);

/**
 * @route GET /api/pricing/platforms/:platformId/models
 * @desc Get models for a platform
 * @access Private
 */
router.get(
  '/platforms/:platformId/models',
  authenticate,
  pricingController.getModels.bind(pricingController)
);

/**
 * @route GET /api/pricing/models/:modelId/rules
 * @desc Get pricing rules for a model
 * @access Private
 */
router.get(
  '/models/:modelId/rules',
  authenticate,
  pricingController.getPricingRules.bind(pricingController)
);

/**
 * @route POST /api/pricing/estimate
 * @desc Estimate cost
 * @access Private
 */
router.post(
  '/estimate',
  authenticate,
  validateRequest(estimateCostSchema),
  pricingController.estimateCost.bind(pricingController)
);

/**
 * @route POST /api/pricing/execute
 * @desc Execute agent with cost tracking
 * @access Private
 */
router.post(
  '/execute',
  authenticate,
  rateLimit({ max: 100, windowMs: 60000 }), // 100 requests per minute
  validateRequest(executeAgentSchema),
  pricingController.executeAgent.bind(pricingController)
);

/**
 * @route GET /api/pricing/usage
 * @desc Get usage history
 * @access Private
 */
router.get(
  '/usage',
  authenticate,
  pricingController.getUsageHistory.bind(pricingController)
);

/**
 * @route PUT /api/pricing/rules/:ruleId
 * @desc Update pricing rule
 * @access Admin
 */
router.put(
  '/rules/:ruleId',
  authenticateAdmin,
  validateRequest(updatePricingRuleSchema),
  pricingController.updatePricingRule.bind(pricingController)
);

/**
 * @route GET /api/pricing/analytics
 * @desc Get pricing analytics
 * @access Admin
 */
router.get(
  '/analytics',
  authenticateAdmin,
  pricingController.getPricingAnalytics.bind(pricingController)
);

export default router;