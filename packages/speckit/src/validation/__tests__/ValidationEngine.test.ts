import { ValidationEngine } from '../ValidationEngine';
import { Specification, SpecificationType, SpecificationCategory, SpecificationStatus, Priority } from '../../types';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let mockSpecification: Specification;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
    
    mockSpecification = {
      id: 'test-spec',
      title: 'Test Specification',
      type: SpecificationType.FUNCTIONAL_REQUIREMENT,
      category: SpecificationCategory.REQUIREMENTS,
      content: 'This is a test specification content.',
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: SpecificationStatus.DRAFT,
        priority: Priority.MEDIUM,
        author: 'Test Author',
      },
      validation: {
        required: ['title', 'content'],
        patterns: [],
      },
    };
  });

  describe('Content Length Validation', () => {
    it('should pass validation for content with more than 10 characters', () => {
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeUndefined();
      expect(result.valid).toBe(true);
    });

    it('should fail validation for content with less than 10 characters', () => {
      mockSpecification.content = 'Short';
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should properly handle content with front matter', () => {
      mockSpecification.content = `---
title: "Front Matter"
author: "Test"
---
# Actual Content

This is the actual content that should be counted.
        `;
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeUndefined();
      expect(result.valid).toBe(true);
    });

    it('should properly handle content with markdown syntax', () => {
      mockSpecification.content = `# Header

## Subheader

- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2

**Bold text** and *italic text*

[Link text](https://example.com)

\`inline code\`

\`\`\`
code block
\`\`\`

> Blockquote

This is actual content with markdown that should be cleaned properly.`;
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeUndefined();
      expect(result.valid).toBe(true);
    });

    it('should fail for content with only front matter and no actual content', () => {
      mockSpecification.content = `---
title: "Front Matter"
author: "Test"
---`;
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should handle empty content gracefully', () => {
      mockSpecification.content = '';
      const result = validationEngine.validateSpecification(mockSpecification);
      const contentError = result.errors.find(e => e.message.includes('Content must be at least 10 characters long'));
      expect(contentError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should handle null content gracefully', () => {
      mockSpecification.content = '';
      const result = validationEngine.validateSpecification(mockSpecification);
      const missingFieldError = result.errors.find(e => e.type === 'missing_field');
      expect(missingFieldError).toBeDefined();
      expect(result.valid).toBe(false);
    });
  });

  describe('Title Format Validation', () => {
    it('should pass validation for title within length limits', () => {
      mockSpecification.title = 'Valid Title';
      const result = validationEngine.validateSpecification(mockSpecification);
      const titleError = result.errors.find(e => e.message.includes('Title must be between 1 and 100 characters'));
      expect(titleError).toBeUndefined();
    });

    it('should fail validation for title exceeding 100 characters', () => {
      mockSpecification.title = 'a'.repeat(101);
      const result = validationEngine.validateSpecification(mockSpecification);
      const titleError = result.errors.find(e => e.message.includes('Title must be between 1 and 100 characters'));
      expect(titleError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should fail validation for empty title', () => {
      mockSpecification.title = '';
      const result = validationEngine.validateSpecification(mockSpecification);
      const titleError = result.errors.find(e => e.message.includes('Title must be between 1 and 100 characters'));
      expect(titleError).toBeDefined();
      expect(result.valid).toBe(false);
    });
  });

  describe('ID Format Validation', () => {
    it('should pass validation for valid ID formats', () => {
      const validIds = ['test-spec', 'test_spec', 'test123', 'test-123_spec'];
      validIds.forEach(id => {
        mockSpecification.id = id;
        const result = validationEngine.validateSpecification(mockSpecification);
        const idError = result.errors.find(e => e.message.includes('ID must contain only alphanumeric characters'));
        expect(idError).toBeUndefined();
      });
    });

    it('should fail validation for invalid ID formats', () => {
      const invalidIds = ['test spec', 'test@spec', 'test.spec', 'test/spec'];
      invalidIds.forEach(id => {
        mockSpecification.id = id;
        const result = validationEngine.validateSpecification(mockSpecification);
        const idError = result.errors.find(e => e.message.includes('ID must contain only alphanumeric characters'));
        expect(idError).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Version Format Validation', () => {
    it('should pass validation for semantic versioning', () => {
      const validVersions = ['1.0.0', '10.20.30', '1.0.0-alpha', '2.0.0-beta.1'];
      validVersions.forEach(version => {
        mockSpecification.metadata.version = version;
        const result = validationEngine.validateSpecification(mockSpecification);
        const versionError = result.errors.find(e => e.message.includes('Version must follow semantic versioning'));
        expect(versionError).toBeUndefined();
      });
    });

    it('should fail validation for non-semantic versions', () => {
      const invalidVersions = ['1.0', 'v1.0.0', '1.0.0.0', '1.0'];
      invalidVersions.forEach(version => {
        mockSpecification.metadata.version = version;
        const result = validationEngine.validateSpecification(mockSpecification);
        const versionError = result.errors.find(e => e.message.includes('Version must follow semantic versioning'));
        expect(versionError).toBeDefined();
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('User Story Format Validation', () => {
    beforeEach(() => {
      mockSpecification.type = SpecificationType.USER_STORY;
    });

    it('should pass validation for properly formatted user story', () => {
      mockSpecification.content = `---
title: "User Story"
---
As a user, I want to login with my email so that I can access my account.`;
      const result = validationEngine.validateSpecification(mockSpecification);
      const userStoryWarning = result.warnings.find(w => w.message.includes('User story should follow format'));
      expect(userStoryWarning).toBeUndefined();
    });

    it('should warn for improperly formatted user story', () => {
      mockSpecification.content = `---
title: "User Story"
---
User wants to login.`;
      const result = validationEngine.validateSpecification(mockSpecification);
      const userStoryWarning = result.warnings.find(w => w.message.includes('User story should follow format'));
      expect(userStoryWarning).toBeDefined();
    });

    it('should check for acceptance criteria in user stories', () => {
      mockSpecification.content = `---
title: "User Story"
---
As a user, I want to login with my email so that I can access my account.

Acceptance Criteria:
- Given I am on the login page
- When I enter valid credentials
- Then I should be redirected to dashboard`;
      const result = validationEngine.validateSpecification(mockSpecification);
      const acceptanceWarning = result.warnings.find(w => w.message.includes('acceptance criteria'));
      expect(acceptanceWarning).toBeUndefined();
    });
  });

  describe('Traceability Calculation', () => {
    it('should calculate traceability score based on dependencies, tags, and categorization', () => {
      mockSpecification.dependencies = ['spec-1', 'spec-2'];
      mockSpecification.tags = ['tag1', 'tag2'];
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.metrics.traceability).toBe(100);
    });

    it('should calculate lower traceability score for specs without dependencies', () => {
      mockSpecification.dependencies = [];
      mockSpecification.tags = ['tag1'];
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.metrics.traceability).toBe(66.66666666666666);
    });

    it('should calculate zero traceability score for specs with no dependencies, tags, or category', () => {
      mockSpecification.dependencies = [];
      mockSpecification.tags = [];
      mockSpecification.category = undefined as any;
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.metrics.traceability).toBe(0);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate appropriate score for valid specifications', () => {
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should deduct points for errors', () => {
      mockSpecification.content = 'Short';
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.score).toBeLessThan(80);
      expect(result.valid).toBe(false);
    });

    it('should deduct points for warnings', () => {
      mockSpecification.type = SpecificationType.USER_STORY;
      mockSpecification.content = 'User wants to login without proper format.';
      const result = validationEngine.validateSpecification(mockSpecification);
      expect(result.score).toBeLessThan(95);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle specifications with missing metadata', () => {
      delete mockSpecification.metadata.author;
      const result = validationEngine.validateSpecification(mockSpecification);
      const authorWarning = result.warnings.find(w => w.message.includes('author'));
      expect(authorWarning).toBeDefined();
    });

    it('should handle specifications with invalid effort values', () => {
      mockSpecification.metadata.estimatedEffort = -1;
      const result = validationEngine.validateSpecification(mockSpecification);
      const effortError = result.errors.find(e => e.message.includes('Estimated effort must be greater than 0'));
      expect(effortError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should handle custom validation rules', () => {
      const customRule = {
        name: 'custom-rule',
        description: 'Custom validation rule',
        validator: (spec: Specification) => ({
          valid: false,
          errors: [{ type: 'custom_error' as any, message: 'Custom error', severity: 'error' as any }],
          warnings: [],
          score: 0,
          metrics: {
            completeness: 0,
            clarity: 0,
            consistency: 0,
            traceability: 0,
            overall: 0,
          },
        }),
      };
      mockSpecification.validation.customRules = [customRule];
      const result = validationEngine.validateSpecification(mockSpecification);
      const customError = result.errors.find(e => e.message === 'Custom error');
      expect(customError).toBeDefined();
      expect(result.valid).toBe(false);
    });
  });
});