import type { Location } from './types';

export function fuzzLocation(loc: Location, decimals: number = 3): Location {
  const round = (v: number) => Number(v.toFixed(decimals));
  return {
    latitude: round(loc.latitude),
    longitude: round(loc.longitude),
  };
}

