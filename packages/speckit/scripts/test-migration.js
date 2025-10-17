#!/usr/bin/env node

/**
 * Test script for migration functionality
 */

const { migrateSpec } = require('./migrate-spec.js');

// Test with a simple example
const testContent = `
---
title: "FR-1: Multi-method Authentication"
author: "Development Team"
version: "1.0.0"
---

# FR-1: Multi-method Authentication

## Requirements
- Google OAuth 2.0 integration
- Email/password with BCRYPT (cost factor: 12)
- Email verification (6-digit OTP, 15-min expiry)

## Acceptance Criteria
- Registration completion rate > 70%
- Login success rate > 99%
`;

// Write test file
const fs = require('fs');
const path = require('path');

const testFile = 'test-fr-1.md';
fs.writeFileSync(testFile, testContent);

console.log('Testing migration with sample content...');

// Test migration
try {
  const result = migrateSpec(testFile, 'feature');
  console.log('Migration test result:', result);
  
  // Read the migrated file
  const migratedContent = fs.readFileSync(testFile, 'utf8');
  console.log('\nMigrated content preview:');
  console.log(migratedContent.substring(0, 500) + '...');
  
  // Clean up
  fs.unlinkSync(testFile);
  
} catch (error) {
  console.error('Migration test failed:', error);
}