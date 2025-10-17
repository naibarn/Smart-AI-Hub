export interface ValidationThresholds {
  // Content length thresholds
  minContentLength: number;
  shortContentThreshold: number;
  veryShortContentThreshold: number;
  
  // Title length thresholds
  minTitleLength: number;
  maxTitleLength: number;
  
  // Score thresholds
  excellentScoreThreshold: number;
  goodScoreThreshold: number;
  acceptableScoreThreshold: number;
  
  // Warning/Error thresholds
  maxWarningsForGoodScore: number;
  maxErrorsForGoodScore: number;
  maxWarningsForAcceptableScore: number;
  maxErrorsForAcceptableScore: number;
}

export interface ValidationConfig {
  // Enable/disable certain validations
  enabled: {
    contentLength: boolean;
    titleFormat: boolean;
    idFormat: boolean;
    versionFormat: boolean;
    userStoryFormat: boolean;
    acceptanceCriteria: boolean;
    requirementClarity: boolean;
    fieldDefinitions: boolean;
    dataTypes: boolean;
    apiEndpoints: boolean;
    httpMethods: boolean;
    metadata: boolean;
    dependencies: boolean;
    traceability: boolean;
  };
  
  // Thresholds for warnings vs errors
  thresholds: ValidationThresholds;
  
  // Strictness levels (0-100, where 0 is most lenient, 100 is strictest)
  strictness: {
    contentLength: number;
    formatValidation: number;
    completeness: number;
    clarity: number;
    consistency: number;
    traceability: number;
  };
  
  // Custom patterns
  customPatterns: {
    [key: string]: {
      pattern: RegExp;
      description: string;
      required: boolean;
      type: 'error' | 'warning';
    };
  };
  
  // Traceability settings
  traceability: {
    requireParent: boolean;
    requireDependencies: boolean;
    requireRelated: boolean;
    validateLinksExist: boolean;
    allowedLinkTypes: string[];
  };
  
  // User story format settings
  userStory: {
    requireExactFormat: boolean;
    allowVariations: boolean;
    variations: string[];
    requireAcceptanceCriteria: boolean;
    acceptanceCriteriaPatterns: string[];
  };
}

export const defaultValidationConfig: ValidationConfig = {
  enabled: {
    contentLength: true,
    titleFormat: true,
    idFormat: true,
    versionFormat: false, // Often too strict for early drafts
    userStoryFormat: true,
    acceptanceCriteria: false, // Warning only
    requirementClarity: false, // Warning only
    fieldDefinitions: true,
    dataTypes: true,
    apiEndpoints: true,
    httpMethods: true,
    metadata: false, // Warning only
    dependencies: true,
    traceability: true,
  },
  
  thresholds: {
    minContentLength: 10,
    shortContentThreshold: 50,
    veryShortContentThreshold: 20,
    minTitleLength: 3,
    maxTitleLength: 100,
    excellentScoreThreshold: 90,
    goodScoreThreshold: 70,
    acceptableScoreThreshold: 50,
    maxWarningsForGoodScore: 3,
    maxErrorsForGoodScore: 0,
    maxWarningsForAcceptableScore: 5,
    maxErrorsForAcceptableScore: 1,
  },
  
  strictness: {
    contentLength: 70, // Moderate strictness
    formatValidation: 80, // Fairly strict
    completeness: 60, // Less strict for drafts
    clarity: 50, // Lenient for early stages
    consistency: 90, // Strict for consistency
    traceability: 70, // Moderate
  },
  
  customPatterns: {},
  
  traceability: {
    requireParent: false,
    requireDependencies: false,
    requireRelated: false,
    validateLinksExist: true,
    allowedLinkTypes: ['parent', 'dependency', 'related', 'child', 'implements'],
  },
  
  userStory: {
    requireExactFormat: false,
    allowVariations: true,
    variations: [
      'as a\\s+.+\\s+i want to\\s+.+\\s+so that\\s+.+',
      'as an?\\s+.+\\s+i want to\\s+.+\\s+so that\\s+.+',
      'as a\\s+.+\\s+i would like to\\s+.+\\s+so that\\s+.+',
      'as a\\s+.+\\s+i need to\\s+.+\\s+so that\\s+.+',
    ],
    requireAcceptanceCriteria: false,
    acceptanceCriteriaPatterns: [
      'acceptance criteria',
      'given\\s+.+\\s+when\\s+.+\\s+then\\s+.+',
      'scenario:',
      'examples:',
    ],
  },
};

// Presets for different project phases
export const validationPresets = {
  draft: {
    ...defaultValidationConfig,
    enabled: {
      ...defaultValidationConfig.enabled,
      versionFormat: false,
      requirementClarity: false,
      metadata: false,
      traceability: false,
    },
    strictness: {
      contentLength: 30,
      formatValidation: 50,
      completeness: 30,
      clarity: 20,
      consistency: 60,
      traceability: 30,
    },
  },
  
  review: {
    ...defaultValidationConfig,
    enabled: {
      ...defaultValidationConfig.enabled,
      acceptanceCriteria: true,
      requirementClarity: true,
      metadata: true,
      traceability: true,
    },
    strictness: {
      contentLength: 60,
      formatValidation: 80,
      completeness: 70,
      clarity: 60,
      consistency: 90,
      traceability: 80,
    },
  },
  
  production: {
    ...defaultValidationConfig,
    enabled: {
      ...defaultValidationConfig.enabled,
      versionFormat: true,
      acceptanceCriteria: true,
      requirementClarity: true,
      metadata: true,
      traceability: true,
    },
    thresholds: {
      ...defaultValidationConfig.thresholds,
      excellentScoreThreshold: 95,
      goodScoreThreshold: 85,
      acceptableScoreThreshold: 70,
    },
    strictness: {
      contentLength: 90,
      formatValidation: 95,
      completeness: 90,
      clarity: 85,
      consistency: 100,
      traceability: 90,
    },
  },
};