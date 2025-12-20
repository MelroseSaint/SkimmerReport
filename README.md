# SkimmerWatch

Community-driven, anonymous reporting platform for suspected payment card skimming activity.

## Overview

SkimmerWatch is a PWA-based reporting and hotspot awareness platform that:
- Allows **anonymous public reporting** of suspicious devices or behavior
- Aggregates reports into **geographic hotspots**
- Displays **risk density, not accusations**
- Lets users voluntarily submit compiled reports to authorities
- Provides **local safety dashboards** for proactive community protection

## Core Principles

1. **No detection claims** - We don't claim to detect skimmers
2. **No accusations** - All reports are observations, not accusations
3. **No user accounts** - Fully anonymous
4. **No exact location exposure** - Zone-based visualization only
5. **No IDE lock-in** - Clean, portable architecture
6. **AI is advisory, not foundational** - App works without AI
7. **Automated Processing** - Reports are automatically validated and processed
8. **SEO-Driven Local Authority** - Dedicated pages for cities to drive organic awareness

## Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Maps**: OpenStreetMap via Leaflet
- **SEO**: React-Helmet-Async + Dynamic Sitemap Generation
- **Routing**: React Router DOM (v7)
- **Styling**: Vanilla CSS (dark mode, glassmorphism) + Tailwind
- **Architecture**: Layered (Domain-Driven Design principles)

## Project Structure

```
/src
├── /app          → PWA UI (stateless React components)
│   ├── /components → Reusable UI components (SEO, Lists)
│   └── /pages      → Route-level page components (Home, CityPage, StatePage)
├── /domain       → Pure business logic (NO framework dependencies)
├── /services     → API adapters + Automation logic
├── /ai           → Optional AI utilities (NOT required for functionality)
└── /infrastructure → Storage, maps, external integrations
```

