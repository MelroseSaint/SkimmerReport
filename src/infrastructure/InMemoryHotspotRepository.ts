import type { Hotspot } from '../domain/types';
import type { HotspotRepository } from '../domain/HotspotRepository';

export class InMemoryHotspotRepository implements HotspotRepository {
    private hotspots: Hotspot[] = [];

    async save(hotspotData: Hotspot): Promise<Hotspot> {
        const newHotspot: Hotspot = {
            ...hotspotData,
            id: Math.random().toString(36).substr(2, 9),
        };
        this.hotspots.push(newHotspot);
        return newHotspot;
    }

    async getAll(): Promise<Hotspot[]> {
        return this.hotspots;
    }

    async getById(id: string): Promise<Hotspot | null> {
        const hotspot = this.hotspots.find(h => h.id === id);
        return hotspot || null;
    }
}
