import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { ReportService } from './ReportService';
import { AuthService } from './AuthService';
import { AdminInstantReportRepository } from '../infrastructure/AdminInstantReportRepository';
import { InstantUserRepository } from '../infrastructure/InstantUserRepository';

import {
    rateLimiter,
    setSecurityHeaders,
    getClientIp,
    sanitizeText,
    validateCategory,
    validateObservationType
} from '../security/validation';
import {
    securityLogger,
    logRateLimitExceeded
} from '../security/audit';
import type { ReportCategory, ObservationType } from '../domain/types';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const app = express();
const port = 3000;

// -- Repositories & Services --
const reportRepository = new AdminInstantReportRepository();
const userRepository = new InstantUserRepository();
const reportService = new ReportService(reportRepository);
const authService = new AuthService(userRepository);


// -- Middleware --

// 1. Security Headers
app.use((_req, res, next) => {
    setSecurityHeaders(res);
    next();
});

// 2. Body Parsing with Limits (DoS Protection)
app.use(express.json({ limit: '10kb' }));

// 3. Global Rate Limiting & Bot Defense
app.use((req, res, next) => {
    const ip = getClientIp(req);

    // Check Rate Limit
    if (!rateLimiter.isAllowed(ip)) {
        logRateLimitExceeded(ip, req.path);
        return res.status(429).json({ error: 'Too many requests' });
    }

    next();
});

// 4. Request Logging
app.use((_req, _res, next) => {
    // Log meaningful events only to avoid noise, but here we log all for audit trail if needed
    // For now, relies on specific actions logging.
    next();
});

// -- Authentication Middleware --
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = authService.verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// -- Routes --

// Auth: Register
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // Basic email validation
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        const user = await authService.register(email, password);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Auth: Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        // Log successful login
        securityLogger.logEvent({
            event_type: 'suspicious_activity', // Tracking login
            severity: 'low',
            details: { action: 'login_success', userId: result.user.id }
        });

        res.json(result);
    } catch (error: any) {
        // Generic error message for security
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Reports: Submit (Protected)
app.post('/reports', authenticateToken, async (req, res) => {
    try {
        const { location, category, observationType, description, merchant } = req.body;

        // Input Validation
        if (!location || !category || !observationType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validateCategory(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        if (!validateObservationType(observationType)) {
            return res.status(400).json({ error: 'Invalid observation type' });
        }

        const sanitizedDescription = description ? sanitizeText(description) : undefined;
        const sanitizedMerchant = merchant ? sanitizeText(merchant) : undefined;

        const report = await reportService.submitReport(
            location,
            category as ReportCategory,
            observationType as ObservationType,
            sanitizedDescription,
            sanitizedMerchant
        );

        res.status(201).json(report);
    } catch (error: any) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Reports: Get (Protected - Zero Trust)
app.get('/reports', authenticateToken, async (_req, res) => {
    try {
        const reports = await reportService.getReports();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Reports: Get by ID (Protected)
app.get('/reports/:id', authenticateToken, async (req, res) => {
    try {
        const report = await reportService.getReportById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// -- Error Handling --
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    securityLogger.logEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        details: { action: 'unhandled_error', error: err.message, stack: err.stack }
    });
    res.status(500).send('Internal Server Error');
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

export default app;