### API Structure
```
/api/
├── reports.ts         → Report submission/retrieval + automation trigger
├── automation.ts     → Manual automation trigger + log retrieval  
├── send-email.ts     → Email notification service
└── sitemap.ts        → Dynamic XML sitemap generation for local SEO
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

## Local SEO & City Pages

SkimmerWatch includes a robust Local SEO architecture to rank for "skimmer" related keywords in specific cities.

- **Dynamic City Pages**: `/locations/:state/:city` (e.g., `/locations/illinois/chicago`)
  - Acts as a "Live Safety Dashboard" for the area.
  - Pivots to "Prevention Mode" if no reports are found.
  - Injects specific Schema.org `ItemList` and `City` markup.
- **State Hubs**: `/locations/:state` (e.g., `/locations/illinois`)
  - Links to all major cities to establish site hierarchy.
- **Dynamic Sitemap**: `sitemap.xml` is generated on-the-fly via `/api/sitemap` to ensure instant indexing of new incident locations.

## Deploy on Vercel

1. Create a new Vercel project and import this repository.
2. Set environment variable `VITE_USE_API=true` to use the serverless API.
3. Ensure the default Node serverless runtime is enabled.
4. The API route is available at `GET/POST /api/reports`.
5. `vercel.json` provides SPA rewrites excluding `/api` and handles the `/sitemap.xml` rewrite.

### Automation Endpoints
The following API endpoints are automatically deployed:

- `POST /api/automation` - Manual trigger for report processing
- `GET /api/automation` - Retrieve automation logs
- `POST /api/send-email` - Email notification service

Automation runs automatically on new report submissions via `/api/reports`.

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

### Required Report Fields
- **report_id** - Unique identifier for tracking (auto-generated)
- **location** - Geographic coordinates (latitude, longitude)
- **merchant** - Business name where observation occurred
- **timestamp** - When the observation was made (ISO format)
- **category** - Type of payment device (ATM, Gas pump, Store POS)
- **observationType** - What was suspected (overlay, camera, etc.)
- **description** - Optional additional details

### Report Status Types
- **Under Review** - Initial state after submission
- **Confirmed** - Passed validation and duplicate checks
- **Rejected** - Failed validation or duplicate detected
- **Error** - Processing error requiring manual review

## Automation Workflow

### Processing Pipeline
1. **Report Submission** → New report added via `/api/reports`
2. **Validation** → Check required fields and data integrity
3. **Duplicate Detection** → Search for similar reports (24h window, 100m radius)
4. **Status Assignment** → Set report status based on validation results
5. **Email Notification** → Send email only for confirmed reports
6. **Logging** → Record all automation actions with timestamps

### Validation Rules
- **Required Fields**: report_id, location, merchant, timestamp
- **Location Validation**: Valid coordinates (latitude/longitude)
- **Duplicate Criteria**: Same merchant + 100m radius + 24 hours
- **Status Logic**: Valid & Unique → Confirmed; Invalid/Duplicate → Rejected

### Email Notification Rules
- **Sent Only For**: Confirmed reports
- **Recipient**: Monroedoses@gmail.com
- **Content**: Report ID, location, merchant, timestamp, status
- **Not Sent For**: Rejected or Error status reports

### Error Handling
- **Automatic Retry**: One retry attempt on processing failures
- **Manual Review**: Reports marked "Error" after retry failure
- **Comprehensive Logging**: All errors logged with timestamps and details

## Privacy & Legal

- **No IP logging**
- **Location fuzzing** (approximate zones only)
- **EXIF stripping** on photo uploads
- **Non-accusatory language** throughout
- Clear disclaimers on all exported reports
- **Automation logs** for audit trail and transparency

## API Overview

### Reports API
- **Endpoint**: `GET/POST /api/reports`
- **Functionality**: Submit and retrieve skimmer observation reports
- **Features**: Real-time validation, duplicate detection, and status updates

### Automation API  
- **Endpoint**: `POST /api/automation` (manual trigger)
- **Endpoint**: `GET /api/automation` (retrieve logs)
- **Functionality**: Automated report processing, validation, and email notifications
- **Features**: 
  - Validates required fields (report_id, location, merchant, timestamp)
  - Detects duplicate reports within 24-hour window and 100m radius
  - Updates report status (Confirmed/Rejected/Error)
  - Sends email notifications for confirmed reports
  - Comprehensive logging system for audit trail

### Email API
- **Endpoint**: `POST /api/send-email`
- **Functionality**: Send email notifications for confirmed reports
- **Recipient**: Monroedoses@gmail.com (configured)
- **Format**: Standardized email template with report details

### Overpass API (OpenStreetMap)
Used to query nearby ATMs, gas stations, and shops for location suggestions.

## License

This project is private and proprietary.

## Automation System Details

The automation system processes skimmer reports automatically with the following workflow:

### Validation
- Checks for required fields: report_id, location, merchant, timestamp
- Validates data integrity and format
- Rejects incomplete or malformed reports

### Duplicate Detection
- Searches for similar reports within 100m radius and 24-hour window
- Compares merchant names and proximity
- Marks duplicates as "Rejected" to prevent spam

### Email Notifications
- Sends emails only for confirmed valid reports
- Recipient: Monroedoses@gmail.com
- Includes report details in standardized format

### Status Management
- **Confirmed**: Valid and unique reports
- **Rejected**: Invalid or duplicate reports  
- **Error**: Processing failures requiring manual review

### Logging & Auditing
- Every action is logged with timestamps
- Success/failure states with error details
- Exportable logs for review and compliance
- Complete audit trail of automation decisions

### Error Handling
- Automatic retry on first failure
- Manual review flag for persistent failures
- Comprehensive error logging
- Graceful degradation when services unavailable

## Security & Privacy

- All reports are anonymized and privacy-protected
- Location fuzzing prevents exact address exposure
- No personal data collection or IP logging
- Full compliance with privacy principles
### Deployment Checklist

- Set `VITE_USE_API=true` in Environment Variables.
- Confirm `vercel.json` exists with SPA rewrites.
- Verify `api/reports.ts` is deployed and responds to `GET` and `POST`.
- Use default Node runtime for API routes.
- If hosting UI and API on different domains, configure CORS.
- Avoid storing secrets client-side; none are required for MVP.
- Validate `npm run build` and `npm run preview` locally before deploying.

### Automation Deployment

The automation system requires no additional configuration:
- Email recipient is pre-configured (Monroedoses@gmail.com)
- Automation logs are stored in memory and accessible via API
- Email service uses standard API endpoints (Vercel Email or external SMTP)
- All automation rules and validations are built into the system
- Error handling and retry logic included automatically

### Monitoring

Monitor automation performance via:
- `/api/automation` endpoint for logs retrieval
- Console logs for real-time debugging
- Report status updates in admin interface
- Email delivery confirmation in automation logs
