import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { User, UserRole } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { securityLogger } from '../security/audit.js';


const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-prod-immediately';
const JWT_EXPIRATION = '1h';
const SALT_ROUNDS = 12; // High cost factor

export class AuthService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Register a new user
     */
    async register(email: string, password: string, role: UserRole = 'user'): Promise<Omit<User, 'passwordHash'>> {
        // Check if user exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser: User = {
            id: Math.random().toString(36).substring(2, 15),
            email,
            passwordHash,
            role,
            createdAt: new Date().toISOString(),
            isLocked: false,
            failedLoginAttempts: 0
        };

        await this.userRepository.save(newUser);

        securityLogger.logEvent({
            event_type: 'suspicious_activity', // Technically not suspicious, but tracking creation
            severity: 'low',
            details: { action: 'user_created', userId: newUser.id }
        });

        const { passwordHash: _, ...userWithoutHash } = newUser;
        return userWithoutHash;
    }

    /**
     * Authenticate a user and return a JWT
     */
    async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            // Fake computation to prevent timing attacks
            await bcrypt.hash('dummy', SALT_ROUNDS);
            throw new Error('Invalid credentials');
        }

        if (user.isLocked) {
            securityLogger.logEvent({
                event_type: 'suspicious_activity',
                severity: 'medium',
                details: { action: 'locked_account_login_attempt', userId: user.id }
            });
            throw new Error('Account is locked');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true;
                securityLogger.logEvent({
                    event_type: 'suspicious_activity',
                    severity: 'high',
                    details: { action: 'account_locked', userId: user.id }
                });
            }
            await this.userRepository.update(user);
            throw new Error('Invalid credentials');
        }

        // Reset failed attempts on success
        if (user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            await this.userRepository.update(user);
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        const { passwordHash: _, ...userWithoutHash } = user;

        return { token, user: userWithoutHash };
    }

    /**
     * Verify a JWT token
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}
