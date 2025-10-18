import {
  Specification,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationMetrics,
  ValidationPattern,
  CustomValidationRule,
  ErrorType,
  WarningType,
  ErrorSeverity,
  SpecificationType,
} from '../types';
import * as fs from 'fs';
import * as path from 'path';
import {
  ValidationConfig,
  defaultValidationConfig,
  validationPresets,
} from '../config/validation-config';

export class ValidationEngine {
  private config: ValidationConfig;
  constructor(configPath?: string, preset?: 'draft' | 'review' | 'production') {
    // Load configuration
    this.config = this.loadConfiguration(configPath, preset);

    // Initialize default patterns based on config
    this.defaultPatterns = this.buildDefaultPatterns();
  }

  private loadConfiguration(
    configPath?: string,
    preset?: 'draft' | 'review' | 'production'
  ): ValidationConfig {
    let config: ValidationConfig;

    // Start with default config
    config = { ...defaultValidationConfig };

    // Apply preset if specified
    if (preset && validationPresets[preset]) {
      config = { ...config, ...validationPresets[preset] };
    }

    // Load custom config file if provided
    if (configPath) {
      try {
        const fullPath = path.resolve(configPath);
        if (fs.existsSync(fullPath)) {
          const customConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          config = this.mergeConfigurations(config, customConfig);
        }
      } catch (error) {
        console.warn(`Failed to load configuration from ${configPath}:`, error);
      }
    }

    return config;
  }

