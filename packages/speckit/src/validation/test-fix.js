const { ValidationEngine } = require('../../dist/validation/ValidationEngine');
const { SpecificationParser } = require('../../dist/parser/SpecificationParser');
const path = require('path');

async function testValidationFix() {
  console.log('🔧 Testing SpeckIt Validation Fix...\n');
  
  const validationEngine = new ValidationEngine();
  const parser = new SpecificationParser();
  
  // Test with the actual spec file that was failing
  const specPath = path.resolve(__dirname, '../../../../specs/01_requirements/functional/fr_1.md');
  
  try {
    console.log(`📄 Parsing specification: ${specPath}`);
    const parseResult = await parser.parseFile(specPath);
    
    if (parseResult.specifications.length === 0) {
      console.error('❌ No specifications found in file');
      return;
    }
    
    const specification = parseResult.specifications[0];
    console.log(`✅ Successfully parsed: ${specification.id}`);
    console.log(`📏 Raw content length: ${specification.content.length} characters`);
    
    // Test the validation
    console.log('\n🔍 Running validation...');
    const validationResult = validationEngine.validateSpecification(specification);
    
    console.log(`\n📊 Validation Results:`);
    console.log(`   Valid: ${validationResult.valid}`);
    console.log(`   Score: ${validationResult.score.toFixed(2)}%`);
    console.log(`   Errors: ${validationResult.errors.length}`);
    console.log(`   Warnings: ${validationResult.warnings.length}`);
    
    // Check for the specific content length error
    const contentLengthError = validationResult.errors.find(
      e => e.message.includes('Content must be at least 10 characters long')
    );
    
    if (contentLengthError) {
      console.log('\n❌ FAILED: Content length validation still failing');
      console.log(`   Error: ${contentLengthError.message}`);
    } else {
      console.log('\n✅ SUCCESS: Content length validation passed!');
    }
    
    // Show actual content after cleaning
    const actualContent = validationEngine.getActualContent(specification.content);
    console.log(`\n📝 Actual content length (after cleaning): ${actualContent.length} characters`);
    console.log(`\n📄 First 200 characters of actual content:`);
    console.log(`   "${actualContent.substring(0, 200)}..."`);
    
    // Test edge cases
    console.log('\n🧪 Testing edge cases...');
    
    // Test 1: Content with only front matter
    console.log('\n1. Testing content with only front matter...');
    const frontMatterOnlySpec = {
      ...specification,
      content: `---
title: "Test"
author: "Test Author"
---`
    };
    const frontMatterResult = validationEngine.validateSpecification(frontMatterOnlySpec);
    const frontMatterError = frontMatterResult.errors.find(
      e => e.message.includes('Content must be at least 10 characters long')
    );
    console.log(`   ${frontMatterError ? '❌ Failed (expected)' : '✅ Passed (unexpected)'}`);
    
    // Test 2: Short content
    console.log('\n2. Testing short content...');
    const shortContentSpec = {
      ...specification,
      content: 'Short'
    };
    const shortResult = validationEngine.validateSpecification(shortContentSpec);
    const shortError = shortResult.errors.find(
      e => e.message.includes('Content must be at least 10 characters long')
    );
    console.log(`   ${shortError ? '✅ Failed (expected)' : '❌ Passed (unexpected)'}`);
    
    // Test 3: Empty content
    console.log('\n3. Testing empty content...');
    const emptyContentSpec = {
      ...specification,
      content: ''
    };
    const emptyResult = validationEngine.validateSpecification(emptyContentSpec);
    const emptyError = emptyResult.errors.find(
      e => e.type === 'missing_field'
    );
    console.log(`   ${emptyError ? '✅ Failed (expected)' : '❌ Passed (unexpected)'}`);
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testValidationFix();