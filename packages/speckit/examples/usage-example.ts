/**
 * Example usage of the updated SpeckIt ValidationEngine with configurable validation rules
 */

import { ValidationEngine } from '../src/validation/ValidationEngine';
import {
  Specification,
  SpecificationType,
  SpecificationCategory,
  SpecificationStatus,
  Priority,
  WarningType,
} from '../src/types';

// Example 1: Using default configuration with 'draft' preset
console.log('=== Example 1: Using draft preset ===');
const draftEngine = new ValidationEngine(undefined, 'draft');

// Example 2: Using custom configuration file
console.log('\n=== Example 2: Using custom configuration ===');
const customEngine = new ValidationEngine('./validation-config.json', 'review');

// Example 3: Creating a sample specification
const sampleSpec: Specification = {
  id: 'user-auth-story',
  title: 'User Authentication',
  type: SpecificationType.USER_STORY,
  category: SpecificationCategory.REQUIREMENTS,
  content: `---
author: John Doe
version: 1.0.0
status: draft
priority: high
---

# User Authentication Story

As a user, I want to authenticate with my email and password, so that I can access my account securely.

## Acceptance Criteria

Given I am on the login page
When I enter valid credentials
Then I should be redirected to my dashboard

Given I am on the login page
When I enter invalid credentials
Then I should see an error message

## Implementation Notes

- Use JWT tokens for authentication
- Passwords should be hashed using bcrypt
- Implement rate limiting for login attempts
`,
  metadata: {
    author: 'John Doe',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: SpecificationStatus.DRAFT,
    priority: Priority.HIGH,
    estimatedEffort: 8,
  },
  validation: {
    required: ['title', 'content', 'metadata.author', 'metadata.version'],
    patterns: [],
  },
  dependencies: ['user-registration-story'],
  tags: ['authentication', 'security', 'user-management'],
  parent: 'epic-user-management',
  related: ['password-reset-story', 'two-factor-auth-story'],
};

// Example 4: Validating the specification with different engines
console.log('\n=== Example 3: Validation with draft preset ===');
const draftResult = draftEngine.validateSpecification(sampleSpec);
console.log(`Valid: ${draftResult.valid}`);
console.log(`Score: ${draftResult.score.toFixed(2)}`);
console.log(`Errors: ${draftResult.errors.length}`);
console.log(`Warnings: ${draftResult.warnings.length}`);
console.log('Metrics:', draftResult.metrics);

console.log('\n=== Example 4: Validation with custom configuration ===');
const customResult = customEngine.validateSpecification(sampleSpec);
console.log(`Valid: ${customResult.valid}`);
console.log(`Score: ${customResult.score.toFixed(2)}`);
console.log(`Errors: ${customResult.errors.length}`);
console.log(`Warnings: ${customResult.warnings.length}`);
console.log('Metrics:', customResult.metrics);

// Example 5: Demonstrating traceability validation
console.log('\n=== Example 5: Traceability validation ===');
const specWithoutTraceability: Specification = {
  ...sampleSpec,
  parent: undefined,
  dependencies: [],
  related: [],
};

const traceabilityResult = customEngine.validateSpecification(specWithoutTraceability);
console.log('Traceability warnings for spec without links:');
traceabilityResult.warnings
  .filter(
    (w) =>
      w.message.includes('traceability') ||
      w.message.includes('parent') ||
      w.message.includes('dependencies')
  )
  .forEach((w) => console.log(`- ${w.message}: ${w.suggestion}`));

// Example 6: Demonstrating user story format validation
console.log('\n=== Example 6: User story format validation ===');
const badlyFormattedStory: Specification = {
  ...sampleSpec,
  content: `---
author: John Doe
version: 1.0.0
---

# User needs to login

Users should be able to login with email and password. This is important for security.
`,
};

const storyFormatResult = customEngine.validateSpecification(badlyFormattedStory);
console.log('User story format warnings:');
storyFormatResult.warnings
  .filter((w) => w.message.includes('user story') || w.message.includes('format'))
  .forEach((w) => console.log(`- ${w.message}: ${w.suggestion}`));

// Example 7: Demonstrating content length validation with actual content extraction
console.log('\n=== Example 7: Content length validation ===');
const shortSpec: Specification = {
  ...sampleSpec,
  content: `---
author: John Doe
---

# Short Spec

This is too short.
`,
};

const contentLengthResult = customEngine.validateSpecification(shortSpec);
console.log('Content length warnings:');
contentLengthResult.warnings
  .filter((w) => w.message.includes('length') || w.message.includes('brief'))
  .forEach((w) => console.log(`- ${w.message}: ${w.suggestion}`));

// Example 8: Generating a validation report
console.log('\n=== Example 8: Generating validation report ===');
import { ValidationReportGenerator } from '../src/reporting/ValidationReportGenerator';

// Get the config from a new engine instance since config is private
const reportEngine = new ValidationEngine('./validation-config.json', 'review');
const reportGenerator = new ValidationReportGenerator(reportEngine['config']); // Access private property for example
const specs = [sampleSpec, badlyFormattedStory, shortSpec];
const results = specs.map((spec) => customEngine.validateSpecification(spec));

const report = reportGenerator.generateReport(specs, results);
const markdownReport = reportGenerator.generateMarkdownReport(report);

console.log('Report Summary:');
console.log(`- Total specifications: ${report.summary.total}`);
console.log(`- Average score: ${report.summary.averageScore.toFixed(2)}`);
console.log(`- Errors: ${report.summary.errors}`);
console.log(`- Warnings: ${report.summary.warnings}`);

// Example 9: Saving the report to a file
import * as fs from 'fs';
fs.writeFileSync('./validation-report.md', markdownReport);
console.log('\nFull report saved to validation-report.md');

// Example 10: Creating a custom validation rule
console.log('\n=== Example 9: Custom validation rule ===');
const specWithCustomRule: Specification = {
  ...sampleSpec,
  validation: {
    ...sampleSpec.validation,
    customRules: [
      {
        name: 'business_value_check',
        description: 'Check if specification mentions business value',
        validator: (spec: Specification) => {
          const content = spec.content.toLowerCase();
          const hasBusinessValue =
            content.includes('business value') ||
            content.includes('benefit') ||
            content.includes('roi');

          return {
            valid: hasBusinessValue,
            errors: [],
            warnings: hasBusinessValue
              ? []
              : [
                  {
                    type: WarningType.INCOMPLETE_CONTENT,
                    message: 'Specification should mention business value or benefits',
                    suggestion:
                      'Add information about the business value this specification provides',
                  },
                ],
            score: hasBusinessValue ? 100 : 70,
            metrics: {
              completeness: hasBusinessValue ? 100 : 70,
              clarity: 100,
              consistency: 100,
              traceability: 100,
              overall: hasBusinessValue ? 100 : 70,
            },
          };
        },
      },
    ],
  },
};

const customRuleResult = customEngine.validateSpecification(specWithCustomRule);
console.log('Custom validation rule warnings:');
customRuleResult.warnings
  .filter((w) => w.message.includes('business value'))
  .forEach((w) => console.log(`- ${w.message}: ${w.suggestion}`));
