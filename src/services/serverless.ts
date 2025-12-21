import type { ReportFilter } from '../domain/types.js';
import { AdminInstantReportRepository } from '../infrastructure/AdminInstantReportRepository.js';

import { ReportService } from './ReportService.js';
import {
    sanitizeText,
    sanitizeMerchant,
    sanitizeCoordinates,
    validateReportId,
    validateTimestamp,
    validateObservationType,
    validateCategory,
    rateLimiter,
    detectSuspiciousRequest,
    getClientIp,
    setSecurityHeaders
} from '../security/validation.js';


const repo = new AdminInstantReportRepository();
const service = new ReportService(repo);


// Enhanced request validation
export async function postReports(event: { body: any; headers?: any }) {
    const res = { setHeader: () => { } }; // Mock response for security headers

    try {
        // Set security headers
        setSecurityHeaders(res);

        // Detect suspicious requests
        const suspicious = detectSuspiciousRequest({ headers: event.headers });
        if (suspicious.isSuspicious) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Request blocked for security reasons',
                    reasons: suspicious.reasons
                })
            };
        }

        // Rate limiting
        const clientIp = getClientIp(event);
        if (!rateLimiter.isAllowed(clientIp)) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Rate limit exceeded',
                    remaining: rateLimiter.getRemainingRequests(clientIp)
                })
            };
        }

        const body = event.body || {};

        // Validate and sanitize location
        const sanitizedLocation = sanitizeCoordinates(body.location?.latitude, body.location?.longitude);
        if (!sanitizedLocation) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid coordinates provided' }) };
        }

        // Validate and sanitize merchant
        const sanitizedMerchant = sanitizeMerchant(body.merchant);

        // Validate category
        if (!validateCategory(body.category)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid category provided' }) };
        }

        // Validate observation type
        if (!validateObservationType(body.observationType)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid observation type provided' }) };
        }

        // Validate and sanitize description
        const sanitizedDescription = sanitizeText(body.description || '');

        // Validate report ID if provided
        if (body.report_id && !validateReportId(body.report_id)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid report ID format' }) };
        }

        // Validate timestamp if provided
        if (body.timestamp && !validateTimestamp(body.timestamp)) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid timestamp provided' }) };
        }

        const report = await service.submitReport(
            sanitizedLocation,
            body.category,
            body.observationType,
            sanitizedDescription || undefined,
            sanitizedMerchant
        );

        return {
            statusCode: 201,
            body: JSON.stringify({
                ...report,
                // Remove sensitive internal data
                confidenceScore: report.confidenceScore ? Math.round(report.confidenceScore * 100) / 100 : undefined
            })
        };

    } catch (error) {
        console.error('Report submission error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to process report submission'
            })
        };
    }
}

export async function getReports(_event: { query?: ReportFilter; headers?: any }) {
    const res = { setHeader: () => { } };

    try {
        // Set security headers
        setSecurityHeaders(res);

        // Detect suspicious requests
        const suspicious = detectSuspiciousRequest({ headers: _event.headers });
        if (suspicious.isSuspicious) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Request blocked for security reasons',
                    reasons: suspicious.reasons
                })
            };
        }

        // Rate limiting for data access
        const clientIp = getClientIp(_event);
        if (!rateLimiter.isAllowed(clientIp)) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Rate limit exceeded',
                    remaining: rateLimiter.getRemainingRequests(clientIp)
                })
            };
        }

        const reports = await service.getReports(_event.query);

        // Sanitize report data for output
        const sanitizedReports = reports.map(report => ({
            ...report,
            // Remove sensitive internal data from public API
            confidenceScore: report.confidenceScore ? Math.round(report.confidenceScore * 100) / 100 : undefined,
            // Remove any potentially sensitive description content
            description: report.description ? sanitizeText(report.description) : undefined,
            // Ensure coordinates are properly rounded for privacy
            location: {
                latitude: Math.round(report.location.latitude * 10000) / 10000,
                longitude: Math.round(report.location.longitude * 10000) / 10000
            }
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(sanitizedReports)
        };

    } catch (error) {
        console.error('Reports fetch error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to retrieve reports'
            })
        };
    }
}
