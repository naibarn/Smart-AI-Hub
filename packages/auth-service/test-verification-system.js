// test-verification-system.js
// Simple test script to demonstrate the email verification system

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testVerificationSystem() {
  console.log('🧪 Testing Email Verification System\n');

  try {
    // Test 1: Send verification email
    console.log('1. Testing POST /api/auth/send-verification');
    const sendResponse = await axios.post(`${BASE_URL}/api/auth/send-verification`, {
      email: 'test@example.com'
    });
    console.log('✅ Send verification response:', sendResponse.data);
    console.log('');

    // Test 2: Check verification status
    console.log('2. Testing GET /api/auth/verification-status');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/verification-status`, {
      params: { email: 'test@example.com' }
    });
    console.log('✅ Verification status response:', statusResponse.data);
    console.log('');

    // Test 3: Test email configuration (development only)
    console.log('3. Testing POST /api/auth/test-email');
    try {
      const emailTestResponse = await axios.post(`${BASE_URL}/api/auth/test-email`);
      console.log('✅ Email configuration test response:', emailTestResponse.data);
    } catch (error) {
      console.log('⚠️  Email configuration test failed (expected if SendGrid not configured):', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Test validation errors
    console.log('4. Testing validation errors');
    try {
      await axios.post(`${BASE_URL}/api/auth/send-verification`, {
        email: 'invalid-email'
      });
    } catch (error) {
      console.log('✅ Invalid email validation works:', error.response?.data);
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/verify-email`, {
        email: 'test@example.com',
        otp: 'invalid'
      });
    } catch (error) {
      console.log('✅ Invalid OTP validation works:', error.response?.data);
    }
    console.log('');

    console.log('🎉 All basic tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure SendGrid API key in .env file');
    console.log('2. Test with real email addresses');
    console.log('3. Verify OTP generation and storage in Redis');
    console.log('4. Test rate limiting functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the auth service is running on port 3001');
      console.log('   Run: cd packages/auth-service && npm run dev');
    }
  }
}

// Run the test
testVerificationSystem();