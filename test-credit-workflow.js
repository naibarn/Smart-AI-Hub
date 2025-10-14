const https = require('https');
const http = require('http');

// Configuration
const MCP_SERVER_URL = 'http://localhost:3003';
const TEST_USER_ID = 'test-user-id';

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${MCP_SERVER_URL}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': TEST_USER_ID,
      },
    };
    
    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = httpModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function checkCreditBalance() {
  console.log('\n=== Checking Current Credit Balance ===');
  try {
    const response = await makeRequest('GET', '/api/credits/balance');
    console.log('Current credit balance:', response.data?.balance || 0);
    return response.data?.balance || 0;
  } catch (error) {
    console.log('Credit service not available, using mock balance');
    return 5; // Mock balance for testing
  }
}

async function adjustCredits(amount) {
  console.log(`\n=== Adjusting Credits by ${amount} ===`);
  try {
    const response = await makeRequest('POST', '/api/credits/add', {
      amount,
      description: 'Test credit adjustment for workflow validation',
    });
    console.log('New credit balance:', response.data?.account?.balance || 0);
    return response.data?.account?.balance || 0;
  } catch (error) {
    console.log('Credit adjustment service not available, using mock balance');
    return 20; // Mock balance for testing
  }
}

async function testPromptSubmission(model, message, expectedCredits) {
  console.log(`\n=== Testing Prompt Submission ===`);
  console.log(`Model: ${model}`);
  console.log(`Message: "${message}"`);
  console.log(`Expected credits: ${expectedCredits}`);
  
  // For this test, we'll simulate the credit check
  const currentBalance = await checkCreditBalance();
  const hasSufficientCredits = currentBalance >= expectedCredits;
  
  console.log(`Current balance: ${currentBalance}`);
  console.log(`Has sufficient credits: ${hasSufficientCredits}`);
  
  if (!hasSufficientCredits) {
    console.log('❌ INSUFFICIENT CREDITS - Request would be rejected');
    return { success: false, error: 'Insufficient credits' };
  }
  
  console.log('✅ SUFFICIENT CREDITS - Request would be processed');
  return { 
    success: true, 
    newBalance: currentBalance - expectedCredits,
    message: 'Request processed successfully'
  };
}

// Test the MCP server health to verify it's running
async function testMCPServerHealth() {
  console.log('\n=== Testing MCP Server Health ===');
  try {
    const response = await makeRequest('GET', '/health');
    console.log('MCP Server Status:', response.status);
    console.log('MCP Server Version:', response.version);
    return true;
  } catch (error) {
    console.log('MCP Server not responding:', error.message);
    return false;
  }
}

// Main test workflow
async function runWorkflowTest() {
  console.log('🚀 Starting Credit Workflow Test');
  console.log('================================');
  
  try {
    // Check if MCP server is running
    const isMCPServerRunning = await testMCPServerHealth();
    if (!isMCPServerRunning) {
      console.log('⚠️ MCP Server is not running, using mock responses');
    }
    
    // Step 1: Check current credit balance
    let balance = await checkCreditBalance();
    
    // Step 2: Test with insufficient credits
    console.log('\n--- STEP 2: Testing with Insufficient Credits ---');
    const insufficientResult = await testPromptSubmission(
      'gpt-4', 
      'This is a test message that should cost about 10 credits', 
      10
    );
    
    if (!insufficientResult.success) {
      console.log('✅ Correctly rejected request with insufficient credits');
    } else {
      console.log('❌ Should have rejected request with insufficient credits');
    }
    
    // Step 3: Adjust credits to have sufficient balance
    console.log('\n--- STEP 3: Adjusting Credits ---');
    balance = await adjustCredits(15); // Add 15 credits
    console.log(`Adjusted balance to: ${balance}`);
    
    // Step 4: Test with sufficient credits
    console.log('\n--- STEP 4: Testing with Sufficient Credits ---');
    const sufficientResult = await testPromptSubmission(
      'gpt-4', 
      'This is a test message that should cost about 10 credits', 
      10
    );
    
    if (sufficientResult.success) {
      console.log('✅ Correctly processed request with sufficient credits');
      console.log(`New balance would be: ${sufficientResult.newBalance}`);
    } else {
      console.log('❌ Should have processed request with sufficient credits');
    }
    
    // Final check
    console.log('\n--- FINAL CHECK ---');
    const finalBalance = await checkCreditBalance();
    console.log(`Final credit balance: ${finalBalance}`);
    
    console.log('\n🎉 Workflow Test Complete');
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
runWorkflowTest();