  private mergeConfigurations(
    base: ValidationConfig,
    override: Partial<ValidationConfig>
  ): ValidationConfig {
    const merged = { ...base };

    // Deep merge for nested objects
    for (const key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        const value = override[key as keyof ValidationConfig];
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          merged[key as keyof ValidationConfig] = {
            ...base[key as keyof ValidationConfig],
            ...value,
          } as any;
        } else {
          merged[key as keyof ValidationConfig] = value as any;
        }
      }
    }

    return merged as ValidationConfig;
  }

  private buildDefaultPatterns(): ValidationPattern[] {
    const patterns: ValidationPattern[] = [];

    if (this.config.enabled.titleFormat) {
      patterns.push({
        name: 'title_format',
        pattern: new RegExp(
          `^.{${this.config.thresholds.minTitleLength},${this.config.thresholds.maxTitleLength}}$`
        ),
        description: `Title must be between ${this.config.thresholds.minTitleLength} and ${this.config.thresholds.maxTitleLength} characters`,
        required: true,
      });
    }

    if (this.config.enabled.contentLength) {
      patterns.push({
        name: 'content_min_length',
        pattern: new RegExp(`^.{${this.config.thresholds.minContentLength},}$`),
        description: `Content must be at least ${this.config.thresholds.minContentLength} characters long`,
        required: true,
      });
    }

    if (this.config.enabled.idFormat) {
      patterns.push({
        name: 'id_format',
        pattern: /^[a-zA-Z0-9_-]+$/,
        description: 'ID must contain only alphanumeric characters, hyphens, and underscores',
        required: true,
      });
    }

    if (this.config.enabled.versionFormat) {
      patterns.push({
        name: 'version_format',
        pattern: /^\d+\.\d+\.\d+$/,
        description: 'Version must follow semantic versioning (x.y.z)',
        required: true,
      });
    }

    return patterns;
  }

  private defaultPatterns: ValidationPattern[] = [];

  private readonly typeSpecificPatterns: Map<SpecificationType, ValidationPattern[]> = new Map([
    [
      SpecificationType.USER_STORY,
      [
        {
          name: 'user_story_format',
          pattern: /as a\s+.+\s+i want to\s+.+\s+so that\s+.+/i,
          description:
            'User story should follow format: "As a [user], I want to [action], so that [benefit]"',
          required: false,
        },
        {
          name: 'acceptance_criteria',
          pattern: /acceptance criteria|given\s+when\s+then/i,
          description: 'User story should include acceptance criteria',
          required: false,
        },
      ],
    ],
    [
      SpecificationType.FUNCTIONAL_REQUIREMENT,
      [
        {
          name: 'requirement clarity',
          pattern: /(shall|must|should|will)\s+/i,
          description:
            'Functional requirement should use clear language (shall, must, should, will)',
          required: false,
        },
      ],
    ],
    [
      SpecificationType.DATA_MODEL,
      [
        {
          name: 'field_definitions',
          pattern: /field|property|column|attribute/i,
          description: 'Data model should define fields/properties',
          required: false,
        },
        {
          name: 'data_types',
          pattern: /string|number|boolean|date|array|object/i,
          description: 'Data model should specify data types',
          required: false,
        },
      ],
    ],
    [
      SpecificationType.SERVICE_SPEC,
      [
        {
          name: 'api_endpoints',
          pattern: /endpoint|route|\/api\//i,
          description: 'Service specification should define API endpoints',
          required: false,
        },
        {
          name: 'methods',
          pattern: /get|post|put|delete|patch/i,
          description: 'Service specification should specify HTTP methods',
          required: false,
        },
      ],
    ],
  ]);

  validateSpecification(specification: Specification): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    this.validateRequiredFields(specification, errors);

    // Validate patterns
    this.validatePatterns(specification, errors, warnings);

    // Validate type-specific rules
    this.validateTypeSpecificRules(specification, errors, warnings);

    // Validate metadata
    this.validateMetadata(specification, errors, warnings);

    // Validate dependencies
    this.validateDependencies(specification, errors, warnings);

    // Apply custom rules
    if (specification.validation.customRules) {
      this.applyCustomRules(specification, specification.validation.customRules, errors, warnings);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(specification, errors, warnings);
    const score = this.calculateScore(metrics, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score,
      metrics,
    };
  }

  private validateRequiredFields(specification: Specification, errors: ValidationError[]): void {
    for (const requiredField of specification.validation.required) {
      if (!this.hasField(specification, requiredField)) {
        errors.push({
          type: ErrorType.MISSING_FIELD,
          message: `Required field '${requiredField}' is missing`,
          severity: ErrorSeverity.ERROR,
        });
      }
    }
  }

  private hasField(specification: Specification, field: string): boolean {
    const parts = field.split('.');
    let current: any = specification;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return false;
      }
      current = current[part];
    }

    return current !== null && current !== undefined && current !== '';
  }

  private validatePatterns(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const allPatterns = [...this.defaultPatterns];

    // Add type-specific patterns
    const typePatterns = this.typeSpecificPatterns.get(specification.type);
    if (typePatterns) {
      allPatterns.push(...typePatterns);
    }

    // Add specification-specific patterns
    allPatterns.push(...specification.validation.patterns);

    for (const pattern of allPatterns) {
      const testValue = this.getValueForPattern(specification, pattern.name);

      // Handle null or undefined values
      if (testValue === null || testValue === undefined) {
        if (pattern.required) {
          errors.push({
            type: ErrorType.MISSING_FIELD,
            message: `Required field for pattern '${pattern.name}' is missing or empty`,
            severity: ErrorSeverity.ERROR,
          });
        }
        continue;
      }

      // Test the pattern
      if (!pattern.pattern.test(testValue)) {
        if (pattern.required) {
          errors.push({
            type: ErrorType.PATTERN_MISMATCH,
            message: pattern.description,
            severity: ErrorSeverity.ERROR,
          });
        } else {
          warnings.push({
            type: WarningType.INCOMPLETE_CONTENT,
            message: pattern.description,
            suggestion: `Consider updating content to match pattern: ${pattern.description}`,
          });
        }
      }
    }
  }

  private getValueForPattern(specification: Specification, patternName: string): string | null {
    switch (patternName) {
      case 'title_format':
        return specification.title;
      case 'content_min_length':
        return this.getActualContent(specification.content);
      case 'id_format':
        return specification.id;
      case 'version_format':
        return specification.metadata.version;
      case 'user_story_format':
      case 'acceptance_criteria':
        return this.getActualContent(specification.content);
      case 'requirement clarity':
        return this.getActualContent(specification.content);
      case 'field_definitions':
      case 'data_types':
        return this.getActualContent(specification.content);
      case 'api_endpoints':
      case 'methods':
        return this.getActualContent(specification.content);
      default:
        return null;
    }
  }

  /**
   * Extract actual content from markdown by removing front matter and markdown syntax
   * @param content Raw content from specification
   * @returns Cleaned content without front matter and markdown syntax
   */
  private getActualContent(content: string): string {
    if (!content) return '';

    // 1. Remove front matter (between --- markers)
    const frontMatterRegex = /^---[\s\S]*?---\n/;
    let contentWithoutMeta = content.replace(frontMatterRegex, '');

    // 2. Remove code blocks with improved regex
    const codeBlockRegex = /```[\s\S]*?```/g;
    contentWithoutMeta = contentWithoutMeta.replace(codeBlockRegex, '');

    // 3. Remove inline code
    const inlineCodeRegex = /`[^`]*`/g;
    contentWithoutMeta = contentWithoutMeta.replace(inlineCodeRegex, '');

    // 4. Remove HTML tags
    const htmlTagRegex = /<[^>]*>/g;
    contentWithoutMeta = contentWithoutMeta.replace(htmlTagRegex, '');

    // 5. Remove markdown syntax but keep text
    const plainText = contentWithoutMeta
      .replace(/#{1,6}\s+/g, '') // Remove headers (with space after #)
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers but keep text
      .replace(/__([^_]+)__/g, '$1') // Remove bold markers but keep text
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers but keep text
      .replace(/_([^_]+)_/g, '$1') // Remove italic markers but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text only
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers (with space after)
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists (with space after)
      .replace(/^>\s+/gm, '') // Remove blockquote markers (with space after)
      .replace(/\n{3,}/g, '\n\n') // Normalize whitespace
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    return plainText;
  }

  private validateTypeSpecificRules(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (specification.type) {
      case SpecificationType.USER_STORY:
        this.validateUserStory(specification, errors, warnings);
        break;
      case SpecificationType.FUNCTIONAL_REQUIREMENT:
        this.validateFunctionalRequirement(specification, errors, warnings);
        break;
      case SpecificationType.DATA_MODEL:
        this.validateDataModel(specification, errors, warnings);
        break;
      case SpecificationType.SERVICE_SPEC:
        this.validateServiceSpec(specification, errors, warnings);
        break;
    }

    // Validate traceability if enabled
    if (this.config.enabled.traceability) {
      this.validateTraceability(specification, errors, warnings);
    }
  }

  private validateUserStory(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!this.config.enabled.userStoryFormat) return;

    const content = specification.content.toLowerCase();
    const userStoryConfig = this.config.userStory;

    // Check user story format
    if (userStoryConfig.requireExactFormat || userStoryConfig.allowVariations) {
      let formatMatched = false;
      const patterns = userStoryConfig.allowVariations
        ? userStoryConfig.variations
        : ['as a\\s+.+\\s+i want to\\s+.+\\s+so that\\s+.+'];

      for (const pattern of patterns) {
        if (new RegExp(pattern, 'i').test(content)) {
          formatMatched = true;
          break;
        }
      }

      if (!formatMatched) {
        const message = userStoryConfig.requireExactFormat
          ? 'User story must follow the exact format: "As a [user], I want to [action], so that [benefit]"'
          : 'User story should follow the format: "As a [user], I want to [action], so that [benefit]"';

        if (userStoryConfig.requireExactFormat) {
          errors.push({
            type: ErrorType.PATTERN_MISMATCH,
            message,
            severity: ErrorSeverity.ERROR,
          });
        } else {
          warnings.push({
            type: WarningType.UNCLEAR_REQUIREMENT,
            message,
            suggestion: 'Restructure the user story to follow the standard format',
          });
        }
      }
    }

    // Check acceptance criteria
    if (userStoryConfig.requireAcceptanceCriteria) {
      let hasAcceptanceCriteria = false;

      for (const pattern of userStoryConfig.acceptanceCriteriaPatterns) {
        if (new RegExp(pattern, 'i').test(content)) {
          hasAcceptanceCriteria = true;
          break;
        }
      }

      if (!hasAcceptanceCriteria) {
        if (userStoryConfig.requireAcceptanceCriteria) {
          errors.push({
            type: ErrorType.MISSING_FIELD,
            message: 'User story must include acceptance criteria',
            severity: ErrorSeverity.ERROR,
          });
        } else {
          warnings.push({
            type: WarningType.MISSING_ACCEPTANCE_CRITERIA,
            message: 'User story should include acceptance criteria',
            suggestion: 'Add acceptance criteria using Given-When-Then format',
          });
        }
      }
    }
  }

  private validateTraceability(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const traceabilityConfig = this.config.traceability;

    // Check parent link
    if (traceabilityConfig.requireParent && !specification.parent) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Specification should have a parent link',
        suggestion: 'Add a parent link to establish traceability',
      });
    }

    // Check dependencies
    if (
      traceabilityConfig.requireDependencies &&
      (!specification.dependencies || specification.dependencies.length === 0)
    ) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Specification should have dependencies',
        suggestion: 'Add dependencies to related specifications',
      });
    }

    // Check related links
    if (
      traceabilityConfig.requireRelated &&
      (!specification.related || specification.related.length === 0)
    ) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Specification should have related links',
        suggestion: 'Add related specifications for better traceability',
      });
    }

    // Validate link formats
    const allLinks = [
      ...(specification.dependencies || []),
      ...(specification.related || []),
      ...(specification.parent ? [specification.parent] : []),
    ];

    for (const link of allLinks) {
      if (typeof link !== 'string' || !link.trim()) {
        errors.push({
          type: ErrorType.DEPENDENCY_ERROR,
          message: 'Invalid traceability link format',
          severity: ErrorSeverity.ERROR,
        });
      }
    }
  }

  private validateFunctionalRequirement(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = specification.content.toLowerCase();

    if (
      !content.includes('shall') &&
      !content.includes('must') &&
      !content.includes('should') &&
      !content.includes('will')
    ) {
      warnings.push({
        type: WarningType.UNCLEAR_REQUIREMENT,
        message: 'Functional requirement should use clear language (shall, must, should, will)',
        suggestion: 'Use modal verbs to make requirements unambiguous',
      });
    }

    if (specification.content.length < 50) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Functional requirement seems too brief',
        suggestion: 'Add more detail to make the requirement clearer and more testable',
      });
    }
  }

  private validateDataModel(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = specification.content.toLowerCase();

    if (
      !content.includes('field') &&
      !content.includes('property') &&
      !content.includes('column') &&
      !content.includes('attribute')
    ) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Data model should define fields/properties',
        suggestion: 'Add field definitions with names and types',
      });
    }

    if (
      !content.includes('string') &&
      !content.includes('number') &&
      !content.includes('boolean') &&
      !content.includes('date') &&
      !content.includes('array') &&
      !content.includes('object')
    ) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Data model should specify data types',
        suggestion: 'Add data types for each field',
      });
    }
  }

  private validateServiceSpec(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = specification.content.toLowerCase();

    if (!content.includes('endpoint') && !content.includes('route') && !content.includes('/api/')) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Service specification should define API endpoints',
        suggestion: 'Add API endpoint definitions',
      });
    }

    if (
      !content.includes('get') &&
      !content.includes('post') &&
      !content.includes('put') &&
      !content.includes('delete') &&
      !content.includes('patch')
    ) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Service specification should specify HTTP methods',
        suggestion: 'Add HTTP methods for each endpoint',
      });
    }
  }

  private validateMetadata(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!specification.metadata.author) {
      warnings.push({
        type: WarningType.INCOMPLETE_CONTENT,
        message: 'Specification missing author information',
        suggestion: 'Add author information to track ownership',
      });
    }

    if (specification.metadata.estimatedEffort && specification.metadata.estimatedEffort <= 0) {
      errors.push({
        type: ErrorType.INVALID_FORMAT,
        message: 'Estimated effort must be greater than 0',
        severity: ErrorSeverity.ERROR,
      });
    }

    if (specification.metadata.actualEffort && specification.metadata.actualEffort <= 0) {
      errors.push({
        type: ErrorType.INVALID_FORMAT,
        message: 'Actual effort must be greater than 0',
        severity: ErrorSeverity.ERROR,
      });
    }
  }

  private validateDependencies(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (specification.dependencies) {
      for (const dependency of specification.dependencies) {
        if (!dependency || typeof dependency !== 'string') {
          errors.push({
            type: ErrorType.DEPENDENCY_ERROR,
            message: 'Invalid dependency format',
            severity: ErrorSeverity.ERROR,
          });
        }
      }
    }
  }

  private applyCustomRules(
    specification: Specification,
    customRules: CustomValidationRule[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const rule of customRules) {
      try {
        const result = rule.validator(specification);
        if (!result.valid) {
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      } catch (error) {
        errors.push({
          type: ErrorType.SCHEMA_VIOLATION,
          message: `Custom rule '${rule.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: ErrorSeverity.ERROR,
        });
      }
    }
  }

  private calculateMetrics(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): ValidationMetrics {
    const completeness = this.calculateCompleteness(specification);
    const clarity = this.calculateClarity(specification, warnings);
    const consistency = this.calculateConsistency(specification);
    const traceability = this.calculateTraceability(specification);
    const overall = (completeness + clarity + consistency + traceability) / 4;

    return {
      completeness,
      clarity,
      consistency,
      traceability,
      overall,
    };
  }

  private calculateCompleteness(specification: Specification): number {
    let score = 0;
    let maxScore = 0;
    const thresholds = this.config.thresholds;

    // Check required fields
    maxScore += specification.validation.required.length;
    score += specification.validation.required.filter((field) =>
      this.hasField(specification, field)
    ).length;

    // Check metadata
    maxScore += 4;
    if (specification.metadata.author) score++;
    if (specification.metadata.version) score++;
    if (specification.metadata.status) score++;
    if (specification.metadata.priority) score++;

    // Check content quality using configurable thresholds
    maxScore += 2;
    const actualContent = this.getActualContent(specification.content);
    if (actualContent.length >= thresholds.shortContentThreshold) score++;
    if (actualContent.length >= thresholds.minContentLength) score++;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  private calculateClarity(specification: Specification, warnings: ValidationWarning[]): number {
    let score = 100;
    const thresholds = this.config.thresholds;

    // Deduct points for clarity warnings
    const clarityWarnings = warnings.filter(
      (w) => w.type === WarningType.UNCLEAR_REQUIREMENT || w.type === WarningType.INCOMPLETE_CONTENT
    );
    score -= clarityWarnings.length * 15;

    // Check content length using configurable thresholds
    const actualContent = this.getActualContent(specification.content);
    if (actualContent.length < thresholds.veryShortContentThreshold) score -= 30;
    else if (actualContent.length < thresholds.shortContentThreshold) score -= 20;

    return Math.max(0, score);
  }

  private calculateConsistency(specification: Specification): number {
    let score = 100;
    const thresholds = this.config.thresholds;

    // Check ID format consistency (only if enabled)
    if (this.config.enabled.idFormat && !/^[a-zA-Z0-9_-]+$/.test(specification.id)) {
      score -= 20;
    }

    // Check version format consistency (only if enabled)
    if (
      this.config.enabled.versionFormat &&
      specification.metadata.version &&
      !/^\d+\.\d+\.\d+$/.test(specification.metadata.version)
    ) {
      score -= 20;
    }

    // Check title length using configurable thresholds
    if (
      specification.title.length > thresholds.maxTitleLength ||
      specification.title.length < thresholds.minTitleLength
    ) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private calculateTraceability(specification: Specification): number {
    let score = 0;
    const maxScore = 3;

    // Has dependencies
    if (specification.dependencies && specification.dependencies.length > 0) {
      score++;
    }

    // Has tags
    if (specification.tags && specification.tags.length > 0) {
      score++;
    }

    // Has proper categorization
    if (specification.type && specification.category) {
      score++;
    }

    // Bonus points for traceability links if enabled
    if (this.config.enabled.traceability) {
      if (specification.parent) score += 0.5;
      if (specification.related && specification.related.length > 0) score += 0.5;
    }

    return maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  }

  private calculateScore(
    metrics: ValidationMetrics,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = metrics.overall;
    const scoreThresholds = this.config.thresholds;

    // Use configurable penalty points based on score level
    let errorPenalty = 20;
    let warningPenalty = 5;

    if (score < scoreThresholds.acceptableScoreThreshold) {
      errorPenalty = 25;
      warningPenalty = 8;
    } else if (score < scoreThresholds.goodScoreThreshold) {
      errorPenalty = 22;
      warningPenalty = 6;
    }

    // Deduct points for errors and warnings
    score -= errors.length * errorPenalty;
    score -= warnings.length * warningPenalty;

    return Math.max(0, Math.min(100, score));
  }
}
