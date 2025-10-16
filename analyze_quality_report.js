const fs = require('fs');
// const path = require('path'); // Reserved for future use

// Initialize counters and storage for analysis
const fileGroups = {
  'Functional Requirements': { pattern: /^fr_/, files: [], failed: 0, errors: {}, scores: [] },
  'Data Models': {
    files: [],
    failed: 0,
    errors: {},
    scores: [],
    filter: (spec) => spec.type === 'data_model' || spec.id.includes('data_model'),
  },
  'Frontend Specs': {
    files: [],
    failed: 0,
    errors: {},
    scores: [],
    filter: (spec) => spec.category === 'frontend' || spec.id.includes('frontend'),
  },
  Documentation: {
    files: [],
    failed: 0,
    errors: {},
    scores: [],
    filter: (spec) => spec.category === 'documentation' || spec.type === 'documentation',
  },
};

// Global error tracking
const allErrors = {};
let totalFiles = 0;
let totalFailed = 0;

// Function to process the quality report data
function processQualityReport(data) {
  try {
    if (!data.specifications || !Array.isArray(data.specifications)) {
      console.error('Invalid report structure: missing specifications array');
      return;
    }

    data.specifications.forEach((specResult) => {
      if (!specResult.specification || !specResult.validationResult) {
        return;
      }

      const spec = specResult.specification;
      const validation = specResult.validationResult;

      totalFiles++;
      const specId = spec.id || 'unknown';
      const specType = spec.type || 'unknown';
      const specCategory = spec.category || 'unknown';

      // Determine which group this specification belongs to
      let assignedGroup = null;
      for (const [groupName, group] of Object.entries(fileGroups)) {
        if (group.filter) {
          if (group.filter(spec)) {
            assignedGroup = groupName;
            break;
          }
        } else if (group.pattern.test(specId)) {
          assignedGroup = groupName;
          break;
        }
      }

      // If no specific group matched, try to determine by type/category
      if (!assignedGroup) {
        if (specType === 'functional_requirement' || specId.startsWith('fr_')) {
          assignedGroup = 'Functional Requirements';
        } else if (specType === 'data_model' || specCategory === 'data_model') {
          assignedGroup = 'Data Models';
        } else if (specCategory === 'frontend') {
          assignedGroup = 'Frontend Specs';
        } else {
          assignedGroup = 'Documentation';
        }
      }

      const group = fileGroups[assignedGroup];
      group.files.push(specId);

      // Check validation result
      if (!validation.valid) {
        group.failed++;
        totalFailed++;

        // Process errors
        if (validation.errors && Array.isArray(validation.errors)) {
          validation.errors.forEach((error) => {
            const errorType = error.type || 'Unknown Error';
            const errorMessage = error.message || 'No message';

            // Create a more specific error key combining type and message
            const errorKey = `${errorType}: ${errorMessage}`;

            // Track in group
            group.errors[errorKey] = (group.errors[errorKey] || 0) + 1;

            // Track globally
            allErrors[errorKey] = (allErrors[errorKey] || 0) + 1;

            // Store example file for this error
            if (!allErrors[errorKey + '_examples']) {
              allErrors[errorKey + '_examples'] = [];
            }
            if (allErrors[errorKey + '_examples'].length < 3) {
              allErrors[errorKey + '_examples'].push(specId);
            }
          });
        }

        // Also track warnings for additional context
        if (validation.warnings && Array.isArray(validation.warnings)) {
          validation.warnings.forEach((warning) => {
            const warningType = warning.type || 'Unknown Warning';
            const warningMessage = warning.message || 'No message';

            // Create a specific warning key
            const warningKey = `WARNING: ${warningType}: ${warningMessage}`;

            // Track globally (warnings don't affect pass/fail status)
            allErrors[warningKey] = (allErrors[warningKey] || 0) + 1;

            // Store example file for this warning
            if (!allErrors[warningKey + '_examples']) {
              allErrors[warningKey + '_examples'] = [];
            }
            if (allErrors[warningKey + '_examples'].length < 3) {
              allErrors[warningKey + '_examples'].push(specId);
            }
          });
        }
      }

      // Calculate a simple score based on validation
      const errorCount = (validation.errors && validation.errors.length) || 0;
      const warningCount = (validation.warnings && validation.warnings.length) || 0;
      const score = Math.max(0, 100 - errorCount * 10 - warningCount * 2);
      group.scores.push(score);
    });
  } catch (error) {
    console.error('Error processing quality report:', error);
  }
}

