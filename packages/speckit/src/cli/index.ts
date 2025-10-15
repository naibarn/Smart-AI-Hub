#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { SpeckitEngine } from '../core/SpeckitEngine';
import { SpeckitConfig, OutputFormat, ReporterType, Priority } from '../types';

const program = new Command();

program
  .name('speckit')
  .description('Specification validation and analysis toolkit for Smart AI Hub')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze specifications in a directory')
  .argument('<path>', 'Path to specifications directory')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, html)', 'json')
  .option('-v, --verbose', 'Verbose output')
  .option('-s, --strict', 'Strict mode (fail on warnings)')
  .option('--no-warnings', 'Ignore warnings')
  .option('--config <path>', 'Configuration file path')
  .action(async (inputPath, options) => {
    try {
      const config = await loadConfiguration(options.config);

      // Override config with CLI options
      if (options.output) config.outputPath = options.output;
      if (options.format) config.format = options.format as OutputFormat;
      if (options.verbose) config.verbose = true;
      if (options.strict) config.strict = true;
      if (!options.warnings) config.includeWarnings = false;

      const engine = new SpeckitEngine(config);
      const report = await engine.analyzeSpecifications(inputPath);

      if (config.strict && report.summary.invalidSpecifications > 0) {
        console.error(
          `\n❌ Analysis failed with ${report.summary.invalidSpecifications} invalid specifications`
        );
        process.exit(1);
      }

      if (config.strict && report.summary.criticalIssues > 0) {
        console.error(`\n❌ Analysis failed with ${report.summary.criticalIssues} critical issues`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a single specification file')
  .argument('<file>', 'Path to specification file')
  .option('-v, --verbose', 'Verbose output')
  .option('-s, --strict', 'Strict mode (fail on warnings)')
  .option('--no-warnings', 'Ignore warnings')
  .action(async (filePath, options) => {
    try {
      const config: SpeckitConfig = {
        format: OutputFormat.JSON,
        verbose: options.verbose || false,
        strict: options.strict || false,
        includeWarnings: options.warnings !== false,
        reporters: [
          {
            type: ReporterType.CONSOLE,
            enabled: true,
            options: {},
          },
        ],
      };

      const engine = new SpeckitEngine(config);
      const results = await engine.validateFile(filePath);

      let hasErrors = false;
      let hasWarnings = false;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (config.verbose) {
          console.log(`\n📋 Specification ${i + 1}:`);
          console.log(`   Score: ${result.score.toFixed(2)}/100`);
          console.log(`   Valid: ${result.valid ? '✅' : '❌'}`);
        }

        if (result.errors.length > 0) {
          hasErrors = true;
          console.log(`\n❌ Errors:`);
          for (const error of result.errors) {
            console.log(`   - ${error.message}`);
          }
        }

        if (config.includeWarnings && result.warnings.length > 0) {
          hasWarnings = true;
          console.log(`\n⚠️  Warnings:`);
          for (const warning of result.warnings) {
            console.log(`   - ${warning.message}`);
            if (warning.suggestion) {
              console.log(`     💡 Suggestion: ${warning.suggestion}`);
            }
          }
        }
      }

      if (config.strict && (hasErrors || (config.includeWarnings && hasWarnings))) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Speckit configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      const configPath = 'speckit.config.json';

      if (fs.existsSync(configPath) && !options.force) {
        console.error('❌ Configuration file already exists. Use --force to overwrite.');
        process.exit(1);
      }

      const defaultConfig: SpeckitConfig = {
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

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`✅ Configuration file created: ${configPath}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check if specifications meet quality thresholds')
  .argument('<path>', 'Path to specifications directory')
  .option('--min-score <score>', 'Minimum acceptable score (0-100)', '70')
  .option('--max-errors <count>', 'Maximum allowed errors', '0')
  .option('--max-warnings <count>', 'Maximum allowed warnings', '10')
  .action(async (inputPath, options) => {
    try {
      const config: SpeckitConfig = {
        format: OutputFormat.JSON,
        verbose: true,
        strict: true,
        includeWarnings: true,
        reporters: [
          {
            type: ReporterType.CONSOLE,
            enabled: true,
            options: {},
          },
        ],
      };

      const engine = new SpeckitEngine(config);
      const report = await engine.analyzeSpecifications(inputPath);

      const minScore = parseFloat(options.minScore);
      const maxErrors = parseInt(options.maxErrors);
      const maxWarnings = parseInt(options.maxWarnings);

      console.log('\n📊 Quality Check Results:');
      console.log(
        `Average Score: ${report.summary.averageScore.toFixed(2)}/100 (required: ≥${minScore})`
      );
      console.log(`Errors: ${report.summary.criticalIssues} (max: ${maxErrors})`);
      console.log(`Warnings: ${report.summary.warnings} (max: ${maxWarnings})`);

      let passed = true;

      if (report.summary.averageScore < minScore) {
        console.log(`❌ Score threshold not met`);
        passed = false;
      }

      if (report.summary.criticalIssues > maxErrors) {
        console.log(`❌ Error threshold exceeded`);
        passed = false;
      }

      if (report.summary.warnings > maxWarnings) {
        console.log(`❌ Warning threshold exceeded`);
        passed = false;
      }

      if (passed) {
        console.log('\n✅ Quality check passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Quality check failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

async function loadConfiguration(configPath?: string): Promise<SpeckitConfig> {
  const defaultConfig: SpeckitConfig = {
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
    ],
  };

  if (!configPath) {
    // Try to find config file in current directory
    const possiblePaths = ['speckit.config.json', '.speckit.json', 'package.json'];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        configPath = possiblePath;
        break;
      }
    }
  }

  if (!configPath || !fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');

    if (configPath.endsWith('package.json')) {
      const packageJson = JSON.parse(configContent);
      return { ...defaultConfig, ...packageJson.speckit };
    } else {
      const config = JSON.parse(configContent);
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to load configuration from ${configPath}, using defaults`);
    return defaultConfig;
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
