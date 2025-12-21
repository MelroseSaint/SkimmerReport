/**
 * Data protection and privacy controls
 */

import type { Report, Location } from '../domain/types';

/**
 * Enhanced location fuzzing for privacy protection
 */
export function fuzzLocation(location: Location, precisionMeters: number = 150): Location {
    // Add random jitter to prevent exact location identification
    const earthRadius = 6371000; // Earth's radius in meters
    const jitterRadius = precisionMeters / earthRadius;
    
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * jitterRadius;
    
    const lat = location.latitude + randomRadius * Math.cos(randomAngle) * (180 / Math.PI);
    const lon = location.longitude + randomRadius * Math.sin(randomAngle) * (180 / Math.PI) / Math.cos(location.latitude * Math.PI / 180);
    
    // Round to reasonable precision
    return {
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000
    };
}

/**
 * Sanitize report data for public API responses
 */
export function sanitizeReportForPublic(report: Report): Omit<Report, 'confidenceScore' | 'lastEvaluatedAt' | 'confirmationReason' | 'statusReason'> {
    return {
        id: report.id,
        report_id: report.report_id,
        location: fuzzLocation(report.location, 150),
        merchant: sanitizeMerchantName(report.merchant),
        category: report.category,
        observationType: report.observationType,
        description: report.description ? sanitizeDescription(report.description) : undefined,
        timestamp: report.timestamp,
        status: report.status
    };
}

/**
 * Sanitize merchant names to remove PII
 */
function sanitizeMerchantName(merchant: string): string {
    if (!merchant || merchant === 'Unknown') return 'Unknown';
    
    // Remove potential personal information
    let sanitized = merchant
        .replace(/\b\d{3}-\d{3}-\d{4}\b/g, 'XXX-XXX-XXXX') // Phone numbers
        .replace(/\b\d{3}\s\d{3}\s\d{4}\b/g, 'XXX XXX XXXX') // Phone numbers with spaces
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'email@example.com') // Emails
        .replace(/\b\d{1,5}\s+[^,\s]+(?:\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|pl|place|way))\b/gi, 'XXXX Address') // Street addresses
        .trim();
    
    // Limit length to prevent data leakage
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 97) + '...';
    }
    
    return sanitized || 'Unknown';
}

/**
 * Sanitize descriptions to remove PII and harmful content
 */
function sanitizeDescription(description: string): string {
    if (!description) return '';
    
    let sanitized = description
        // Remove PII patterns
        .replace(/\b\d{3}-\d{3}-\d{4}\b/g, 'XXX-XXX-XXXX')
        .replace(/\b\d{3}\s\d{3}\s\d{4}\b/g, 'XXX XXX XXXX')
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'email@example.com')
        .replace(/\b\d{1,5}\s+[^,\s]+(?:\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|pl|place|way))\b/gi, 'XXXX Address')
        // Remove SSN patterns
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX')
        // Remove credit card patterns
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX')
        // Remove potentially dangerous URLs
        .replace(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi, '[URL removed]')
        // Remove script-like content
        .replace(/<script[^>]*>.*?<\/script>/gis, '[script removed]')
        .replace(/javascript:/gi, '[javascript removed]')
        .trim();
    
    // Limit length
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 497) + '...';
    }
    
    return sanitized;
}

/**
 * Data retention policies
 */
export interface RetentionPolicy {
    maxAgeDays: number;
    anonymizeAfterDays?: number;
    deleteAfterDays?: number;
}

export const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
    reports: {
        maxAgeDays: 365,
        anonymizeAfterDays: 90,
        deleteAfterDays: 730 // 2 years
    },
    automation_logs: {
        maxAgeDays: 90,
        deleteAfterDays: 365
    },
    security_logs: {
        maxAgeDays: 180,
        deleteAfterDays: 1095 // 3 years
    }
};

/**
 * Check if data should be anonymized based on retention policy
 */
export function shouldAnonymize(timestamp: string, policy: RetentionPolicy): boolean {
    if (!policy.anonymizeAfterDays) return false;
    
    const reportDate = new Date(timestamp);
    const now = new Date();
    const ageInDays = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return ageInDays >= policy.anonymizeAfterDays;
}

/**
 * Anonymize old report data
 */
export function anonymizeReport(report: Report): Report {
    return {
        ...report,
        merchant: 'Anonymized Location',
        description: report.description ? '[Content anonymized for privacy]' : undefined,
        location: fuzzLocation(report.location, 500), // Increase fuzzing for old reports
        confidenceScore: undefined,
        confirmationReason: undefined,
        statusReason: undefined
    };
}

/**
 * Check if data should be deleted based on retention policy
 */
export function shouldDelete(timestamp: string, policy: RetentionPolicy): boolean {
    if (!policy.deleteAfterDays) return false;
    
    const reportDate = new Date(timestamp);
    const now = new Date();
    const ageInDays = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return ageInDays >= policy.deleteAfterDays;
}

/**
 * Export-safe report data (removes internal fields)
 */
export function exportSafeReports(reports: Report[]): any[] {
    return reports.map(report => ({
        id: report.id,
        report_id: report.report_id,
        location: {
            latitude: Math.round(report.location.latitude * 1000) / 1000, // Less precision for export
            longitude: Math.round(report.location.longitude * 1000) / 1000
        },
        merchant: sanitizeMerchantName(report.merchant),
        category: report.category,
        observationType: report.observationType,
        description: report.description ? sanitizeDescription(report.description) : undefined,
        timestamp: report.timestamp,
        status: report.status
        // Internal fields excluded
    }));
}

/**
 * Generate privacy compliance metadata
 */
export function generatePrivacyMetadata(): any {
    return {
        last_anonymized: new Date().toISOString(),
        retention_policies: RETENTION_POLICIES,
        data_subject_rights: [
            'Access',
            'Correction', 
            'Deletion',
            'Portability',
            'Restriction'
        ],
        legal_basis: 'Legitimate interest for community safety',
        data_controller: 'SkimmerWatch Community Platform',
        contact: 'privacy@skimmer-report.vercel.app'
    };
}