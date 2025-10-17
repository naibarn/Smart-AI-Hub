#!/usr/bin/env node

/**
 * Speckit Migration Script
 *
 * This script automates the migration of existing specification files
 * to the new standard template format.
 *
 * Usage:
 *   node migrate-spec.js <spec-file-path> [template-type]
 *   node migrate-spec.js --batch <directory> [template-type]
 *   node migrate-spec.js --report <directory>
 */

const fs = require('fs');
const path = require('path');

// Try to require yaml, but provide fallback if not available
let yaml;
try {
  yaml = require('js-yaml');
} catch (error) {
  console.warn('Warning: js-yaml not found, YAML parsing will be limited');
  yaml = {
    load: (str) => {
      try {
        // Simple YAML parsing for basic frontmatter
        const result = {};
        const lines = str.split('\n');
        for (const line of lines) {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            result[match[1]] = match[2].replace(/^["']|["']$/g, '');
          }
        }
        return result;
      } catch (e) {
        return {};
      }
    },
    dump: (obj) => {
      const lines = [];
      for (const [key, value] of Object.entries(obj)) {
        lines.push(`${key}: ${value}`);
      }
      return lines.join('\n');
    }
  };
}

// Configuration
const CONFIG = {
  templatesDir: path.join(__dirname, '../templates'),
  backupDir: path.join(process.cwd(), 'spec-backups'),
  reportsDir: path.join(process.cwd(), 'migration-reports'),
  defaultTemplate: 'feature'
};

// Template to file mapping
const TEMPLATE_FILE_MAP = {
  'feature': 'feature-template.md',
  'api': 'api-template.md',
  'ui-ux': 'ui-ux-template.md',
  'integration': 'integration-template.md',
  'infrastructure': 'infrastructure-template.md',
  'bug-fix': 'bug-fix-template.md',
  'epic': 'epic-template.md',
  'user-story': 'user-story-template.md'
};

// Section mapping from old format to new template
const SECTION_MAPPERS = {
  // Common sections that map directly
  'overview': 'overview',
  'purpose': 'overview',
  'objectives': 'objectives',
  'scope': 'scope',
  'requirements': 'requirements',
  'functional requirements': 'functional_requirements',
  'non-functional requirements': 'non_functional_requirements',
  'user stories': 'user_stories',
  'acceptance criteria': 'acceptance_criteria',
  'implementation': 'implementation_approach',
  'architecture': 'architecture_overview',
  'design': 'design_considerations',
  'security': 'security_requirements',
  'performance': 'performance_requirements',
  'testing': 'testing_strategy',
  'deployment': 'deployment_strategy',
  'monitoring': 'monitoring_and_observability',
  'maintenance': 'maintenance_requirements',
  'risks': 'risk_assessment',
  'mitigation': 'mitigation_strategies',
  'success metrics': 'success_metrics',
  'timeline': 'timeline_and_milestones',
  'dependencies': 'dependencies',
  'api specifications': 'api_specifications',
  'data models': 'data_models',
  'business logic': 'business_logic'
};

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    try {
      const frontmatter = yaml.load(match[1]);
      const body = match[2];
      return { frontmatter, body };
    } catch (error) {
      console.warn('Warning: Failed to parse frontmatter as YAML, treating as plain text');
      return { frontmatter: {}, body: content };
    }
  }
  
  return { frontmatter: {}, body: content };
}

/**
 * Extract sections from markdown content
 */
