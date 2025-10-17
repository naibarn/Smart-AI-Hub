import {
  Specification,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ErrorType,
  WarningType,
  SpecificationType,
} from '../types';
import { ValidationConfig } from '../config/validation-config';

export interface ValidationReport {
  timestamp: Date;
  summary: ReportSummary;
  specifications: SpecificationReport[];
  recommendations: Recommendation[];
  configuration: ConfigSummary;
}

export interface ReportSummary {
  total: number;
  valid: number;
  invalid: number;
  averageScore: number;
  errors: number;
  warnings: number;
  scoreDistribution: ScoreDistribution;
}

export interface ScoreDistribution {
  excellent: number; // 90-100
  good: number; // 70-89
  acceptable: number; // 50-69
  poor: number; // < 50
}

export interface SpecificationReport {
  id: string;
  title: string;
  type: SpecificationType;
  score: number;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: {
    completeness: number;
    clarity: number;
    consistency: number;
    traceability: number;
  };
  fixSuggestions: FixSuggestion[];
}

export interface FixSuggestion {
  type: 'error' | 'warning';
  category: string;
  message: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'significant';
}

export interface Recommendation {
  category: string;
  description: string;
  impact: string;
  affectedSpecifications: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ConfigSummary {
  preset?: string;
  customConfig: boolean;
  enabledRules: string[];
  strictnessLevels: Record<string, number>;
}

export class ValidationReportGenerator {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  generateReport(
    specifications: Specification[],
    results: ValidationResult[],
    configPath?: string,
    preset?: string
  ): ValidationReport {
    const specReports: SpecificationReport[] = [];
    let totalScore = 0;
    const scoreDistribution: ScoreDistribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0,
    };

    // Generate individual specification reports
    for (let i = 0; i < specifications.length; i++) {
      const spec = specifications[i];
      const result = results[i];
      
      const specReport = this.generateSpecificationReport(spec, result);
      specReports.push(specReport);
      
      totalScore += result.score;
      
      // Update score distribution
      if (result.score >= this.config.thresholds.excellentScoreThreshold) {
        scoreDistribution.excellent++;
      } else if (result.score >= this.config.thresholds.goodScoreThreshold) {
        scoreDistribution.good++;
      } else if (result.score >= this.config.thresholds.acceptableScoreThreshold) {
        scoreDistribution.acceptable++;
      } else {
        scoreDistribution.poor++;
      }
    }

    const summary: ReportSummary = {
      total: specifications.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      averageScore: specifications.length > 0 ? totalScore / specifications.length : 0,
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      scoreDistribution,
    };

    const recommendations = this.generateRecommendations(specReports);
    const configuration = this.generateConfigSummary(configPath, preset);

    return {
      timestamp: new Date(),
      summary,
      specifications: specReports,
      recommendations,
      configuration,
    };
  }

  private generateSpecificationReport(
    specification: Specification,
    result: ValidationResult
  ): SpecificationReport {
    const fixSuggestions = this.generateFixSuggestions(result.errors, result.warnings);

    return {
      id: specification.id,
      title: specification.title,
      type: specification.type,
      score: result.score,
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      metrics: result.metrics,
      fixSuggestions,
    };
  }

