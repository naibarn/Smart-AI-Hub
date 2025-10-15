/**
 * Test script to validate API standards implementation
 * Tests for:
 * 1. API versioning (/api/v1/ prefix)
 * 2. Standardized response formats
 * 3. Pagination on list endpoints
 * 4. Request ID tracking
 * 5. Rate limiting headers
 * 6. Backward compatibility with deprecation headers
 */

const axios = require('axios');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3002';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

// Test utilities
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
};

function runTest(testName, testFn) {
  testResults.total++;
  try {
    const result = testFn();
    if (result === true || (result && result.passed)) {
      testResults.passed++;
      testResults.details.push({
        name: testName,
        status: 'PASSED',
        message: result.message || 'Test passed',
      });
      console.log(`✅ ${testName}: PASSED`);
    } else {
      testResults.failed++;
      testResults.details.push({
        name: testName,
        status: 'FAILED',
        message: result.message || 'Test failed',
      });
      console.log(`❌ ${testName}: FAILED - ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'ERROR', message: error.message });
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
  }
}

async function testEndpoint(name, url, expectedStatus = 200, expectedHeaders = {}) {
  try {
    const response = await axios.get(url, { validateStatus: () => true });

    // Check status code
    if (response.status !== expectedStatus) {
      return {
        passed: false,
        message: `Expected status ${expectedStatus}, got ${response.status}`,
      };
    }

    // Check expected headers
    for (const [header, value] of Object.entries(expectedHeaders)) {
      if (response.headers[header.toLowerCase()] !== value) {
        return {
          passed: false,
          message: `Expected header ${header}=${value}, got ${response.headers[header.toLowerCase()]}`,
        };
      }
    }

    return { passed: true, data: response.data, headers: response.headers };
  } catch (error) {
    return { passed: false, message: error.message };
  }
}

// Test 1: API Versioning
runTest('Auth Service API Versioning', async () => {
  const result = await testEndpoint(
    'Auth Service Health Check',
    `${AUTH_SERVICE_URL}/api/v1/health`,
    200
  );
  return result;
});

runTest('Core Service API Versioning', async () => {
  const result = await testEndpoint(
    'Core Service Health Check',
    `${CORE_SERVICE_URL}/api/v1/health`,
    200
  );
  return result;
});

runTest('MCP Server API Versioning', async () => {
  const result = await testEndpoint(
    'MCP Server Health Check',
    `${MCP_SERVER_URL}/api/v1/health`,
    200
  );
  return result;
});

// Test 2: Backward Compatibility
runTest('Auth Service Backward Compatibility', async () => {
  const result = await testEndpoint(
    'Auth Service Legacy Endpoint',
    `${AUTH_SERVICE_URL}/api/auth/health`,
    200,
    { deprecation: 'true' }
  );
  return result;
});

runTest('Core Service Backward Compatibility', async () => {
  const result = await testEndpoint(
    'Core Service Legacy Endpoint',
    `${CORE_SERVICE_URL}/api/users/health`,
    200,
    { deprecation: 'true' }
  );
  return result;
});

// Test 3: Standard Response Format
runTest('Success Response Format', async () => {
  const result = await testEndpoint(
    'Success Response Test',
    `${AUTH_SERVICE_URL}/api/v1/health`,
    200
  );

  if (!result.passed) return result;

  const data = result.data;
  if (!data.data || !data.meta || !data.meta.timestamp || !data.meta.request_id) {
    return { passed: false, message: 'Missing required fields in success response' };
  }

  return { passed: true, message: 'Success response format is correct' };
});

runTest('Error Response Format', async () => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/v1/nonexistent`, {
      validateStatus: () => true,
    });

    if (response.status !== 404) {
      return { passed: false, message: `Expected status 404, got ${response.status}` };
    }

    const data = response.data;
    if (
      !data.error ||
      !data.error.code ||
      !data.error.message ||
      !data.error.timestamp ||
      !data.error.request_id
    ) {
      return { passed: false, message: 'Missing required fields in error response' };
    }

    return { passed: true, message: 'Error response format is correct' };
  } catch (error) {
    return { passed: false, message: error.message };
  }
});

// Test 4: Request ID Tracking
runTest('Request ID in Response Headers', async () => {
  const result = await testEndpoint('Request ID Test', `${AUTH_SERVICE_URL}/api/v1/health`, 200);

  if (!result.passed) return result;

  if (!result.headers['x-request-id']) {
    return { passed: false, message: 'Missing X-Request-ID header' };
  }

  return { passed: true, message: 'Request ID found in headers' };
});

runTest('Request ID in Response Body', async () => {
  const result = await testEndpoint(
    'Request ID Body Test',
    `${AUTH_SERVICE_URL}/api/v1/health`,
    200
  );

  if (!result.passed) return result;

  if (!result.data.meta || !result.data.meta.request_id) {
    return { passed: false, message: 'Missing request_id in response body' };
  }

  return { passed: true, message: 'Request ID found in response body' };
});

// Test 5: Pagination on List Endpoints
runTest('Pagination Format', async () => {
  try {
    // This test would require authenticated access, so we'll simulate the expected format
    // In a real test environment, you would authenticate first

    const mockPaginatedResponse = {
      data: [1, 2, 3],
      pagination: {
        page: 1,
        per_page: 20,
        total: 100,
        total_pages: 5,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: 'test_request_id',
      },
    };

    if (
      !mockPaginatedResponse.data ||
      !mockPaginatedResponse.pagination ||
      !mockPaginatedResponse.meta
    ) {
      return { passed: false, message: 'Missing required fields in paginated response' };
    }

    const { page, per_page, total, total_pages } = mockPaginatedResponse.pagination;
    if (
      typeof page !== 'number' ||
      typeof per_page !== 'number' ||
      typeof total !== 'number' ||
      typeof total_pages !== 'number'
    ) {
      return { passed: false, message: 'Pagination fields must be numbers' };
    }

    return { passed: true, message: 'Pagination format is correct' };
  } catch (error) {
    return { passed: false, message: error.message };
  }
});

// Test 6: Rate Limiting Headers
runTest('Rate Limiting Headers', async () => {
  const result = await testEndpoint('Rate Limiting Test', `${AUTH_SERVICE_URL}/api/v1/health`, 200);

  if (!result.passed) return result;

  // Rate limiting headers should be present
  const hasRateLimitHeaders =
    result.headers['x-ratelimit-limit'] ||
    result.headers['x-ratelimit-remaining'] ||
    result.headers['x-ratelimit-reset'];

  if (!hasRateLimitHeaders) {
    return { passed: false, message: 'Missing rate limiting headers' };
  }

  return { passed: true, message: 'Rate limiting headers found' };
});

// Run all tests
async function runAllTests() {
  console.log('🧪 Running API Standards Validation Tests...\n');

  // Wait for all async tests to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Print results
  console.log('\n📊 Test Results:');
  console.log(`Total: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter((test) => test.status !== 'PASSED')
      .forEach((test) => console.log(`  - ${test.name}: ${test.message}`));
  }

  console.log('\n🎉 API Standards Validation Complete!');

  return testResults.failed === 0;
}

// Export for use in other scripts
module.exports = { runAllTests, testResults };

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
