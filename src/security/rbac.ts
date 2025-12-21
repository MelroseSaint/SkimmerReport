/**
 * RBAC (Role-Based Access Control) Middleware
 * Enforces permission-based access to endpoints
 */

import type { Request, Response, NextFunction } from 'express';

export type Permission =
    | 'reports:read'
    | 'reports:write'
    | 'reports:delete'
    | 'reports:moderate'
    | 'users:read'
    | 'users:write'
    | 'users:delete'
    | 'admin:all';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    user: ['reports:read', 'reports:write'],
    moderator: ['reports:read', 'reports:write', 'reports:moderate', 'users:read'],
    admin: ['admin:all'], // Admin has all permissions
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];

    // Admin has all permissions
    if (permissions.includes('admin:all')) {
        return true;
    }

    return permissions.includes(permission);
}

/**
 * Middleware to require specific permissions
 */
export function requirePermission(...permissions: Permission[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        const hasAllPermissions = permissions.every(perm => hasPermission(userRole, perm));

        if (!hasAllPermissions) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: permissions,
                userRole
            });
        }

        next();
    };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient role',
                required: roles,
                userRole: req.user.role
            });
        }

        next();
    };
}
