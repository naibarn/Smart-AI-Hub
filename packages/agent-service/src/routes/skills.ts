import { Router } from 'express';
import { SkillsController } from '@/controllers/SkillsController';
import { authenticate, authenticateAdmin } from '@/middleware';
import { validateRequest, ValidationSchema } from '@/middleware';
import { rateLimit } from '@/middleware';

const router = Router();
const skillsController = new SkillsController({} as any); // Mock service instance

// Validation schemas
const createSkillSchema: ValidationSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    description: { type: 'string', required: true, minLength: 1, maxLength: 500 },
    longDescription: { type: 'string', required: false, maxLength: 5000 },
    categoryId: { type: 'string', required: true },
    platformId: { type: 'string', required: true },
    visibility: { type: 'string', required: true, enum: ['public', 'organization', 'private'] },
    tags: { type: 'array', required: false }
  }
};

const updateSkillSchema: ValidationSchema = {
  params: {
    skillId: { type: 'string', required: true }
  },
  body: {
    name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    description: { type: 'string', required: false, minLength: 1, maxLength: 500 },
    longDescription: { type: 'string', required: false, maxLength: 5000 },
    categoryId: { type: 'string', required: false },
    visibility: { type: 'string', required: false, enum: ['public', 'organization', 'private'] },
    tags: { type: 'array', required: false },
    iconUrl: { type: 'string', required: false },
    screenshotUrls: { type: 'array', required: false }
  }
};

const rateSkillSchema: ValidationSchema = {
  params: {
    skillId: { type: 'string', required: true }
  },
  body: {
    rating: { type: 'number', required: true, min: 1, max: 5 },
    review: { type: 'string', required: false, maxLength: 1000 }
  }
};

const purchaseSkillSchema: ValidationSchema = {
  params: {
    skillId: { type: 'string', required: true }
  },
  body: {
    version: { type: 'string', required: false }
  }
};

const rejectSkillSchema: ValidationSchema = {
  params: {
    skillId: { type: 'string', required: true }
  },
  body: {
    reason: { type: 'string', required: false, maxLength: 500 }
  }
};

/**
 * @route GET /api/skills/categories
 * @desc Get all categories
 * @access Public
 */
router.get(
  '/categories',
  skillsController.getCategories.bind(skillsController)
);

/**
 * @route GET /api/skills/category/:categoryId
 * @desc Get skills by category
 * @access Public
 */
router.get(
  '/category/:categoryId',
  skillsController.getSkillsByCategory.bind(skillsController)
);

/**
 * @route GET /api/skills/search
 * @desc Search skills
 * @access Public
 */
router.get(
  '/search',
  skillsController.searchSkills.bind(skillsController)
);

/**
 * @route GET /api/skills/:skillId
 * @desc Get skill details
 * @access Public
 */
router.get(
  '/:skillId',
  skillsController.getSkillDetails.bind(skillsController)
);

/**
 * @route POST /api/skills
 * @desc Create skill
 * @access Private
 */
router.post(
  '/',
  authenticate,
  rateLimit({ max: 10, windowMs: 60000 }), // 10 requests per minute
  validateRequest(createSkillSchema),
  skillsController.createSkill.bind(skillsController)
);

/**
 * @route PUT /api/skills/:skillId
 * @desc Update skill
 * @access Private
 */
router.put(
  '/:skillId',
  authenticate,
  rateLimit({ max: 20, windowMs: 60000 }), // 20 requests per minute
  validateRequest(updateSkillSchema),
  skillsController.updateSkill.bind(skillsController)
);

/**
 * @route POST /api/skills/:skillId/submit
 * @desc Submit skill for review
 * @access Private
 */
router.post(
  '/:skillId/submit',
  authenticate,
  skillsController.submitSkillForReview.bind(skillsController)
);

/**
 * @route POST /api/skills/:skillId/approve
 * @desc Approve skill
 * @access Admin
 */
router.post(
  '/:skillId/approve',
  authenticateAdmin,
  skillsController.approveSkill.bind(skillsController)
);

/**
 * @route POST /api/skills/:skillId/reject
 * @desc Reject skill
 * @access Admin
 */
router.post(
  '/:skillId/reject',
  authenticateAdmin,
  validateRequest(rejectSkillSchema),
  skillsController.rejectSkill.bind(skillsController)
);

/**
 * @route POST /api/skills/:skillId/rate
 * @desc Rate skill
 * @access Private
 */
router.post(
  '/:skillId/rate',
  authenticate,
  rateLimit({ max: 5, windowMs: 60000 }), // 5 requests per minute
  validateRequest(rateSkillSchema),
  skillsController.rateSkill.bind(skillsController)
);

/**
 * @route POST /api/skills/:skillId/purchase
 * @desc Purchase skill
 * @access Private
 */
router.post(
  '/:skillId/purchase',
  authenticate,
  rateLimit({ max: 10, windowMs: 60000 }), // 10 requests per minute
  validateRequest(purchaseSkillSchema),
  skillsController.purchaseSkill.bind(skillsController)
);

/**
 * @route GET /api/skills/user/my-skills
 * @desc Get user's skills
 * @access Private
 */
router.get(
  '/user/my-skills',
  authenticate,
  skillsController.getUserSkills.bind(skillsController)
);

/**
 * @route GET /api/skills/admin/pending
 * @desc Get skills pending review
 * @access Admin
 */
router.get(
  '/admin/pending',
  authenticateAdmin,
  skillsController.getSkillsPendingReview.bind(skillsController)
);

export default router;