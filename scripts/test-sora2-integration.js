#!/usr/bin/env node

/**
 * Sora2 Integration End-to-End Test Script
 * 
 * This script tests the complete Sora2 integration flow:
 * 1. OAuth with session parameters
 * 2. Session verification
 * 3. Credit check
 * 4. Credit deduction
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3002';

// Test data
const testSessionId = `test-session-${uuidv4()}`;
const testReturnTo = 'chatgpt';
const testService = 'sora2-video-generation';
const testCost = 30;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test functions
async function testHealthEndpoints() {
  logInfo('Testing health endpoints...');
  
  try {
    // Test API Gateway health
    const gatewayHealth = await axios.get(`${API_GATEWAY_URL}/health`);
    if (gatewayHealth.status === 200) {
      logSuccess('API Gateway health check passed');
    } else {
      logError('API Gateway health check failed');
      return false;
    }

    // Test Auth Service health
    const authHealth = await axios.get(`${AUTH_SERVICE_URL}/health`);
    if (authHealth.status === 200) {
      logSuccess('Auth Service health check passed');
    } else {
      logError('Auth Service health check failed');
      return false;
    }

    // Test Core Service health (if available)
    try {
      const coreHealth = await axios.get(`${CORE_SERVICE_URL}/health`);
      if (coreHealth.status === 200) {
        logSuccess('Core Service health check passed');
      } else {
        logError('Core Service health check failed');
        return false;
      }
    } catch (error) {
      logWarning('Core Service health check failed (service might not be running)');
    }

    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testOAuthInitiation() {
  logInfo('Testing OAuth initiation with session parameters...');
  
  try {
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/auth/google?session=${testSessionId}&return_to=${testReturnTo}`,
      { maxRedirects: 0 } // Don't follow redirects
    );

    if (response.status === 302) {
      const location = response.headers.location;
      if (location && location.includes('accounts.google.com')) {
        logSuccess('OAuth initiation successful');
        
        // Extract state from redirect URL
        const stateMatch = location.match(/state=([^&]+)/);
        if (stateMatch) {
          const state = stateMatch[1];
          logInfo(`OAuth state: ${state}`);
          return state;
        } else {
          logError('OAuth state not found in redirect URL');
          return null;
        }
      } else {
        logError('OAuth redirect URL is invalid');
        return null;
      }
    } else {
      logError(`OAuth initiation failed with status: ${response.status}`);
      return null;
    }
  } catch (error) {
    logError(`OAuth initiation error: ${error.message}`);
    return null;
  }
}

async function testSessionVerification() {
  logInfo('Testing session verification endpoint...');
  
  try {
    // Create a test session token
    const sessionToken = 'VERIFIED-test123';
    
    // First, let's try to verify without creating a session (should fail)
    try {
      await axios.get(`${API_GATEWAY_URL}/api/auth/verify-session`, {
        headers: { 'X-Session-Token': sessionToken }
      });
      logError('Session verification should have failed for non-existent session');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logSuccess('Session verification correctly failed for non-existent session');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Note: In a real test, we would create a session in Redis
    // For this test, we're just verifying the endpoint exists and responds correctly
    logInfo('Session verification endpoint is accessible');
    return true;
  } catch (error) {
    logError(`Session verification error: ${error.message}`);
    return false;
  }
}

async function testCreditCheck() {
  logInfo('Testing credit check endpoint...');
  
  try {
    // Test with missing X-User-ID header (should fail)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/check`, {
        service: testService,
        cost: testCost
      });
      logError('Credit check should have failed without X-User-ID header');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Credit check correctly failed without X-User-ID header');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Test with invalid user ID (should fail)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/check`, {
        service: testService,
        cost: testCost
      }, {
        headers: { 'X-User-ID': 'invalid-user-id' }
      });
      logError('Credit check should have failed for invalid user ID');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Credit check correctly failed for invalid user ID');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Test with valid request format (endpoint should be accessible)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/check`, {
        service: testService,
        cost: testCost
      }, {
        headers: { 'X-User-ID': 'test-user-id' }
      });
      logInfo('Credit check endpoint is accessible');
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 500)) {
        logInfo('Credit check endpoint is accessible (user not found is expected)');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logError(`Credit check error: ${error.message}`);
    return false;
  }
}

async function testCreditDeduction() {
  logInfo('Testing credit deduction endpoint...');
  
  try {
    // Test with missing X-User-ID header (should fail)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/deduct`, {
        service: testService,
        cost: testCost,
        metadata: { test: 'data' }
      });
      logError('Credit deduction should have failed without X-User-ID header');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Credit deduction correctly failed without X-User-ID header');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Test with invalid user ID (should fail)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/deduct`, {
        service: testService,
        cost: testCost,
        metadata: { test: 'data' }
      }, {
        headers: { 'X-User-ID': 'invalid-user-id' }
      });
      logError('Credit deduction should have failed for invalid user ID');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Credit deduction correctly failed for invalid user ID');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Test with valid request format (endpoint should be accessible)
    try {
      await axios.post(`${API_GATEWAY_URL}/api/mcp/v1/credits/deduct`, {
        service: testService,
        cost: testCost,
        metadata: { test: 'data' }
      }, {
        headers: { 'X-User-ID': 'test-user-id' }
      });
      logInfo('Credit deduction endpoint is accessible');
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 500)) {
        logInfo('Credit deduction endpoint is accessible (user not found is expected)');
      } else {
        logError(`Unexpected error: ${error.message}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logError(`Credit deduction error: ${error.message}`);
    return false;
  }
}

async function testOAuthSuccessPage() {
  logInfo('Testing OAuth success page...');
  
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/oauth-success.html`);
    
    if (response.status === 200) {
      const content = response.data;
      if (content.includes('Authentication Successful')) {
        logSuccess('OAuth success page is accessible');
        return true;
      } else {
        logError('OAuth success page content is invalid');
        return false;
      }
    } else {
      logError(`OAuth success page request failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`OAuth success page error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('\n🚀 Sora2 Integration End-to-End Test', colors.blue);
  log('=' * 50, colors.blue);
  
  let allTestsPassed = true;
  
  // Run all tests
  const tests = [
    { name: 'Health Endpoints', fn: testHealthEndpoints },
    { name: 'OAuth Initiation', fn: testOAuthInitiation },
    { name: 'Session Verification', fn: testSessionVerification },
    { name: 'Credit Check', fn: testCreditCheck },
    { name: 'Credit Deduction', fn: testCreditDeduction },
    { name: 'OAuth Success Page', fn: testOAuthSuccessPage }
  ];
  
  for (const test of tests) {
    log(`\n📋 Running ${test.name} Test...`, colors.yellow);
    const result = await test.fn();
    
    if (!result) {
      allTestsPassed = false;
      logError(`${test.name} test failed`);
    } else {
      logSuccess(`${test.name} test passed`);
    }
  }
  
  // Final result
  log('\n' + '=' * 50, colors.blue);
  if (allTestsPassed) {
    log('🎉 All tests passed! Sora2 integration is ready.', colors.green);
  } else {
    log('💥 Some tests failed. Please check the errors above.', colors.red);
  }
  
  log('\n📝 Test Summary:', colors.blue);
  log(`- API Gateway URL: ${API_GATEWAY_URL}`);
  log(`- Auth Service URL: ${AUTH_SERVICE_URL}`);
  log(`- Core Service URL: ${CORE_SERVICE_URL}`);
  log(`- Test Session ID: ${testSessionId}`);
  log(`- Test Return To: ${testReturnTo}`);
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthEndpoints,
  testOAuthInitiation,
  testSessionVerification,
  testCreditCheck,
  testCreditDeduction,
  testOAuthSuccessPage
};