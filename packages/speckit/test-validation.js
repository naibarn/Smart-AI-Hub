const { ValidationEngine } = require('./dist/validation/ValidationEngine');
const fs = require('fs');

const engine = new ValidationEngine();

// Check if getActualContent method exists
console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)));
console.log('Has getActualContent:', typeof engine.getActualContent);

// Test with a simple spec
const specContent = fs.readFileSync('../../specs/01_requirements/functional/fr_1.md', 'utf8');
console.log('\nSpec content length (raw):', specContent.length);

// Test getActualContent method
if (typeof engine.getActualContent === 'function') {
  const cleanedContent = engine.getActualContent(specContent);
  console.log('\nCleaned content length:', cleanedContent.length);
  console.log('First 200 chars:', cleanedContent.substring(0, 200));
}

// Try to validate the spec
try {
  // The ValidationEngine expects a specification object, not raw content
  const specObj = {
    id: 'fr_1',
    title: 'Test Spec',
    content: specContent,
    type: 'FUNCTIONAL_REQUIREMENT',
    metadata: {
      version: '1.0.0',
      author: 'test',
      status: 'draft',
      priority: 'medium',
    },
    validation: {
      required: ['id', 'title', 'content'],
      patterns: [],
    },
  };

  const result = engine.validateSpecification(specObj);
  console.log('\n=== Validation Results ===');
  console.log('Valid:', result.valid);
  console.log('Score:', result.score);
  console.log('Errors:', result.errors.length);
  console.log('Warnings:', result.warnings.length);

  if (result.errors.length > 0) {
    console.log('\n--- Errors ---');
    result.errors.forEach((err) => console.log(err.message));
  }

  if (result.warnings.length > 0) {
    console.log('\n--- Warnings ---');
    result.warnings.forEach((warn) => console.log(warn.message));
  }
} catch (e) {
  console.log('\nError:', e.message);
  console.log(e.stack);
}
