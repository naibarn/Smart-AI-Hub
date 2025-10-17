# SpeckIt Validation Rules Documentation

## Overview

SpeckIt validation engine checks specifications against a set of rules to ensure quality, completeness, and consistency. This document explains all validation rules and how they are applied.

## Core Validation Rules

### 1. Content Length Validation

**Rule Name**: `content_min_length`  
**Pattern**: `^.{10,}$`  
**Description**: Content must be at least 10 characters long  
**Severity**: Error (Required)  
**Implementation Details**:

The validation engine now properly cleans content before checking length:

1. **Removes Front Matter**: YAML front matter (between `---` markers) is excluded from content length calculation
2. **Strips Markdown Syntax**: Headers, list markers, links, code blocks, emphasis, and blockquotes are removed
3. **Normalizes Whitespace**: Excessive whitespace is collapsed to single spaces
4. **Trims Content**: Leading and trailing whitespace is removed

**Example**:
```markdown
---
title: "Specification"
author: "Author"
---
# Header

This is actual content that will be counted.
```

The actual content counted would be: "Header This is actual content that will be counted."

### 2. Title Format Validation

**Rule Name**: `title_format`  
**Pattern**: `^.{1,100}$`  
**Description**: Title must be between 1 and 100 characters  
**Severity**: Error (Required)

### 3. ID Format Validation

**Rule Name**: `id_format`  
**Pattern**: `^[a-zA-Z0-9_-]+$`  
**Description**: ID must contain only alphanumeric characters, hyphens, and underscores  
**Severity**: Error (Required)

### 4. Version Format Validation

**Rule Name**: `version_format`  
**Pattern**: `^\d+\.\d+\.\d+$`  
**Description**: Version must follow semantic versioning (x.y.z)  
**Severity**: Error (Required)

## Type-Specific Validation Rules

### User Story Specifications

#### User Story Format
**Rule Name**: `user_story_format`  
**Pattern**: `/as a\s+.+\s+i want to\s+.+\s+so that\s+.+/i`  
**Description**: User story should follow format: "As a [user], I want to [action], so that [benefit]"  
**Severity**: Warning (Optional)

#### Acceptance Criteria
**Rule Name**: `acceptance_criteria`  
**Pattern**: `/acceptance criteria|given\s+when\s+then/i`  
**Description**: User story should include acceptance criteria  
**Severity**: Warning (Optional)

### Functional Requirement Specifications

#### Requirement Clarity
**Rule Name**: `requirement clarity`  
**Pattern**: `/(shall|must|should|will)\s+/i`  
**Description**: Functional requirement should use clear language (shall, must, should, will)  
**Severity**: Warning (Optional)

### Data Model Specifications

#### Field Definitions
**Rule Name**: `field_definitions`  
**Pattern**: `/field|property|column|attribute/i`  
**Description**: Data model should define fields/properties  
**Severity**: Warning (Optional)

#### Data Types
**Rule Name**: `data_types`  
**Pattern**: `/string|number|boolean|date|array|object/i`  
**Description**: Data model should specify data types  
**Severity**: Warning (Optional)

### Service Specification

#### API Endpoints
**Rule Name**: `api_endpoints`  
**Pattern**: `/endpoint|route|\/api\//i`  
**Description**: Service specification should define API endpoints  
**Severity**: Warning (Optional)

#### HTTP Methods
**Rule Name**: `methods`  
**Pattern**: `/get|post|put|delete|patch/i`  
**Description**: Service specification should specify HTTP methods  
**Severity**: Warning (Optional)

## Validation Metrics

The validation engine calculates the following metrics:

### Completeness Score
- Checks required fields presence
- Evaluates metadata completeness
- Assesses content quality based on length

### Clarity Score
- Deducts points for clarity warnings
- Penalizes overly brief content
- Considers content length thresholds

### Consistency Score
- Validates ID format consistency
- Checks version format compliance
- Evaluates title length compliance

### Traceability Score
- Has dependencies (33.33%)
- Has tags (33.33%)
- Has proper categorization (33.33%)

## Score Calculation

The overall score is calculated as follows:

1. Base score from metrics average
2. Subtract 20 points for each error
3. Subtract 5 points for each warning
4. Final score is clamped between 0 and 100

## Error Types

### Missing Field
Required field is not present or is empty.

### Invalid Format
Field value doesn't match expected pattern or format.

### Pattern Mismatch
Content doesn't match the required pattern.

### Dependency Error
Invalid dependency format or circular dependency.

### Schema Violation
Custom validation rule failed.

## Warning Types

### Incomplete Content
Content is missing recommended elements or too brief.

### Unclear Requirement
Requirement language is ambiguous or unclear.

### Missing Acceptance Criteria
User story lacks acceptance criteria.

### Dependency Warning
Potential issue with dependencies.

## Best Practices

1. **Always include front matter** in markdown specifications with proper metadata
2. **Use clear, concise language** when writing requirements
3. **Follow standard formats** for user stories and acceptance criteria
4. **Include dependencies** between specifications for better traceability
5. **Add relevant tags** to improve categorization and searchability
6. **Keep titles descriptive** but under 100 characters
7. **Use semantic versioning** for specification versions

## Troubleshooting

### Content Length Validation Fails

If your specification fails content length validation despite having substantial content:

1. Check if content is hidden in front matter
2. Verify content isn't just markdown syntax without actual text
3. Ensure content has meaningful text beyond headers and lists

### Validation Fails Unexpectedly

1. Check for special characters in ID field
2. Verify version follows x.y.z format
3. Ensure all required fields are present in metadata
4. Review custom validation rules if any are defined

## Recent Updates

### Fixed Issues (October 17, 2025)

1. **Content Length Validation Bug**: Fixed issue where content length validation was failing on valid content due to improper handling of front matter and markdown syntax.

2. **Null Value Handling**: Improved handling of null/undefined values in pattern validation to prevent false positives.

3. **Content Cleaning**: Added comprehensive content cleaning that properly:
   - Removes front matter
   - Strips markdown syntax
   - Normalizes whitespace
   - Preserves actual content text

These fixes ensure that validation accurately reflects the quality of specification content rather than being affected by formatting or metadata.