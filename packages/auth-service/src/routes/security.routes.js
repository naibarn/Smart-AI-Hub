// src/routes/security.routes.js
const express = require('express');
const router = express.Router();
const { validateCspReport } = require('@smart-ai-hub/shared/security/headers');
const logger = require('../utils/logger');

// In-memory storage for CSP violations (in production, use database)
const cspViolations = [];
const MAX_VIOLATIONS = 1000; // Keep only the latest 1000 violations

/**
 * POST /api/v1/security/csp-report
 * Content Security Policy violation report endpoint
 */
router.post('/csp-report', express.json({ type: ['application/csp-report', 'application/json'] }), (req, res) => {
  try {
    const report = req.body;
    
    // Validate the CSP report format
    if (!validateCspReport(report)) {
      return res.status(400).json({
        error: 'Invalid CSP report format',
        message: 'The provided CSP report does not match the expected format'
      });
    }

    // Add metadata to the violation
    const violation = {
      id: `csp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      report: report['csp-report'],
      resolved: false
    };

    // Store the violation
    cspViolations.unshift(violation);
    
    // Keep only the latest violations
    if (cspViolations.length > MAX_VIOLATIONS) {
      cspViolations.splice(MAX_VIOLATIONS);
    }

    // Log the violation for monitoring
    logger.warn('CSP Violation Reported', {
      violationId: violation.id,
      documentUri: violation.report['document-uri'],
      violatedDirective: violation.report['violated-directive'],
      blockedUri: violation.report['blocked-uri'],
      userAgent: violation.userAgent,
      ip: violation.ip
    });

    // Return success response
    res.status(204).send();
  } catch (error) {
    logger.error('Error processing CSP report', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process CSP report'
    });
  }
});

/**
 * GET /api/v1/security/csp-violations
 * Get recent CSP violations (admin only)
 */
router.get('/csp-violations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get paginated violations
    const violations = cspViolations.slice(offset, offset + limit);
    
    // Get statistics
    const stats = {
      total: cspViolations.length,
      unresolved: cspViolations.filter(v => !v.resolved).length,
      byDirective: {},
      byBlockedUri: {},
      recent24h: cspViolations.filter(v => {
        const violationTime = new Date(v.timestamp);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return violationTime > twentyFourHoursAgo;
      }).length
    };

    // Calculate statistics by directive
    cspViolations.forEach(violation => {
      const directive = violation.report['violated-directive'] || 'unknown';
      stats.byDirective[directive] = (stats.byDirective[directive] || 0) + 1;
      
      const blockedUri = violation.report['blocked-uri'] || 'unknown';
      stats.byBlockedUri[blockedUri] = (stats.byBlockedUri[blockedUri] || 0) + 1;
    });

    res.json({
      violations,
      stats,
      pagination: {
        limit,
        offset,
        total: cspViolations.length
      }
    });
  } catch (error) {
    logger.error('Error fetching CSP violations', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch CSP violations'
    });
  }
});

/**
 * POST /api/v1/security/csp-violations/:id/resolve
 * Mark a CSP violation as resolved (admin only)
 */
router.post('/csp-violations/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const violation = cspViolations.find(v => v.id === id);
    
    if (!violation) {
      return res.status(404).json({
        error: 'Violation not found',
        message: 'CSP violation with the specified ID was not found'
      });
    }

    violation.resolved = true;
    violation.resolvedAt = new Date().toISOString();
    violation.resolvedBy = req.user?.id || 'system';

    logger.info('CSP violation resolved', {
      violationId: id,
      resolvedBy: violation.resolvedBy
    });

    res.json({
      message: 'CSP violation marked as resolved',
      violation
    });
  } catch (error) {
    logger.error('Error resolving CSP violation', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve CSP violation'
    });
  }
});

/**
 * DELETE /api/v1/security/csp-violations
 * Clear resolved CSP violations (admin only)
 */
router.delete('/csp-violations', (req, res) => {
  try {
    const beforeCount = cspViolations.length;
    
    // Remove resolved violations
    for (let i = cspViolations.length - 1; i >= 0; i--) {
      if (cspViolations[i].resolved) {
        cspViolations.splice(i, 1);
      }
    }

    const clearedCount = beforeCount - cspViolations.length;

    logger.info('CSP violations cleared', {
      clearedCount,
      remainingCount: cspViolations.length
    });

    res.json({
      message: 'Resolved CSP violations cleared',
      clearedCount,
      remainingCount: cspViolations.length
    });
  } catch (error) {
    logger.error('Error clearing CSP violations', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to clear CSP violations'
    });
  }
});

module.exports = router;