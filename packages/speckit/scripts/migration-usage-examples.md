# Speckit Migration Script - Usage Examples

This document provides practical examples of how to use the migration script to convert existing specifications to the new standard template format.

## Basic Usage

### Migrate a Single File

```bash
# Migrate a single functional requirement spec
node packages/speckit/scripts/migrate-spec.js specs/01_requirements/functional/fr_1.md

# Migrate with specific template type
node packages/speckit/scripts/migrate-spec.js specs/02_architecture/data_models/user.md api

# Auto-detect template type (recommended)
node packages/speckit/scripts/migrate-spec.js specs/03_frontend/pages/dashboard.md
```

### Batch Migration

```bash
# Migrate entire functional requirements directory
node packages/speckit/scripts/migrate-spec.js --batch specs/01_requirements/functional/

# Migrate with specific template type
node packages/speckit/scripts/migrate-spec.js --batch specs/02_architecture/data_models/ api

# Migrate all architecture specs
node packages/speckit/scripts/migrate-spec.js --batch specs/02_architecture/
```

### Generate Report Only

```bash
# Generate migration report without modifying files
node packages/speckit/scripts/migrate-spec.js --report specs/01_requirements/functional/
```

## Migration Examples by Spec Type

### 1. Feature Requirements Migration

**Before Migration:**

```markdown
# User Registration

## Overview

Users should be able to register for an account.

## Requirements

- User must provide email
- User must provide password
- Email verification required

## User Stories

As a new user, I want to register with my email so that I can access the system.
```

**After Migration:**

```markdown
# User Registration

## Overview

Users should be able to register for an account.

## Objectives

<!-- TODO: Define clear objectives for this feature -->

## User Stories

As a new user, I want to register with my email so that I can access the system.

## Requirements

### Functional Requirements

- User must provide email
- User must provide password
- Email verification required

### Non-Functional Requirements

<!-- TODO: Specify non-functional requirements -->

## Acceptance Criteria

<!-- TODO: Define detailed acceptance criteria -->

## Implementation Approach

<!-- TODO: Outline implementation approach -->

## Testing Strategy

<!-- TODO: Define comprehensive testing strategy -->
```

### 2. API Specification Migration

**Before Migration:**

```markdown
# User Service API

## Endpoints

- GET /api/v1/users
- POST /api/v1/users
- PUT /api/v1/users/:id

## Data Model

User {
id: string
email: string
name: string
}
```

**After Migration:**

```markdown
# User Service API

## Overview

<!-- TODO: Add overview for this api specification -->

## API Specifications

### Endpoints

- GET /api/v1/users
- POST /api/v1/users
- PUT /api/v1/users/:id

### Request/Response Formats

<!-- TODO: Define request and response formats -->

## Data Models

User {
id: string
email: string
name: string
}

## Implementation Approach

<!-- TODO: Outline implementation approach -->

## Testing Strategy

<!-- TODO: Define comprehensive testing strategy -->

## Security Requirements

<!-- TODO: Specify security requirements -->
```

### 3. UI/UX Specification Migration

**Before Migration:**

```markdown
# Dashboard Layout

## Components

- Header with navigation
- Sidebar with menu items
- Main content area

## Design

- Use Material Design principles
- Responsive layout
- Dark mode support
```

**After Migration:**

```markdown
# Dashboard Layout

## Overview

<!-- TODO: Add overview for this ui-ux specification -->

## Design Considerations

### Visual Design

- Use Material Design principles
- Responsive layout
- Dark mode support

### User Experience

<!-- TODO: Define user experience considerations -->

## Component Specifications

### Header

- Navigation elements
- User profile section

### Sidebar

- Menu items
- Collapsible sections

### Main Content Area

- Dynamic content loading
- Responsive behavior

## Implementation Approach

<!-- TODO: Outline implementation approach -->

## Testing Strategy

<!-- TODO: Define comprehensive testing strategy -->
```

## Advanced Usage

### Custom Template Selection

The script can auto-detect template types based on file path and content patterns:

