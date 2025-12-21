import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postReports, getReports } from '../src/services/serverless.js';
import { ReportAutomationService } from '../src/services/ReportAutomationService.js';
import { setSecurityHeaders, rateLimiter, detectSuspiciousRequest, getClientIp } from '../src/security/validation.js';
import { ipFilterManager, detectSuspiciousPatterns } from '../src/security/advanced.js';
import { securityLogger } from '../src/security/audit.js';


function setCors(res: VercelResponse) {
  // Strict CORS - only allow specific origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const automationService = new ReportAutomationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientIp = getClientIp(req);

  // Apply security headers to all responses
  setSecurityHeaders(res);

  // Additional CORS headers
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // IP Blacklist Check (Fail-Fast)
  if (ipFilterManager.isBlacklisted(clientIp)) {
    securityLogger.logEvent({
      event_type: 'blocked_request',
      severity: 'high',
      ip_address: clientIp,
      endpoint: '/api/reports',
      method: req.method,
      details: { reason: 'IP blacklisted' }
    });
    return res.status(403).json({ error: 'Access denied' });
  }

  // Advanced Threat Detection
  const suspiciousPatterns = detectSuspiciousPatterns(req);

  if (suspiciousPatterns.length > 0) {
    securityLogger.logEvent({
      event_type: 'suspicious_activity',
      severity: 'critical',
      ip_address: clientIp,
      endpoint: '/api/reports',
      method: req.method,
      details: {
        action: 'attack_pattern_detected',
        patterns: suspiciousPatterns
      }
    });
    ipFilterManager.markSuspicious(clientIp);
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Detect suspicious requests at the API gateway level
  const suspicious = detectSuspiciousRequest(req);

  if (suspicious.isSuspicious) {
    securityLogger.logEvent({
      event_type: 'suspicious_activity',
      severity: 'medium',
      ip_address: clientIp,
      user_agent: req.headers['user-agent'] as string,
      endpoint: '/api/reports',
      method: req.method,
      details: { reasons: suspicious.reasons }
    });
    return res.status(429).json({
      error: 'Request blocked for security reasons'
    });
  }

  // Apply rate limiting at API level
  if (!rateLimiter.isAllowed(clientIp)) {
    securityLogger.logEvent({
      event_type: 'rate_limit_exceeded',
      severity: 'high',
      ip_address: clientIp,
      endpoint: '/api/reports',
      details: { remaining: rateLimiter.getRemainingRequests(clientIp) }
    });
    return res.status(429).json({
      error: 'Rate limit exceeded',
      remaining: rateLimiter.getRemainingRequests(clientIp),
      retryAfter: 3600 // 1 hour
    });
  }

  if (req.method === 'POST') {
    try {
      const r = await postReports({
        body: req.body,
        headers: req.headers
      });

      res.status(r.statusCode).send(r.body);

      // Trigger automation for new reports (only if successful)
      if (r.statusCode === 201 && req.body) {
        try {
          // Convert response body to report object if needed
          const newReport = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;

          // Add additional security checks before automation
          if (newReport && newReport.report_id) {
            await automationService.processNewReport(newReport);

            securityLogger.logEvent({
              event_type: 'automation_trigger',
              severity: 'low',
              ip_address: clientIp,
              details: {
                action: 'report_automation_triggered',
                reportId: newReport.report_id
              }
            });
          }
        } catch (error) {
          console.error('Automation trigger error:', error);
          // Don't expose automation errors to client
        }
      }
    } catch (error) {
      console.error('API POST error:', error);
      securityLogger.logEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        ip_address: clientIp,
        endpoint: '/api/reports',
        method: 'POST',
        details: {
          action: 'api_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process request'
      });
    }
    return;
  }

  if (req.method === 'GET') {
    try {
      const r = await getReports({
        query: req.query,
        headers: req.headers
      });
      res.status(r.statusCode).send(r.body);
    } catch (error) {
      console.error('API GET error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve data'
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

