import { SpecificationParser } from '../parser/SpecificationParser';
import { ValidationEngine } from '../validation/ValidationEngine';
import {
  Specification,
  SpeckitConfig,
  AnalysisReport,
  ValidationResult,
  ParserResult,
  AnalyzedSpecification,
  ReportSummary,
  ReportMetrics,
  Recommendation,
  RecommendationType,
  Priority,
  OutputFormat,
  SpecificationRelationship,
  RelationshipType,
  ImpactAnalysis,
  ImpactLevel,
  RiskLevel,
} from '../types';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class SpeckitEngine {
  private parser: SpecificationParser;
  private validationEngine: ValidationEngine;
  private config: SpeckitConfig;

  constructor(config: SpeckitConfig) {
    this.config = config;
    this.parser = new SpecificationParser();
    this.validationEngine = new ValidationEngine();
  }

  async analyzeSpecifications(inputPath: string): Promise<AnalysisReport> {
    if (this.config.verbose) {
      console.log(`🔍 Analyzing specifications in: ${inputPath}`);
    }

    // Parse specifications
    const parserResult = await this.parser.parseDirectory(inputPath);

    if (this.config.verbose) {
      console.log(`📄 Found ${parserResult.specifications.length} specifications`);
      console.log(`⚠️  ${parserResult.warnings.length} parse warnings`);
      console.log(`❌ ${parserResult.errors.length} parse errors`);
    }

    // Validate specifications
    const analyzedSpecifications: AnalyzedSpecification[] = [];

    for (const specification of parserResult.specifications) {
      if (this.config.verbose) {
        console.log(`🔎 Validating: ${specification.id}`);
      }

      const validationResult = this.validationEngine.validateSpecification(specification);
      const relationships = this.analyzeRelationships(specification, parserResult.specifications);
      const impact = this.analyzeImpact(specification, parserResult.specifications);

      analyzedSpecifications.push({
        specification,
        validationResult,
        relationships,
        impact,
      });
    }

    // Generate summary
    const summary = this.generateSummary(analyzedSpecifications);

    // Generate metrics
    const metrics = this.generateMetrics(analyzedSpecifications);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analyzedSpecifications);

    const report: AnalysisReport = {
      id: generateUUID(),
      timestamp: new Date(),
      specifications: analyzedSpecifications,
      summary,
      recommendations,
      metrics,
    };

    // Generate output reports
    await this.generateReports(report);

    return report;
  }

  validateSingleSpecification(specification: Specification): ValidationResult {
    return this.validationEngine.validateSpecification(specification);
  }

  async validateFile(filePath: string): Promise<ValidationResult[]> {
    const parserResult = await this.parser.parseFile(filePath);
    const results: ValidationResult[] = [];

    for (const specification of parserResult.specifications) {
      const validationResult = this.validationEngine.validateSpecification(specification);
      results.push(validationResult);
    }

    return results;
  }

  private analyzeRelationships(
    specification: Specification,
    allSpecifications: Specification[]
  ): SpecificationRelationship[] {
    const relationships: SpecificationRelationship[] = [];

    if (specification.dependencies) {
      for (const depId of specification.dependencies) {
        const targetSpec = allSpecifications.find((s) => s.id === depId);
        if (targetSpec) {
          relationships.push({
            type: RelationshipType.DEPENDS_ON,
            targetId: depId,
            description: `${specification.id} depends on ${depId}`,
            strength: 0.8,
          });
        }
      }
    }

    // Look for references in content
    for (const otherSpec of allSpecifications) {
      if (
        otherSpec.id !== specification.id &&
        specification.content.toLowerCase().includes(otherSpec.id.toLowerCase())
      ) {
        relationships.push({
          type: RelationshipType.REFERENCES,
          targetId: otherSpec.id,
          description: `${specification.id} references ${otherSpec.id}`,
          strength: 0.6,
        });
      }
    }

    return relationships;
  }

  private analyzeImpact(
    specification: Specification,
    allSpecifications: Specification[]
  ): ImpactAnalysis {
    const dependentSpecs = allSpecifications.filter(
      (s) => s.dependencies && s.dependencies.includes(specification.id)
    );

    const impactLevel =
      dependentSpecs.length === 0
        ? ImpactLevel.NONE
        : dependentSpecs.length <= 2
          ? ImpactLevel.LOW
          : dependentSpecs.length <= 5
            ? ImpactLevel.MEDIUM
            : dependentSpecs.length <= 10
              ? ImpactLevel.HIGH
              : ImpactLevel.CRITICAL;

    return {
      changeImpact: impactLevel,
      affectedSpecifications: dependentSpecs.map((s) => s.id),
      riskLevel:
        impactLevel === ImpactLevel.CRITICAL
          ? RiskLevel.CRITICAL
          : impactLevel === ImpactLevel.HIGH
            ? RiskLevel.HIGH
            : impactLevel === ImpactLevel.MEDIUM
              ? RiskLevel.MEDIUM
              : RiskLevel.LOW,
      effortEstimate: dependentSpecs.length * 2, // 2 hours per dependent spec
    };
  }

  private generateRecommendations(
    analyzedSpecifications: AnalyzedSpecification[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find specifications with low scores
    const lowScoreSpecs = analyzedSpecifications.filter((spec) => spec.validationResult.score < 70);
    if (lowScoreSpecs.length > 0) {
      recommendations.push({
        type: RecommendationType.IMPROVE_CLARITY,
        priority: Priority.HIGH,
        description: `Improve clarity and completeness of ${lowScoreSpecs.length} specifications with low scores`,
        targetSpecifications: lowScoreSpecs.map((spec) => spec.specification.id),
        effort: lowScoreSpecs.length * 2,
        impact: 'Improved specification quality and reduced ambiguity',
      });
    }

    // Find specifications with missing dependencies
    const specsMissingDeps = analyzedSpecifications.filter(
      (spec) => !spec.specification.dependencies || spec.specification.dependencies.length === 0
    );
    if (specsMissingDeps.length > 0) {
      recommendations.push({
        type: RecommendationType.ADD_DEPENDENCIES,
        priority: Priority.MEDIUM,
        description: `Review and add dependencies for ${specsMissingDeps.length} specifications`,
        targetSpecifications: specsMissingDeps.map((spec) => spec.specification.id),
        effort: specsMissingDeps.length * 0.5,
        impact: 'Better traceability and impact analysis',
      });
    }

    return recommendations;
  }

  async generateReports(report: AnalysisReport): Promise<void> {
    // Basic console output for now
    console.log('\n📊 Speckit Analysis Report');
    console.log('==========================');
    console.log(`Total Specifications: ${report.summary.totalSpecifications}`);
    console.log(`Valid: ${report.summary.validSpecifications}`);
    console.log(`Invalid: ${report.summary.invalidSpecifications}`);
    console.log(`Average Score: ${report.summary.averageScore.toFixed(2)}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Warnings: ${report.summary.warnings}`);

    if (this.config.outputPath) {
      // Simple JSON output for now
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      fs.writeFileSync(this.config.outputPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${this.config.outputPath}`);
    }
  }

  private generateSummary(analyzedSpecifications: AnalyzedSpecification[]): ReportSummary {
    const totalSpecifications = analyzedSpecifications.length;
    const validSpecifications = analyzedSpecifications.filter(
      (spec) => spec.validationResult.valid
    ).length;
    const invalidSpecifications = totalSpecifications - validSpecifications;

    const scores = analyzedSpecifications.map((spec) => spec.validationResult.score);
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    const criticalIssues = analyzedSpecifications.reduce(
      (count, spec) =>
        count + spec.validationResult.errors.filter((error) => error.severity === 'error').length,
      0
    );

    const warnings = analyzedSpecifications.reduce(
      (count, spec) => count + spec.validationResult.warnings.length,
      0
    );

    return {
      totalSpecifications,
      validSpecifications,
      invalidSpecifications,
      averageScore,
      criticalIssues,
      warnings,
    };
  }

  private generateMetrics(analyzedSpecifications: AnalyzedSpecification[]): ReportMetrics {
    const metrics = analyzedSpecifications.map((spec) => spec.validationResult.metrics);

    if (metrics.length === 0) {
      return {
        qualityScore: 0,
        completenessScore: 0,
        consistencyScore: 0,
        maintainabilityIndex: 0,
        technicalDebt: 100,
      };
    }

    const qualityScore = metrics.reduce((sum, m) => sum + m.overall, 0) / metrics.length;
    const completenessScore = metrics.reduce((sum, m) => sum + m.completeness, 0) / metrics.length;
    const consistencyScore = metrics.reduce((sum, m) => sum + m.consistency, 0) / metrics.length;

    // Calculate maintainability index based on various factors
    const maintainabilityIndex = this.calculateMaintainabilityIndex(analyzedSpecifications);

    // Calculate technical debt (inverse of quality)
    const technicalDebt = Math.max(0, 100 - qualityScore);

    return {
      qualityScore,
      completenessScore,
      consistencyScore,
      maintainabilityIndex,
      technicalDebt,
    };
  }

  private calculateMaintainabilityIndex(analyzedSpecifications: AnalyzedSpecification[]): number {
    let totalScore = 0;
    let factors = 0;

    // Factor 1: Average validation score
    const avgScore =
      analyzedSpecifications.reduce((sum, spec) => sum + spec.validationResult.score, 0) /
      analyzedSpecifications.length;
    totalScore += avgScore;
    factors++;

    // Factor 2: Consistency of metadata
    const metadataConsistency = this.calculateMetadataConsistency(analyzedSpecifications);
    totalScore += metadataConsistency;
    factors++;

    // Factor 3: Relationship coverage
    const relationshipCoverage = this.calculateRelationshipCoverage(analyzedSpecifications);
    totalScore += relationshipCoverage;
    factors++;

    // Factor 4: Documentation quality
    const documentationQuality = this.calculateDocumentationQuality(analyzedSpecifications);
    totalScore += documentationQuality;
    factors++;

    return totalScore / factors;
  }

  private calculateMetadataConsistency(analyzedSpecifications: AnalyzedSpecification[]): number {
    const specs = analyzedSpecifications.map((as) => as.specification);

    // Check version format consistency
    const versionConsistency =
      (specs.filter((spec) => /^\d+\.\d+\.\d+$/.test(spec.metadata.version)).length /
        specs.length) *
      100;

    // Check ID format consistency
    const idConsistency =
      (specs.filter((spec) => /^[a-zA-Z0-9_-]+$/.test(spec.id)).length / specs.length) * 100;

    // Check author coverage
    const authorCoverage =
      (specs.filter((spec) => spec.metadata.author).length / specs.length) * 100;

    return (versionConsistency + idConsistency + authorCoverage) / 3;
  }

  private calculateRelationshipCoverage(analyzedSpecifications: AnalyzedSpecification[]): number {
    const totalSpecs = analyzedSpecifications.length;
    if (totalSpecs === 0) return 100;

    const specsWithRelationships = analyzedSpecifications.filter(
      (spec) => spec.relationships.length > 0
    ).length;

    return (specsWithRelationships / totalSpecs) * 100;
  }

  private calculateDocumentationQuality(analyzedSpecifications: AnalyzedSpecification[]): number {
    const specs = analyzedSpecifications.map((as) => as.specification);

    let totalQuality = 0;
    let factors = 0;

    // Content length quality
    const avgContentLength =
      specs.reduce((sum, spec) => sum + spec.content.length, 0) / specs.length;
    const contentQuality = Math.min(100, (avgContentLength / 500) * 100);
    totalQuality += contentQuality;
    factors++;

    // Title quality
    const titleQuality =
      (specs.filter((spec) => spec.title.length >= 10 && spec.title.length <= 100).length /
        specs.length) *
      100;
    totalQuality += titleQuality;
    factors++;

    // Tag coverage
    const tagCoverage =
      (specs.filter((spec) => spec.tags && spec.tags.length > 0).length / specs.length) * 100;
    totalQuality += tagCoverage;
    factors++;

    return totalQuality / factors;
  }
}
