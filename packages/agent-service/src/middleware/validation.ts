import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

// Validation schema interface
export interface ValidationSchema {
  body?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
      custom?: (value: any) => boolean | string;
    };
  };
  query?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
      custom?: (value: any) => boolean | string;
    };
  };
  params?: {
    [key: string]: {
      type: 'string' | 'number';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
      custom?: (value: any) => boolean | string;
    };
  };
}

// Validate request against schema
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      // Validate body
      if (schema.body) {
        for (const [key, rules] of Object.entries(schema.body)) {
          const value = req.body[key];

          // Check if required
          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${key} is required`);
            continue;
          }

          // Skip validation if not provided and not required
          if (value === undefined || value === null) {
            continue;
          }

          // Type validation
          if (rules.type === 'string' && typeof value !== 'string') {
            errors.push(`${key} must be a string`);
            continue;
          }

          if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
            errors.push(`${key} must be a number`);
            continue;
          }

          if (rules.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`${key} must be a boolean`);
            continue;
          }

          if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            errors.push(`${key} must be an object`);
            continue;
          }

          if (rules.type === 'array' && !Array.isArray(value)) {
            errors.push(`${key} must be an array`);
            continue;
          }

          // String validations
          if (typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${key} must be at least ${rules.minLength} characters long`);
            }

            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${key} must be at most ${rules.maxLength} characters long`);
            }

            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`${key} format is invalid`);
            }
          }

          // Number validations
          if (typeof value === 'number') {
            if (rules.min !== undefined && value < rules.min) {
              errors.push(`${key} must be at least ${rules.min}`);
            }

            if (rules.max !== undefined && value > rules.max) {
              errors.push(`${key} must be at most ${rules.max}`);
            }
          }

          // Enum validation
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
          }

          // Custom validation
          if (rules.custom) {
            const customResult = rules.custom(value);
            if (customResult !== true) {
              errors.push(typeof customResult === 'string' ? customResult : `${key} is invalid`);
            }
          }
        }
      }

      // Validate query parameters
      if (schema.query) {
        for (const [key, rules] of Object.entries(schema.query)) {
          const value = req.query[key];

          // Check if required
          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`Query parameter ${key} is required`);
            continue;
          }

          // Skip validation if not provided and not required
          if (value === undefined || value === null) {
            continue;
          }

          // Convert to appropriate type
          let parsedValue: any = value;
          if (rules.type === 'number') {
            parsedValue = Number(value);
            if (isNaN(parsedValue)) {
              errors.push(`Query parameter ${key} must be a number`);
              continue;
            }
          } else if (rules.type === 'boolean') {
            parsedValue = value === 'true' || value === '1';
          } else if (rules.type === 'array') {
            parsedValue = Array.isArray(value) ? value : [value];
          }

          // Apply same validations as body
          if (rules.type === 'string') {
            if (rules.minLength && (parsedValue as string).length < rules.minLength) {
              errors.push(
                `Query parameter ${key} must be at least ${rules.minLength} characters long`
              );
            }

            if (rules.maxLength && (parsedValue as string).length > rules.maxLength) {
              errors.push(
                `Query parameter ${key} must be at most ${rules.maxLength} characters long`
              );
            }

            if (rules.pattern && !rules.pattern.test(parsedValue as string)) {
              errors.push(`Query parameter ${key} format is invalid`);
            }
          }

          if (typeof parsedValue === 'number') {
            if (rules.min !== undefined && parsedValue < rules.min) {
              errors.push(`Query parameter ${key} must be at least ${rules.min}`);
            }

            if (rules.max !== undefined && parsedValue > rules.max) {
              errors.push(`Query parameter ${key} must be at most ${rules.max}`);
            }
          }

          if (rules.enum && !rules.enum.includes(parsedValue)) {
            errors.push(`Query parameter ${key} must be one of: ${rules.enum.join(', ')}`);
          }
        }
      }

      // Validate path parameters
      if (schema.params) {
        for (const [key, rules] of Object.entries(schema.params)) {
          const value = req.params[key];

          // Check if required
          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`Path parameter ${key} is required`);
            continue;
          }

          // Skip validation if not provided and not required
          if (value === undefined || value === null) {
            continue;
          }

          // Convert to appropriate type
          let parsedValue: any = value;
          if (rules.type === 'number') {
            parsedValue = Number(value);
            if (isNaN(parsedValue)) {
              errors.push(`Path parameter ${key} must be a number`);
              continue;
            }
          }

          // Apply validations
          if (typeof parsedValue === 'string') {
            if (rules.minLength && parsedValue.length < rules.minLength) {
              errors.push(
                `Path parameter ${key} must be at least ${rules.minLength} characters long`
              );
            }

            if (rules.maxLength && parsedValue.length > rules.maxLength) {
              errors.push(
                `Path parameter ${key} must be at most ${rules.maxLength} characters long`
              );
            }

            if (rules.pattern && !rules.pattern.test(parsedValue)) {
              errors.push(`Path parameter ${key} format is invalid`);
            }
          }

          if (typeof parsedValue === 'number') {
            if (rules.min !== undefined && parsedValue < rules.min) {
              errors.push(`Path parameter ${key} must be at least ${rules.min}`);
            }

            if (rules.max !== undefined && parsedValue > rules.max) {
              errors.push(`Path parameter ${key} must be at most ${rules.max}`);
            }
          }

          if (rules.enum && !rules.enum.includes(parsedValue)) {
            errors.push(`Path parameter ${key} must be one of: ${rules.enum.join(', ')}`);
          }
        }
      }

      // If there are validation errors, return them
      if (errors.length > 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details: errors,
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // If no errors, continue to the next middleware
      next();
    } catch (error) {
      logger.error('Validation error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Validation error',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  };
};
