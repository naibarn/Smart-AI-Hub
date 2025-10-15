import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import {
  Specification,
  SpecificationType,
  SpecificationCategory,
  SpecificationStatus,
  Priority,
  ParserResult,
  ParseError,
  ParseWarning,
  SpecificationMetadata,
} from '../types';

export class SpecificationParser {
  private readonly supportedExtensions = ['.md', '.yaml', '.yml', '.json'];
  private readonly frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

  async parseDirectory(dirPath: string): Promise<ParserResult> {
    const files = await this.findSpecificationFiles(dirPath);
    const specifications: Specification[] = [];
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    for (const file of files) {
      try {
        const result = await this.parseFile(file);
        specifications.push(...result.specifications);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        errors.push({
          message: `Failed to parse file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          line: 0,
          column: 0,
          file,
        });
      }
    }

    return {
      specifications,
      errors,
      warnings,
    };
  }

  async parseFile(filePath: string): Promise<ParserResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.md':
        return this.parseMarkdown(content, filePath);
      case '.yaml':
      case '.yml':
        return this.parseYaml(content, filePath);
      case '.json':
        return this.parseJson(content, filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  private async findSpecificationFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.supportedExtensions.includes(path.extname(item).toLowerCase())) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(dirPath);
    return files;
  }

  private parseMarkdown(content: string, filePath: string): ParserResult {
    const specifications: Specification[] = [];
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    try {
      const frontMatterMatch = content.match(this.frontMatterRegex);

      if (!frontMatterMatch) {
        warnings.push({
          message: 'No front matter found, using default values',
          line: 1,
          column: 1,
          file: filePath,
          suggestion: 'Add YAML front matter with metadata',
        });

        // Create basic specification from content
        const spec = this.createBasicSpecification(content, filePath);
        specifications.push(spec);
      } else {
        const [, frontMatterStr, bodyContent] = frontMatterMatch;

        try {
          const frontMatter = parseYaml(frontMatterStr);
          const spec = this.createSpecificationFromFrontMatter(frontMatter, bodyContent, filePath);
          specifications.push(spec);
        } catch (error) {
          errors.push({
            message: `Invalid front matter YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: 1,
            column: 1,
            file: filePath,
          });
        }
      }
    } catch (error) {
      errors.push({
        message: `Failed to parse markdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 0,
        column: 0,
        file: filePath,
      });
    }

    return { specifications, errors, warnings };
  }

  private parseYaml(content: string, filePath: string): ParserResult {
    const specifications: Specification[] = [];
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    try {
      const data = parseYaml(content);

      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          try {
            const spec = this.createSpecificationFromYaml(data[i], filePath);
            specifications.push(spec);
          } catch (error) {
            errors.push({
              message: `Failed to parse specification at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              line: 0,
              column: 0,
              file: filePath,
            });
          }
        }
      } else {
        const spec = this.createSpecificationFromYaml(data, filePath);
        specifications.push(spec);
      }
    } catch (error) {
      errors.push({
        message: `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 0,
        column: 0,
        file: filePath,
      });
    }

    return { specifications, errors, warnings };
  }

  private parseJson(content: string, filePath: string): ParserResult {
    const specifications: Specification[] = [];
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    try {
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          try {
            const spec = this.createSpecificationFromJson(data[i], filePath);
            specifications.push(spec);
          } catch (error) {
            errors.push({
              message: `Failed to parse specification at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              line: 0,
              column: 0,
              file: filePath,
            });
          }
        }
      } else {
        const spec = this.createSpecificationFromJson(data, filePath);
        specifications.push(spec);
      }
    } catch (error) {
      errors.push({
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 0,
        column: 0,
        file: filePath,
      });
    }

    return { specifications, errors, warnings };
  }

  private createBasicSpecification(content: string, filePath: string): Specification {
    const fileName = path.basename(filePath, path.extname(filePath));
    const now = new Date();

    return {
      id: fileName,
      title: this.extractTitleFromContent(content) || fileName,
      type: this.inferSpecificationType(filePath, content),
      category: this.inferSpecificationCategory(filePath),
      content: content.trim(),
      metadata: {
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        status: SpecificationStatus.DRAFT,
        priority: Priority.MEDIUM,
      },
      validation: {
        required: ['title', 'content'],
        patterns: [],
      },
    };
  }

  private createSpecificationFromFrontMatter(
    frontMatter: any,
    content: string,
    filePath: string
  ): Specification {
    const fileName = path.basename(filePath, path.extname(filePath));
    const now = new Date();

    return {
      id: frontMatter.id || fileName,
      title: frontMatter.title || this.extractTitleFromContent(content) || fileName,
      type:
        this.parseSpecificationType(frontMatter.type) ||
        this.inferSpecificationType(filePath, content),
      category:
        this.parseSpecificationCategory(frontMatter.category) ||
        this.inferSpecificationCategory(filePath),
      content: content.trim(),
      metadata: {
        author: frontMatter.author,
        version: frontMatter.version || '1.0.0',
        createdAt: frontMatter.createdAt ? new Date(frontMatter.createdAt) : now,
        updatedAt: frontMatter.updatedAt ? new Date(frontMatter.updatedAt) : now,
        status: this.parseSpecificationStatus(frontMatter.status) || SpecificationStatus.DRAFT,
        priority: this.parsePriority(frontMatter.priority) || Priority.MEDIUM,
        estimatedEffort: frontMatter.estimatedEffort,
        actualEffort: frontMatter.actualEffort,
      },
      validation: {
        required: frontMatter.required || ['title', 'content'],
        patterns: frontMatter.patterns || [],
        customRules: frontMatter.customRules,
      },
      dependencies: frontMatter.dependencies,
      tags: frontMatter.tags,
    };
  }

  private createSpecificationFromYaml(data: any, filePath: string): Specification {
    const fileName = path.basename(filePath, path.extname(filePath));
    const now = new Date();

    return {
      id: data.id || fileName,
      title: data.title || fileName,
      type: this.parseSpecificationType(data.type) || SpecificationType.FUNCTIONAL_REQUIREMENT,
      category:
        this.parseSpecificationCategory(data.category) || SpecificationCategory.REQUIREMENTS,
      content: data.content || '',
      metadata: {
        author: data.author,
        version: data.version || '1.0.0',
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
        status: this.parseSpecificationStatus(data.status) || SpecificationStatus.DRAFT,
        priority: this.parsePriority(data.priority) || Priority.MEDIUM,
        estimatedEffort: data.estimatedEffort,
        actualEffort: data.actualEffort,
      },
      validation: {
        required: data.required || ['title', 'content'],
        patterns: data.patterns || [],
        customRules: data.customRules,
      },
      dependencies: data.dependencies,
      tags: data.tags,
    };
  }

  private createSpecificationFromJson(data: any, filePath: string): Specification {
    return this.createSpecificationFromYaml(data, filePath);
  }

  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return null;
  }

  private inferSpecificationType(filePath: string, content: string = ''): SpecificationType {
    const pathLower = filePath.toLowerCase();
    const contentLower = content.toLowerCase();

    if (pathLower.includes('/data_models/') || pathLower.includes('\\data_models\\')) {
      return SpecificationType.DATA_MODEL;
    }
    if (pathLower.includes('/services/') || pathLower.includes('\\services\\')) {
      return SpecificationType.SERVICE_SPEC;
    }
    if (pathLower.includes('/epics/') || pathLower.includes('\\epics\\')) {
      return SpecificationType.EPIC;
    }
    if (pathLower.includes('/user_stories/') || pathLower.includes('\\user_stories\\')) {
      return SpecificationType.USER_STORY;
    }
    if (
      contentLower.includes('user story') ||
      contentLower.includes('as a') ||
      contentLower.includes('i want to')
    ) {
      return SpecificationType.USER_STORY;
    }
    if (
      contentLower.includes('api endpoint') ||
      contentLower.includes('rest api') ||
      contentLower.includes('graphql')
    ) {
      return SpecificationType.API_SPEC;
    }

    return SpecificationType.FUNCTIONAL_REQUIREMENT;
  }

  private inferSpecificationCategory(filePath: string): SpecificationCategory {
    const pathLower = filePath.toLowerCase();

    if (pathLower.includes('/requirements/') || pathLower.includes('\\requirements\\')) {
      return SpecificationCategory.REQUIREMENTS;
    }
    if (pathLower.includes('/architecture/') || pathLower.includes('\\architecture\\')) {
      return SpecificationCategory.ARCHITECTURE;
    }
    if (pathLower.includes('/backlog/') || pathLower.includes('\\backlog\\')) {
      return SpecificationCategory.BACKLOG;
    }

    return SpecificationCategory.DOCUMENTATION;
  }

  private parseSpecificationType(type: any): SpecificationType | null {
    if (typeof type !== 'string') return null;
    return Object.values(SpecificationType).find((t) => t === type) || null;
  }

  private parseSpecificationCategory(category: any): SpecificationCategory | null {
    if (typeof category !== 'string') return null;
    return Object.values(SpecificationCategory).find((c) => c === category) || null;
  }

  private parseSpecificationStatus(status: any): SpecificationStatus | null {
    if (typeof status !== 'string') return null;
    return Object.values(SpecificationStatus).find((s) => s === status) || null;
  }

  private parsePriority(priority: any): Priority | null {
    if (typeof priority !== 'string') return null;
    return Object.values(Priority).find((p) => p === priority) || null;
  }
}
