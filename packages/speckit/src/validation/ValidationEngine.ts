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

export class ValidationEngine {
  private readonly defaultPatterns: ValidationPattern[] = [
    {
      name: 'title_format',
      pattern: /^.{1,100}$/,
      description: 'Title must be between 1 and 100 characters',
      required: true,
    },
    {
      name: 'content_min_length',
      pattern: /^.{10,}$/,
      description: 'Content must be at least 10 characters long',
      required: true,
    },
    {
      name: 'id_format',
      pattern: /^[a-zA-Z0-9_-]+$/,
      description: 'ID must contain only alphanumeric characters, hyphens, and underscores',
      required: true,
    },
    {
      name: 'version_format',
      pattern: /^\d+\.\d+\.\d+$/,
      description: 'Version must follow semantic versioning (x.y.z)',
      required: true,
    },
  ];

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
      if (testValue !== null) {
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
  }

  private getValueForPattern(specification: Specification, patternName: string): string | null {
    switch (patternName) {
      case 'title_format':
        return specification.title;
      case 'content_min_length':
        return specification.content;
      case 'id_format':
        return specification.id;
      case 'version_format':
        return specification.metadata.version;
      case 'user_story_format':
      case 'acceptance_criteria':
        return specification.content;
      case 'requirement clarity':
        return specification.content;
      case 'field_definitions':
      case 'data_types':
        return specification.content;
      case 'api_endpoints':
      case 'methods':
        return specification.content;
      default:
        return null;
    }
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
  }

  private validateUserStory(
    specification: Specification,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const content = specification.content.toLowerCase();

    if (
      !content.includes('as a') &&
      !content.includes('i want to') &&
      !content.includes('so that')
    ) {
      warnings.push({
        type: WarningType.UNCLEAR_REQUIREMENT,
        message:
          'User story should follow the standard format: "As a [user], I want to [action], so that [benefit]"',
        suggestion: 'Restructure the user story to follow the standard format',
      });
    }

    if (
      !content.includes('acceptance criteria') &&
      !content.includes('given') &&
      !content.includes('when') &&
      !content.includes('then')
    ) {
      warnings.push({
        type: WarningType.MISSING_ACCEPTANCE_CRITERIA,
        message: 'User story should include acceptance criteria',
        suggestion: 'Add acceptance criteria using Given-When-Then format',
      });
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

    // Check content quality
    maxScore += 2;
    if (specification.content.length >= 50) score++;
    if (specification.content.length >= 200) score++;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  private calculateClarity(specification: Specification, warnings: ValidationWarning[]): number {
    let score = 100;

    // Deduct points for clarity warnings
    const clarityWarnings = warnings.filter(
      (w) => w.type === WarningType.UNCLEAR_REQUIREMENT || w.type === WarningType.INCOMPLETE_CONTENT
    );
    score -= clarityWarnings.length * 15;

    // Check content length
    if (specification.content.length < 50) score -= 20;
    if (specification.content.length < 20) score -= 30;

    return Math.max(0, score);
  }

  private calculateConsistency(specification: Specification): number {
    let score = 100;

    // Check ID format consistency
    if (!/^[a-zA-Z0-9_-]+$/.test(specification.id)) {
      score -= 20;
    }

    // Check version format consistency
    if (!/^\d+\.\d+\.\d+$/.test(specification.metadata.version)) {
      score -= 20;
    }

    // Check title length
    if (specification.title.length > 100 || specification.title.length < 3) {
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

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  private calculateScore(
    metrics: ValidationMetrics,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = metrics.overall;

    // Deduct points for errors
    score -= errors.length * 20;

    // Deduct points for warnings
    score -= warnings.length * 5;

    return Math.max(0, Math.min(100, score));
  }
}
