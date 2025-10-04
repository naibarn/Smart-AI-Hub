const http = require('http');
const https = require('https');

// ฟังก์ชันสำหรับส่ง HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.url.startsWith('https') ? https : http;
    const url = new URL(options.url);

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (options.url.startsWith('https') ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// ฟังก์ชันสำหรับแสดงผลลัพธ์
function printSuccess(message) {
  console.log(`\x1b[32m✅ ${message}\x1b[0m`);
}

function printError(message) {
  console.log(`\x1b[31m❌ ${message}\x1b[0m`);
}

function printInfo(message) {
  console.log(`\x1b[33mℹ️  ${message}\x1b[0m`);
}

function printStep(message) {
  console.log(`\n\x1b[33m🔄 ${message}\x1b[0m`);
}

// สร้างตัวแปรสำหรับเก็บข้อมูล
const USER_EMAIL = `testuser${Date.now()}@example.com`;
const USER_PASSWORD = 'TestPassword123!';
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';

// ฟังก์ชันหลักสำหรับทดสอบ
async function testAuthFlow() {
  console.log('========================================');
  console.log('🧪 ทดสอบ Authentication Flow');
  console.log('========================================');

  const BASE_URL = 'http://localhost:3001';
  const API_BASE = `${BASE_URL}/api/auth`;

  try {
    // 1. ตรวจสอบสถานะ Auth Service
    printStep('ตรวจสอบสถานะ Auth Service...');
    const healthResponse = await makeRequest({ url: `${BASE_URL}/health` });

    if (healthResponse.statusCode === 200) {
      const healthData = JSON.parse(healthResponse.body);
      printSuccess('Auth Service ทำงานอยู่');
      console.log(`Response: ${healthResponse.body}`);
    } else {
      printError(`Auth Service ไม่สามารถเข้าถึงได้ (HTTP Code: ${healthResponse.statusCode})`);
      printInfo(`กรุณาตรวจสอบว่า Auth Service กำลังทำงานอยู่ที่ ${BASE_URL}`);
      return;
    }

    // 2. Register ผู้ใช้ใหม่
    printStep('1. Register ผู้ใช้ใหม่');
    const registerData = JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

    const registerResponse = await makeRequest(
      {
        url: `${API_BASE}/register`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(registerData),
        },
      },
      registerData
    );

    if (registerResponse.statusCode === 201) {
      const registerResult = JSON.parse(registerResponse.body);
      printSuccess('Register สำเร็จ');
      console.log(`Response: ${registerResponse.body}`);
      printInfo(`Email: ${USER_EMAIL}`);

      // เก็บ tokens จาก response
      ACCESS_TOKEN = registerResult.data.token || registerResult.data.accessToken;
      REFRESH_TOKEN = registerResult.data.refreshToken;
    } else {
      printError(`Register ล้มเหลว (HTTP Code: ${registerResponse.statusCode})`);
      console.log(`Response: ${registerResponse.body}`);
      return;
    }

    // 3. Login
    printStep('2. Login และเก็บ tokens');
    const loginData = JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

    const loginResponse = await makeRequest(
      {
        url: `${API_BASE}/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
        },
      },
      loginData
    );

    if (loginResponse.statusCode === 200) {
      const loginResult = JSON.parse(loginResponse.body);
      printSuccess('Login สำเร็จ');
      console.log(`Response: ${loginResponse.body}`);

      // เก็บ tokens จาก response
      ACCESS_TOKEN = loginResult.data.accessToken;
      REFRESH_TOKEN = loginResult.data.refreshToken;

      printInfo(`Access Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
      printInfo(`Refresh Token: ${REFRESH_TOKEN.substring(0, 20)}...`);
    } else {
      printError(`Login ล้มเหลว (HTTP Code: ${loginResponse.statusCode})`);
      console.log(`Response: ${loginResponse.body}`);
      return;
    }

    // 4. เรียก Protected Endpoint
    printStep('3. เรียก Protected Endpoint ด้วย Access Token');
    const meResponse = await makeRequest({
      url: `${API_BASE}/me`,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (meResponse.statusCode === 200) {
      printSuccess('เรียก Protected Endpoint สำเร็จ');
      console.log(`Response: ${meResponse.body}`);
    } else {
      printError(`เรียก Protected Endpoint ล้มเหลว (HTTP Code: ${meResponse.statusCode})`);
      console.log(`Response: ${meResponse.body}`);
      return;
    }

    // 5. Refresh Access Token
    printStep('4. Refresh Access Token');
    const refreshData = JSON.stringify({
      refreshToken: REFRESH_TOKEN,
    });

    const refreshResponse = await makeRequest(
      {
        url: `${API_BASE}/refresh`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(refreshData),
        },
      },
      refreshData
    );

    if (refreshResponse.statusCode === 200) {
      const refreshResult = JSON.parse(refreshResponse.body);
      printSuccess('Refresh Token สำเร็จ');
      console.log(`Response: ${refreshResponse.body}`);

      // เก็บ tokens ใหม่
      ACCESS_TOKEN = refreshResult.data.accessToken;
      REFRESH_TOKEN = refreshResult.data.refreshToken;

      printInfo(`New Access Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
      printInfo(`New Refresh Token: ${REFRESH_TOKEN.substring(0, 20)}...`);
    } else {
      printError(`Refresh Token ล้มเหลว (HTTP Code: ${refreshResponse.statusCode})`);
      console.log(`Response: ${refreshResponse.body}`);
      return;
    }

    // 6. Logout
    printStep('5. Logout');
    const logoutData = JSON.stringify({
      refreshToken: REFRESH_TOKEN,
    });

    const logoutResponse = await makeRequest(
      {
        url: `${API_BASE}/logout`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(logoutData),
        },
      },
      logoutData
    );

    if (logoutResponse.statusCode === 200) {
      printSuccess('Logout สำเร็จ');
      console.log(`Response: ${logoutResponse.body}`);
    } else {
      printError(`Logout ล้มเหลว (HTTP Code: ${logoutResponse.statusCode})`);
      console.log(`Response: ${logoutResponse.body}`);
      return;
    }

    // 7. พยายามเรียก Protected Endpoint หลัง Logout
    printStep('6. พยายามเรียก Protected Endpoint หลัง Logout (ควรล้มเหลว)');
    const meAfterLogoutResponse = await makeRequest({
      url: `${API_BASE}/me`,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (meAfterLogoutResponse.statusCode === 401) {
      printSuccess('Protected Endpoint ปฏิเสธการเข้าถึงตามที่คาดหวัง');
      console.log(`Response: ${meAfterLogoutResponse.body}`);
    } else {
      printError(
        `Protected Endpoint ไม่ปฏิเสธการเข้าถึง (HTTP Code: ${meAfterLogoutResponse.statusCode})`
      );
      console.log(`Response: ${meAfterLogoutResponse.body}`);
      return;
    }

    console.log('\n========================================');
    console.log('✅ การทดสอบ Authentication Flow สำเร็จทั้งหมด');
    console.log('========================================');
  } catch (error) {
    printError(`เกิดข้อผิดพลาด: ${error.message}`);
  }
}

// เรียกฟังก์ชันหลัก
testAuthFlow();
