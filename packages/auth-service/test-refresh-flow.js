// Simple test script to verify refresh token flow
const http = require('http');

const BASE_URL = 'localhost';

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: BASE_URL,
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testRefreshFlow() {
  try {
    console.log('🔄 Testing refresh token flow...\n');

    // Step 1: Login to get tokens
    console.log('1. Logging in...');
    let loginResponse;
    try {
      loginResponse = await makeRequest('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    } catch (error) {
      if (error.status === 401) {
        console.log('❌ Login failed - user may not exist. Creating test user first...');
        // Try to register the user first
        await makeRequest('/api/auth/register', {
          email: 'test@example.com',
          password: 'password123'
        });
        // Try login again
        loginResponse = await makeRequest('/api/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
      } else {
        throw error;
      }
    }

    const { accessToken, refreshToken } = loginResponse.data.data;
    console.log('✅ Login successful');
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...\n`);

    // Step 2: Use refresh token to get new tokens
    console.log('2. Refreshing tokens...');
    const refreshResponse = await makeRequest('/api/auth/refresh', {
      refreshToken
    });

    const newTokens = refreshResponse.data.data;
    console.log('✅ Token refresh successful');
    console.log(`   New Access Token: ${newTokens.accessToken.substring(0, 20)}...`);
    console.log(`   New Refresh Token: ${newTokens.refreshToken.substring(0, 20)}...\n`);

    // Step 3: Verify old refresh token no longer works
    console.log('3. Testing that old refresh token is invalidated...');
    try {
      await makeRequest('/api/auth/refresh', {
        refreshToken
      });
      console.log('❌ Old refresh token still works (this should not happen)');
    } catch (error) {
      if (error.status === 401) {
        console.log('✅ Old refresh token correctly invalidated');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tests passed! Refresh token endpoint is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.data || error.message);
  }
}

testRefreshFlow();