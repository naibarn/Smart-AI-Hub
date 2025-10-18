# SpeckIt - Enhanced Specification Validation System

SpeckIt is a powerful validation system for software specifications that provides configurable rules, comprehensive reporting, and traceability validation.

## Features

### 🔧 Configurable Validation Rules

- **Flexible Configuration**: Customize validation rules through JSON configuration files
- **Project Presets**: Built-in presets for different project phases (draft, review, production)
- **Custom Patterns**: Add your own validation patterns with regex
- **Strictness Levels**: Adjust strictness for different aspects of validation

### 📊 Comprehensive Reporting

- **Detailed Reports**: Generate markdown or JSON reports with fix suggestions
- **Score Distribution**: View quality scores across all specifications
- **Priority-based Fixes**: Get prioritized fix suggestions with effort estimates
- **Recommendations**: Receive actionable recommendations for improving specification quality

### 🔍 Advanced Validation Features

- **Traceability Validation**: Validate parent, dependency, and related links
- **User Story Format Validation**: Check user stories follow proper format with variations
- **Content Length Validation**: Smart content extraction that ignores markdown syntax
- **Type-specific Rules**: Specialized validation for different specification types

## Quick Start

### Installation

```bash
npm install @speckit/core
```

### Basic Usage

```typescript
import { ValidationEngine } from '@speckit/core';
import { Specification, SpecificationType } from '@speckit/types';

// Create a validation engine with a preset
const engine = new ValidationEngine(undefined, 'draft');

// Validate a specification
const result = engine.validateSpecification(specification);

console.log(`Score: ${result.score}`);
console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${result.errors.length}`);
console.log(`Warnings: ${result.warnings.length}`);
```

### Using Custom Configuration

```typescript
// Create a validation engine with custom config
const engine = new ValidationEngine('./validation-config.json', 'review');

// Generate a comprehensive report
import { ValidationReportGenerator } from '@speckit/reporting';

const reportGenerator = new ValidationReportGenerator(engine.config);
const report = reportGenerator.generateReport(specifications, results);
const markdown = reportGenerator.generateMarkdownReport(report);
```

## Configuration

### Configuration File Structure

```json
{
  "enabled": {
    "contentLength": true,
    "titleFormat": true,
    "idFormat": true,
    "versionFormat": false,
    "userStoryFormat": true,
    "traceability": true
  },
  "thresholds": {
    "minContentLength": 10,
    "shortContentThreshold": 50,
    "veryShortContentThreshold": 20,
    "minTitleLength": 3,
    "maxTitleLength": 100,
    "excellentScoreThreshold": 90,
    "goodScoreThreshold": 70,
    "acceptableScoreThreshold": 50
  },
  "strictness": {
    "contentLength": 70,
    "formatValidation": 80,
    "completeness": 60,
    "clarity": 50,
    "consistency": 90,
    "traceability": 70
  },
  "traceability": {
    "requireParent": false,
    "requireDependencies": false,
    "requireRelated": false,
    "validateLinksExist": true
  },
  "userStory": {
    "requireExactFormat": false,
    "allowVariations": true,
    "variations": [
      "as a\\s+.+\\s+i want to\\s+.+\\s+so that\\s+.+",
      "as an?\\s+.+\\s+i want to\\s+.+\\s+so that\\s+.+"
    ],
    "requireAcceptanceCriteria": false,
    "acceptanceCriteriaPatterns": ["acceptance criteria", "given\\s+.+\\s+when\\s+.+\\s+then\\s+.+"]
  },
  "customPatterns": {
    "require_business_value": {
      "pattern": "business\\s+value|value\\s+proposition|benefit",
      "description": "Specification should mention business value",
      "required": false,
      "type": "warning"
    }
  }
}
```

### Presets

#### Draft Preset

- Lenient validation for early-stage specifications
- Focus on basic structure and completeness
- Version format validation disabled
- Lower strictness levels

#### Review Preset

- Moderate validation for specifications under review
- Enables acceptance criteria validation
- Higher strictness levels
- Traceability validation enabled

#### Production Preset

- Strict validation for production-ready specifications
- All validations enabled
- Highest strictness levels
- Stricter score thresholds

## Validation Features

### Content Length Validation

Smart content extraction that:

- Removes markdown front matter
- Strips markdown syntax (headers, lists, links, code blocks)
- Preserves actual text content for accurate length validation
- Uses configurable thresholds for different content lengths

### User Story Format Validation

Supports multiple user story formats:

- "As a [user], I want to [action], so that [benefit]"
- "As an [user], I want to [action], so that [benefit]"
- "As a [user], I would like to [action], so that [benefit]"
- "As a [user], I need to [action], so that [benefit]"

### Traceability Validation

Validates:

- Parent links for hierarchical relationships
- Dependencies for specification relationships
- Related links for cross-references
- Link format validation
- Optional requirement based on configuration

### Type-specific Validation

Different validation rules for:

- **User Stories**: Format and acceptance criteria
- **Functional Requirements**: Clear language and modal verbs
- **Data Models**: Field definitions and data types
- **Service Specifications**: API endpoints and HTTP methods

## Reporting

### Validation Reports

Generate comprehensive reports that include:

- Summary statistics and score distribution
- Individual specification reports with metrics
- Prioritized fix suggestions with effort estimates
- Configuration summary
- Actionable recommendations

### Fix Suggestions

Each issue includes:

- Category classification
- Priority level (high, medium, low)
- Effort estimate (quick, moderate, significant)
- Specific fix suggestions
- Impact assessment

## API Reference

### ValidationEngine

```typescript
class ValidationEngine {
  constructor(configPath?: string, preset?: 'draft' | 'review' | 'production');

