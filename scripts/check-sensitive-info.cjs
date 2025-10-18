#!/usr/bin/env node

/**
 * Script to check for sensitive information in code
 * This script looks for potential sensitive data like passwords, API keys, etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns that might indicate sensitive information
const SENSITIVE_PATTERNS = [
  /password\s*=\s*['"][^'"]{8,}['"]/i,
  /api[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
  /secret[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
  /token\s*=\s*['"][^'"]{16,}['"]/i,
  /private[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
  /aws[_-]?access[_-]?key[_-]?id\s*=\s*['"][^'"]{16,}['"]/i,
  /aws[_-]?secret[_-]?access[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
  // Only match database URLs with hardcoded credentials (not environment variables)
  /mongodb:\/\/[^:$\s\{]+:[^@$\s\{]+@/,
  /mysql:\/\/[^:$\s\{]+:[^@$\s\{]+@/,
  /postgresql:\/\/[^:$\s\{]+:[^@$\s\{]+@/,
  /redis:\/\/[^:$\s\{]+:[^@$\s\{]+@/,
];

// Files to exclude from checking
const EXCLUDE_PATTERNS = [
  /\.env\.example$/,
  /\.gitignore$/,
  /\.md$/,
  /node_modules/,
  /\.vscode/,
  /coverage/,
  /dist/,
  /build/,
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function checkFileForSensitiveInfo(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      SENSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.source
          });
        }
      });
    });

    return issues;
  } catch (error) {
    // Skip files that can't be read
    return [];
  }
}

function main() {
  try {
    // Get staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .filter(file => !shouldExcludeFile(file));

    let foundIssues = false;

    for (const file of stagedFiles) {
      if (fs.existsSync(file)) {
        const issues = checkFileForSensitiveInfo(file);
        if (issues.length > 0) {
          console.error(`🚨 Sensitive information found in ${file}:`);
          issues.forEach(issue => {
            console.error(`  Line ${issue.line}: ${issue.content}`);
          });
          foundIssues = true;
        }
      }
    }

    if (foundIssues) {
      console.error('\n❌ Please remove sensitive information before committing.');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking for sensitive information:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForSensitiveInfo };