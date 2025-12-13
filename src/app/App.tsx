import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import './performance.css';

// Fix Leaflet default marker icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import type { Report, ReportCategory, ObservationType, Location, Hotspot } from '../domain/types';
import { generateHotspots } from '../domain/hotspot';
import { InMemoryReportRepository } from '../infrastructure/InMemoryReportRepository';
import { ReportService } from '../services/ReportService';
import { ReportServiceHttp } from '../services/ReportServiceHttp';
import { ReportServiceHybrid } from '../services/ReportServiceHybrid';
import jsPDF from 'jspdf';
import { geocodeAddress, suggestAddresses } from '../services/GeocodingService';

// Icons as inline SVGs
const ShieldIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
));
ShieldIcon.displayName = 'ShieldIcon';

const PlusIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
));
PlusIcon.displayName = 'PlusIcon';

const XIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));
XIcon.displayName = 'XIcon';

// Initialize services (singleton pattern for scalability)
const repository = new InMemoryReportRepository();
const useApi = import.meta.env.VITE_USE_API === 'true';
const memService = new ReportService(repository);
const httpService = new ReportServiceHttp();
const reportService = useApi ? new ReportServiceHybrid(httpService, memService) : memService;

const CATEGORIES: ReportCategory[] = ['ATM', 'Gas pump', 'Store POS'];
const OBSERVATION_TYPES: ObservationType[] = [
  'Loose card slot',
  'Overlay',
  'Camera suspected',
  'Fraud after use',
  'Other',
];

const TIME_FILTERS = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: 'All', days: 365 },
];

// Debounce utility for performance
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Map click handler component with debouncing
const MapClickHandler = memo(({ onMapClick }: { onMapClick: (loc: Location) => void }) => {
  const debouncedClick = useMemo(
    () => debounce((loc: Location) => onMapClick(loc), 150),
    [onMapClick]
  );

  useMapEvents({
    click(e) {
      debouncedClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
});
MapClickHandler.displayName = 'MapClickHandler';

// Optimized report circles with memoization
const ReportMarkers = memo(({ reports }: { reports: Report[] }) => {
  const getColor = useCallback((report: Report) => {
    const age = Date.now() - new Date(report.timestamp).getTime();
    const dayMs = 86400000;
    if (age < dayMs) return '#ef4444'; // High - recent
    if (age < 7 * dayMs) return '#f59e0b'; // Medium
    return '#10b981'; // Low - old
  }, []);

  // For 100k+ reports, implement clustering or virtualization
  // Currently showing all, but in production you'd use react-leaflet-markercluster
  return (
    <>
      {reports.map((report) => (
        <Circle
          key={report.id}
          center={[report.location.latitude, report.location.longitude]}
          radius={150} // 150m radius - zone-based, not exact
          pathOptions={{
            color: getColor(report),
            fillColor: getColor(report),
            fillOpacity: 0.3,
          }}
        />
      ))}
    </>
  );
});
ReportMarkers.displayName = 'ReportMarkers';

// Hotspot overlay
const HotspotOverlay = memo(({ reports }: { reports: Report[] }) => {
  const hotspots: Hotspot[] = useMemo(() => generateHotspots(reports, { radiusMeters: 200, halfLifeDays: 7 }), [reports]);
  const colorFor = (score: number) => {
    if (score > 2) return '#ef4444';
    if (score > 1) return '#f59e0b';
    return '#10b981';
  };
  return (
    <>
      {hotspots.map(h => (
        <Circle
          key={h.id}
          center={[h.center.latitude, h.center.longitude]}
          radius={Math.max(150, h.radius)}
          pathOptions={{ color: colorFor(h.riskScore), fillColor: colorFor(h.riskScore), fillOpacity: 0.25 }}
        />
      ))}
    </>
  );
});
HotspotOverlay.displayName = 'HotspotOverlay';

// Location finder component
const LocationFinder = memo(({ setCenter }: { setCenter: (loc: [number, number]) => void }) => {
  const map = useMap();

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(loc);
          map.setView(loc, 14);
        },
        (error) => {
          console.warn('Geolocation failed:', error.message);
          // Default to NYC if geolocation fails
          setCenter([40.7128, -74.006]);
        }
      );
    } else {
      setCenter([40.7128, -74.006]);
    }
  }, [map, setCenter]);

  return null;
});
LocationFinder.displayName = 'LocationFinder';

function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [timeFilter, setTimeFilter] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [category, setCategory] = useState<ReportCategory>('ATM');
  const [observationType, setObservationType] = useState<ObservationType>('Loose card slot');
  const [description, setDescription] = useState('');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [showHotspots, setShowHotspots] = useState(true);
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState<{ label: string; location: Location }[]>([]);
  const [addressHintActive, setAddressHintActive] = useState(false);

  // Load reports with error handling
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await reportService.getReports();
        setReports(data);
        setError(null);
      } catch (err) {
        setError('Failed to load reports. Please try again.');
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    const q = [addrLine, addrCity, addrState, addrZip].filter(Boolean).join(', ');
    let cancelled = false;
    const tid = setTimeout(async () => {
      try {
        if (!navigator.onLine) {
          const cache = JSON.parse(localStorage.getItem('addr_suggestions_cache') || '[]');
          const filtered = cache.filter((s: any) => String(s.label).toLowerCase().includes(q.toLowerCase())).slice(0, 5);
          if (!cancelled) setAddrSuggestions(filtered);
          return;
        }
        const s = await suggestAddresses(q);
        if (!cancelled) {
          setAddrSuggestions(s);
          localStorage.setItem('addr_suggestions_cache', JSON.stringify(s));
        }
      } catch {
        // keep last suggestions
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(tid); };
  }, [addrLine, addrCity, addrState, addrZip]);

  const handleMapClick = useCallback((loc: Location) => {
    setSelectedLocation(loc);
    setPanelOpen(true);
    setAddressHintActive(false);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!selectedLocation) return;

    try {
      setSubmitting(true);
      setError(null);

      const newReport = await reportService.submitReport(
        selectedLocation,
        category,
        observationType,
        description || undefined
      );

      setReports((prev) => [...prev, newReport]);
      setPanelOpen(false);
      setDescription('');
      setSelectedLocation(null);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  }, [selectedLocation, category, observationType, description]);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setError(null);
  }, []);

  // Memoized filtered reports for performance
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const age = Date.now() - new Date(r.timestamp).getTime();
      return age < timeFilter * 86400000;
    });
  }, [reports, timeFilter]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        handleClosePanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [panelOpen, handleClosePanel]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header" role="banner">
        <div className="header-logo">
          <ShieldIcon />
          <span className="header-title">SkimmerWatch</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              const startTs = new Date(Date.now() - timeFilter * 86400000);
              const reportsForExport = filteredReports;
              const uniqueIds = new Set(reportsForExport.map(r => r.id));
              const count = uniqueIds.size;
              const categoryCounts = CATEGORIES.map(cat => ({
                cat,
                count: reportsForExport.filter(r => r.category === cat).length
              }));
              const avgLat = reportsForExport.length ? reportsForExport.reduce((a, r) => a + r.location.latitude, 0) / reportsForExport.length : center[0];
              const avgLon = reportsForExport.length ? reportsForExport.reduce((a, r) => a + r.location.longitude, 0) / reportsForExport.length : center[1];
              const lastTs = reportsForExport.length ? reportsForExport.reduce((a, r) => Math.max(a, new Date(r.timestamp).getTime()), 0) : Date.now();
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.text('SkimmerWatch – Area Summary', 14, 20);
              doc.setFontSize(11);
              doc.text(`Time range: since ${startTs.toISOString().slice(0,10)}`, 14, 30);
              doc.text(`Approximate center: (${avgLat.toFixed(4)}, ${avgLon.toFixed(4)})`, 14, 38);
              doc.text(`Unique reports: ${count}`, 14, 46);
              let y = 54;
              doc.text('Report categories:', 14, y); y += 8;
              categoryCounts.forEach(({ cat, count }) => { doc.text(`• ${cat}: ${count}`, 20, y); y += 8; });
              doc.text(`Most recent report: ${new Date(lastTs).toISOString().slice(0,19).replace('T',' ')}`, 14, y); y += 12;
              doc.setFontSize(10);
              doc.text('Disclaimer: User-submitted unverified reports. No accusations are made.', 14, y);
              y += 10;
              doc.text('Developed by DarkStackStudios Inc.', 14, y);
              doc.save('skimmerwatch-area-summary.pdf');
            }}
            aria-label="Export report data"
          >
            Export Report
          </button>
          <button
            onClick={() => {
              const startTs = new Date(Date.now() - timeFilter * 86400000).toISOString();
              const data = {
                startTs,
                count: filteredReports.length,
                categories: CATEGORIES.map(cat => ({ cat, count: filteredReports.filter(r => r.category === cat).length })),
                center: { lat: center[0], lon: center[1] }
              };
              const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
              const url = `${window.location.origin}/?case=${encoded}`;
              navigator.clipboard.writeText(url);
              alert('Shareable case link copied to clipboard');
            }}
            aria-label="Copy shareable case link"
          >
            Share Case Link
          </button>
          {import.meta.env.VITE_SHOW_TEST_LINK === 'true' && (
            <a href="/test" aria-label="Verify API" style={{ textDecoration: 'underline' }}>
              Verify API
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" role="main">
        <div className="map-container">
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-text-secondary)'
            }}>
              Loading map data...
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
              touchZoom={true}
              doubleClickZoom={true}
              dragging={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                subdomains="abc"
                maxZoom={19}
              />
              <LocationFinder setCenter={setCenter} />
              <MapClickHandler onMapClick={handleMapClick} />
              {showHotspots ? <HotspotOverlay reports={filteredReports} /> : <ReportMarkers reports={filteredReports} />}
              {selectedLocation && (
                <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
              )}
              {addressHintActive && selectedLocation && (
                <Circle
                  center={[selectedLocation.latitude, selectedLocation.longitude]}
                  radius={200}
                  pathOptions={{ color: '#2563eb', dashArray: '4 4', fillColor: '#2563eb', fillOpacity: 0.1 }}
                />
              )}
            </MapContainer>
          )}

          {/* Time Filter */}
          <div className="time-filter" role="group" aria-label="Time filter">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.days}
                className={timeFilter === tf.days ? 'active' : ''}
                onClick={() => setTimeFilter(tf.days)}
                aria-pressed={timeFilter === tf.days}
                aria-label={`Filter by ${tf.label}`}
              >
                {tf.label}
              </button>
            ))}
            <button
              className={showHotspots ? 'active' : ''}
              onClick={() => setShowHotspots((v) => !v)}
              aria-pressed={showHotspots}
              aria-label="Toggle hotspots"
            >
              Hotspots
            </button>
          </div>

          {/* Risk Legend */}
          <div className="risk-legend" role="complementary" aria-label="Activity level legend">
            <h4>Activity Level</h4>
            <div className="legend-item">
              <div className="legend-dot high" aria-hidden="true" />
              <span>Recent (24h)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot medium" aria-hidden="true" />
              <span>This week</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot low" aria-hidden="true" />
              <span>Older</span>
            </div>
          </div>

          {/* FAB Button */}
          {!panelOpen && (
            <button
              className="fab-button"
              onClick={() => setPanelOpen(true)}
              aria-label="Add new observation report"
            >
              <PlusIcon />
            </button>
          )}
        </div>

        {/* Report Panel */}
        <div
          className={`report-panel ${panelOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-panel-title"
        >
          <div className="report-panel-handle" aria-hidden="true" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="report-panel-title">Submit Observation</h2>
            <button
              onClick={handleClosePanel}
              style={{ background: 'transparent', border: 'none', padding: '0.5rem' }}
              aria-label="Close report panel"
            >
              <XIcon />
            </button>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: '8px',
              color: 'var(--color-danger)',
              fontSize: '0.875rem'
            }} role="alert">
              {error}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            {selectedLocation
              ? 'Location selected. Choose observation details below.'
              : 'Tap on the map to select an approximate location.'}
          </p>

          <div className="form-group">
            <label htmlFor="category-group">Category</label>
            <div className="category-buttons" id="category-group" role="group" aria-label="Report category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observation-type">What did you observe?</label>
            <select
              id="observation-type"
              value={observationType}
              onChange={(e) => setObservationType(e.target.value as ObservationType)}
              aria-label="Observation type"
            >
              {OBSERVATION_TYPES.map((obs) => (
                <option key={obs} value={obs}>{obs}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manual-location">Approximate location (optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }} id="manual-location">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                aria-label="Latitude"
                step="0.0001"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                aria-label="Longitude"
                step="0.0001"
              />
              <button
                onClick={() => {
                  const lat = parseFloat(manualLat);
                  const lon = parseFloat(manualLon);
                  if (!isNaN(lat) && !isNaN(lon)) {
                    const loc: Location = { latitude: lat, longitude: lon };
                    setSelectedLocation(loc);
                    setAddressHintActive(false);
                  }
                }}
                aria-label="Use typed coordinates"
              >
                Set
              </button>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const loc: Location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                        setSelectedLocation(loc);
                        setCenter([loc.latitude, loc.longitude]);
                        setAddressHintActive(false);
                      }
                    );
                  }
                }}
                aria-label="Use my current location"
              >
                Use My Location
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address-entry">Address (optional; used to approximate zone)</label>
            <div id="address-entry" style={{ display: 'grid', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Street address"
                value={addrLine}
                onChange={(e) => setAddrLine(e.target.value)}
                aria-label="Street address"
                autoComplete="address-line1"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  aria-label="City"
                  autoComplete="address-level2"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  aria-label="State"
                  autoComplete="address-level1"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  aria-label="ZIP"
                  autoComplete="postal-code"
                />
              </div>
              <div className="suggestions">
                {addrSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => {
                      setSelectedLocation(s.location);
                      setCenter([s.location.latitude, s.location.longitude]);
                      setAddrSuggestions([]);
                      setAddressHintActive(true);
                    }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  setError(null);
                  const { location } = await geocodeAddress({ address: addrLine, city: addrCity, state: addrState, zip: addrZip });
                  if (location) {
                    setSelectedLocation(location);
                    setCenter([location.latitude, location.longitude]);
                    setAddressHintActive(true);
                  } else {
                    setError('Address not found. Please refine your entry or use map/coordinates.');
                  }
                }}
                aria-label="Approximate from address"
              >
                Use Address
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Address is converted to an approximate zone; exact location is not stored.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you noticed..."
              aria-label="Report description"
              maxLength={500}
            />
          </div>

          <button
            className="primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={handleSubmitReport}
            disabled={!selectedLocation || submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Observation'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
            This is an unverified user observation. No accusations are made.
          </p>
        </div>
      </main>
      <footer className="footer" role="contentinfo">
        Developed by DarkStackStudios Inc. ·
        <a href="https://darkstackstudiosinc.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
          darkstackstudiosinc.vercel.app
        </a>
        {' '}· <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>
      </footer>
    </div>
  );
}

export default App;
