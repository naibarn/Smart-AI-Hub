/**
 * Core types and interfaces for Speckit specification validation system
 */

export interface Specification {
  id: string;
  title: string;
  type: SpecificationType;
  category: SpecificationCategory;
  content: string;
  metadata: SpecificationMetadata;
  validation: ValidationRules;
  dependencies?: string[];
  tags?: string[];
}

export enum SpecificationType {
  FUNCTIONAL_REQUIREMENT = 'functional_requirement',
  USER_STORY = 'user_story',
  DATA_MODEL = 'data_model',
  SERVICE_SPEC = 'service_spec',
  EPIC = 'epic',
  API_SPEC = 'api_spec',
  UI_SPEC = 'ui_spec',
}

export enum SpecificationCategory {
  REQUIREMENTS = 'requirements',
  ARCHITECTURE = 'architecture',
  BACKLOG = 'backlog',
  DOCUMENTATION = 'documentation',
}

export interface SpecificationMetadata {
  author?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  status: SpecificationStatus;
  priority: Priority;
  estimatedEffort?: number;
  actualEffort?: number;
}

export enum SpecificationStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  DEPRECATED = 'deprecated',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ValidationRules {
  required: string[];
  patterns: ValidationPattern[];
  customRules?: CustomValidationRule[];
}

export interface ValidationPattern {
  name: string;
  pattern: RegExp;
  description: string;
  required: boolean;
}

export interface CustomValidationRule {
  name: string;
  validator: (spec: Specification) => ValidationResult;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  metrics: ValidationMetrics;
}

export interface ValidationError {
  type: ErrorType;
  message: string;
  path?: string;
  line?: number;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  type: WarningType;
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
}

export enum ErrorType {
  MISSING_FIELD = 'missing_field',
  INVALID_FORMAT = 'invalid_format',
  PATTERN_MISMATCH = 'pattern_mismatch',
  DEPENDENCY_ERROR = 'dependency_error',
  SCHEMA_VIOLATION = 'schema_violation',
}

export enum WarningType {
  INCOMPLETE_CONTENT = 'incomplete_content',
  UNCLEAR_REQUIREMENT = 'unclear_requirement',
  MISSING_ACCEPTANCE_CRITERIA = 'missing_acceptance_criteria',
  DEPENDENCY_WARNING = 'dependency_warning',
}

export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ValidationMetrics {
  completeness: number;
  clarity: number;
  consistency: number;
  traceability: number;
  overall: number;
}

export interface AnalysisReport {
  id: string;
  timestamp: Date;
  specifications: AnalyzedSpecification[];
  summary: ReportSummary;
  recommendations: Recommendation[];
  metrics: ReportMetrics;
}

export interface AnalyzedSpecification {
  specification: Specification;
  validationResult: ValidationResult;
  relationships: SpecificationRelationship[];
  impact: ImpactAnalysis;
}

export interface SpecificationRelationship {
  type: RelationshipType;
  targetId: string;
  description: string;
  strength: number;
}

export enum RelationshipType {
  DEPENDS_ON = 'depends_on',
  IMPLEMENTS = 'implements',
  REFERENCES = 'references',
  CONFLICTS_WITH = 'conflicts_with',
  DERIVES_FROM = 'derives_from',
}

export interface ImpactAnalysis {
  changeImpact: ImpactLevel;
  affectedSpecifications: string[];
  riskLevel: RiskLevel;
  effortEstimate: number;
}

export enum ImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ReportSummary {
  totalSpecifications: number;
  validSpecifications: number;
  invalidSpecifications: number;
  averageScore: number;
  criticalIssues: number;
  warnings: number;
}

export interface Recommendation {
  type: RecommendationType;
  priority: Priority;
  description: string;
  targetSpecifications: string[];
  effort: number;
  impact: string;
}

export enum RecommendationType {
  ADD_MISSING_FIELDS = 'add_missing_fields',
  IMPROVE_CLARITY = 'improve_clarity',
  RESOLVE_CONFLICTS = 'resolve_conflicts',
  ADD_DEPENDENCIES = 'add_dependencies',
  UPDATE_METADATA = 'update_metadata',
}

export interface ReportMetrics {
  qualityScore: number;
  completenessScore: number;
  consistencyScore: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface SpeckitConfig {
  rulesPath?: string;
  outputPath?: string;
  format: OutputFormat;
  verbose: boolean;
  strict: boolean;
  includeWarnings: boolean;
  customRules?: CustomValidationRule[];
  reporters: ReporterConfig[];
}

export enum OutputFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
}

export interface ReporterConfig {
  type: ReporterType;
  enabled: boolean;
  options: Record<string, any>;
}

export enum ReporterType {
  CONSOLE = 'console',
  FILE = 'file',
  HTML = 'html',
  JSON = 'json',
}

export interface ParserResult {
  specifications: Specification[];
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  file: string;
}

export interface ParseWarning {
  message: string;
  line: number;
  column: number;
  file: string;
  suggestion?: string;
}
