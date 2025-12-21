import type { User } from '../domain/User';
import type { UserRepository } from '../domain/UserRepository';

/**
 * InMemoryUserRepository
 * 
 * NOTE: This is a temporary implementation for development/demonstration.
 * In a real production environment, this MUST be replaced with a persistent
 * database adapter (e.g., SurrealDB, PostgreSQL, MongoDB).
 * 
 * Data stored here will be lost when the server restarts.
 */
export class InMemoryUserRepository implements UserRepository {
    private users: Map<string, User> = new Map();

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    async save(user: User): Promise<User> {
        this.users.set(user.id, user);
        return user;
    }

    async update(user: User): Promise<User> {
        if (!this.users.has(user.id)) {
            throw new Error('User not found');
        }
        this.users.set(user.id, user);
        return user;
    }
}
