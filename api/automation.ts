import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ReportAutomationService } from '../src/services/ReportAutomationService';
import type { Report } from '../src/domain/types';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const automationService = new ReportAutomationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      const reportData: Report = req.body;
      
      // Validate required fields
      if (!reportData.report_id || !reportData.location || !reportData.merchant || !reportData.timestamp) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['report_id', 'location', 'merchant', 'timestamp'],
          timestamp: new Date().toISOString()
        });
      }
      
      // Process the report through automation
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
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }
  
  if (req.method === 'GET') {
    try {
      const { report_id, export: exportLogs } = req.query;
      
      if (exportLogs === 'true') {
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
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}