import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ReportAutomationService } from '../src/services/ReportAutomationService';
import type { Report } from '../src/domain/types';
import { 
    setSecurityHeaders, 
    rateLimiter, 
    detectSuspiciousRequest, 
    getClientIp,
    validateReportId,
    sanitizeText
} from '../src/security/validation';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

const automationService = new ReportAutomationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply security headers
  setSecurityHeaders(res);
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Enhanced security for automation endpoint
  const suspicious = detectSuspiciousRequest(req);
  if (suspicious.isSuspicious) {
    console.warn('Suspicious automation request detected:', { 
      ip: getClientIp(req), 
      userAgent: req.headers['user-agent'],
      reasons: suspicious.reasons 
    });
    return res.status(429).json({ 
      error: 'Request blocked for security reasons',
      reasons: suspicious.reasons 
    });
  }
  
  // Apply stricter rate limiting for automation
  const clientIp = getClientIp(req);
  if (!rateLimiter.isAllowed(clientIp)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      remaining: rateLimiter.getRemainingRequests(clientIp),
      retryAfter: 3600
    });
  }
  
  if (req.method === 'POST') {
    try {
      const reportData: Report = req.body;
      
      // Validate report ID format
      if (reportData.report_id && !validateReportId(reportData.report_id)) {
        return res.status(400).json({ 
          error: 'Invalid report ID format',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate required fields
      if (!reportData.report_id || !reportData.location || !reportData.merchant || !reportData.timestamp) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['report_id', 'location', 'merchant', 'timestamp'],
          timestamp: new Date().toISOString()
        });
      }
      
      // Sanitize any text fields
      if (reportData.merchant) {
        reportData.merchant = sanitizeText(reportData.merchant, 100);
      }
      if (reportData.description) {
        reportData.description = sanitizeText(reportData.description, 500);
      }
      
      // Log automation trigger for audit
      console.log('Automation triggered:', {
        report_id: reportData.report_id,
        ip: clientIp,
        timestamp: new Date().toISOString()
      });
      
      // Process report through automation
      await automationService.processNewReport(reportData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Report automation completed successfully',
        report_id: reportData.report_id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Automation error:', error);
      res.status(500).json({ 
        error: 'Automation processing failed',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }
  
  if (req.method === 'GET') {
    try {
      const { report_id, export: exportLogs } = req.query;
      
      // Validate report_id parameter
      if (report_id && typeof report_id === 'string' && !validateReportId(report_id)) {
        return res.status(400).json({ 
          error: 'Invalid report ID format',
          timestamp: new Date().toISOString()
        });
      }
      
      if (exportLogs === 'true') {
        // Export functionality - additional security check
        const exportData = await automationService.exportAutomationLogs();
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="automation-logs-${new Date().toISOString().split('T')[0]}.txt"`);
        res.status(200).send(exportData);
        return;
      }
      
      if (report_id) {
        // Get logs for specific report
        const logs = await automationService.getAutomationLogsForReport(report_id as string);
        res.status(200).json({ logs, count: logs.length, timestamp: new Date().toISOString() });
      } else {
        // Get organized log sections
        const sections = automationService.getAutomationLogSections();
        res.status(200).json({ sections, timestamp: new Date().toISOString() });
      }
      
    } catch (error) {
      console.error('Log retrieval error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve logs',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}