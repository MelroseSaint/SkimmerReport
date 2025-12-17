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
      
      // Validate that we have the required report data
      if (!reportData) {
        return res.status(400).json({ 
          error: 'Missing report data',
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
      const { report_id } = req.query;
      
      if (report_id) {
        // Get logs for specific report
        const logs = await automationService.getAutomationLogsForReport(report_id as string);
        res.status(200).json({ logs, timestamp: new Date().toISOString() });
      } else {
        // Get all automation logs
        const logs = await automationService.getAutomationLogs();
        res.status(200).json({ logs, timestamp: new Date().toISOString() });
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