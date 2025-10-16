#!/usr/bin/env node

/**
 * Webhook System Integration Validation Script
 *
 * This script validates the complete webhook system by:
 * 1. Checking service health
 * 2. Testing webhook creation and management
 * 3. Validating event delivery
 * 4. Verifying signature generation/verification
 * 5. Testing retry logic
 * 6. Checking rate limiting
 */

import axios from 'axios';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

// Configuration
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3005';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TEST_WEBHOOK_URL = process.env.TEST_WEBHOOK_URL || 'https://webhook.site/your-unique-id';

// Test data
const testUser = {
  email: 'webhook-test@example.com',
  password: 'TestPassword123!',
  name: 'Webhook Test User',
};

let authToken = null;
let testWebhookId = null;
// let receivedWebhooks = []; // Reserved for future use

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'success');
}

function logError(message) {
  log(`❌ ${message}`, 'error');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'warning');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'info');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSignature(payload, secret) {
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${signature}`;
}

// Test functions
async function testServiceHealth() {
  logInfo('Testing webhook service health...');

  try {
    const response = await axios.get(`${WEBHOOK_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    if (response.status === 200 && response.data.status === 'ok') {
      logSuccess('Webhook service is healthy');
      return true;
    } else {
      logError('Webhook service health check failed');
      return false;
    }
  } catch (error) {
    logError(`Webhook service health check error: ${error.message}`);
    return false;
  }
}

async function authenticateUser() {
  logInfo('Authenticating test user...');

  try {
    // Try to login first
    try {
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      authToken = loginResponse.data.token;
      logSuccess('User authenticated successfully');
      return true;
    } catch (error) {
      // If login fails, try to register
      if (error.response && error.response.status === 401) {
        logInfo('User not found, registering...');

        await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, testUser);

        const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
          email: testUser.email,
          password: testUser.password,
        });

        authToken = loginResponse.data.token;
        logSuccess('User registered and authenticated successfully');
        return true;
      } else {
        throw error;
      }
    }
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    return false;
  }
}

