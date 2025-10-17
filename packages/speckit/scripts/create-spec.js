#!/usr/bin/env node

/**
 * Script to create a new specification from the template
 * Usage: node create-spec.js [options]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Template file paths
const templates = {
  standard: path.join(__dirname, '../templates/specification-template.md'),
  feature: path.join(__dirname, '../templates/feature-template.md'),
  api: path.join(__dirname, '../templates/api-template.md'),
  ui: path.join(__dirname, '../templates/ui-ux-template.md'),
  integration: path.join(__dirname, '../templates/integration-template.md'),
  infrastructure: path.join(__dirname, '../templates/infrastructure-template.md'),
  bugfix: path.join(__dirname, '../templates/bug-fix-template.md'),
  epic: path.join(__dirname, '../templates/epic-template.md'),
};
const examplePath = path.join(__dirname, '../templates/specification-example.md');

// Questions for user input
const templateQuestions = [
  {
    name: 'template',
    message:
      'Template type (standard, feature, api, ui, integration, infrastructure, bugfix, epic):',
  },
];

const questions = {
  standard: [
    { name: 'title', message: 'Specification title:' },
    {
      name: 'type',
      message:
        'Specification type (user_story, functional_requirement, data_model, service_spec, epic, api_spec, ui_spec):',
    },
    { name: 'category', message: 'Category (requirements, architecture, backlog, documentation):' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'featureName', message: 'Feature name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
  ],
  feature: [
    { name: 'title', message: 'Feature title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'featureName', message: 'Feature name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'featureCategory', message: 'Feature category:' },
    { name: 'team', message: 'Team responsible:' },
    { name: 'epicSpecId', message: 'Epic specification ID:' },
  ],
  api: [
    { name: 'title', message: 'API title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'apiName', message: 'API name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'apiCategory', message: 'API category:' },
    { name: 'protocol', message: 'Protocol (REST, GraphQL, SOAP, etc.):' },
    { name: 'parentSpecId', message: 'Parent specification ID:' },
  ],
  ui: [
    { name: 'title', message: 'UI/UX feature title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'featureName', message: 'Feature name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'featureCategory', message: 'Feature category:' },
    { name: 'platform', message: 'Platform (web, mobile, desktop):' },
    { name: 'parentSpecId', message: 'Parent specification ID:' },
  ],
  integration: [
    { name: 'title', message: 'Integration title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'integrationName', message: 'Integration name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'integrationType', message: 'Integration type:' },
    { name: 'thirdParty', message: 'Third-party system:' },
    { name: 'parentSpecId', message: 'Parent specification ID:' },
  ],
  infrastructure: [
    { name: 'title', message: 'Infrastructure title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'infrastructureName', message: 'Infrastructure name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'infrastructureType', message: 'Infrastructure type:' },
    { name: 'environment', message: 'Environment (dev, staging, prod):' },
    { name: 'parentSpecId', message: 'Parent specification ID:' },
  ],
  bugfix: [
    { name: 'title', message: 'Bug title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'bugId', message: 'Bug ID:' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'component', message: 'Component affected:' },
    { name: 'severity', message: 'Severity (critical, high, medium, low):' },
    { name: 'parentSpecId', message: 'Parent specification ID:' },
  ],
  epic: [
    { name: 'title', message: 'Epic title:' },
    { name: 'author', message: 'Author name:' },
    { name: 'priority', message: 'Priority (low, medium, high, critical):' },
    { name: 'epicName', message: 'Epic name (for ID generation):' },
    { name: 'sequenceNumber', message: 'Sequence number (e.g., 001, 002):' },
    { name: 'epicCategory', message: 'Epic category:' },
    { name: 'initiative', message: 'Initiative:' },
    { name: 'initiativeSpecId', message: 'Initiative specification ID:' },
  ],
};

// Function to prompt user for input
function question(message) {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer);
    });
  });
}

// Function to generate ID from inputs
function generateId(category, featureName, sequenceNumber) {
  const normalizedFeature = featureName.toLowerCase().replace(/\s+/g, '-');
  return `spec-${category}-${normalizedFeature}-${sequenceNumber}`;
}

// Function to get today's date
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Function to replace placeholders in template
function replacePlaceholders(template, answers) {
  const id = generateId(answers.category, answers.featureName, answers.sequenceNumber);

  let content = template
    .replace(/{{Feature Name}}/g, answers.title)
    .replace(/{{specification-type}}/g, answers.type)
    .replace(/{{specification-category}}/g, answers.category)
    .replace(/{{author-name}}/g, answers.author)
    .replace(/{{priority-level}}/g, answers.priority)
    .replace(/{{category}}/g, answers.category)
    .replace(/{{feature-name}}/g, answers.featureName.toLowerCase().replace(/\s+/g, '-'))
    .replace(/{{sequence-number}}/g, answers.sequenceNumber)
    .replace(/{{YYYY-MM-DD}}/g, getTodayDate())
    .replace(/{{hours}}/g, '0')
    .replace(/{{tag1}}/g, answers.featureName.toLowerCase().replace(/\s+/g, '-'))
    .replace(/{{tag2}}/g, answers.category)
    .replace(/{{tag3}}/g, answers.type)
    .replace(/{{specification-id}}/g, id);

  // Replace traceability placeholders
  content = content
    .replace(/{{parent-spec-id}}/g, '')
    .replace(/{{dependency-spec-id-1}}/g, '')
    .replace(/{{dependency-spec-id-2}}/g, '')
    .replace(/{{related-spec-id-1}}/g, '')
    .replace(/{{related-spec-id-2}}/g, '');

  return content;
}

// Main function
async function main() {
  console.log('📝 SpeckIt Specification Creator\n');
  console.log('This script will help you create a new specification from the template.\n');

  // Collect template type
  const templateAnswers = {};
  for (const q of templateQuestions) {
    templateAnswers[q.name] = await question(q.message);
  }

  // Validate template type
  if (!templates[templateAnswers.template]) {
    console.error(`❌ Unknown template type: ${templateAnswers.template}`);
    console.log(`Available templates: ${Object.keys(templates).join(', ')}`);
    process.exit(1);
  }

  // Check if template exists
  const templatePath = templates[templateAnswers.template];
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at ${templatePath}`);
    process.exit(1);
  }

  // Read template
  const template = fs.readFileSync(templatePath, 'utf8');

  // Collect user input based on template type
  const answers = { ...templateAnswers };
  const templateQuestionsList = questions[templateAnswers.template] || questions.standard;

  for (const q of templateQuestionsList) {
    answers[q.name] = await question(q.message);
  }

  // Set default values for standard template fields
  if (templateAnswers.template !== 'standard') {
    // Set defaults for standard fields
    answers.type = getDefaultSpecType(templateAnswers.template);
    answers.category = getDefaultCategory(templateAnswers.template);
  }

  // Validate required fields
  if (!answers.title || !answers.author) {
    console.error('❌ Please provide all required fields');
    process.exit(1);
  }

  // Generate specification content
  const content = replacePlaceholders(template, answers);
  const id = generateId(
    answers.category || getDefaultCategory(templateAnswers.template),
    answers.featureName ||
      answers.apiName ||
      answers.integrationName ||
      answers.infrastructureName ||
      answers.epicName ||
      answers.bugId ||
      'spec',
    answers.sequenceNumber
  );
  const filename = `${id}.md`;

  // Write specification file
  fs.writeFileSync(filename, content);

  console.log(`\n✅ Specification created successfully!`);
  console.log(`📁 File: ${filename}`);
  console.log(`🆔 ID: ${id}`);
  console.log(`📋 Template: ${templateAnswers.template}`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Open ${filename} and fill in the details`);
  console.log(`2. Update the parent, dependencies, and related links`);
  console.log(`3. Add specific requirements and acceptance criteria`);
  console.log(`4. Review and validate with SpeckIt`);

  rl.close();
}

// Helper function to get default spec type based on template
function getDefaultSpecType(template) {
  const defaults = {
    feature: 'functional_requirement',
    api: 'api_spec',
    ui: 'ui_spec',
    integration: 'service_spec',
    infrastructure: 'service_spec',
    bugfix: 'functional_requirement',
    epic: 'epic',
  };
  return defaults[template] || 'functional_requirement';
}

// Helper function to get default category based on template
function getDefaultCategory(template) {
  const defaults = {
    feature: 'requirements',
    api: 'architecture',
    ui: 'requirements',
    integration: 'architecture',
    infrastructure: 'architecture',
    bugfix: 'backlog',
    epic: 'backlog',
  };
  return defaults[template] || 'requirements';
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
SpeckIt Specification Creator

Usage: node create-spec.js [options]

Options:
  --help, -h     Show this help message
  --example      Show an example specification
  --templates    List available templates

Examples:
  node create-spec.js
  node create-spec.js --help
  node create-spec.js --example
  node create-spec.js --templates
`);
  process.exit(0);
}

if (args.includes('--templates')) {
  console.log('\nAvailable Templates:');
  console.log('- standard: General purpose specification template');
  console.log('- feature: Feature specification with user stories and requirements');
  console.log('- api: API specification with contracts and endpoints');
  console.log('- ui: UI/UX specification with design requirements');
  console.log('- integration: Third-party integration specification');
  console.log('- infrastructure: Infrastructure and deployment specification');
  console.log('- bugfix: Bug fix specification with root cause analysis');
  console.log('- epic: High-level epic specification with child specs\n');
  process.exit(0);
}

if (args.includes('--example')) {
  if (fs.existsSync(examplePath)) {
    console.log(fs.readFileSync(examplePath, 'utf8'));
  } else {
    console.error('Example file not found');
    process.exit(1);
  }
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
