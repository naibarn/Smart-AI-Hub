/**
 * Validation utilities for Agent URLs and types
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate Custom GPT URL format
 * Expected format: https://chat.openai.com/g/g-XXXXX-agent-name
 */
export function validateCustomGPTUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  // Check if URL starts with the correct base
  if (!url.startsWith('https://chat.openai.com/g/')) {
    return {
      isValid: false,
      error: 'Custom GPT URL must start with https://chat.openai.com/g/',
    };
  }

  // Extract the part after the base URL
  const urlPath = url.replace('https://chat.openai.com/g/', '');

  // Check if it follows the pattern g-XXXXX-agent-name
  const customGPTPattern = /^g-[a-zA-Z0-9]+/;
  if (!customGPTPattern.test(urlPath)) {
    return {
      isValid: false,
      error: 'Custom GPT URL must follow the format: https://chat.openai.com/g/g-XXXXX-agent-name',
    };
  }

  // Additional validation for the full URL structure
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'chat.openai.com') {
      return {
        isValid: false,
        error: 'Custom GPT URL must be from chat.openai.com domain',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  return { isValid: true };
}

/**
 * Validate Gemini Gem URL format
 * Expected format: https://gemini.google.com/gem/XXXXX
 */
export function validateGeminiGemUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  // Check if URL starts with the correct base
  if (!url.startsWith('https://gemini.google.com/gem/')) {
    return {
      isValid: false,
      error: 'Gemini Gem URL must start with https://gemini.google.com/gem/',
    };
  }

  // Extract the part after the base URL
  const urlPath = url.replace('https://gemini.google.com/gem/', '');

  // Check if it has a valid ID (alphanumeric characters, hyphens, underscores)
  if (!/^[a-zA-Z0-9\-_]+$/.test(urlPath) || urlPath.length < 1) {
    return {
      isValid: false,
      error: 'Gemini Gem URL must follow the format: https://gemini.google.com/gem/XXXXX',
    };
  }

  // Additional validation for the full URL structure
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'gemini.google.com') {
      return {
        isValid: false,
        error: 'Gemini Gem URL must be from gemini.google.com domain',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  return { isValid: true };
}

/**
 * Validate agent data based on type
 */
export function validateAgentData(
  type: string,
  externalUrl?: string,
  flowDefinition?: any
): ValidationResult {
  switch (type) {
    case 'CUSTOMGPT':
      if (!externalUrl) {
        return {
          isValid: false,
          error: 'External URL is required for Custom GPT agents',
        };
      }
      if (flowDefinition) {
        return {
          isValid: false,
          error: 'Flow definition must be null for Custom GPT agents',
        };
      }
      return validateCustomGPTUrl(externalUrl);

    case 'GEMINI_GEM':
      if (!externalUrl) {
        return {
          isValid: false,
          error: 'External URL is required for Gemini Gem agents',
        };
      }
      if (flowDefinition) {
        return {
          isValid: false,
          error: 'Flow definition must be null for Gemini Gem agents',
        };
      }
      return validateGeminiGemUrl(externalUrl);

    case 'AGENTFLOW':
      if (externalUrl) {
        return {
          isValid: false,
          error: 'External URL must be null for Agent Flow agents',
        };
      }
      if (!flowDefinition) {
        return {
          isValid: false,
          error: 'Flow definition is required for Agent Flow agents',
        };
      }
      return { isValid: true };

    default:
      return {
        isValid: false,
        error: 'Invalid agent type',
      };
  }
}

/**
 * Get URL type (Custom GPT or Gemini Gem) based on URL pattern
 */
export function getUrlType(url: string): 'CUSTOMGPT' | 'GEMINI_GEM' | null {
  if (url.startsWith('https://chat.openai.com/g/')) {
    return 'CUSTOMGPT';
  }
  if (url.startsWith('https://gemini.google.com/gem/')) {
    return 'GEMINI_GEM';
  }
  return null;
}

/**
 * Extract agent ID from external URL
 */
export function extractAgentIdFromUrl(
  url: string,
  type: 'CUSTOMGPT' | 'GEMINI_GEM'
): string | null {
  try {
    if (type === 'CUSTOMGPT') {
      const match = url.match(/\/g\/(g-[a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } else if (type === 'GEMINI_GEM') {
      const match = url.match(/\/gem\/([a-zA-Z0-9\-_]+)/);
      return match ? match[1] : null;
    }
  } catch (error) {
    console.error('Error extracting agent ID from URL:', error);
  }
  return null;
}
