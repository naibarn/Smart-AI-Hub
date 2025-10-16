#!/usr/bin/env node

/**
 * Script to check commit message format
 * This script validates that commit messages follow the conventional commit format
 */

const fs = require('fs');

// Conventional commit pattern
const COMMIT_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}/;

function main() {
  const commitMsgFile = process.argv[2];
  
  if (!commitMsgFile) {
    console.error('Usage: node check-commit-message.js <commit-message-file>');
    process.exit(1);
  }

  try {
    const commitMessage = fs.readFileSync(commitMsgFile, 'utf8').trim();
    
    // Skip if it's a merge commit or rebase
    if (commitMessage.startsWith('Merge ') || commitMessage.startsWith('#')) {
      process.exit(0);
    }

    // Check if the commit message matches the pattern
    if (!COMMIT_PATTERN.test(commitMessage)) {
      console.error('❌ Invalid commit message format.');
      console.error('\nExpected format: type(scope): description');
      console.error('Examples:');
      console.error('  feat(auth): add OAuth support');
      console.error('  fix(api): resolve user profile issue');
      console.error('  docs(readme): update installation instructions');
      console.error('\nAllowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert');
      process.exit(1);
    }

    // Check if the description is too short
    const match = commitMessage.match(/^.+?: (.+)$/);
    if (match && match[1].length < 3) {
      console.error('❌ Commit message description is too short (minimum 3 characters).');
      process.exit(1);
    }

    console.log('✅ Commit message format is valid');
    process.exit(0);
  } catch (error) {
    console.error('Error checking commit message:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { COMMIT_PATTERN };