/**
 * Security utilities for input validation, sanitization, and abuse prevention
 */

// Character sets for validation
const ALLOWED_TEXT_CHARS = /^[a-zA-Z0-9\s\-.,#'@:/&()]+$/;
const ALLOWED_MERCHANT_CHARS = /^[a-zA-Z0-9\s\-.,#'@:&()]+$/;
const COORDINATE_PRECISION = 6;
const MAX_TEXT_LENGTH = 500;
const MAX_MERCHANT_LENGTH = 100;
const MAX_REPORT_ID_LENGTH = 50;

/**
 * Sanitizes text input to prevent XSS and injection attacks
 */
export function sanitizeText(input: string, maxLength: number = MAX_TEXT_LENGTH): string {
    if (typeof input !== 'string') return '';
    
    // Remove potential XSS patterns
    let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/eval\s*\(/gi, '')
        .replace(/expression\s*\(/gi, '');

    // Limit length
    sanitized = sanitized.substring(0, maxLength);
    
    // Validate characters
    if (!ALLOWED_TEXT_CHARS.test(sanitized)) {
        // Remove invalid characters
        sanitized = sanitized.replace(/[^\sa-zA-Z0-9\-.,#'@:/&()]/g, '');
    }
    
    return sanitized.trim();
}

/**
 * Validates and sanitizes merchant name
 */
export function sanitizeMerchant(input: string): string {
    if (typeof input !== 'string') return 'Unknown';
    
    let sanitized = sanitizeText(input, MAX_MERCHANT_LENGTH);
    
    if (!ALLOWED_MERCHANT_CHARS.test(sanitized)) {
        sanitized = sanitized.replace(/[^\sa-zA-Z0-9\-.,#'@:&()]/g, '');
    }
    
    // Remove common abusive patterns
    const abusivePatterns = [
        /police/i,
        /fbi/i,
        /law enforcement/i,
        /official/i,
        /government/i,
        /investigation/i,
        /case\s*\#/i,
        /warrant/i,
        /subpoena/i
    ];
    
    for (const pattern of abusivePatterns) {
        sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized.trim() || 'Unknown';
}

/**
 * Validates and sanitizes geographic coordinates
 */
export function sanitizeCoordinates(lat: any, lon: any): { latitude: number; longitude: number } | null {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) return null;
    if (latNum < -90 || latNum > 90) return null;
    if (lonNum < -180 || lonNum > 180) return null;
    
    // Round to reasonable precision to prevent coordinate fingerprinting
    return {
        latitude: Math.round(latNum * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION),
        longitude: Math.round(lonNum * Math.pow(10, COORDINATE_PRECISION)) / Math.pow(10, COORDINATE_PRECISION)
    };
}

/**
 * Validates report ID format
 */
export function validateReportId(reportId: any): boolean {
    if (typeof reportId !== 'string') return false;
    if (reportId.length > MAX_REPORT_ID_LENGTH) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(reportId)) return false;
    return true;
}

/**
 * Validates ISO timestamp and prevents date injection
 */
export function validateTimestamp(timestamp: any): boolean {
    if (typeof timestamp !== 'string') return false;
    
    // Basic ISO format validation
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoRegex.test(timestamp)) return false;
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return false;
    
    // Prevent dates too far in the past or future
    const now = new Date();
    const maxPast = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const maxFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    return date >= maxPast && date <= maxFuture;
}

/**
 * Validates observation type
 */
export function validateObservationType(type: any): type is string {
    const validTypes = ['Loose card slot', 'Overlay', 'Camera suspected', 'Fraud after use', 'Other'];
    return typeof type === 'string' && validTypes.includes(type);
}

/**
 * Validates report category
 */
export function validateCategory(category: any): category is string {
    const validCategories = ['ATM', 'Gas pump', 'Store POS'];
    return typeof category === 'string' && validCategories.includes(category);
}

/**
 * Rate limiting interface
 */
interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

class RateLimiter {
    private static instance: RateLimiter;
    private limits = new Map<string, RateLimitEntry>();
    private readonly MAX_REQUESTS_PER_HOUR = 10;
    private readonly HOUR_IN_MS = 60 * 60 * 1000;

    static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    isAllowed(identifier: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(identifier);
        
        if (!entry) {
            this.limits.set(identifier, { count: 1, firstRequest: now });
            return true;
        }
        
        // Reset if hour has passed
        if (now - entry.firstRequest > this.HOUR_IN_MS) {
            this.limits.set(identifier, { count: 1, firstRequest: now });
            return true;
        }
        
        // Check limit
        if (entry.count >= this.MAX_REQUESTS_PER_HOUR) {
            return false;
        }
        
        entry.count++;
        return true;
    }

    getRemainingRequests(identifier: string): number {
        const entry = this.limits.get(identifier);
        if (!entry) return this.MAX_REQUESTS_PER_HOUR;
        
        const now = Date.now();
        if (now - entry.firstRequest > this.HOUR_IN_MS) {
            return this.MAX_REQUESTS_PER_HOUR;
        }
        
        return Math.max(0, this.MAX_REQUESTS_PER_HOUR - entry.count);
    }

    // Cleanup old entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now - entry.firstRequest > this.HOUR_IN_MS * 24) { // Keep for 24 hours
                this.limits.delete(key);
            }
        }
    }
}

export const rateLimiter = RateLimiter.getInstance();

/**
 * Content Security Policy violations logger
 */
export function logCSPViolation(violation: any): void {
    console.warn('CSP Violation:', {
        blockedURI: violation.blockedURI,
        documentURI: violation.documentURI,
        effectiveDirective: violation.effectiveDirective,
        originalPolicy: violation.originalPolicy,
        referrer: violation.referrer,
        sourceFile: violation.sourceFile,
        timestamp: new Date().toISOString()
    });
}

/**
 * Security headers for API responses
 */
export function setSecurityHeaders(res: any): void {
    if (!res) return;
    
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
    
    for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
    }
}

/**
 * Bot detection heuristics
 */
export function detectSuspiciousRequest(req: { headers?: Record<string, string | string[] | undefined>; method?: string; url?: string; body?: unknown }): { isSuspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
// Check for missing or suspicious User-Agent
    const userAgentHeader = req.headers?.['user-agent'];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] || '' : userAgentHeader || '';
    if (!userAgent || userAgent.length < 10) {
        reasons.push('Missing or short User-Agent');
    }
    
    // Check for common bot signatures
    const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
        /node/i,
        /go-http/i,
        /postman/i,
        /insomnia/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
        reasons.push('Bot-like User-Agent detected');
}
    
    // Check for missing required headers
    if (!req.headers?.['accept']) {
        reasons.push('Missing Accept header');
    }
    
    // Do not perform rate limiting here; leave it to explicit checks in handlers
    return {
        isSuspicious: reasons.length > 0,
        reasons
    };
}

/**
 * Extract client IP safely
 */
export function getClientIp(req: any): string {
    // Try various headers for real IP, fallback to connection remote address
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return (forwarded as string).split(',')[0].trim();
    }
    
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp as string;
    }
    
    return req.connection?.remoteAddress || 'unknown';
}

/**
 * Anti-automation token generator
 */
export function generateAntiBotToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    const token = Buffer.from(`${timestamp}-${random}`).toString('base64');
    return token.substring(0, 32);
}

/**
 * Validate anti-bot token (basic timestamp validation)
 */
export function validateAntiBotToken(token: string, maxAgeMs: number = 30 * 60 * 1000): boolean {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [timestamp] = decoded.split('-');
        const tokenTime = parseInt(timestamp);
        
        if (isNaN(tokenTime)) return false;
        
        const now = Date.now();
        const age = now - tokenTime;
        
        return age >= 0 && age <= maxAgeMs;
    } catch {
        return false;
    }
}