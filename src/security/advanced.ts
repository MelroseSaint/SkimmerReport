/**
 * Advanced Security Middleware
 * Additional layers of protection for the API
 */

import type { Request, Response, NextFunction } from 'express';
import { securityLogger } from './audit';
import { getClientIp } from './validation';

/**
 * IP Whitelist/Blacklist Management
 */
class IPFilterManager {
    private static instance: IPFilterManager;
    private blacklist: Set<string> = new Set();
    private whitelist: Set<string> = new Set();
    private suspiciousIPs: Map<string, number> = new Map();

    static getInstance(): IPFilterManager {
        if (!IPFilterManager.instance) {
            IPFilterManager.instance = new IPFilterManager();
        }
        return IPFilterManager.instance;
    }

    addToBlacklist(ip: string): void {
        this.blacklist.add(ip);
        securityLogger.logEvent({
            event_type: 'suspicious_activity',
            severity: 'high',
            ip_address: ip,
            details: { action: 'ip_blacklisted' }
        });
    }

    addToWhitelist(ip: string): void {
        this.whitelist.add(ip);
    }

    isBlacklisted(ip: string): boolean {
        return this.blacklist.has(ip);
    }

    isWhitelisted(ip: string): boolean {
        return this.whitelist.has(ip);
    }

    markSuspicious(ip: string): void {
        const count = (this.suspiciousIPs.get(ip) || 0) + 1;
        this.suspiciousIPs.set(ip, count);

        // Auto-blacklist after 10 suspicious activities
        if (count >= 10) {
            this.addToBlacklist(ip);
        }
    }
}

export const ipFilterManager = IPFilterManager.getInstance();

/**
 * IP Filtering Middleware
 */
export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);

    if (ipFilterManager.isBlacklisted(ip)) {
        securityLogger.logEvent({
            event_type: 'blocked_request',
            severity: 'high',
            ip_address: ip,
            endpoint: req.path,
            method: req.method,
            details: { reason: 'IP blacklisted' }
        });
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    next();
}

/**
 * Request Size Limiter (Additional DoS Protection)
 */
export function requestSizeLimiter(maxSizeKB: number = 10) {
    return (req: Request, res: Response, next: NextFunction) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxBytes = maxSizeKB * 1024;

        if (contentLength > maxBytes) {
            securityLogger.logEvent({
                event_type: 'suspicious_activity',
                severity: 'medium',
                ip_address: getClientIp(req),
                details: {
                    action: 'oversized_request',
                    size: contentLength,
                    maxAllowed: maxBytes
                }
            });
            return res.status(413).json({ error: 'Request too large' });
        }

        next();
    };
}

/**
 * Slow Request Detection (Slowloris Attack Prevention)
 */
export function slowRequestDetection(timeoutMs: number = 10000) {
    return (req: Request, res: Response, next: NextFunction) => {
        const timeout = setTimeout(() => {
            const ip = getClientIp(req);
            securityLogger.logEvent({
                event_type: 'suspicious_activity',
                severity: 'medium',
                ip_address: ip,
                details: { action: 'slow_request_detected', timeout: timeoutMs }
            });
            ipFilterManager.markSuspicious(ip);
            res.status(408).json({ error: 'Request timeout' });
        }, timeoutMs);

        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));

        next();
    };
}

/**
 * Honeypot Endpoint (Trap for bots)
 */
export function honeypotTrap(req: Request, res: Response): void {
    const ip = getClientIp(req);

    securityLogger.logEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        ip_address: ip,
        endpoint: req.path,
        method: req.method,
        details: { action: 'honeypot_triggered' }
    });

    ipFilterManager.addToBlacklist(ip);

    // Return fake success to not alert the attacker
    res.status(200).json({ success: true });
}

/**
 * CORS Configuration (Strict)
 */
export function strictCORS(allowedOrigins: string[] = []) {
    return (req: Request, res: Response, next: NextFunction) => {
        const origin = req.headers.origin;

        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }

        next();
    };
}

/**
 * Request Fingerprinting (Track unique clients)
 */
export function generateRequestFingerprint(req: Request): string {
    const components = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        getClientIp(req)
    ];

    return Buffer.from(components.join('|')).toString('base64');
}

/**
 * Suspicious Pattern Detection
 */
export function detectSuspiciousPatterns(req: Request): string[] {
    const patterns: string[] = [];
    const path = req.path.toLowerCase();
    const query = JSON.stringify(req.query).toLowerCase();
    const body = JSON.stringify(req.body).toLowerCase();

    // SQL Injection patterns
    if (/(\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bdelete\b|\bupdate\b)/i.test(path + query + body)) {
        patterns.push('sql_injection_attempt');
    }

    // Path traversal
    if (/(\.\.\/)|(\.\.\\)/g.test(path)) {
        patterns.push('path_traversal_attempt');
    }

    // XSS patterns
    if (/(<script|javascript:|onerror=|onload=)/i.test(body)) {
        patterns.push('xss_attempt');
    }

    // Command injection
    if (/(\||;|`|\$\(|\$\{)/g.test(query + body)) {
        patterns.push('command_injection_attempt');
    }

    return patterns;
}

/**
 * Advanced Threat Detection Middleware
 */
export function threatDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
    const suspiciousPatterns = detectSuspiciousPatterns(req);

    if (suspiciousPatterns.length > 0) {
        const ip = getClientIp(req);

        securityLogger.logEvent({
            event_type: 'suspicious_activity',
            severity: 'critical',
            ip_address: ip,
            endpoint: req.path,
            method: req.method,
            details: {
                action: 'attack_pattern_detected',
                patterns: suspiciousPatterns
            }
        });

        ipFilterManager.markSuspicious(ip);

        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    next();
}