  private generateFixSuggestions(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    // Process errors
    for (const error of errors) {
      suggestions.push(this.createFixSuggestion('error', error));
    }

    // Process warnings
    for (const warning of warnings) {
      suggestions.push(this.createFixSuggestion('warning', warning));
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private createFixSuggestion(
    type: 'error' | 'warning',
    issue: ValidationError | ValidationWarning
  ): FixSuggestion {
    const category = this.getIssueCategory(issue);
    const { priority, effort } = this.getIssuePriorityAndEffort(issue);

    return {
      type,
      category,
      message: issue.message,
      suggestion: this.getFixSuggestion(issue),
      priority,
      effort,
    };
  }

  private getIssueCategory(issue: ValidationError | ValidationWarning): string {
    switch (issue.type) {
      case ErrorType.MISSING_FIELD:
        return 'Missing Information';
      case ErrorType.INVALID_FORMAT:
      case ErrorType.PATTERN_MISMATCH:
        return 'Format Issue';
      case ErrorType.DEPENDENCY_ERROR:
        return 'Dependency Issue';
      case WarningType.UNCLEAR_REQUIREMENT:
        return 'Clarity Issue';
      case WarningType.INCOMPLETE_CONTENT:
        return 'Completeness Issue';
      case WarningType.MISSING_ACCEPTANCE_CRITERIA:
        return 'Acceptance Criteria';
      default:
        return 'General';
    }
  }

  private getIssuePriorityAndEffort(
    issue: ValidationError | ValidationWarning
  ): { priority: 'high' | 'medium' | 'low'; effort: 'quick' | 'moderate' | 'significant' } {
    // Errors have higher priority than warnings
    const isHighPriority = 'severity' in issue && issue.severity === 'error';
    
    // Determine priority based on issue type
    if (issue.type === ErrorType.MISSING_FIELD || issue.type === ErrorType.DEPENDENCY_ERROR) {
      return { priority: 'high', effort: 'quick' };
    }
    
    if (issue.type === ErrorType.PATTERN_MISMATCH || issue.type === WarningType.UNCLEAR_REQUIREMENT) {
      return { priority: isHighPriority ? 'high' : 'medium', effort: 'moderate' };
    }
    
    if (issue.type === WarningType.MISSING_ACCEPTANCE_CRITERIA) {
      return { priority: 'medium', effort: 'significant' };
    }
    
    return { priority: 'low', effort: 'quick' };
  }

  private getFixSuggestion(issue: ValidationError | ValidationWarning): string {
    // Return custom suggestion if available
    if ('suggestion' in issue && issue.suggestion) {
      return issue.suggestion;
    }

    // Provide default suggestions based on issue type
    switch (issue.type) {
      case ErrorType.MISSING_FIELD:
        return `Add the required field mentioned in the error message.`;
      
      case ErrorType.INVALID_FORMAT:
      case ErrorType.PATTERN_MISMATCH:
        return `Update the content to match the required format specified in the error message.`;
      
      case ErrorType.DEPENDENCY_ERROR:
        return `Check and fix the dependency references. Ensure all linked specifications exist.`;
      
      case WarningType.UNCLEAR_REQUIREMENT:
        return `Rewrite the requirement to be more specific and unambiguous. Use clear language and avoid ambiguity.`;
      
      case WarningType.INCOMPLETE_CONTENT:
        return `Add more detail to make the specification complete and testable.`;
      
      case WarningType.MISSING_ACCEPTANCE_CRITERIA:
        return `Add acceptance criteria using the Given-When-Then format to make the user story testable.`;
      
      default:
        return `Review and address the issue mentioned in the message.`;
    }
  }

  private generateRecommendations(specReports: SpecificationReport[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const issueCounts = this.aggregateIssues(specReports);

    // Analyze common issues and generate recommendations
    if (issueCounts.missingFields > 0) {
      recommendations.push({
        category: 'Completeness',
        description: `Multiple specifications are missing required fields. Consider creating templates to ensure consistency.`,
        impact: 'Improves specification completeness and reduces validation errors',
        affectedSpecifications: specReports
          .filter(s => s.errors.some(e => e.type === ErrorType.MISSING_FIELD))
          .map(s => s.id),
        priority: 'high',
      });
    }

    if (issueCounts.formatIssues > 0) {
      recommendations.push({
        category: 'Format',
        description: `Several specifications have format issues. Review formatting guidelines and consider using linter rules.`,
        impact: 'Improves consistency and readability across specifications',
        affectedSpecifications: specReports
          .filter(s => s.errors.some(e => e.type === ErrorType.PATTERN_MISMATCH))
          .map(s => s.id),
        priority: 'medium',
      });
    }

    if (issueCounts.clarityIssues > 0) {
      recommendations.push({
        category: 'Clarity',
        description: `Some specifications lack clarity. Consider conducting peer reviews and using clear language guidelines.`,
        impact: 'Reduces ambiguity and improves implementation accuracy',
        affectedSpecifications: specReports
          .filter(s => s.warnings.some(w => w.type === WarningType.UNCLEAR_REQUIREMENT))
          .map(s => s.id),
        priority: 'medium',
      });
    }

    if (issueCounts.traceabilityIssues > 0) {
      recommendations.push({
        category: 'Traceability',
        description: `Traceability links are missing or incomplete. Establish clear traceability requirements.`,
        impact: 'Improves requirement tracking and impact analysis',
        affectedSpecifications: specReports
          .filter(s => s.metrics.traceability < 70)
          .map(s => s.id),
        priority: 'low',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private aggregateIssues(specReports: SpecificationReport[]) {
    return {
      missingFields: specReports.reduce((sum, s) => 
        sum + s.errors.filter(e => e.type === ErrorType.MISSING_FIELD).length, 0),
      formatIssues: specReports.reduce((sum, s) => 
        sum + s.errors.filter(e => e.type === ErrorType.PATTERN_MISMATCH).length, 0),
      clarityIssues: specReports.reduce((sum, s) => 
        sum + s.warnings.filter(w => w.type === WarningType.UNCLEAR_REQUIREMENT).length, 0),
      traceabilityIssues: specReports.reduce((sum, s) => 
        sum + (s.metrics.traceability < 70 ? 1 : 0), 0),
    };
  }

  private generateConfigSummary(configPath?: string, preset?: string): ConfigSummary {
    const enabledRules = Object.entries(this.config.enabled)
      .filter(([_, enabled]) => enabled)
      .map(([rule]) => rule);

    return {
      preset,
      customConfig: !!configPath,
      enabledRules,
      strictnessLevels: this.config.strictness,
    };
  }

  generateMarkdownReport(report: ValidationReport): string {
    const md = [];
    
    // Header
    md.push('# SpeckIt Validation Report');
    md.push(`Generated on: ${report.timestamp.toISOString()}`);
    md.push('');

    // Summary
    md.push('## Summary');
    md.push(`- **Total Specifications**: ${report.summary.total}`);
    md.push(`- **Valid**: ${report.summary.valid}`);
    md.push(`- **Invalid**: ${report.summary.invalid}`);
    md.push(`- **Average Score**: ${report.summary.averageScore.toFixed(1)}%`);
    md.push(`- **Errors**: ${report.summary.errors}`);
    md.push(`- **Warnings**: ${report.summary.warnings}`);
    md.push('');

    // Score Distribution
    md.push('## Score Distribution');
    md.push(`- **Excellent (90-100%)**: ${report.summary.scoreDistribution.excellent}`);
    md.push(`- **Good (70-89%)**: ${report.summary.scoreDistribution.good}`);
    md.push(`- **Acceptable (50-69%)**: ${report.summary.scoreDistribution.acceptable}`);
    md.push(`- **Poor (<50%)**: ${report.summary.scoreDistribution.poor}`);
    md.push('');

    // Configuration
    md.push('## Configuration');
    if (report.configuration.preset) {
      md.push(`- **Preset**: ${report.configuration.preset}`);
    }
    md.push(`- **Custom Config**: ${report.configuration.customConfig ? 'Yes' : 'No'}`);
    md.push(`- **Enabled Rules**: ${report.configuration.enabledRules.join(', ')}`);
    md.push('');

    // Specifications with issues
    const problemSpecs = report.specifications.filter(s => !s.valid || s.warnings.length > 0);
    if (problemSpecs.length > 0) {
      md.push('## Specifications Requiring Attention');
      md.push('');
      
      for (const spec of problemSpecs) {
        md.push(`### ${spec.title} (${spec.id})`);
        md.push(`**Score**: ${spec.score}% | **Type**: ${spec.type} | **Valid**: ${spec.valid ? '✅' : '❌'}`);
        md.push('');
        
        if (spec.errors.length > 0) {
          md.push('#### Errors:');
          for (const error of spec.errors) {
            md.push(`- **${error.message}**`);
          }
          md.push('');
        }
        
        if (spec.warnings.length > 0) {
          md.push('#### Warnings:');
          for (const warning of spec.warnings) {
            md.push(`- ${warning.message}`);
          }
          md.push('');
        }
        
        if (spec.fixSuggestions.length > 0) {
          md.push('#### Suggested Fixes:');
          for (const fix of spec.fixSuggestions.slice(0, 5)) { // Show top 5
            md.push(`- [${fix.priority.toUpperCase()}] ${fix.suggestion}`);
          }
          md.push('');
        }
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      md.push('## Recommendations');
      md.push('');
      
      for (const rec of report.recommendations) {
        md.push(`### ${rec.category} [${rec.priority.toUpperCase()}]`);
        md.push(rec.description);
        md.push(`**Impact**: ${rec.impact}`);
        md.push(`**Affected Specifications**: ${rec.affectedSpecifications.length}`);
        md.push('');
      }
    }

    return md.join('\n');
  }

  generateJsonReport(report: ValidationReport): string {
    return JSON.stringify(report, null, 2);
  }
}