function extractSections(content) {
  const sections = {};
  
  // Split content by headers (## ### etc.)
  const headerRegex = /^(#{1,3})\s+(.+)$/gm;
  let currentSection = 'introduction';
  let currentContent = [];
  let lastMatch = null;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      
      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim().toLowerCase();
      
      // Only consider ## and ### headers as sections
      if (level <= 3) {
        currentSection = title;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
      
      lastMatch = headerMatch;
    } else {
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

/**
 * Map extracted sections to template sections
 */
function mapSectionsToTemplate(sections, templateType) {
  const mappedSections = {};
  
  // Map sections based on SECTION_MAPPERS
  for (const [oldSection, content] of Object.entries(sections)) {
    const normalizedSection = oldSection.toLowerCase().trim();
    const mappedSection = SECTION_MAPPERS[normalizedSection];
    
    if (mappedSection) {
      mappedSections[mappedSection] = content;
    } else {
      // Try fuzzy matching
      for (const [key, value] of Object.entries(SECTION_MAPPERS)) {
        if (normalizedSection.includes(key) || key.includes(normalizedSection)) {
          mappedSections[value] = content;
          break;
        }
      }
    }
  }
  
  return mappedSections;
}

/**
 * Load template content
 */
function loadTemplate(templateType) {
  const templateFile = TEMPLATE_FILE_MAP[templateType] || TEMPLATE_FILE_MAP[CONFIG.defaultTemplate];
  const templatePath = path.join(CONFIG.templatesDir, templateFile);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Generate placeholder content for missing sections
 */
function generatePlaceholder(sectionName, templateType) {
  const placeholders = {
    overview: `<!-- TODO: Add overview for this ${templateType} specification -->\n\nThis section should provide a comprehensive overview of the ${templateType}, including its purpose, scope, and key objectives.`,
    
    objectives: `<!-- TODO: Define clear objectives for this ${templateType} -->\n\n## Primary Objectives\n\n- [ ] Define the main business objectives\n- [ ] Specify technical objectives\n- [ ] Outline user experience goals\n\n## Success Criteria\n\n- [ ] Measurable success metrics\n- [ ] Key performance indicators\n- [ ] Acceptance criteria`,
    
    user_stories: `<!-- TODO: Add user stories in proper format -->\n\n### Story 1: [Story Title]\n\n**As a** [user type]  \n**I want** [action]  \n**So that** [benefit]\n\n**Acceptance Criteria:**\n- [ ] Criterion 1\n- [ ] Criterion 2\n- [ ] Criterion 3`,
    
    requirements: `<!-- TODO: Specify functional and non-functional requirements -->\n\n## Functional Requirements\n\n- FR-1: [Requirement description]\n- FR-2: [Requirement description]\n\n## Non-Functional Requirements\n\n- NFR-1: Performance requirements\n- NFR-2: Security requirements\n- NFR-3: Scalability requirements`,
    
    acceptance_criteria: `<!-- TODO: Define detailed acceptance criteria -->\n\n## Must-Have Criteria\n\n- [ ] Critical requirement 1\n- [ ] Critical requirement 2\n\n## Should-Have Criteria\n\n- [ ] Important requirement 1\n- [ ] Important requirement 2`,
    
    testing_strategy: `<!-- TODO: Define comprehensive testing strategy -->\n\n## Unit Testing\n\n- [ ] Test coverage requirements\n- [ ] Test framework selection\n\n## Integration Testing\n\n- [ ] API integration tests\n- [ ] Service integration tests\n\n## End-to-End Testing\n\n- [ ] User journey tests\n- [ ] Cross-browser tests`,
    
    implementation_approach: `<!-- TODO: Outline implementation approach -->\n\n## Development Phases\n\n1. Phase 1: [Description]\n2. Phase 2: [Description]\n3. Phase 3: [Description]\n\n## Technical Considerations\n\n- [ ] Architecture decisions\n- [ ] Technology choices\n- [ ] Performance considerations`,
    
    api_specifications: `<!-- TODO: Define API specifications -->\n\n## Endpoints\n\n### GET /api/v1/resource\n\n**Description:** [Endpoint description]\n**Authentication:** [Required/Optional]\n**Parameters:** [List parameters]\n**Response:** [Response format]`,
    
    data_models: `<!-- TODO: Define data models -->\n\n## Entity Model\n\n\`\`\`typescript\ninterface Entity {\n  id: string;\n  // TODO: Add properties\n}\n\`\`\``,
    
    business_logic: `<!-- TODO: Describe business logic -->\n\n## Core Logic\n\n1. [Step 1 description]\n2. [Step 2 description]\n3. [Step 3 description]\n\n## Edge Cases\n\n- [ ] Edge case 1 handling\n- [ ] Edge case 2 handling`,
    
    security_requirements: `<!-- TODO: Specify security requirements -->\n\n## Authentication\n\n- [ ] Authentication method\n- [ ] Authorization levels\n\n## Data Protection\n\n- [ ] Data encryption requirements\n- [ ] PII handling`,
    
    performance_requirements: `<!-- TODO: Define performance requirements -->\n\n## Response Time\n\n- [ ] API response time < Xms\n- [ ] Page load time < Ys\n\n## Throughput\n\n- [ ] Concurrent users supported\n- [ ] Requests per second`,
    
    deployment_strategy: `<!-- TODO: Define deployment strategy -->\n\n## Environments\n\n- Development: [Description]\n- Staging: [Description]\n- Production: [Description]\n\n## Deployment Process\n\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]`,
    
    monitoring_and_observability: `<!-- TODO: Define monitoring requirements -->\n\n## Metrics to Track\n\n- [ ] Performance metrics\n- [ ] Error rates\n- [ ] Usage statistics\n\n## Alerting\n\n- [ ] Alert conditions\n- [ ] Notification channels`,
    
    maintenance_requirements: `<!-- TODO: Specify maintenance requirements -->\n\n## Regular Maintenance\n\n- [ ] Daily tasks\n- [ ] Weekly tasks\n- [ ] Monthly tasks\n\n## Updates and Patches\n\n- [ ] Update process\n- [ ] Patch management`,
    
    risk_assessment: `<!-- TODO: Conduct risk assessment -->\n\n## Technical Risks\n\n- [ ] Risk 1: [Description] - [Mitigation]\n- [ ] Risk 2: [Description] - [Mitigation]\n\n## Business Risks\n\n- [ ] Risk 1: [Description] - [Mitigation]\n- [ ] Risk 2: [Description] - [Mitigation]`,
    
    mitigation_strategies: `<!-- TODO: Define mitigation strategies -->\n\n## Risk Mitigation\n\n- [ ] Strategy for risk 1\n- [ ] Strategy for risk 2\n\n## Contingency Plans\n\n- [ ] Contingency for issue 1\n- [ ] Contingency for issue 2`,
    
    success_metrics: `<!-- TODO: Define success metrics -->\n\n## Key Performance Indicators\n\n- [ ] KPI 1: [Description] - [Target]\n- [ ] KPI 2: [Description] - [Target]\n\n## Success Criteria\n\n- [ ] Criteria 1\n- [ ] Criteria 2`,
    
    timeline_and_milestones: `<!-- TODO: Define timeline and milestones -->\n\n## Milestones\n\n- [ ] Milestone 1: [Date] - [Description]\n- [ ] Milestone 2: [Date] - [Description]\n\n## Dependencies\n\n- [ ] Dependency 1\n- [ ] Dependency 2`,
    
    dependencies: `<!-- TODO: List dependencies -->\n\n## Technical Dependencies\n\n- [ ] System/Service 1\n- [ ] System/Service 2\n\n## Resource Dependencies\n\n- [ ] Resource 1\n- [ ] Resource 2`
  };
  
  return placeholders[sectionName] || `<!-- TODO: Add content for ${sectionName} -->\n\nThis section needs to be completed with relevant information for the ${templateType} specification.`;
}

/**
 * Generate migrated spec content
 */
function generateMigratedSpec(frontmatter, mappedSections, templateType, templateContent) {
  // Parse template to identify sections
  const templateSections = {};
  const templateLines = templateContent.split('\n');
  let currentSection = null;
  let sectionContent = [];
  let sectionPlaceholders = {};
  
  for (let i = 0; i < templateLines.length; i++) {
    const line = templateLines[i];
    const sectionMatch = line.match(/^##\s+(.+)$/);
    
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        templateSections[currentSection] = {
          content: sectionContent.join('\n'),
          hasContent: sectionContent.some(l => l && !l.includes('TODO'))
        };
      }
      
      currentSection = sectionMatch[1];
      sectionContent = [line];
    } else {
      sectionContent.push(line);
    }
  }
  
  // Save last section
  if (currentSection) {
    templateSections[currentSection] = {
      content: sectionContent.join('\n'),
      hasContent: sectionContent.some(l => l && !l.includes('TODO'))
    };
  }
  
  // Build new content
  let newContent = '';
  
  // Add frontmatter
  if (Object.keys(frontmatter).length > 0) {
    newContent += '---\n';
    newContent += yaml.dump(frontmatter);
    newContent += '---\n\n';
  }
  
  // Add title
  const title = frontmatter.title || 'Specification';
  newContent += `# ${title}\n\n`;
  
  // Add sections
  for (const [sectionName, sectionData] of Object.entries(templateSections)) {
    newContent += `## ${sectionName}\n\n`;
    
    // Add mapped content if available, otherwise use template content or placeholder
    const normalizedSection = sectionName.toLowerCase().replace(/\s+/g, '_');
    if (mappedSections[normalizedSection]) {
      newContent += mappedSections[normalizedSection] + '\n\n';
    } else if (sectionData.hasContent) {
      newContent += sectionData.content + '\n\n';
    } else {
      newContent += generatePlaceholder(normalizedSection, templateType) + '\n\n';
    }
  }
  
  return newContent;
}

/**
 * Create backup of original file
 */
function createBackup(filePath) {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  const relativePath = path.relative(process.cwd(), filePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Migrate a single specification file
 */
function migrateSpec(filePath, templateType = CONFIG.defaultTemplate) {
  try {
    console.log(`Migrating: ${filePath}`);
    
    // Read original file
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter and body
    const { frontmatter, body } = parseFrontmatter(originalContent);
    
    // Extract sections
    const sections = extractSections(body);
    
    // Map sections to template
    const mappedSections = mapSectionsToTemplate(sections, templateType);
    
    // Load template
    const templateContent = loadTemplate(templateType);
    
    // Generate migrated content
    const migratedContent = generateMigratedSpec(frontmatter, mappedSections, templateType, templateContent);
    
    // Create backup
    const backupPath = createBackup(filePath);
    console.log(`  Backup created: ${backupPath}`);
    
    // Write migrated content
    fs.writeFileSync(filePath, migratedContent);
    console.log(`  Migration completed successfully`);
    
    return {
      success: true,
      filePath,
      templateType,
      backupPath,
      sectionsFound: Object.keys(sections).length,
      sectionsMapped: Object.keys(mappedSections).length,
      sectionsAdded: Object.keys(generateAllSectionNames(templateContent)).length - Object.keys(mappedSections).length
    };
  } catch (error) {
    console.error(`  Error migrating ${filePath}:`, error.message);
    return {
      success: false,
      filePath,
      templateType,
      error: error.message
    };
  }
}

/**
 * Get all section names from template
 */
function generateAllSectionNames(templateContent) {
  const sections = [];
  const lines = templateContent.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      sections.push(match[1].toLowerCase().replace(/\s+/g, '_'));
    }
  }
  
  return sections;
}

/**
 * Migrate multiple files in batch
 */
function migrateBatch(directory, templateType = CONFIG.defaultTemplate) {
  const results = [];
  
  function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        processDirectory(itemPath);
      } else if (item.endsWith('.md')) {
        const result = migrateSpec(itemPath, templateType);
        results.push(result);
      }
    }
  }
  
  processDirectory(directory);
  
  return results;
}

