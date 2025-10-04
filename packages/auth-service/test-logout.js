// Test script for logout functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

async function testLogout() {
  try {
    console.log('🧪 Testing logout functionality...\n');

    // 1. Login to get tokens
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const { accessToken, refreshToken } = loginResponse.data.data;
    console.log('✅ Login successful');
    console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...\n`);

    // 2. Test protected endpoint with valid token
    console.log('2. Testing protected endpoint with valid token...');
    const meResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Protected endpoint accessible\n');

    // 3. Logout
    console.log('3. Logging out...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {
      refreshToken: refreshToken
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Logout successful');
    console.log(`Message: ${logoutResponse.data.message}\n`);

    // 4. Test protected endpoint with blacklisted token (should fail)
    console.log('4. Testing protected endpoint with blacklisted token...');
    try {
      await axios.get(`${BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('❌ ERROR: Protected endpoint should not be accessible with blacklisted token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protected endpoint correctly rejected blacklisted token');
        console.log(`Error: ${error.response.data.error.message}\n`);
      } else {
        throw error;
      }
    }

    // 5. Test refresh token with blacklisted refresh token (should fail)
    console.log('5. Testing refresh token with blacklisted refresh token...');
    try {
      await axios.post(`${BASE_URL}/refresh`, {
        refreshToken: refreshToken
      });
      console.log('❌ ERROR: Refresh token should not work after logout');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Refresh token correctly rejected after logout');
        console.log(`Error: ${error.response.data.error.message}\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 All tests passed! Logout functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testLogout();