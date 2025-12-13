# SkimmerWatch

Community-driven, anonymous reporting platform for suspected payment card skimming activity.

## Overview

SkimmerWatch is a PWA-based reporting and hotspot awareness platform that:
- Allows **anonymous public reporting** of suspicious devices or behavior
- Aggregates reports into **geographic hotspots**
- Displays **risk density, not accusations**
- Lets users voluntarily submit compiled reports to authorities

## Core Principles

1. **No detection claims** - We don't claim to detect skimmers
2. **No accusations** - All reports are observations, not accusations
3. **No user accounts** - Fully anonymous
4. **No exact location exposure** - Zone-based visualization only
5. **No IDE lock-in** - Clean, portable architecture
6. **AI is advisory, not foundational** - App works without AI

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Maps**: OpenStreetMap via Leaflet
- **Styling**: Vanilla CSS (dark mode, glassmorphism)
- **Architecture**: Layered (Domain-Driven Design principles)

## Project Structure

```
/src
├── /app          → PWA UI (stateless React components)
├── /domain       → Pure business logic (NO framework dependencies)
├── /services     → API adapters
├── /ai           → Optional AI utilities (NOT required for functionality)
└── /infrastructure → Storage, maps, external integrations
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploy on Vercel

1. Create a new Vercel project and import this repository.
2. Set environment variable `VITE_USE_API=true` to use the serverless API.
3. Ensure the default Node serverless runtime is enabled.
4. The API route is available at `GET/POST /api/reports`.
5. `vercel.json` provides SPA rewrites excluding `/api`.

### Local Verification

```bash
# Build production bundle
npm run build

# Preview the build locally
npm run preview
```

### Notes
- Address geocoding and suggestions use Nominatim with a privacy-safe User-Agent.
- Fuzzing rounds coordinates for privacy; exact addresses are not stored.
- Hotspots are zone-based with time decay and category severity.
 - OpenStreetMap tiles and Nominatim are public endpoints. Throttling may occur; client uses debounce, caching, retry, and a service worker caches map tiles.

### Environment Variables

```
VITE_USE_API=true|false
VITE_SHOW_TEST_LINK=true|false
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org/search
VITE_OSM_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_BRAND_NAME=Your Studio Name
VITE_BRAND_URL=https://your-studio.example.com
```


## Credits

Developed by DarkStackStudios Inc. — https://darkstackstudiosinc.vercel.app/

## Report Types

Users can report observations of:
- **ATM** - Cash machines
- **Gas pump** - Fuel station card readers
- **Store POS** - Point of sale terminals

### Observation Categories
- Loose card slot
- Overlay suspected
- Camera suspected
- Fraud after use
- Other

## Privacy & Legal

- **No IP logging**
- **Location fuzzing** (approximate zones only)
- **EXIF stripping** on photo uploads
- **Non-accusatory language** throughout
- Clear disclaimers on all exported reports

## API Overview

### Overpass API (OpenStreetMap)
Used to query nearby ATMs, gas stations, and shops for location suggestions.

## License

This project is private and proprietary.
### Deployment Checklist

- Set `VITE_USE_API=true` in Environment Variables.
- Confirm `vercel.json` exists with SPA rewrites.
- Verify `api/reports.ts` is deployed and responds to `GET` and `POST`.
- Use default Node runtime for API routes.
- If hosting UI and API on different domains, configure CORS.
- Avoid storing secrets client-side; none are required for MVP.
- Validate `npm run build` and `npm run preview` locally before deploying.
