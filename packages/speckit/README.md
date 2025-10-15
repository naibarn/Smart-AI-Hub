# Speckit - Specification Validation & Analysis Toolkit

Speckit is a comprehensive toolkit for validating, analyzing, and reporting on software specifications in the Smart AI Hub project. It ensures specification quality, consistency, and completeness through automated validation and analysis.

## Features

- **Multi-format Support**: Parse specifications from Markdown, YAML, and JSON files
- **Comprehensive Validation**: Validate specifications against quality standards and best practices
- **Type-specific Rules**: Specialized validation for different specification types (user stories, data models, APIs, etc.)
- **Relationship Analysis**: Analyze dependencies and relationships between specifications
- **Impact Assessment**: Assess the impact of changes across your specification ecosystem
- **Quality Metrics**: Generate detailed quality scores and metrics
- **Multiple Output Formats**: Export reports in JSON, Markdown, HTML, and PDF formats
- **CLI Interface**: Easy-to-use command-line interface for integration into CI/CD pipelines
- **Configurable Rules**: Customize validation rules to match your project requirements

## Installation

```bash
npm install @smart-ai-hub/speckit
```

## Quick Start

### Command Line Usage

```bash
# Analyze all specifications in a directory
speckit analyze specs/

# Validate a single specification file
speckit validate specs/user-stories/us-1.md

# Check quality thresholds
speckit check specs/ --min-score 80 --max-errors 0 --max-warnings 5

# Initialize configuration
speckit init
```

### Programmatic Usage

```javascript
import { analyzeSpecifications, validateSpecification } from '@smart-ai-hub/speckit';

// Analyze all specifications
const report = await analyzeSpecifications('specs/', {
  outputPath: 'analysis-report.json',
  verbose: true,
  strict: true
});

console.log(`Found ${report.summary.totalSpecifications} specifications`);
console.log(`Average quality score: ${report.summary.averageScore}`);

// Validate a single specification
const result = await validateSpecification(specification, {
  verbose: true
});

if (result.valid) {
  console.log('✅ Specification is valid');
} else {
  console.log('❌ Specification has issues');
  result.errors.forEach(error => console.log(`- ${error.message}`));
}
```

## Configuration

Create a `speckit.config.json` file in your project root:

```json
{
  "format": "json",
  "verbose": false,
  "strict": false,
  "includeWarnings": true,
  "reporters": [
    {
      "type": "console",
      "enabled": true,
      "options": {}
    },
    {
      "type": "file",
      "enabled": true,
      "options": {
        "path": "speckit-report.json"
      }
    }
  ]
}
```

## Specification Format

Speckit supports specifications in multiple formats with YAML front matter:

### Markdown Example

```markdown
---
id: user-authentication
title: User Authentication
type: functional_requirement
category: requirements
author: "John Doe"
version: "1.0.0"
status: draft
priority: high
dependencies:
  - user-management
  - security-policy
tags:
  - authentication
  - security
  - user-experience
---

# User Authentication

The system SHALL provide secure user authentication capabilities that allow users to register, login, and manage their accounts.

## Requirements

### User Registration
- **SHALL** allow users to register with email and password
- **SHALL** validate email format and password strength
- **SHALL** send verification email upon registration

### User Login
- **SHALL** authenticate users with email/password
- **SHALL** provide password reset functionality
- **SHALL** implement session management

## Acceptance Criteria

**Given** a user is not authenticated
**When** they visit the login page
**Then** they SHALL see email and password fields

**Given** a user enters valid credentials
**When** they click the login button
**Then** they SHALL be redirected to the dashboard
```

### YAML Example

```yaml
- id: user-data-model
  title: User Data Model
  type: data_model
  category: architecture
  version: "1.2.0"
  status: approved
  priority: high
  content: |
    # User Data Model
    
    ## Fields
    - id: string (UUID, primary key)
    - email: string (unique, required)
    - firstName: string (required)
    - lastName: string (required)
    - createdAt: datetime (auto-generated)
    - updatedAt: datetime (auto-updated)
    - status: enum (active, inactive, suspended)
    
    ## Relationships
    - hasMany: UserSession
    - hasMany: UserPermission
    - belongsTo: Role
```