  validateSpecification(specification: Specification): ValidationResult;
}
```

### ValidationReportGenerator

```typescript
class ValidationReportGenerator {
  constructor(config: ValidationConfig);

  generateReport(
    specifications: Specification[],
    results: ValidationResult[],
    configPath?: string,
    preset?: string
  ): ValidationReport;

  generateMarkdownReport(report: ValidationReport): string;
  generateJsonReport(report: ValidationReport): string;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  metrics: ValidationMetrics;
}
```

## Templates and Tools

### Specification Templates

SpeckIt provides specialized templates for different types of specifications, all designed to pass validation:

#### Standard Template

- **Use Case**: General purpose specifications
- **Sections**: Metadata, Overview, User Stories, Functional Requirements, Non-Functional Requirements, Constraints, Dependencies, Data Models, API Specifications, Implementation Notes, Review and Approval

#### Feature Template

- **Use Case**: New features with comprehensive requirements
- **Special Sections**: Feature Goals, Success Metrics, User Experience Design, Testing Strategy, Release and Deployment, Risks and Mitigation

#### API Template

- **Use Case**: API specifications with detailed contracts
- **Special Sections**: API Contracts, Authentication/Authorization, Error Handling, Integration Requirements, Monitoring and Observability

#### UI/UX Template

- **Use Case**: UI features with design requirements
- **Special Sections**: User Research, Design Requirements, User Journey, Screen and Component Designs, Usability Testing, Content Requirements

#### Integration Template

- **Use Case**: Third-party integrations
- **Special Sections**: Third-Party System Information, Data Mapping and Transformation, Error Handling and Recovery, Security Considerations

#### Infrastructure Template

- **Use Case**: Infrastructure and deployment requirements
- **Special Sections**: Architecture Overview, Infrastructure Components, Configuration Management, Disaster Recovery, Cost Management

#### Bug Fix Template

- **Use Case**: Bug fixes requiring specification
- **Special Sections**: Bug Information, Root Cause Analysis, Fix Requirements, Testing Requirements, Implementation Plan

#### Epic Template

- **Use Case**: High-level epics with child specifications
- **Special Sections**: Business Case, User Personas, Child Specifications, High-Level Architecture, Implementation Timeline

### Create Specification Script

Use the provided script to create new specifications from any template:

```bash
# Interactive mode with template selection
node packages/speckit/scripts/create-spec.js

# List available templates
node packages/speckit/scripts/create-spec.js --templates

# Show help
node packages/speckit/scripts/create-spec.js --help

# Show example
node packages/speckit/scripts/create-spec.js --example
```

The script will guide you through selecting the appropriate template and filling in the required information for your specification type.

## Examples

See the `examples/` directory for comprehensive usage examples:

- Basic validation with different presets
- Custom configuration usage
- Report generation
- Custom validation rules
- Traceability validation
- Template usage examples

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
