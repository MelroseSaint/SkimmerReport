import type { Location } from '../domain/types';
import { fuzzLocation } from '../domain/privacy';

export interface GeocodeResult {
  location: Location | null;
  raw?: any;
}

const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(query: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Promise<GeocodeResult> {
  const q = [query.address, query.city, query.state, query.zip, query.country].filter(Boolean).join(', ');
  if (!q) return { location: null };
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'SkimmerWatch/0.1 (anonymous)' },
    });
    if (!res.ok) return { location: null };
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return { location: null };
    const item = data[0];
    const loc: Location = { latitude: Number(item.lat), longitude: Number(item.lon) };
    return { location: fuzzLocation(loc, 3), raw: item };
  } catch {
    return { location: null };
  }
}

export interface AddressSuggestion {
  label: string;
  location: Location;
}

export async function suggestAddresses(q: string, limit: number = 5): Promise<AddressSuggestion[]> {
  if (!q || q.trim().length < 3) return [];
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('accept-language', 'en');
  const headers = { 'User-Agent': 'SkimmerWatch/0.1 (anonymous)' } as Record<string, string>;
  let attempt = 0;
  const maxAttempts = 3;
  const baseDelay = 250;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error('bad');
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((item: any) => ({
        label: String(item.display_name || '').slice(0, 120),
        location: fuzzLocation({ latitude: Number(item.lat), longitude: Number(item.lon) }, 3),
      }));
    } catch {
      attempt++;
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, baseDelay * attempt));
    }
  }
  return [];
}

export interface ReverseGeocodeResult {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  formatted?: string;
}

export async function reverseGeocode(loc: Location): Promise<ReverseGeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(loc.latitude));
  url.searchParams.set('lon', String(loc.longitude));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');
  try {
    const res = await fetch(url.toString(), { headers: { 'User-Agent': 'SkimmerWatch/0.1 (anonymous)' } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const name = data.name || data.display_name?.split(',')?.[0];
    const street = a.road || a.pedestrian || a.house_number ? [a.house_number, a.road].filter(Boolean).join(' ') : undefined;
    const city = a.city || a.town || a.village || a.hamlet;
    const state = a.state || a.region;
    const postcode = a.postcode;
    const country = a.country;
    const formatted = [street, city, state, postcode].filter(Boolean).join(', ');
    return { name, street, city, state, postcode, country, formatted };
  } catch {
    return null;
  }
}
