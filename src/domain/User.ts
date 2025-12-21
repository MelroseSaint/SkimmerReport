export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
    id: string;
    email: string;
    passwordHash: string; // Never plain text!
    role: UserRole;
    createdAt: string;
    lastLogin?: string;
    mfaEndpoint?: string; // For future MFA
    isLocked: boolean;
    failedLoginAttempts: number;
}

export interface UserSession {
    token: string;
    expiresAt: number;
    userId: string;
    role: UserRole;
}