```bash
# Auto-detection examples
node packages/speckit/scripts/migrate-spec.js specs/02_architecture/services/auth_service.md
# → Detects as 'api' template

node packages/speckit/scripts/migrate-spec.js specs/03_frontend/pages/dashboard.md
# → Detects as 'ui-ux' template

node packages/speckit/scripts/migrate-spec.js specs/03_backlog/epics/epic_1.md
# → Detects as 'epic' template
```

### Manual Template Override

```bash
# Override auto-detection
node packages/speckit/scripts/migrate-spec.js specs/02_architecture/services/auth_service.md feature
```

### Migration with Custom Configuration

You can modify the script configuration at the top of `migrate-spec.js`:

```javascript
const CONFIG = {
  templatesDir: path.join(__dirname, '../templates'),
  backupDir: path.join(process.cwd(), 'spec-backups'),
  reportsDir: path.join(process.cwd(), 'migration-reports'),
  defaultTemplate: 'feature',
};
```

## Migration Workflow

### 1. Preparation

```bash
# Create a test migration first
node packages/speckit/scripts/migrate-spec.js --report specs/01_requirements/functional/

# Review the report to understand what will be migrated
cat migration-reports/migration-report-*.md
```

### 2. Pilot Migration

```bash
# Migrate a single file as a test
node packages/speckit/scripts/migrate-spec.js specs/01_requirements/functional/fr_1.md

# Review the result
git diff specs/01_requirements/functional/fr_1.md
```

### 3. Batch Migration

```bash
# Migrate entire directory
node packages/speckit/scripts/migrate-spec.js --batch specs/01_requirements/functional/

# Review migration report
cat migration-reports/migration-report-*.md
```

### 4. Post-Migration Tasks

After migration, complete the TODO sections:

1. **Review frontmatter metadata**
2. **Complete overview sections**
3. **Define clear objectives**
4. **Add missing acceptance criteria**
5. **Specify testing strategies**
6. **Update traceability links**

## Troubleshooting

### Common Issues

1. **Template Not Found**

   ```
   Error: Template not found: packages/speckit/templates/unknown-template.md
   ```

   **Solution:** Use a valid template type (feature, api, ui-ux, integration, infrastructure, bug-fix, epic, user-story)

2. **Frontmatter Parse Error**

   ```
   Warning: Failed to parse frontmatter as YAML, treating as plain text
   ```

   **Solution:** Check YAML syntax in frontmatter or remove frontmatter

3. **File Not Found**
   ```
   Error: File not found: specs/nonexistent/file.md
   ```
   **Solution:** Verify file path exists

### Recovery

If migration goes wrong:

```bash
# Restore from backup
cp spec-backups/specs/01_requirements/functional/fr_1.md specs/01_requirements/functional/fr_1.md

# Or use git to revert
git checkout -- specs/01_requirements/functional/fr_1.md
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Spec Migration Check

on:
  pull_request:
    paths:
      - 'specs/**/*.md'

jobs:
  check-migration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install js-yaml

      - name: Generate migration report
        run: |
          node packages/speckit/scripts/migrate-spec.js --report specs/

      - name: Upload migration report
        uses: actions/upload-artifact@v2
        with:
          name: migration-report
          path: migration-reports/
```

## Best Practices

1. **Always create backups** before batch migration
2. **Start with a pilot migration** of a few files
3. **Review migration reports** before proceeding
4. **Complete TODO sections** promptly after migration
5. **Validate migrated specs** with speckit validation
6. **Update traceability links** as needed
7. **Document any custom mappings** for future reference

## Performance Considerations

- **Large directories**: Process in chunks of 50-100 files
- **Memory usage**: Script processes files sequentially to limit memory usage
- **Backup storage**: Ensure adequate space for backups (roughly 2x original size)
- **Network drives**: Avoid running on network drives for better performance

## Next Steps

After migration:

1. Run speckit validation to check compliance
2. Update any references to old spec structures
3. Train team members on new template format
4. Update documentation and processes
5. Monitor for any issues or improvements needed
