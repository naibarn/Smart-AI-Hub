import { Request, Response, NextFunction } from 'express';
import { AgentType, AgentVisibility } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Validate agent data for creation
 */
export const validateAgentData = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const {
      name,
      description,
      category,
      type,
      visibility,
      flowDefinition,
      inputSchema,
      outputSchema,
      executionConfig,
      externalUrl,
    } = req.body;

    // Required fields validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Agent name is required and must be a non-empty string',
      });
      return;
    }

    if (name.length > 255) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Agent name must be less than 255 characters',
      });
      return;
    }

    if (!type || !Object.values(AgentType).includes(type)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Agent type is required and must be one of: AGENTFLOW, CUSTOMGPT, GEMINI_GEM',
      });
      return;
    }

    // Optional fields validation
    if (description && (typeof description !== 'string' || description.length > 10000)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Description must be a string with less than 10,000 characters',
      });
      return;
    }

    if (category && (typeof category !== 'string' || category.length > 100)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Category must be a string with less than 100 characters',
      });
      return;
    }

    if (visibility && !Object.values(AgentVisibility).includes(visibility)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Visibility must be one of: PRIVATE, ORGANIZATION, AGENCY, PUBLIC',
      });
      return;
    }

    if (externalUrl && (typeof externalUrl !== 'string' || externalUrl.length > 500)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'External URL must be a string with less than 500 characters',
      });
      return;
    }

    // URL validation for externalUrl
    if (externalUrl) {
      try {
        new URL(externalUrl);
      } catch (error) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'External URL must be a valid URL',
        });
        return;
      }
    }

    // JSON fields validation
    if (flowDefinition && typeof flowDefinition !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition must be a valid JSON object',
      });
      return;
    }

    if (inputSchema && typeof inputSchema !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema must be a valid JSON object',
      });
      return;
    }

    if (outputSchema && typeof outputSchema !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Output schema must be a valid JSON object',
      });
      return;
    }

    if (executionConfig && typeof executionConfig !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Execution config must be a valid JSON object',
      });
      return;
    }

    // Type-specific validation
    if (type === AgentType.AGENTFLOW && !flowDefinition) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition is required for AGENTFLOW type',
      });
      return;
    }

    if ((type === AgentType.CUSTOMGPT || type === AgentType.GEMINI_GEM) && !externalUrl) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'External URL is required for CUSTOMGPT and GEMINI_GEM types',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during validation',
    });
  }
};

/**
 * Validate agent data for update
 */
export const validateUpdateAgentData = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const {
      name,
      description,
      category,
      flowDefinition,
      inputSchema,
      outputSchema,
      executionConfig,
      externalUrl,
    } = req.body;

    // Name validation if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Agent name must be a non-empty string',
        });
        return;
      }

      if (name.length > 255) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Agent name must be less than 255 characters',
        });
        return;
      }
    }

    // Optional fields validation
    if (
      description !== undefined &&
      (typeof description !== 'string' || description.length > 10000)
    ) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Description must be a string with less than 10,000 characters',
      });
      return;
    }

    if (category !== undefined && (typeof category !== 'string' || category.length > 100)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Category must be a string with less than 100 characters',
      });
      return;
    }

    if (externalUrl !== undefined) {
      if (externalUrl && (typeof externalUrl !== 'string' || externalUrl.length > 500)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'External URL must be a string with less than 500 characters',
        });
        return;
      }

      // URL validation for externalUrl if provided
      if (externalUrl) {
        try {
          new URL(externalUrl);
        } catch (error) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'External URL must be a valid URL',
          });
          return;
        }
      }
    }

    // JSON fields validation
    if (
      flowDefinition !== undefined &&
      flowDefinition !== null &&
      typeof flowDefinition !== 'object'
    ) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition must be a valid JSON object or null',
      });
      return;
    }

    if (inputSchema !== undefined && inputSchema !== null && typeof inputSchema !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema must be a valid JSON object or null',
      });
      return;
    }

    if (outputSchema !== undefined && outputSchema !== null && typeof outputSchema !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Output schema must be a valid JSON object or null',
      });
      return;
    }

    if (
      executionConfig !== undefined &&
      executionConfig !== null &&
      typeof executionConfig !== 'object'
    ) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Execution config must be a valid JSON object or null',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during validation',
    });
  }
};

