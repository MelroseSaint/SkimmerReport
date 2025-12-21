export interface AutomationLog {
    id: string;
    report_id: string;
    action: 'validation_started' | 'validation_completed' | 'duplicate_detected' | 'status_updated' | 'email_sent' | 'error_occurred' | 'retry_attempted' | 'daily_summary_sent' | 'daily_summary_failed';
    details: string;
    status: 'success' | 'failure' | 'pending';
    timestamp: string; // ISO string
    error?: string;
    retryCount?: number;
}

export interface AutomationLogSection {
    confirmedReports: AutomationLog[];
    unconfirmedReports: AutomationLog[];
    emailActivity: AutomationLog[];
    errors: AutomationLog[];
}

export interface DailySummaryData {
    date: string;
    confirmedReports: import('./types.js').Report[];
    unconfirmedReports: import('./types.js').Report[];

    totalConfirmed: number;
    totalUnconfirmed: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateId?: string;
}

export interface EmailNotificationData {
    to: string;
    subject: string;
    body: string;
    report_id: string;
    from?: string;
}