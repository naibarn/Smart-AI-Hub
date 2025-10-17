#!/usr/bin/env ts-node

/**
 * Spec Validation Script
 * 
 * This script validates the implementation progress against the spec
 * by checking if required components exist in the codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SpecConfig {
  name: string;
  path: string;
  backlog: string;
  enabled: boolean;
  priority: string;
  status: string;
}

interface ValidationConfig {
  database?: {
    enabled: boolean;
    source: string;
    models: string[];
    enums: string[];
  };
  api?: {
    enabled: boolean;
    source: string;
    endpoints: string[];
  };
  services?: {
    enabled: boolean;
    source: string;
    services: string[];
  };
  frontend?: {
    enabled: boolean;
    pages?: {
      source: string;
      pages: string[];
    };
    components?: {
      source: string;
      components: string[];
    };
  };
}

interface Config {
  specs: SpecConfig[];
  validation: ValidationConfig;
  reporters: any[];
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function loadConfig(): Promise<Config> {
  const configPath = path.join(process.cwd(), 'speckit.config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(colorize('❌ Error: speckit.config.json not found', 'red'));
    console.error(colorize(`   Expected at: ${configPath}`, 'red'));
    process.exit(1);
  }
  
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

async function checkFileExists(filePath: string): Promise<boolean> {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

async function searchInFiles(pattern: string, searchPaths: string[]): Promise<string[]> {
  const found: string[] = [];
  
  for (const searchPath of searchPaths) {
    const fullPath = path.join(process.cwd(), searchPath);
    
    try {
      const files = await glob(fullPath, { ignore: ['**/node_modules/**', '**/dist/**'] });
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes(pattern)) {
          found.push(file);
        }
      }
    } catch (error) {
      // Ignore errors (path might not exist yet)
    }
  }
  
  return found;
}

async function validateDatabase(config: ValidationConfig['database']): Promise<{ found: number; total: number; details: any[] }> {
  if (!config || !config.enabled) {
    return { found: 0, total: 0, details: [] };
  }
  
  const details: any[] = [];
  let found = 0;
  const total = (config.models?.length || 0) + (config.enums?.length || 0);
  
  const schemaPath = path.join(process.cwd(), config.source);
  
  if (!fs.existsSync(schemaPath)) {
    details.push({
      type: 'error',
      message: `Schema file not found: ${config.source}`,
    });
    return { found, total, details };
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // Check models
  if (config.models) {
    for (const model of config.models) {
      const regex = new RegExp(`model\\s+${model}\\s*{`, 'g');
      if (regex.test(schemaContent)) {
        found++;
        details.push({
          type: 'success',
          category: 'model',
          name: model,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'model',
          name: model,
        });
      }
    }
  }
  
  // Check enums
  if (config.enums) {
    for (const enumName of config.enums) {
      const regex = new RegExp(`enum\\s+${enumName}\\s*{`, 'g');
      if (regex.test(schemaContent)) {
        found++;
        details.push({
          type: 'success',
          category: 'enum',
          name: enumName,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'enum',
          name: enumName,
        });
      }
    }
  }
  
  return { found, total, details };
}

async function validateAPI(config: ValidationConfig['api']): Promise<{ found: number; total: number; details: any[] }> {
  if (!config || !config.enabled) {
    return { found: 0, total: 0, details: [] };
  }
  
  const details: any[] = [];
  let found = 0;
  const total = config.endpoints?.length || 0;
  
  if (config.endpoints) {
    for (const endpoint of config.endpoints) {
      const [method, path] = endpoint.split(' ');
      const searchPattern = `${method.toLowerCase()}('${path}'`;
      
      const foundFiles = await searchInFiles(searchPattern, [config.source]);
      
      if (foundFiles.length > 0) {
        found++;
        details.push({
          type: 'success',
          category: 'endpoint',
          name: endpoint,
          files: foundFiles,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'endpoint',
          name: endpoint,
        });
      }
    }
  }
  
  return { found, total, details };
}

async function validateServices(config: ValidationConfig['services']): Promise<{ found: number; total: number; details: any[] }> {
  if (!config || !config.enabled) {
    return { found: 0, total: 0, details: [] };
  }
  
  const details: any[] = [];
  let found = 0;
  const total = config.services?.length || 0;
  
  if (config.services) {
    for (const service of config.services) {
      const searchPattern = `${service}`;
      const foundFiles = await searchInFiles(searchPattern, [config.source]);
      
      if (foundFiles.length > 0) {
        found++;
        details.push({
          type: 'success',
          category: 'service',
          name: service,
          files: foundFiles,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'service',
          name: service,
        });
      }
    }
  }
  
  return { found, total, details };
}

async function validateFrontend(config: ValidationConfig['frontend']): Promise<{ found: number; total: number; details: any[] }> {
  if (!config || !config.enabled) {
    return { found: 0, total: 0, details: [] };
  }
  
  const details: any[] = [];
  let found = 0;
  let total = 0;
  
  // Check pages
  if (config.pages) {
    total += config.pages.pages?.length || 0;
    
    for (const page of config.pages.pages || []) {
      const searchPattern = `${page}`;
      const foundFiles = await searchInFiles(searchPattern, [config.pages.source]);
      
      if (foundFiles.length > 0) {
        found++;
        details.push({
          type: 'success',
          category: 'page',
          name: page,
          files: foundFiles,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'page',
          name: page,
        });
      }
    }
  }
  
  // Check components
  if (config.components) {
    total += config.components.components?.length || 0;
    
    for (const component of config.components.components || []) {
      const searchPattern = `${component}`;
      const foundFiles = await searchInFiles(searchPattern, [config.components.source]);
      
      if (foundFiles.length > 0) {
        found++;
        details.push({
          type: 'success',
          category: 'component',
          name: component,
          files: foundFiles,
        });
      } else {
        details.push({
          type: 'missing',
          category: 'component',
          name: component,
        });
      }
    }
  }
  
  return { found, total, details };
}

async function main() {
  console.log(colorize('\n🔍 Spec Kit Validator', 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan'));
  
  const config = await loadConfig();
  
  console.log(colorize('\n📋 Validating specs...', 'blue'));
  
  for (const spec of config.specs) {
    if (!spec.enabled) {
      continue;
    }
    
    console.log(colorize(`\nSpec: ${spec.name}`, 'bright'));
    
    // Check if spec file exists
    const specExists = await checkFileExists(spec.path);
    const backlogExists = await checkFileExists(spec.backlog);
    
    console.log(`  Path: ${spec.path} ${specExists ? colorize('✅', 'green') : colorize('❌', 'red')}`);
    console.log(`  Backlog: ${spec.backlog} ${backlogExists ? colorize('✅', 'green') : colorize('❌', 'red')}`);
    console.log(`  Status: ${colorize(spec.status, 'yellow')}`);
    
    if (!specExists) {
      console.log(colorize(`  ⚠️  Spec file not found. Skipping validation.`, 'yellow'));
      continue;
    }
    
    // Validate components
    let totalFound = 0;
    let totalExpected = 0;
    
    // Database
    if (config.validation.database) {
      const dbResult = await validateDatabase(config.validation.database);
      totalFound += dbResult.found;
      totalExpected += dbResult.total;
      
      if (dbResult.total > 0) {
        console.log(colorize(`\n  📊 Database Models (${dbResult.found}/${dbResult.total}):`, 'cyan'));
        const missing = dbResult.details.filter(d => d.type === 'missing');
        if (missing.length > 0) {
          missing.forEach(m => {
            console.log(colorize(`    ❌ ${m.name}`, 'red'));
          });
        } else {
          console.log(colorize(`    ✅ All models implemented`, 'green'));
        }
      }
    }
    
    // API
    if (config.validation.api) {
      const apiResult = await validateAPI(config.validation.api);
      totalFound += apiResult.found;
      totalExpected += apiResult.total;
      
      if (apiResult.total > 0) {
        console.log(colorize(`\n  🌐 API Endpoints (${apiResult.found}/${apiResult.total}):`, 'cyan'));
        const missing = apiResult.details.filter(d => d.type === 'missing');
        if (missing.length > 0) {
          missing.slice(0, 5).forEach(m => {
            console.log(colorize(`    ❌ ${m.name}`, 'red'));
          });
          if (missing.length > 5) {
            console.log(colorize(`    ... and ${missing.length - 5} more`, 'yellow'));
          }
        } else {
          console.log(colorize(`    ✅ All endpoints implemented`, 'green'));
        }
      }
    }
    
    // Services
    if (config.validation.services) {
      const servicesResult = await validateServices(config.validation.services);
      totalFound += servicesResult.found;
      totalExpected += servicesResult.total;
      
      if (servicesResult.total > 0) {
        console.log(colorize(`\n  ⚙️  Services (${servicesResult.found}/${servicesResult.total}):`, 'cyan'));
        const missing = servicesResult.details.filter(d => d.type === 'missing');
        if (missing.length > 0) {
          missing.forEach(m => {
            console.log(colorize(`    ❌ ${m.name}`, 'red'));
          });
        } else {
          console.log(colorize(`    ✅ All services implemented`, 'green'));
        }
      }
    }
    
    // Frontend
    if (config.validation.frontend) {
      const frontendResult = await validateFrontend(config.validation.frontend);
      totalFound += frontendResult.found;
      totalExpected += frontendResult.total;
      
      if (frontendResult.total > 0) {
        console.log(colorize(`\n  📄 Frontend (${frontendResult.found}/${frontendResult.total}):`, 'cyan'));
        const missing = frontendResult.details.filter(d => d.type === 'missing');
        if (missing.length > 0) {
          missing.slice(0, 5).forEach(m => {
            console.log(colorize(`    ❌ ${m.category}: ${m.name}`, 'red'));
          });
          if (missing.length > 5) {
            console.log(colorize(`    ... and ${missing.length - 5} more`, 'yellow'));
          }
        } else {
          console.log(colorize(`    ✅ All components implemented`, 'green'));
        }
      }
    }
    
    // Calculate progress
    const progress = totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 0;
    console.log(colorize(`\n  Progress: ${totalFound}/${totalExpected} (${progress}%)`, progress === 100 ? 'green' : 'yellow'));
    
    // Next steps
    if (progress < 100) {
      console.log(colorize(`\n  Next Steps:`, 'cyan'));
      console.log(`  1. Read spec: ${spec.path}`);
      console.log(`  2. Read backlog: ${spec.backlog}`);
      console.log(`  3. Start implementing missing components`);
    }
  }
  
  console.log(colorize('\n═'.repeat(60), 'cyan'));
  console.log(colorize('✅ Spec validation completed!', 'green'));
  console.log();
}

main().catch((error) => {
  console.error(colorize(`\n❌ Error: ${error.message}`, 'red'));
  process.exit(1);
});

