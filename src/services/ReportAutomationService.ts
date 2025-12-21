import type { Report } from '../domain/types';
import type { AutomationLog, ValidationResult, DuplicateCheckResult, EmailNotificationData } from '../domain/automation';
import { AdminInstantReportRepository } from '../infrastructure/AdminInstantReportRepository';


interface DailySummaryData {
    date: string;
    confirmedReports: Report[];
    unconfirmedReports: Report[];
    totalConfirmed: number;
    totalUnconfirmed: number;
}

export class ReportAutomationService {
    private reportRepository = new AdminInstantReportRepository();

    private automationLogs: AutomationLog[] = [];
    private readonly EMAIL_RECIPIENT = 'Monroedoses@gmail.com';
    private readonly NO_REPLY_EMAIL = 'no-reply@skimmer-report.vercel.app';
    private dailySummaryTimer?: NodeJS.Timeout;

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

            // Step 3: Corroborate report and send real-time notification
            await this.updateReportStatus(report.report_id, 'Community Supported');
            await this.sendCorroboratedEmailNotification(report);

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
        const filter = {
            center: report.location,
            radius: 100
        };
        const existingReports = await this.reportRepository.getAll(filter);


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

    private async updateReportStatus(report_id: string, status: 'Community Supported' | 'Rejected' | 'Error', reason?: string): Promise<void> {
        try {
            const reports = await this.reportRepository.getAll();
            const report = reports.find(r => r.report_id === report_id);

            if (report) {
                const updatedReport = {
                    ...report,
                    status,
                    reason,
                    lastEvaluatedAt: new Date().toISOString()
                };

                await this.reportRepository.save(updatedReport);


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

    private async sendCorroboratedEmailNotification(report: Report): Promise<void> {
        try {
            const emailData: EmailNotificationData = {
                to: this.EMAIL_RECIPIENT,
                from: this.NO_REPLY_EMAIL,
                subject: `Skimmer Report Corroborated – ${report.report_id}`,
                body: this.generateCorroboratedEmailBody(report),
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

            // Set report status to Error and trigger error handling
            await this.updateReportStatus(report.report_id, 'Error', `Email notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            await this.handleError(report.report_id, error);
        }
    }

    private generateCorroboratedEmailBody(report: Report): string {
        return `Hello,

A new skimmer report has been corroborated on SkimmerWatch.

Report Details:
- Report ID: ${report.report_id}
- Location: ${report.location.latitude}, ${report.location.longitude}
- Merchant: ${report.merchant}
- Timestamp: ${report.timestamp}
- Status: Community Supported

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
        tomorrow.setHours(23, 59, 0, 0);

        const msUntilDaily = tomorrow.getTime() - now.getTime();

        this.dailySummaryTimer = setTimeout(() => {
            this.sendDailySummary();
            // Schedule next day's summary
            this.scheduleDailySummary();
        }, msUntilDaily);
    }

    // Enhanced daily summary functionality
    public async sendDailySummary(): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const summaryData = await this.generateDailySummaryData(today);

            const emailData: EmailNotificationData = {
                to: this.EMAIL_RECIPIENT,
                from: this.NO_REPLY_EMAIL,
                subject: `SkimmerWatch Daily Report Summary – ${today}`,
                body: this.generateDailySummaryEmailBody(summaryData),
                report_id: 'daily_summary'
            };

            await this.sendEmail(emailData);

            await this.logAutomation({
                id: this.generateLogId(),
                report_id: 'daily_summary',
                action: 'daily_summary_sent',
                details: `Daily summary sent for ${today}. Confirmed: ${summaryData.totalConfirmed}, Unconfirmed: ${summaryData.totalUnconfirmed}`,
                status: 'success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            await this.logAutomation({
                id: this.generateLogId(),
                report_id: 'daily_summary',
                action: 'daily_summary_failed',
                details: `Failed to send daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'failure',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async generateDailySummaryData(date: string): Promise<DailySummaryData> {
        const allReports = await this.reportRepository.getAll();

        const todayReports = allReports.filter(report =>
            report.timestamp.split('T')[0] === date
        );

        const confirmedReports = todayReports.filter(report => report.status === 'Community Supported');
        const unconfirmedReports = todayReports.filter(report =>
            report.status === 'Rejected' || report.status === 'Under Review' || report.status === 'Error'
        );

        return {
            date,
            confirmedReports,
            unconfirmedReports,
            totalConfirmed: confirmedReports.length,
            totalUnconfirmed: unconfirmedReports.length
        };
    }

    private generateDailySummaryEmailBody(summary: DailySummaryData): string {
        let body = `Hello,\n\nDaily Skimmer Report Summary – ${summary.date}\n\n`;

        if (summary.confirmedReports.length > 0) {
            body += `Confirmed Reports:\n`;
            summary.confirmedReports.forEach(report => {
                body += `- ${report.report_id} | ${report.location.latitude}, ${report.location.longitude} | ${report.merchant} | ${report.timestamp}\n`;
            });
            body += `\n`;
        } else {
            body += `Confirmed Reports:\n- None\n\n`;
        }

        if (summary.unconfirmedReports.length > 0) {
            body += `Unconfirmed Reports:\n`;
            summary.unconfirmedReports.forEach(report => {
                body += `- ${report.report_id} | ${report.location.latitude}, ${report.location.longitude} | ${report.merchant} | ${report.timestamp} | Status: ${report.status}\n`;
            });
        } else {
            body += `Unconfirmed Reports:\n- None\n`;
        }

        body += `\nThis is an automated summary. No reply needed.\n\nThank you,\nSkimmerWatch Automation`;

        return body;
    }

    private async logAutomation(log: AutomationLog): Promise<void> {
        this.automationLogs.push(log);
        console.log('Automation Log:', log);
    }

    private generateLogId(): string {
        return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Enhanced logging with separate sections
    getAutomationLogSections(): {
        confirmedReports: AutomationLog[];
        unconfirmedReports: AutomationLog[];
        emailActivity: AutomationLog[];
        errors: AutomationLog[];
    } {
        const confirmedReports = this.automationLogs.filter(log =>
            log.action === 'status_updated' && log.details.includes('Community Supported')
        );

        const unconfirmedReports = this.automationLogs.filter(log =>
            (log.action === 'status_updated' && log.details.includes('Rejected')) ||
            (log.action === 'duplicate_detected') ||
            (log.action === 'validation_completed' && log.status === 'failure')
        );

        const emailActivity = this.automationLogs.filter(log =>
            log.action === 'email_sent' || log.action === 'daily_summary_sent'
        );

        const errors = this.automationLogs.filter(log =>
            log.status === 'failure' || log.action === 'error_occurred'
        );

        return {
            confirmedReports,
            unconfirmedReports,
            emailActivity,
            errors
        };
    }

    async exportAutomationLogs(): Promise<string> {
        const sections = this.getAutomationLogSections();

        let exportText = `SkimmerWatch Automation Log Export\n`;
        exportText += `Generated: ${new Date().toISOString()}\n\n`;

        exportText += `=== CONFIRMED REPORTS (${sections.confirmedReports.length}) ===\n`;
        sections.confirmedReports.forEach(log => {
            exportText += `[${log.timestamp}] ${log.report_id}: ${log.details}\n`;
        });

        exportText += `\n=== UNCONFIRMED REPORTS (${sections.unconfirmedReports.length}) ===\n`;
        sections.unconfirmedReports.forEach(log => {
            exportText += `[${log.timestamp}] ${log.report_id}: ${log.details}\n`;
        });

        exportText += `\n=== EMAIL ACTIVITY (${sections.emailActivity.length}) ===\n`;
        sections.emailActivity.forEach(log => {
            exportText += `[${log.timestamp}] ${log.report_id}: ${log.details}\n`;
        });

        exportText += `\n=== ERRORS (${sections.errors.length}) ===\n`;
        sections.errors.forEach(log => {
            exportText += `[${log.timestamp}] ${log.report_id}: ${log.details}${log.error ? ' | Error: ' + log.error : ''}\n`;
        });

        return exportText;
    }

    // Public methods for accessing automation logs
    async getAutomationLogs(): Promise<AutomationLog[]> {
        return [...this.automationLogs];
    }

    async getAutomationLogsForReport(report_id: string): Promise<AutomationLog[]> {
        return this.automationLogs.filter(log => log.report_id === report_id);
    }

    // Cleanup method
    destroy(): void {
        if (this.dailySummaryTimer) {
            clearTimeout(this.dailySummaryTimer);
        }
    }
}

// Helper function
function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}