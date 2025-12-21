/**
 * Security audit logging and monitoring system
 */

export interface SecurityEvent {
    timestamp: string;
    event_type: 'blocked_request' | 'rate_limit_exceeded' | 'invalid_input' | 'suspicious_activity' | 'automation_trigger' | 'email_sent' | 'csp_violation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip_address?: string;
    user_agent?: string;
    details: Record<string, any>;
    endpoint?: string;
    method?: string;
    status_code?: number;
}

class SecurityLogger {
    private static instance: SecurityLogger;
    private events: SecurityEvent[] = [];
    private readonly MAX_EVENTS = 1000; // Keep last 1000 events
    
    static getInstance(): SecurityLogger {
        if (!SecurityLogger.instance) {
            SecurityLogger.instance = new SecurityLogger();
        }
        return SecurityLogger.instance;
    }
    
    logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
        const securityEvent: SecurityEvent = {
            ...event,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(securityEvent);
        
        // Maintain size limit
        if (this.events.length > this.MAX_EVENTS) {
            this.events = this.events.slice(-this.MAX_EVENTS);
        }
        
        // Log to console for immediate visibility
        const logLevel = this.getLogLevel(securityEvent.severity);
        console[logLevel](`SECURITY: ${securityEvent.event_type}`, {
            ...securityEvent,
            // Don't log full user agents in production to reduce PII
            user_agent: securityEvent.user_agent?.substring(0, 100) + '...'
        });
        
        // In production, send to external monitoring service
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
            this.sendToMonitoringService(securityEvent);
        }
    }
    
    private getLogLevel(severity: SecurityEvent['severity']): 'log' | 'warn' | 'error' {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            default:
                return 'log';
        }
    }
    
    private async sendToMonitoringService(event: SecurityEvent): Promise<void> {
        // In production, integrate with:
        // - Vercel Analytics
        // - Sentry
        // - Datadog
        // - Custom webhook
        
        try {
            if (process.env.SECURITY_WEBHOOK_URL) {
                await fetch(process.env.SECURITY_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });
            }
        } catch (error) {
            console.error('Failed to send security event to monitoring service:', error);
        }
    }
    
    getEvents(filter?: {
        event_type?: SecurityEvent['event_type'];
        severity?: SecurityEvent['severity'];
        since?: string;
        limit?: number;
    }): SecurityEvent[] {
        let filtered = [...this.events];
        
        if (filter) {
            if (filter.event_type) {
                filtered = filtered.filter(e => e.event_type === filter.event_type);
            }
            if (filter.severity) {
                filtered = filtered.filter(e => e.severity === filter.severity);
            }
            if (filter.since) {
                const sinceDate = new Date(filter.since);
                filtered = filtered.filter(e => new Date(e.timestamp) >= sinceDate);
            }
            if (filter.limit) {
                filtered = filtered.slice(-filter.limit);
            }
        }
        
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    getSecurityMetrics(): {
        total_events: number;
        events_by_type: Record<string, number>;
        events_by_severity: Record<string, number>;
        last_24h: number;
        critical_in_last_hour: number;
    } {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        
        const last24hEvents = this.events.filter(e => new Date(e.timestamp) >= last24h);
        const criticalLastHour = this.events.filter(e => 
            e.severity === 'critical' && new Date(e.timestamp) >= lastHour
        );
        
        const eventsByType: Record<string, number> = {};
        const eventsBySeverity: Record<string, number> = {};
        
        this.events.forEach(event => {
            eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
            eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        });
        
        return {
            total_events: this.events.length,
            events_by_type: eventsByType,
            events_by_severity: eventsBySeverity,
            last_24h: last24hEvents.length,
            critical_in_last_hour: criticalLastHour.length
        };
    }
    
    clearEvents(): void {
        this.events = [];
    }
    
    exportEvents(): string {
        const data = {
            exported_at: new Date().toISOString(),
            total_events: this.events.length,
            events: this.events,
            metrics: this.getSecurityMetrics()
        };
        
        return JSON.stringify(data, null, 2);
    }
}

export const securityLogger = SecurityLogger.getInstance();

// Convenience functions for common security events
export const logBlockedRequest = (ip: string, reasons: string[], endpoint?: string, method?: string): void => {
    securityLogger.logEvent({
        event_type: 'blocked_request',
        severity: 'medium',
        ip_address: ip,
        endpoint,
        method,
        details: { reasons }
    });
};

export const logRateLimitExceeded = (ip: string, endpoint?: string): void => {
    securityLogger.logEvent({
        event_type: 'rate_limit_exceeded',
        severity: 'high',
        ip_address: ip,
        endpoint,
        details: { message: 'Rate limit exceeded' }
    });
};

export const logInvalidInput = (field: string, value: any, ip?: string): void => {
    securityLogger.logEvent({
        event_type: 'invalid_input',
        severity: 'medium',
        ip_address: ip,
        details: { 
            field,
            value_type: typeof value,
            value_preview: typeof value === 'string' ? value.substring(0, 50) : String(value)
        }
    });
};

export const logSuspiciousActivity = (ip: string, activity: string, details: Record<string, any>): void => {
    securityLogger.logEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        ip_address: ip,
        details: { activity, ...details }
    });
};

export const logAutomationTrigger = (report_id: string, ip: string, success: boolean): void => {
    securityLogger.logEvent({
        event_type: 'automation_trigger',
        severity: success ? 'low' : 'medium',
        ip_address: ip,
        details: { report_id, success }
    });
};

export const logEmailSent = (to: string, subject: string, success: boolean): void => {
    securityLogger.logEvent({
        event_type: 'email_sent',
        severity: success ? 'low' : 'medium',
        details: { 
            to: to.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
            subject: subject.substring(0, 50),
            success 
        }
    });
};

export const logCSPViolation = (violation: any): void => {
    securityLogger.logEvent({
        event_type: 'csp_violation',
        severity: 'medium',
        details: {
            blocked_uri: violation.blockedURI,
            document_uri: violation.documentURI,
            effective_directive: violation.effectiveDirective,
            referrer: violation.referrer
        }
    });
};