/**
 * Validate flow definition structure
 */
export const validateFlowDefinition = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { flowDefinition } = req.body;

    if (!flowDefinition) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition is required',
      });
      return;
    }

    if (typeof flowDefinition !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition must be a valid JSON object',
      });
      return;
    }

    // Basic structure validation
    if (!flowDefinition.steps || !Array.isArray(flowDefinition.steps)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition must contain a steps array',
      });
      return;
    }

    if (flowDefinition.steps.length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Flow definition must contain at least one step',
      });
      return;
    }

    // Validate each step
    for (let i = 0; i < flowDefinition.steps.length; i++) {
      const step = flowDefinition.steps[i];

      if (!step.id || typeof step.id !== 'string') {
        res.status(400).json({
          error: 'Validation Error',
          message: `Step ${i + 1} must have an id field`,
        });
        return;
      }

      if (!step.type || typeof step.type !== 'string') {
        res.status(400).json({
          error: 'Validation Error',
          message: `Step ${i + 1} must have a type field`,
        });
        return;
      }

      // Validate step type
      const validStepTypes = [
        'llm_call',
        'condition',
        'loop',
        'data_transform',
        'api_call',
        'input',
        'output',
      ];
      if (!validStepTypes.includes(step.type)) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Step ${i + 1} type must be one of: ${validStepTypes.join(', ')}`,
        });
        return;
      }

      // Type-specific validation
      if (step.type === 'llm_call') {
        if (!step.config || !step.config.model || typeof step.config.model !== 'string') {
          res.status(400).json({
            error: 'Validation Error',
            message: `LLM call step ${i + 1} must have a config with model field`,
          });
          return;
        }

        if (!step.config.prompt || typeof step.config.prompt !== 'string') {
          res.status(400).json({
            error: 'Validation Error',
            message: `LLM call step ${i + 1} must have a config with prompt field`,
          });
          return;
        }
      }

      if (step.type === 'api_call') {
        if (!step.config || !step.config.url || typeof step.config.url !== 'string') {
          res.status(400).json({
            error: 'Validation Error',
            message: `API call step ${i + 1} must have a config with url field`,
          });
          return;
        }

        try {
          new URL(step.config.url);
        } catch (error) {
          res.status(400).json({
            error: 'Validation Error',
            message: `API call step ${i + 1} must have a valid URL`,
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Flow definition validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during flow definition validation',
    });
  }
};

/**
 * Validate input schema (JSON Schema)
 */
export const validateInputSchema = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { inputSchema } = req.body;

    if (!inputSchema) {
      // Input schema is optional
      next();
      return;
    }

    if (typeof inputSchema !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema must be a valid JSON object',
      });
      return;
    }

    // Basic JSON Schema validation
    if (inputSchema.type && typeof inputSchema.type !== 'string') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema type must be a string',
      });
      return;
    }

    if (inputSchema.properties && typeof inputSchema.properties !== 'object') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema properties must be a JSON object',
      });
      return;
    }

    if (inputSchema.required && !Array.isArray(inputSchema.required)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Input schema required must be an array',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Input schema validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during input schema validation',
    });
  }
};

/**
 * Validate external URL
 */
export const validateExternalUrl = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { externalUrl } = req.body;

    if (!externalUrl) {
      // External URL is optional
      next();
      return;
    }

    if (typeof externalUrl !== 'string') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'External URL must be a string',
      });
      return;
    }

    if (externalUrl.length > 500) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'External URL must be less than 500 characters',
      });
      return;
    }

    try {
      const url = new URL(externalUrl);

      // Validate protocol
      if (!['http:', 'https:'].includes(url.protocol)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'External URL must use HTTP or HTTPS protocol',
        });
        return;
      }

      // Basic domain validation (prevent localhost in production)
      if (process.env.NODE_ENV === 'production') {
        const hostname = url.hostname.toLowerCase();
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.')
        ) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'External URL cannot be a private IP address or localhost',
          });
          return;
        }
      }
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'External URL must be a valid URL',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('External URL validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during external URL validation',
    });
  }
};