/**
 * Generate migration report
 */
function generateReport(results) {
  if (!fs.existsSync(CONFIG.reportsDir)) {
    fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(CONFIG.reportsDir, `migration-report-${timestamp}.md`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  let report = `# Migration Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total files processed: ${results.length}\n`;
  report += `- Successful migrations: ${successful.length}\n`;
  report += `- Failed migrations: ${failed.length}\n\n`;
  
  if (successful.length > 0) {
    report += `## Successful Migrations\n\n`;
    report += `| File | Template | Sections Found | Sections Mapped | Sections Added | Backup |\n`;
    report += `|------|----------|----------------|-----------------|----------------|--------|\n`;
    
    for (const result of successful) {
      report += `| ${result.filePath} | ${result.templateType} | ${result.sectionsFound} | ${result.sectionsMapped} | ${result.sectionsAdded} | ${result.backupPath} |\n`;
    }
    report += '\n';
  }
  
  if (failed.length > 0) {
    report += `## Failed Migrations\n\n`;
    report += `| File | Template | Error |\n`;
    report += `|------|----------|-------|\n`;
    
    for (const result of failed) {
      report += `| ${result.filePath} | ${result.templateType} | ${result.error} |\n`;
    }
    report += '\n';
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Review migrated files for accuracy\n`;
  report += `2. Complete TODO sections with appropriate content\n`;
  report += `3. Validate frontmatter metadata\n`;
  report += `4. Test template compliance\n`;
  report += `5. Update traceability links\n\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`Migration report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Detect template type based on file path and content
 */
function detectTemplateType(filePath, content) {
  const pathLower = filePath.toLowerCase();
  
  // Check path patterns
  if (pathLower.includes('data_model') || pathLower.includes('schema')) {
    return 'api';
  }
  if (pathLower.includes('service') || pathLower.includes('api')) {
    return 'api';
  }
  if (pathLower.includes('frontend') || pathLower.includes('ui') || pathLower.includes('component')) {
    return 'ui-ux';
  }
  if (pathLower.includes('epic')) {
    return 'epic';
  }
  if (pathLower.includes('user_story') || pathLower.includes('us-')) {
    return 'user-story';
  }
  if (pathLower.includes('backup') || pathLower.includes('infrastructure')) {
    return 'infrastructure';
  }
  
  // Check content patterns
  if (content.includes('model') && content.includes('schema')) {
    return 'api';
  }
  if (content.includes('component') && content.includes('ui')) {
    return 'ui-ux';
  }
  if (content.includes('epic') && content.includes('story points')) {
    return 'epic';
  }
  if (content.includes('as a') && content.includes('i want') && content.includes('so that')) {
    return 'user-story';
  }
  
  // Check for functional requirements patterns
  if (pathLower.includes('functional') || pathLower.includes('fr_') ||
      content.includes('functional requirement') || content.includes('acceptance criteria')) {
    return 'feature';
  }
  
  // Check for authentication/security patterns
  if (content.includes('authentication') || content.includes('oauth') ||
      content.includes('jwt') || content.includes('password')) {
    return 'feature';
  }
  
  return CONFIG.defaultTemplate;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Speckit Migration Script

Usage:
  node migrate-spec.js <spec-file-path> [template-type]
  node migrate-spec.js --batch <directory> [template-type]
  node migrate-spec.js --report <directory>

Examples:
  node migrate-spec.js specs/01_requirements/functional/fr_1.md feature
  node migrate-spec.js --batch specs/01_requirements/functional feature
  node migrate-spec.js --report specs/01_requirements/functional

Template types:
  feature, api, ui-ux, integration, infrastructure, bug-fix, epic, user-story
`);
    process.exit(1);
  }
  
  const command = args[0];
  
  if (command === '--batch') {
    const directory = args[1];
    const templateType = args[2] || CONFIG.defaultTemplate;
    
    if (!directory) {
      console.error('Error: Directory path required for batch migration');
      process.exit(1);
    }
    
    if (!fs.existsSync(directory)) {
      console.error(`Error: Directory not found: ${directory}`);
      process.exit(1);
    }
    
    console.log(`Starting batch migration of directory: ${directory}`);
    const results = migrateBatch(directory, templateType);
    const reportPath = generateReport(results);
    
    console.log(`\nBatch migration completed. Report: ${reportPath}`);
    
  } else if (command === '--report') {
    const directory = args[1];
    
    if (!directory) {
      console.error('Error: Directory path required for report generation');
      process.exit(1);
    }
    
    console.log(`Generating report for directory: ${directory}`);
    const results = migrateBatch(directory, 'feature');
    const reportPath = generateReport(results);
    
    console.log(`Report generated: ${reportPath}`);
    
  } else {
    const filePath = args[0];
    let templateType = args[1];
    
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    
    // Auto-detect template type if not provided
    if (!templateType) {
      const content = fs.readFileSync(filePath, 'utf8');
      templateType = detectTemplateType(filePath, content);
      console.log(`Auto-detected template type: ${templateType}`);
    }
    
    const result = migrateSpec(filePath, templateType);
    
    if (result.success) {
      console.log(`\nMigration completed successfully!`);
      console.log(`Backup: ${result.backupPath}`);
      console.log(`Sections found: ${result.sectionsFound}`);
      console.log(`Sections mapped: ${result.sectionsMapped}`);
      console.log(`Sections added: ${result.sectionsAdded}`);
    } else {
      console.error(`\nMigration failed: ${result.error}`);
      process.exit(1);
    }
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  migrateSpec,
  migrateBatch,
  generateReport,
  detectTemplateType
};