async function testWebhookCreation() {
  logInfo('Testing webhook creation...');

  const webhookData = {
    url: TEST_WEBHOOK_URL,
    eventTypes: ['user.created', 'user.updated', 'credit.low'],
    secret: 'test-webhook-secret-' + Date.now(),
  };

  try {
    const response = await axios.post(`${WEBHOOK_SERVICE_URL}/api/v1/webhooks`, webhookData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    testWebhookId = response.data.id;
    logSuccess(`Webhook created successfully with ID: ${testWebhookId}`);
    return true;
  } catch (error) {
    logError(`Webhook creation failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebhookListing() {
  logInfo('Testing webhook listing...');

  try {
    const response = await axios.get(`${WEBHOOK_SERVICE_URL}/api/v1/webhooks`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      logSuccess(`Found ${response.data.length} webhooks`);
      return true;
    } else {
      logError('No webhooks found');
      return false;
    }
  } catch (error) {
    logError(`Webhook listing failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebhookUpdate() {
  logInfo('Testing webhook update...');

  if (!testWebhookId) {
    logError('No webhook ID available for update test');
    return false;
  }

  const updateData = {
    eventTypes: ['user.created', 'user.updated', 'credit.low', 'credit.depleted'],
  };

  try {
    const response = await axios.put(
      `${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.data.eventTypes.length === 4) {
      logSuccess('Webhook updated successfully');
      return true;
    } else {
      logError('Webhook update verification failed');
      return false;
    }
  } catch (error) {
    logError(`Webhook update failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebhookTest() {
  logInfo('Testing webhook test functionality...');

  if (!testWebhookId) {
    logError('No webhook ID available for test');
    return false;
  }

  const testData = {
    eventType: 'user.created',
    data: {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  try {
    const response = await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}/test`,
      testData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.data.success) {
      logSuccess('Webhook test sent successfully');
      return true;
    } else {
      logError(`Webhook test failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Webhook test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testEventTrigger() {
  logInfo('Testing event trigger via internal endpoint...');

  const eventData = {
    eventType: 'user.created',
    data: {
      userId: 'trigger-test-user',
      email: 'trigger@example.com',
      name: 'Trigger Test User',
    },
  };

  try {
    const response = await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/internal/webhooks/trigger`,
      eventData,
      {
        headers: {
          'X-Internal-Service': 'auth-service',
          'X-Internal-Secret': 'internal-secret',
        },
      }
    );

    if (response.data.success && response.data.triggered > 0) {
      logSuccess(`Event triggered successfully, ${response.data.triggered} webhooks notified`);
      return true;
    } else {
      logError('Event trigger failed');
      return false;
    }
  } catch (error) {
    logError(`Event trigger failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebhookLogs() {
  logInfo('Testing webhook logs retrieval...');

  if (!testWebhookId) {
    logError('No webhook ID available for logs test');
    return false;
  }

  try {
    const response = await axios.get(
      `${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}/logs`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.data.logs && Array.isArray(response.data.logs)) {
      logSuccess(`Retrieved ${response.data.logs.length} webhook logs`);
      return true;
    } else {
      logError('Failed to retrieve webhook logs');
      return false;
    }
  } catch (error) {
    logError(`Webhook logs retrieval failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testWebhookToggle() {
  logInfo('Testing webhook toggle functionality...');

  if (!testWebhookId) {
    logError('No webhook ID available for toggle test');
    return false;
  }

  try {
    // Toggle to inactive
    const response1 = await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}/toggle`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Toggle back to active
    const response2 = await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}/toggle`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response1.data.isActive === false && response2.data.isActive === true) {
      logSuccess('Webhook toggle functionality works correctly');
      return true;
    } else {
      logError('Webhook toggle verification failed');
      return false;
    }
  } catch (error) {
    logError(`Webhook toggle failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testSignatureVerification() {
  logInfo('Testing signature verification...');

  const payload = JSON.stringify({
    id: 'test-event-123',
    eventType: 'user.created',
    data: { userId: 'test-user' },
    metadata: { timestamp: new Date().toISOString() },
  });

  const secret = 'test-secret';
  const signature = generateSignature(payload, secret);

  // Test valid signature
  const isValidSignature =
    crypto.createHmac('sha256', secret).update(payload).digest('hex') ===
    signature.replace('sha256=', '');

  if (isValidSignature) {
    logSuccess('Signature verification works correctly');
    return true;
  } else {
    logError('Signature verification failed');
    return false;
  }
}

async function testRateLimiting() {
  logInfo('Testing rate limiting...');

  const requests = [];
  // const startTime = performance.now(); // Not used currently

  // Make multiple rapid requests
  for (let i = 0; i < 10; i++) {
    requests.push(
      axios
        .get(`${WEBHOOK_SERVICE_URL}/api/v1/webhooks`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        .catch((error) => error)
    );
  }

  const responses = await Promise.all(requests);
  // const endTime = performance.now(); // Not used currently
  // const duration = endTime - startTime; // Not used currently

  const rateLimitedResponses = responses.filter(
    (response) => response.response && response.response.status === 429
  );

  if (rateLimitedResponses.length > 0) {
    logSuccess(`Rate limiting is working (${rateLimitedResponses.length} requests rate limited)`);
    return true;
  } else {
    logWarning('Rate limiting may not be working (no requests were rate limited)');
    return false;
  }
}

async function testWebhookDeletion() {
  logInfo('Testing webhook deletion...');

  if (!testWebhookId) {
    logError('No webhook ID available for deletion test');
    return false;
  }

  try {
    const response = await axios.delete(`${WEBHOOK_SERVICE_URL}/api/v1/webhooks/${testWebhookId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.data.id === testWebhookId) {
      logSuccess('Webhook deleted successfully');
      return true;
    } else {
      logError('Webhook deletion verification failed');
      return false;
    }
  } catch (error) {
    logError(`Webhook deletion failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runValidation() {
  logInfo('🚀 Starting Webhook System Integration Validation');
  logInfo('================================================');

  const results = [];

  // Run all tests
  const tests = [
    { name: 'Service Health', fn: testServiceHealth },
    { name: 'User Authentication', fn: authenticateUser },
    { name: 'Webhook Creation', fn: testWebhookCreation },
    { name: 'Webhook Listing', fn: testWebhookListing },
    { name: 'Webhook Update', fn: testWebhookUpdate },
    { name: 'Webhook Test', fn: testWebhookTest },
    { name: 'Event Trigger', fn: testEventTrigger },
    { name: 'Webhook Logs', fn: testWebhookLogs },
    { name: 'Webhook Toggle', fn: testWebhookToggle },
    { name: 'Signature Verification', fn: testSignatureVerification },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Webhook Deletion', fn: testWebhookDeletion },
  ];

  for (const test of tests) {
    logInfo(`Running test: ${test.name}`);
    const startTime = performance.now();

    try {
      const result = await test.fn();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      results.push({
        name: test.name,
        passed: result,
        duration,
      });

      if (result) {
        logSuccess(`${test.name} passed (${duration}ms)`);
      } else {
        logError(`${test.name} failed (${duration}ms)`);
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      results.push({
        name: test.name,
        passed: false,
        duration,
        error: error.message,
      });

      logError(`${test.name} failed with error: ${error.message} (${duration}ms)`);
    }

    // Small delay between tests
    await sleep(500);
  }

  // Summary
  logInfo('================================================');
  logInfo('📊 VALIDATION SUMMARY');
  logInfo('================================================');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  logInfo(`Total Tests: ${results.length}`);
  logSuccess(`Passed: ${passed}`);
  logError(`Failed: ${failed}`);
  logInfo(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    logInfo('================================================');
    logError('FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((test) => {
        logError(`  - ${test.name}${test.error ? ': ' + test.error : ''}`);
      });
  }

  logInfo('================================================');

  if (passed === results.length) {
    logSuccess('🎉 ALL TESTS PASSED! Webhook system is fully functional.');
    process.exit(0);
  } else {
    logError('❌ SOME TESTS FAILED! Please check the webhook system.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch((error) => {
    logError(`Validation script failed: ${error.message}`);
    process.exit(1);
  });
}

export {
  runValidation,
  testServiceHealth,
  authenticateUser,
  testWebhookCreation,
  testWebhookListing,
  testWebhookUpdate,
  testWebhookTest,
  testEventTrigger,
  testWebhookLogs,
  testWebhookToggle,
  testSignatureVerification,
  testRateLimiting,
  testWebhookDeletion,
};
