import { adminDb } from '../lib/instantdb-admin.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';


export class InstantUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const { $users } = await adminDb.query({
            $users: {
                $: {
                    where: { email: email }
                }
            }
        });

        if ($users.length === 0) return null;

        const u = $users[0];
        return {
            id: u.id,
            email: u.email || '',
            passwordHash: (u as any).passwordHash || '',
            role: (u as any).role || 'user',
            createdAt: typeof (u as any).createdAt === 'number'
                ? new Date((u as any).createdAt).toISOString()
                : (u as any).createdAt || new Date().toISOString(),
            isLocked: (u as any).isLocked || false,
            failedLoginAttempts: (u as any).failedLoginAttempts || 0
        };
    }

    async save(user: User): Promise<User> {
        await adminDb.transact(
            adminDb.tx.$users[user.id].update({
                email: user.email,
                passwordHash: user.passwordHash,
                role: user.role,
                createdAt: new Date(user.createdAt).getTime(),
                isLocked: user.isLocked,
                failedLoginAttempts: user.failedLoginAttempts
            })
        );
        return user;
    }

    async update(user: User): Promise<User> {
        return this.save(user);
    }

    async findById(id: string): Promise<User | null> {
        const { $users } = await adminDb.query({
            $users: {
                $: {
                    where: { id: id }
                }
            }
        });

        if ($users.length === 0) return null;

        const u = $users[0];
        return {
            id: u.id,
            email: u.email || '',
            passwordHash: (u as any).passwordHash || '',
            role: (u as any).role || 'user',
            createdAt: typeof (u as any).createdAt === 'number'
                ? new Date((u as any).createdAt).toISOString()
                : (u as any).createdAt || new Date().toISOString(),
            isLocked: (u as any).isLocked || false,
            failedLoginAttempts: (u as any).failedLoginAttempts || 0
        };
    }
}
