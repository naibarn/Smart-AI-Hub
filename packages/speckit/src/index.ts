/**
 * Speckit - Specification validation and analysis toolkit
 *
 * A comprehensive toolkit for validating, analyzing, and reporting on
 * software specifications in the Smart AI Hub project.
 */

export { SpecificationParser } from './parser/SpecificationParser';
export { ValidationEngine } from './validation/ValidationEngine';
export { SpeckitEngine } from './core/SpeckitEngine';

// Export all types
export * from './types';

// Import types for internal use
import { SpeckitConfig, OutputFormat, ReporterType } from './types';

// Export version
export const VERSION = '1.0.0';

/**
 * Convenience function to quickly analyze specifications
 */
export async function analyzeSpecifications(
  inputPath: string,
  options: {
    outputPath?: string;
    format?: 'json' | 'markdown' | 'html';
    verbose?: boolean;
    strict?: boolean;
    includeWarnings?: boolean;
  } = {}
) {
  const { SpeckitEngine } = await import('./core/SpeckitEngine');
  const types = await import('./types');

  const config: SpeckitConfig = {
    outputPath: options.outputPath,
    format: (options.format as OutputFormat) || OutputFormat.JSON,
    verbose: options.verbose || false,
    strict: options.strict || false,
    includeWarnings: options.includeWarnings !== false,
    reporters: [
      {
        type: ReporterType.CONSOLE,
        enabled: true,
        options: {},
      },
    ],
  };

  const engine = new SpeckitEngine(config);
  return engine.analyzeSpecifications(inputPath);
}

/**
 * Convenience function to validate a single specification
 */
export async function validateSpecification(
  specification: any,
  options: {
    verbose?: boolean;
    includeWarnings?: boolean;
  } = {}
) {
  const { ValidationEngine } = await import('./validation/ValidationEngine');

  const engine = new ValidationEngine();
  const result = engine.validateSpecification(specification);

  if (options.verbose) {
    console.log(`Validation Result:`);
    console.log(`- Valid: ${result.valid ? '✅' : '❌'}`);
    console.log(`- Score: ${result.score.toFixed(2)}/100`);
    console.log(`- Errors: ${result.errors.length}`);
    console.log(`- Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error) => {
        console.log(`  - ${error.message}`);
      });
    }

    if (options.includeWarnings !== false && result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach((warning) => {
        console.log(`  - ${warning.message}`);
        if (warning.suggestion) {
          console.log(`    💡 ${warning.suggestion}`);
        }
      });
    }
  }

  return result;
}

/**
 * Create a default Speckit configuration
 */
export function createDefaultConfig(): SpeckitConfig {
  return {
    format: OutputFormat.JSON,
    verbose: false,
    strict: false,
    includeWarnings: true,
    reporters: [
      {
        type: ReporterType.CONSOLE,
        enabled: true,
        options: {},
      },
      {
        type: ReporterType.FILE,
        enabled: true,
        options: {
          path: 'speckit-report.json',
        },
      },
    ],
  };
}

// Default export
export default {
  VERSION,
  analyzeSpecifications,
  validateSpecification,
  createDefaultConfig,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SpecificationParser: require('./parser/SpecificationParser').SpecificationParser,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ValidationEngine: require('./validation/ValidationEngine').ValidationEngine,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SpeckitEngine: require('./core/SpeckitEngine').SpeckitEngine,
};
