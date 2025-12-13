import type { Hotspot } from './types.js';

export interface HotspotRepository {
    save(hotspot: Hotspot): Promise<Hotspot>;
    getAll(): Promise<Hotspot[]>;
    getById(id: string): Promise<Hotspot | null>;
}
