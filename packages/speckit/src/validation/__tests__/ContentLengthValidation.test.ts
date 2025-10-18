import { ValidationEngine } from '../ValidationEngine';
import { Specification, SpecificationType } from '../../types';

describe('Content Length Validation', () => {
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
  });

  describe('getActualContent method', () => {
    it('should extract plain text from markdown with frontmatter', () => {
      const markdown = `---
title: "Test Specification"
version: "1.0.0"
---

# Test Specification

This is a test specification with **bold text** and *italic text*.

## Requirements

- Requirement 1: The system shall do something
- Requirement 2: The system must do something else

See [documentation](https://example.com) for more details.

\`\`\`javascript
// This code should be removed
const example = true;
\`\`\`
`;

      const spec: Specification = {
        id: 'test-spec',
        title: 'Test Specification',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should pass validation with the fixed content extraction
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for content shorter than minimum', () => {
      const markdown = `---
title: "Short Spec"
---

# Short Spec

Too short.
`;

      const spec: Specification = {
        id: 'short-spec',
        title: 'Short Spec',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should fail validation due to short content
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('at least 100 characters long'))).toBe(
        true
      );
    });

    it('should handle specifications without frontmatter', () => {
      const markdown = `# Simple Specification

This is a simple specification without frontmatter but with enough content to pass validation.
It contains multiple sentences and should definitely exceed the minimum content length requirement.
The content includes various elements like lists:

- First item
- Second item
- Third item

And some **bold text** for emphasis.
`;

      const spec: Specification = {
        id: 'simple-spec',
        title: 'Simple Specification',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle specifications with only headers and lists', () => {
      const markdown = `---
title: "Header Only Spec"
---

# Main Header

## Sub Header 1

- Item 1
- Item 2
- Item 3

## Sub Header 2

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

### Sub Sub Header

More content here to ensure it passes validation even though most of the content
is in headers and lists. The validation should count the actual text content
from these headers and lists.
`;

      const spec: Specification = {
        id: 'header-only-spec',
        title: 'Header Only Spec',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle specifications with excessive whitespace', () => {
      const markdown = `---
title: "Whitespace Spec"
version: "1.0.0"
---



# Specification with Whitespace



This specification has excessive whitespace between paragraphs.



But it should still pass validation if the actual content is long enough.



The content includes multiple paragraphs separated by multiple newlines.



And it should still be counted correctly.



`;

      const spec: Specification = {
        id: 'whitespace-spec',
        title: 'Whitespace Spec',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty content', () => {
      const markdown = `---
title: "Empty Spec"
---

# Empty Specification
`;

      const spec: Specification = {
        id: 'empty-spec',
        title: 'Empty Spec',
        type: SpecificationType.FUNCTIONAL_REQUIREMENT,
        category: 'requirements' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should fail validation
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('at least 100 characters long'))).toBe(
        true
      );
    });

    it('should handle specifications with code blocks', () => {
      const markdown = `---
title: "Code Heavy Spec"
---

# Code Heavy Specification

This specification contains multiple code blocks but should still pass validation
based on the non-code content.

## API Endpoint

\`\`\`javascript
// This is a code block that should be ignored for content length
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});
\`\`\`

## Database Schema

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);
\`\`\`

## Requirements

The system must provide the following functionality:
1. User management
2. Authentication
3. Data persistence

Even with code blocks, this specification should pass validation because
the non-code content is substantial enough to meet the minimum requirements.
`;

      const spec: Specification = {
        id: 'code-heavy-spec',
        title: 'Code Heavy Spec',
        type: SpecificationType.SERVICE_SPEC,
        category: 'architecture' as any,
        content: markdown,
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'draft' as any,
          priority: 'medium' as any,
        },
        validation: {
          required: ['title', 'content'],
          patterns: [],
        },
      };

      const result = validationEngine.validateSpecification(spec);

      // Should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
