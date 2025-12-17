import type { Report } from '../domain/types';
import type { AutomationLog, ValidationResult, DuplicateCheckResult, EmailNotificationData } from '../domain/automation';
import type { ReportFilter } from '../domain/types';
import { InMemoryReportRepository } from '../infrastructure/InMemoryReportRepository';

export class ReportAutomationService {
    private reportRepository = new InMemoryReportRepository();
    private automationLogs: AutomationLog[] = [];
    private readonly EMAIL_RECIPIENT = 'Monroedoses@gmail.com';
    private readonly NO_REPLY_EMAIL = 'no-reply@skimmer-report.vercel.app';

    // Initialize daily summary on service start
    constructor() {
        this.scheduleDailySummary();
    }

    // Main automation entry point
    async processNewReport(report: Report): Promise<void> {
        const logId = this.generateLogId();
        
        try {
            await this.logAutomation({
                id: logId,
                report_id: report.report_id,
                action: 'validation_started',
                details: `Starting validation for report ${report.report_id}`,
                status: 'pending',
                timestamp: new Date().toISOString()
            });

            // Step 1: Validate required fields
            const validation = await this.validateReport(report);
            await this.logAutomation({
                id: this.generateLogId(),
                report_id: report.report_id,
                action: 'validation_completed',
                details: validation.isValid ? 'Validation passed' : `Validation failed: ${validation.errors.join(', ')}`,
                status: validation.isValid ? 'success' : 'failure',
                timestamp: new Date().toISOString()
            });

            if (!validation.isValid) {
                await this.updateReportStatus(report.report_id, 'Rejected', validation.errors.join('; '));
                return;
            }

            // Step 2: Check for duplicates
            const duplicateCheck = await this.checkForDuplicates(report);
            if (duplicateCheck.isDuplicate) {
                await this.logAutomation({
                    id: this.generateLogId(),
                    report_id: report.report_id,
                    action: 'duplicate_detected',
                    details: `Duplicate report found: ${duplicateCheck.duplicateId}`,
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
                await this.updateReportStatus(report.report_id, 'Rejected', 'Duplicate report');
                return;
            }

            // Step 3: Confirm report and send real-time notification
            await this.updateReportStatus(report.report_id, 'Confirmed');
            await this.sendConfirmedEmailNotification(report);

        } catch (error) {
            await this.handleError(report.report_id, error);
        }
    }

    private async validateReport(report: Report): Promise<ValidationResult> {
        const errors: string[] = [];

        if (!report.report_id || report.report_id.trim() === '') {
            errors.push('report_id is required');
        }

        if (!report.location || 
            typeof report.location.latitude !== 'number' || 
            typeof report.location.longitude !== 'number') {
            errors.push('Valid location with latitude and longitude is required');
        }

        if (!report.merchant || report.merchant.trim() === '') {
            errors.push('merchant is required');
        }

        if (!report.timestamp || !isValidDate(report.timestamp)) {
            errors.push('Valid timestamp is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private async checkForDuplicates(report: Report): Promise<DuplicateCheckResult> {
        const existingReports = await this.reportRepository.getReports({
            center: report.location,
            radius: 100
        });
        
        // Check for reports with same merchant within 24 hours
        const reportTime = new Date(report.timestamp);
        
        for (const existingReport of existingReports) {
            if (existingReport.report_id === report.report_id) continue;
            
            const existingTime = new Date(existingReport.timestamp);
            const timeDiff = Math.abs(reportTime.getTime() - existingTime.getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff <= 24 && 
                existingReport.merchant.toLowerCase() === report.merchant.toLowerCase()) {
                return {
                    isDuplicate: true,
                    duplicateId: existingReport.report_id
                };
            }
        }

        return { isDuplicate: false };
    }

    private async updateReportStatus(report_id: string, status: 'Confirmed' | 'Rejected' | 'Error', reason?: string): Promise<void> {
        try {
            const reports = await this.reportRepository.getReports();
            const reportIndex = reports.findIndex(r => r.report_id === report_id);
            
            if (reportIndex !== -1) {
                const updatedReport = {
                    ...reports[reportIndex],
                    status,
                    reason,
                    lastEvaluatedAt: new Date().toISOString()
                };
                
                await this.reportRepository.updateReport(report_id, updatedReport);
                
                await this.logAutomation({
                    id: this.generateLogId(),
                    report_id,
                    action: 'status_updated',
                    details: `Status updated to ${status}${reason ? ': ' + reason : ''}`,
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            await this.logAutomation({
                id: this.generateLogId(),
                report_id,
                action: 'status_updated',
                details: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'failure',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async sendConfirmedEmailNotification(report: Report): Promise<void> {
        try {
            const emailData: EmailNotificationData = {
                to: this.EMAIL_RECIPIENT,
                from: this.NO_REPLY_EMAIL,
                subject: `Skimmer Report Confirmed – ${report.report_id}`,
                body: this.generateConfirmedEmailBody(report),
                report_id: report.report_id
            };

            await this.sendEmail(emailData);

            await this.logAutomation({
                id: this.generateLogId(),
                report_id: report.report_id,
                action: 'email_sent',
                details: `Real-time email sent to ${this.EMAIL_RECIPIENT}`,
                status: 'success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            await this.logAutomation({
                id: this.generateLogId(),
                report_id: report.report_id,
                action: 'email_sent',
                details: `Failed to send real-time email: ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'failure',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private generateConfirmedEmailBody(report: Report): string {
        return `Hello,

A new skimmer report has been confirmed on SkimmerWatch.

Report Details:
- Report ID: ${report.report_id}
- Location: ${report.location.latitude}, ${report.location.longitude}
- Merchant: ${report.merchant}
- Timestamp: ${report.timestamp}
- Status: Confirmed

View Report: https://skimmer-report.vercel.app/reports/${report.report_id}

This is an automated notification. No reply needed.

Thank you,
SkimmerWatch Automation`;
    }

    private async sendEmail(emailData: EmailNotificationData): Promise<void> {
        if (typeof fetch !== 'undefined') {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                throw new Error(`Email send failed: ${response.statusText}`);
            }
        } else {
            console.log('Email would be sent:', emailData);
        }
    }

    private async handleError(report_id: string, error: unknown): Promise<void> {
        await this.logAutomation({
            id: this.generateLogId(),
            report_id,
            action: 'error_occurred',
            details: `Automation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'failure',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Send daily summary at 11:59 PM server time
    private scheduleDailySummary(): void {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(11, 59, 0, 0);

        const msUntilDaily = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            console.log('Daily summary would be sent');
        }, msUntilDaily);
    }

    private async logAutomation(log: AutomationLog): Promise<void> {
        this.automationLogs.push(log);
        console.log('Automation Log:', log);
    }

    private generateLogId(): string {
        return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Public methods for accessing automation logs
    async getAutomationLogs(): Promise<AutomationLog[]> {
        return [...this.automationLogs];
    }

    async getAutomationLogsForReport(report_id: string): Promise<AutomationLog[]> {
        return this.automationLogs.filter(log => log.report_id === report_id);
    }
}

// Helper function
function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}