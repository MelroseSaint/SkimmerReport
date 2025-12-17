import type { Location } from '../domain/types';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export interface POIResult {
    id: number;
    type: string;
    lat: number;
    lon: number;
    tags: Record<string, string>;
}

/**
 * Query nearby ATMs and gas stations using Overpass API (OpenStreetMap)
 * This can be used to suggest reporting locations to users
 */
export async function queryNearbyPOIs(
    center: Location,
    radiusMeters: number = 500
): Promise<POIResult[]> {
    const { latitude, longitude } = center;

    // Calculate bounding box from center and radius
    const latDelta = radiusMeters / 111000; // ~111km per degree latitude
    const lonDelta = radiusMeters / (111000 * Math.cos(latitude * Math.PI / 180));

    const bbox = [
        latitude - latDelta,
        longitude - lonDelta,
        latitude + latDelta,
        longitude + lonDelta
    ].join(',');

    const query = `
    [bbox:${bbox}]
    [out:json]
    [timeout:90];
    (
      node["amenity"="atm"];
      node["amenity"="fuel"];
      node["amenity"="bank"];
      node["shop"="supermarket"];
      node["shop"="convenience"];
    );
    out body;
  `;

    try {
        const response = await fetch(OVERPASS_API_URL, {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
        });

        if (!response.ok) {
            console.warn('Overpass API request failed:', response.status);
            return [];
        }

        const data = await response.json();
        return data.elements.map((el: any) => ({
            id: el.id,
            type: el.type,
            lat: el.lat,
            lon: el.lon,
            tags: el.tags || {},
        }));
    } catch (error) {
        console.error('Error querying Overpass API:', error);
        return [];
    }
}
