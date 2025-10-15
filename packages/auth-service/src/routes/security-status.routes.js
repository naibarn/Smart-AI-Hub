// src/routes/security-status.routes.js
const express = require('express');
const router = express.Router();
const { getSecurityHeadersStatus } = require('@smart-ai-hub/shared/security/headers');

/**
 * GET /api/v1/security/headers/status
 * Get current security headers status for monitoring
 */
router.get('/headers/status', (req, res) => {
  try {
    const status = getSecurityHeadersStatus();
    
    // Transform status object to array for easier UI rendering
    const headersArray = Object.entries(status).map(([name, config]) => ({
      name,
      ...config
    }));

    res.json(headersArray);
  } catch (error) {
    console.error('Error fetching security headers status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch security headers status'
    });
  }
});

/**
 * POST /api/v1/security/test-headers
 * Test security headers and return score
 */
router.post('/test-headers', async (req, res) => {
  try {
    // This would typically make an external request to security testing services
    // For now, we'll simulate a basic security score calculation
    
    const status = getSecurityHeadersStatus();
    const enabledHeaders = Object.values(status).filter(h => h.enabled).length;
    const totalHeaders = Object.values(status).length;
    
    // Basic scoring algorithm
    let score = (enabledHeaders / totalHeaders) * 100;
    
    // Bonus points for critical headers
    if (status['Strict-Transport-Security']?.enabled) score += 5;
    if (status['Content-Security-Policy']?.enabled) score += 10;
    if (status['X-Frame-Options']?.enabled) score += 5;
    if (status['X-Content-Type-Options']?.enabled) score += 5;
    
    score = Math.min(100, Math.round(score));
    
    // Determine grade
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 80) grade = 'B+';
    else if (score >= 75) grade = 'B';
    else if (score >= 70) grade = 'C+';
    else if (score >= 65) grade = 'C';
    else if (score >= 60) grade = 'D';
    else if (score >= 50) grade = 'D-';
    
    res.json({
      score,
      grade,
      enabledHeaders,
      totalHeaders,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(status)
    });
  } catch (error) {
    console.error('Error testing security headers:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test security headers'
    });
  }
});

/**
 * Generate security recommendations based on current status
 */
function generateRecommendations(status) {
  const recommendations = [];
  
  if (!status['Strict-Transport-Security']?.enabled) {
    recommendations.push({
      priority: 'high',
      header: 'Strict-Transport-Security',
      message: 'Enable HSTS to enforce HTTPS connections and prevent man-in-the-middle attacks'
    });
  }
  
  if (!status['Content-Security-Policy']?.enabled) {
    recommendations.push({
      priority: 'high',
      header: 'Content-Security-Policy',
      message: 'Implement CSP to prevent XSS attacks and code injection'
    });
  }
  
  if (!status['X-Frame-Options']?.enabled) {
    recommendations.push({
      priority: 'medium',
      header: 'X-Frame-Options',
      message: 'Set X-Frame-Options to prevent clickjacking attacks'
    });
  }
  
  if (!status['X-Content-Type-Options']?.enabled) {
    recommendations.push({
      priority: 'medium',
      header: 'X-Content-Type-Options',
      message: 'Set X-Content-Type-Options to prevent MIME-type sniffing'
    });
  }
  
  if (!status['Referrer-Policy']?.enabled) {
    recommendations.push({
      priority: 'low',
      header: 'Referrer-Policy',
      message: 'Set Referrer-Policy to control referrer information leakage'
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

module.exports = router;