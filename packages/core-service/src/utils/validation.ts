import { UserValidationError } from '@smart-ai-hub/shared';

/**
 * Validate email format
 */
export const validateEmail = (email: string): UserValidationError | null => {
  if (!email) {
    return {
      field: 'email',
      message: 'Email is required',
      code: 'REQUIRED_FIELD',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT',
    };
  }

  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): UserValidationError | null => {
  if (!password) {
    return {
      field: 'password',
      message: 'Password is required',
      code: 'REQUIRED_FIELD',
    };
  }

  if (password.length < 8) {
    return {
      field: 'password',
      message: 'Password must be at least 8 characters long',
      code: 'PASSWORD_TOO_SHORT',
    };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return {
      field: 'password',
      message:
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      code: 'PASSWORD_TOO_WEAK',
    };
  }

  return null;
};

/**
 * Validate name field
 */
export const validateName = (name: string, fieldName: string): UserValidationError | null => {
  if (name && name.length > 100) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be less than 100 characters`,
      code: 'FIELD_TOO_LONG',
    };
  }

  return null;
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): UserValidationError | null => {
  if (!phone) {
    return null; // Phone is optional
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return {
      field: 'phone',
      message: 'Invalid phone number format',
      code: 'INVALID_FORMAT',
    };
  }

  return null;
};

/**
 * Validate date of birth
 */
export const validateDateOfBirth = (dateOfBirth: Date | string): UserValidationError | null => {
  if (!dateOfBirth) {
    return null; // Date of birth is optional
  }

  const dob = new Date(dateOfBirth);
  const now = new Date();
  const minAge = 13;
  const maxAge = 120;

  if (isNaN(dob.getTime())) {
    return {
      field: 'dateOfBirth',
      message: 'Invalid date format',
      code: 'INVALID_FORMAT',
    };
  }

  const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < minAge || age > maxAge) {
    return {
      field: 'dateOfBirth',
      message: `Age must be between ${minAge} and ${maxAge} years`,
      code: 'INVALID_AGE',
    };
  }

  return null;
};

/**
 * Validate timezone
 */
export const validateTimezone = (timezone: string): UserValidationError | null => {
  if (!timezone) {
    return null; // Timezone is optional
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return {
      field: 'timezone',
      message: 'Invalid timezone',
      code: 'INVALID_TIMEZONE',
    };
  }

  return null;
};

/**
 * Validate language code
 */
export const validateLanguage = (language: string): UserValidationError | null => {
  if (!language) {
    return null; // Language is optional
  }

  const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!languageRegex.test(language)) {
    return {
      field: 'language',
      message: 'Invalid language format (e.g., en, en-US)',
      code: 'INVALID_FORMAT',
    };
  }

  return null;
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string, fieldName: string): UserValidationError | null => {
  if (!url) {
    return null; // URL is optional
  }

  try {
    new URL(url);
  } catch {
    return {
      field: fieldName,
      message: 'Invalid URL format',
      code: 'INVALID_FORMAT',
    };
  }

  return null;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: any, limit: any): UserValidationError[] => {
  const errors: UserValidationError[] = [];

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive integer',
        code: 'INVALID_PAGINATION',
      });
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        code: 'INVALID_PAGINATION',
      });
    }
  }

  return errors;
};

/**
 * Validate UUID format
 */
export const validateUuid = (uuid: string, fieldName: string): UserValidationError | null => {
  if (!uuid) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return {
      field: fieldName,
      message: `Invalid ${fieldName} format`,
      code: 'INVALID_FORMAT',
    };
  }

  return null;
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): UserValidationError | null => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
      code: 'REQUIRED_FIELD',
    };
  }

  return null;
};

/**
 * Validate field length
 */
export const validateLength = (
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): UserValidationError | null => {
  if (value && (value.length < minLength || value.length > maxLength)) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be between ${minLength} and ${maxLength} characters`,
      code: 'INVALID_LENGTH',
    };
  }

  return null;
};

/**
 * Validate boolean field
 */
export const validateBoolean = (value: any, fieldName: string): UserValidationError | null => {
  if (value !== undefined && value !== null && typeof value !== 'boolean') {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be a boolean`,
      code: 'INVALID_BOOLEAN',
    };
  }

  return null;
};

/**
 * Validate array field
 */
export const validateArray = (
  value: any,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 100
): UserValidationError | null => {
  if (value !== undefined && value !== null) {
    if (!Array.isArray(value)) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be an array`,
        code: 'INVALID_ARRAY',
      };
    }

    if (value.length < minLength || value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must contain between ${minLength} and ${maxLength} items`,
        code: 'INVALID_ARRAY_LENGTH',
      };
    }
  }

  return null;
};

/**
 * Validate enum value
 */
export const validateEnum = (
  value: any,
  fieldName: string,
  allowedValues: string[]
): UserValidationError | null => {
  if (value !== undefined && value !== null && !allowedValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be one of: ${allowedValues.join(', ')}`,
      code: 'INVALID_ENUM_VALUE',
    };
  }

  return null;
};

/**
 * Validate numeric field
 */
export const validateNumber = (
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): UserValidationError | null => {
  if (value !== undefined && value !== null) {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be a number`,
        code: 'INVALID_NUMBER',
      };
    }

    if (min !== undefined && numValue < min) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${min}`,
        code: 'NUMBER_TOO_SMALL',
      };
    }

    if (max !== undefined && numValue > max) {
      return {
        field: fieldName,
        message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${max}`,
        code: 'NUMBER_TOO_LARGE',
      };
    }
  }

  return null;
};

/**
 * Validate object field
 */
export const validateObject = (value: any, fieldName: string): UserValidationError | null => {
  if (value !== undefined && value !== null && typeof value !== 'object') {
    return {
      field: fieldName,
      message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be an object`,
      code: 'INVALID_OBJECT',
    };
  }

  return null;
};