// Function to read and process the large JSON file
function analyzeQualityReport() {
  const filePath = 'quality-report.json';

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    processQualityReport(data);

    // Calculate averages and prepare results
    const results = {
      summary: {
        totalFiles,
        totalFailed,
        passRate:
          totalFiles > 0 ? (((totalFiles - totalFailed) / totalFiles) * 100).toFixed(2) : '0.00',
      },
      groups: {},
      topErrors: [],
    };

    // Process group data
    for (const [groupName, group] of Object.entries(fileGroups)) {
      const avgScore =
        group.scores.length > 0
          ? (group.scores.reduce((a, b) => a + b, 0) / group.scores.length).toFixed(2)
          : 'N/A';

      const passRate =
        group.files.length > 0
          ? (((group.files.length - group.failed) / group.files.length) * 100).toFixed(2)
          : 'N/A';

      results.groups[groupName] = {
        totalFiles: group.files.length,
        failed: group.failed,
        passRate,
        avgScore,
        errorTypes: Object.keys(group.errors).length,
        commonErrors: Object.entries(group.errors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([error, count]) => ({ error, count })),
      };
    }

    // Get top 5 errors globally
    results.topErrors = Object.entries(allErrors)
      .filter(([key]) => !key.endsWith('_examples'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({
        error,
        count,
        examples: allErrors[error + '_examples'] || [],
      }));

    return results;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

// Function to generate recommendations for common errors
function generateRecommendations(errorType) {
  const recommendations = {
    'pattern_mismatch: Content must be at least 10 characters long':
      'Expand the content to meet minimum length requirements. Add more detailed descriptions and explanations.',
    'pattern_mismatch: Content must follow markdown format':
      'Ensure content follows proper markdown formatting. Use headers, lists, and other markdown elements correctly.',
    'pattern_mismatch: Missing required sections':
      'Add all required sections as per the specification template. Check the specification guidelines for required sections.',
    'pattern_mismatch: Invalid structure':
      'Restructure the content to match the expected format. Refer to the specification template for correct structure.',
    'pattern_mismatch: Title must follow pattern':
      'Update the title to follow the required naming convention. Check the specification guidelines for title format.',
    'WARNING: incomplete_content: Functional requirement should use clear language (shall, must, should, will)':
      'Rewrite requirements using clear modal verbs (shall, must, should, will) to make them unambiguous.',
    'WARNING: unclear_requirement: Functional requirement should use clear language (shall, must, should, will)':
      'Use modal verbs to make requirements unambiguous and clearly state what the system must do.',
    'WARNING: incomplete_content: Specification missing author information':
      'Add author information to track ownership and responsibility for the specification.',
    'WARNING: incomplete_content: Missing version information':
      'Add version information to track changes and maintain document history.',
    'WARNING: incomplete_content: Missing status information':
      'Specify the current status of the specification (draft, review, approved, etc.).',
    'missing-required-field':
      'Ensure all required fields are included in the specification. Check the specification template for required fields.',
    'invalid-format':
      'Verify that the content follows the correct format. Refer to the documentation for proper formatting guidelines.',
    'missing-section':
      'Add the missing sections to complete the specification. Use the specification checklist to ensure all sections are included.',
    'empty-content':
      'Provide meaningful content for empty sections. Specifications should contain detailed information, not placeholders.',
    'syntax-error':
      'Fix syntax errors in the markup or code. Validate the content using appropriate linters or validators.',
    'inconsistent-naming':
      'Use consistent naming conventions throughout the specification. Follow the project naming guidelines.',
    'missing-dependency':
      'Specify all required dependencies and relationships. Ensure all referenced components are properly documented.',
    'validation-failed':
      'Address validation errors by ensuring the content meets all quality standards and requirements.',
    'duplicate-content':
      'Remove or consolidate duplicate content. Each section should provide unique information.',
    'incomplete-specification':
      'Complete the specification by adding all required details and missing information.',
  };

  return (
    recommendations[errorType] ||
    'Review the error details and consult the specification guidelines for resolution.'
  );
}

// Main execution
function main() {
  console.log('Analyzing quality-report.json...\n');

  const results = analyzeQualityReport();

  if (!results) {
    console.log('Failed to analyze the report.');
    return;
  }

  // Display summary
  console.log('=== QUALITY REPORT ANALYSIS ===\n');
  console.log('Overall Summary:');
  console.log(`Total Files: ${results.summary.totalFiles}`);
  console.log(`Failed: ${results.summary.totalFailed}`);
  console.log(`Pass Rate: ${results.summary.passRate}%\n`);

  // Display group analysis
  console.log('=== FILE GROUP ANALYSIS ===\n');
  console.log('| Group | Total Files | Failed | Pass Rate | Avg Score | Error Types |');
  console.log('|-------|-------------|--------|-----------|-----------|-------------|');

  for (const [groupName, group] of Object.entries(results.groups)) {
    console.log(
      `| ${groupName} | ${group.totalFiles} | ${group.failed} | ${group.passRate}% | ${group.avgScore} | ${group.errorTypes} |`
    );
  }

  console.log('\n=== GROUP DETAILS ===\n');

  for (const [groupName, group] of Object.entries(results.groups)) {
    console.log(`\n${groupName}:`);
    console.log(`- Total Files: ${group.totalFiles}`);
    console.log(`- Failed: ${group.failed}`);
    console.log(`- Pass Rate: ${group.passRate}%`);
    console.log(`- Average Score: ${group.avgScore}`);
    console.log(`- Common Errors:`);

    if (group.commonErrors.length > 0) {
      group.commonErrors.forEach((err) => {
        console.log(`  * ${err.error}: ${err.count} files`);
      });
    } else {
      console.log('  * No significant errors found');
    }
  }

  // Display top 5 errors
  console.log('\n=== TOP 5 ERRORS ===\n');
  console.log('| Rank | Error Type | Count | Example Files |');
  console.log('|------|------------|-------|---------------|');

  results.topErrors.forEach((error, index) => {
    const examples = error.examples.slice(0, 2).join(', ');
    console.log(`| ${index + 1} | ${error.error} | ${error.count} | ${examples} |`);
  });

  // Display recommendations
  console.log('\n=== ERROR RECOMMENDATIONS ===\n');

  results.topErrors.forEach((error, index) => {
    console.log(`\n${index + 1}. ${error.error} (${error.count} files)`);
    console.log(`   Recommendation: ${generateRecommendations(error.error)}`);
    console.log(`   Example files: ${error.examples.slice(0, 3).join(', ')}`);
  });

  // Save results to file
  fs.writeFileSync('quality_analysis_results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed results saved to quality_analysis_results.json');
}

// Run the analysis
main();
