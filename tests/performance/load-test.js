const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  baseUrl: 'http://localhost:3001',
  concurrentUsers: 50,
  duration: 30, // seconds
  rampUpTime: 10, // seconds
  endpoints: [
    {
      path: '/api/v1/auth/login',
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      weight: 30 // 30% of traffic
    },
    {
      path: '/api/v1/users/profile',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      weight: 20 // 20% of traffic
    },
    {
      path: '/api/v1/points/balance',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      weight: 20 // 20% of traffic
    },
    {
      path: '/api/v1/transfer',
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'recipient-user-id',
        amount: 100,
        type: 'points'
      }),
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      weight: 15 // 15% of traffic
    },
    {
      path: '/api/v1/referral/code',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      weight: 15 // 15% of traffic
    }
  ]
};

// Statistics tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: {},
  startTime: null,
  endTime: null,
  requestsPerSecond: [],
  activeUsers: 0,
  maxActiveUsers: 0
};

// Helper function to make HTTP request
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const postData = endpoint.body ? endpoint.body : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: endpoint.method,
      headers: endpoint.headers || {}
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        stats.totalRequests++;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.successfulRequests++;
        } else {
          stats.failedRequests++;
          const errorKey = `HTTP_${res.statusCode}`;
          stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
        }
        
        stats.responseTimes.push(responseTime);
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      stats.totalRequests++;
      stats.failedRequests++;
      stats.errors[err.code] = (stats.errors[err.code] || 0) + 1;
      stats.responseTimes.push(responseTime);
      
      resolve({
        error: err.code,
        responseTime,
        success: false
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Helper function to select endpoint based on weights
function selectEndpoint() {
  const totalWeight = config.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of config.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return config.endpoints[0];
}

// Virtual user function
async function virtualUser(userId, endTime) {
  stats.activeUsers++;
  stats.maxActiveUsers = Math.max(stats.maxActiveUsers, stats.activeUsers);
  
  while (Date.now() < endTime) {
    const endpoint = selectEndpoint();
    await makeRequest(endpoint);
    
    // Small delay between requests to simulate real user behavior
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
  
  stats.activeUsers--;
}

// Function to calculate percentiles
function calculatePercentile(arr, percentile) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Function to format time
function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Main load test function
async function runLoadTest() {
  console.log(`Starting load test with ${config.concurrentUsers} concurrent users for ${config.duration} seconds...`);
  console.log('==================================================');
  
  stats.startTime = Date.now();
  const endTime = stats.startTime + (config.duration * 1000);
  
  // Track requests per second
  const rpsInterval = setInterval(() => {
    const currentRequests = stats.totalRequests;
    stats.requestsPerSecond.push(currentRequests);
  }, 1000);
  
  // Ramp up users gradually
  const usersPerSecond = config.concurrentUsers / config.rampUpTime;
  const rampUpInterval = setInterval(() => {
    if (stats.activeUsers < config.concurrentUsers) {
      const userId = `user-${Date.now()}-${Math.random()}`;
      virtualUser(userId, endTime);
    } else {
      clearInterval(rampUpInterval);
    }
  }, 1000 / usersPerSecond);
  
  // Wait for test to complete
  await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
  
  // Clean up intervals
  clearInterval(rpsInterval);
  clearInterval(rampUpInterval);
  
  stats.endTime = Date.now();
  
  // Calculate statistics
  const totalTime = stats.endTime - stats.startTime;
  const avgResponseTime = stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length;
  const minResponseTime = Math.min(...stats.responseTimes);
  const maxResponseTime = Math.max(...stats.responseTimes);
  const p50 = calculatePercentile(stats.responseTimes, 50);
  const p90 = calculatePercentile(stats.responseTimes, 90);
  const p95 = calculatePercentile(stats.responseTimes, 95);
  const p99 = calculatePercentile(stats.responseTimes, 99);
  
  // Calculate actual requests per second
  let totalRps = 0;
  for (let i = 1; i < stats.requestsPerSecond.length; i++) {
    totalRps += stats.requestsPerSecond[i] - stats.requestsPerSecond[i-1];
  }
  const avgRps = totalRps / (stats.requestsPerSecond.length - 1);
  
  // Print results
  console.log('\nLoad Test Results');
  console.log('==================');
  console.log(`Test Duration: ${formatTime(totalTime)}`);
  console.log(`Concurrent Users: ${config.concurrentUsers} (max active: ${stats.maxActiveUsers})`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests} (${(stats.successfulRequests / stats.totalRequests * 100).toFixed(2)}%)`);
  console.log(`Failed Requests: ${stats.failedRequests} (${(stats.failedRequests / stats.totalRequests * 100).toFixed(2)}%)`);
  console.log(`Average Requests/sec: ${avgRps.toFixed(2)}`);
  console.log('');
  console.log('Response Times');
  console.log('--------------');
  console.log(`Average: ${formatTime(avgResponseTime)}`);
  console.log(`Minimum: ${formatTime(minResponseTime)}`);
  console.log(`Maximum: ${formatTime(maxResponseTime)}`);
  console.log(`50th Percentile: ${formatTime(p50)}`);
  console.log(`90th Percentile: ${formatTime(p90)}`);
  console.log(`95th Percentile: ${formatTime(p95)}`);
  console.log(`99th Percentile: ${formatTime(p99)}`);
  console.log('');
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('Errors Breakdown');
    console.log('----------------');
    for (const [error, count] of Object.entries(stats.errors)) {
      console.log(`${error}: ${count} (${(count / stats.totalRequests * 100).toFixed(2)}%)`);
    }
    console.log('');
  }
  
  // Performance assessment
  console.log('Performance Assessment');
  console.log('----------------------');
  
  let performanceScore = 100;
  const issues = [];
  
  // Check success rate
  const successRate = stats.successfulRequests / stats.totalRequests;
  if (successRate < 0.99) {
    performanceScore -= 20;
    issues.push(`Low success rate: ${(successRate * 100).toFixed(2)}%`);
  }
  
  // Check response times
  if (avgResponseTime > 500) {
    performanceScore -= 15;
    issues.push(`High average response time: ${formatTime(avgResponseTime)}`);
  }
  
  if (p95 > 1000) {
    performanceScore -= 10;
    issues.push(`High 95th percentile response time: ${formatTime(p95)}`);
  }
  
  if (p99 > 2000) {
    performanceScore -= 10;
    issues.push(`High 99th percentile response time: ${formatTime(p99)}`);
  }
  
  // Check error rates
  if (stats.failedRequests > 0) {
    const errorRate = stats.failedRequests / stats.totalRequests;
    if (errorRate > 0.01) {
      performanceScore -= 20;
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }
  }
  
  if (performanceScore >= 90) {
    console.log(`✅ Performance Score: ${performanceScore}/100 - Excellent`);
  } else if (performanceScore >= 80) {
    console.log(`⚠️ Performance Score: ${performanceScore}/100 - Good`);
  } else if (performanceScore >= 70) {
    console.log(`⚠️ Performance Score: ${performanceScore}/100 - Fair`);
  } else {
    console.log(`❌ Performance Score: ${performanceScore}/100 - Poor`);
  }
  
  if (issues.length > 0) {
    console.log('\nIssues to Address');
    console.log('-----------------');
    issues.forEach(issue => console.log(`- ${issue}`));
  }
  
  console.log('\nPerformance Benchmarks');
  console.log('---------------------');
  console.log('Target Performance:');
  console.log('- Success Rate: ≥99%');
  console.log('- Average Response Time: ≤500ms');
  console.log('- 95th Percentile: ≤1000ms');
  console.log('- 99th Percentile: ≤2000ms');
  console.log('- Error Rate: ≤1%');
  
  // Return results for programmatic use
  return {
    summary: {
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      successRate: successRate,
      avgResponseTime: avgResponseTime,
      p95: p95,
      p99: p99,
      avgRps: avgRps,
      performanceScore: performanceScore
    },
    details: {
      minResponseTime,
      maxResponseTime,
      p50,
      p90,
      errors: stats.errors
    },
    passed: performanceScore >= 80 && successRate >= 0.99
  };
}

// Run the load test if this script is executed directly
if (require.main === module) {
  runLoadTest()
    .then(results => {
      console.log('\nLoad test completed successfully.');
      process.exit(results.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Load test failed:', error);
      process.exit(1);
    });
}

module.exports = { runLoadTest, config };