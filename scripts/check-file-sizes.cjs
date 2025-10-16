#!/usr/bin/env node

/**
 * Script to check file sizes
 * This script checks if any files exceed the maximum allowed size
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Files to exclude from checking
const EXCLUDE_PATTERNS = [
  /\.git/,
  /node_modules/,
  /coverage/,
  /dist/,
  /build/,
  /\.log$/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function main() {
  try {
    // Get staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .filter(file => !shouldExcludeFile(file));

    let foundLargeFiles = false;

    for (const file of stagedFiles) {
      if (fs.existsSync(file)) {
        const fileSize = getFileSize(file);
        if (fileSize > MAX_FILE_SIZE) {
          console.error(`🚨 Large file detected: ${file} (${formatFileSize(fileSize)})`);
          foundLargeFiles = true;
        }
      }
    }

    if (foundLargeFiles) {
      console.error(`\n❌ Files larger than ${formatFileSize(MAX_FILE_SIZE)} are not allowed.`);
      console.error('Please reduce file sizes before committing.');
      process.exit(1);
    }

    console.log('✅ All files are within size limits');
    process.exit(0);
  } catch (error) {
    console.error('Error checking file sizes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getFileSize, formatFileSize };