## Validation Rules

Speckit validates specifications against various rules:

### General Rules
- **Required Fields**: Title, ID, content, version
- **Format Validation**: Proper ID format, semantic versioning
- **Content Quality**: Minimum content length, clarity
- **Metadata Completeness**: Author, status, priority

### Type-Specific Rules

#### User Stories
- Format validation: "As a [user], I want to [action], so that [benefit]"
- Acceptance criteria presence
- Clear user value proposition

#### Functional Requirements
- Use of clear language (shall, must, should, will)
- Testable and unambiguous requirements
- Sufficient detail for implementation

#### Data Models
- Field definitions with types
- Relationship specifications
- Data validation rules

#### Service Specifications
- API endpoint definitions
- HTTP method specifications
- Request/response schemas

## Quality Metrics

Speckit calculates various quality metrics:

- **Completeness**: How complete is the specification
- **Clarity**: How clear and unambiguous is the content
- **Consistency**: How consistent is the formatting and structure
- **Traceability**: How well are dependencies and relationships documented
- **Overall Score**: Weighted average of all metrics (0-100)

## CLI Commands

### analyze
Analyze specifications in a directory:

```bash
speckit analyze <path> [options]
```

Options:
- `-o, --output <path>`: Output file path
- `-f, --format <format>`: Output format (json, markdown, html)
- `-v, --verbose`: Verbose output
- `-s, --strict`: Strict mode (fail on warnings)
- `--no-warnings`: Ignore warnings
- `--config <path>`: Configuration file path

### validate
Validate a single specification file:

```bash
speckit validate <file> [options]
```

Options:
- `-v, --verbose`: Verbose output
- `-s, --strict`: Strict mode (fail on warnings)
- `--no-warnings`: Ignore warnings

### check
Check if specifications meet quality thresholds:

```bash
speckit check <path> [options]
```

Options:
- `--min-score <score>`: Minimum acceptable score (0-100, default: 70)
- `--max-errors <count>`: Maximum allowed errors (default: 0)
- `--max-warnings <count>`: Maximum allowed warnings (default: 10)

### init
Initialize Speckit configuration:

```bash
speckit init [options]
```

Options:
- `-f, --force`: Overwrite existing configuration

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Specification Quality Check

on: [push, pull_request]

jobs:
  speckit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Speckit
        run: npm install -g @smart-ai-hub/speckit
      - name: Check Specification Quality
        run: speckit check specs/ --min-score 80 --max-errors 0 --max-warnings 5
```

### npm Scripts Example

```json
{
  "scripts": {
    "speckit:analyze": "speckit analyze specs/ --output reports/speckit-report.json",
    "speckit:validate": "speckit validate specs/**/*.md",
    "speckit:check": "speckit check specs/ --min-score 80",
    "speckit:watch": "speckit analyze specs/ --verbose --watch"
  }
}
```

## API Reference

### Classes

#### SpeckitEngine
Main engine for specification analysis and validation.

```typescript
import { SpeckitEngine } from '@smart-ai-hub/speckit';

const engine = new SpeckitEngine(config);
const report = await engine.analyzeSpecifications('specs/');
```

#### SpecificationParser
Parse specifications from various file formats.

```typescript
import { SpecificationParser } from '@smart-ai-hub/speckit';

const parser = new SpecificationParser();
const result = await parser.parseDirectory('specs/');
```

#### ValidationEngine
Validate specifications against quality rules.

```typescript
import { ValidationEngine } from '@smart-ai-hub/speckit';

const validator = new ValidationEngine();
const result = validator.validateSpecification(specification);
```

### Types

See `src/types/index.ts` for complete type definitions including:
- `Specification`: Main specification interface
- `ValidationResult`: Validation result with errors, warnings, and metrics
- `AnalysisReport`: Complete analysis report with recommendations
- `SpeckitConfig`: Configuration options

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the examples for implementation guidance