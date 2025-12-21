import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../App.css';
import '../performance.css';

// Fix Leaflet default marker icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import type { Report, ReportCategory, ObservationType, Location, Hotspot } from '../../domain/types';
import { generateHotspots } from '../../domain/hotspot';
import jsPDF from 'jspdf';
import { db } from '../../lib/instantdb';
import { id } from '@instantdb/react';


import { geocodeAddress, suggestAddresses } from '../../services/GeocodingService';
import { queryNearbyPOIs, type POIResult } from '../../services/OverpassService';
import LocationList from '../components/LocationList'
import ReportsList from '../components/ReportsList'
import { Link, useNavigate } from 'react-router-dom';

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

const MenuIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="nav-icon">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
));
MenuIcon.displayName = 'MenuIcon';

const HomeIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="nav-icon">
    <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
));
HomeIcon.displayName = 'HomeIcon';

const PrivacyIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="nav-icon">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
));
PrivacyIcon.displayName = 'PrivacyIcon';

const ApiIcon = memo(() => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="nav-icon">
    <circle cx="12" cy="12" r="3" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="12" y1="5" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="19" />
  </svg>
));
ApiIcon.displayName = 'ApiIcon';

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

// Services logic migrated to InstantDB hooks and transactions




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

// Store marker icon
const createStoreIcon = (type: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="store-marker-badge ${type === 'fuel' ? 'gas' : 'store'}"><div class="dot"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// POI Overlay component
const POIOverlay = memo(({ pois, onSelect }: { pois: POIResult[], onSelect: (loc: Location, name: string) => void }) => {
  return (
    <>
      {pois.map(p => {
        const name = p.tags?.name || p.tags?.brand || p.tags?.operator || 'Store';
        const type = p.tags?.amenity === 'fuel' ? 'fuel' : 'store';
        return (
          <Marker
            key={`${p.type}-${p.id}`}
            position={[p.lat, p.lon]}
            icon={createStoreIcon(type)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click
                onSelect({ latitude: p.lat, longitude: p.lon }, name);
              }
            }}
          />
        );
      })}
    </>
  );
});
POIOverlay.displayName = 'POIOverlay';

// Location finder component
const LocationFinder = memo(({
  setCenter,
  onLocationFound
}: {
  setCenter: (loc: [number, number]) => void
  onLocationFound: (loc: Location) => void
}) => {
  const map = useMap();

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(loc);
          map.setView(loc, 15); // Closer zoom for mobile
          onLocationFound({ latitude: loc[0], longitude: loc[1] });
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
  }, [map, setCenter, onLocationFound]);

  return null;
});
POIOverlay.displayName = 'POIOverlay';
LocationFinder.displayName = 'LocationFinder';

// Bottom Navigation for Mobile
const BottomNav = memo(({ activeTab }: { activeTab: string }) => {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      <button
        className={`b-nav-item ${activeTab === '' ? 'active' : ''}`}
        onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
      >
        <HomeIcon />
        <span>Home</span>
      </button>
      <button
        className={`b-nav-item ${activeTab === '#locations' ? 'active' : ''}`}
        onClick={() => { window.location.hash = 'locations'; }}
      >
        <span>📍</span>
        <span>Locations</span>
      </button>
      <button
        className={`b-nav-item ${activeTab === '#reports' ? 'active' : ''}`}
        onClick={() => { window.location.hash = 'reports'; }}
      >
        <span>🗂️</span>
        <span>Reports</span>
      </button>
      <Link
        to="/privacy"
        className={`b-nav-item`}
      >
        <PrivacyIcon />
        <span>Privacy</span>
      </Link>
    </nav>
  );
});
BottomNav.displayName = 'BottomNav';

function Home() {
  const { isLoading: dbLoading, error: dbError, data: dbData } = db.useQuery({ reports: {} });

  const reports = useMemo(() => {
    if (!dbData || !dbData.reports) return [];
    return dbData.reports.map(r => ({
      id: r.id,
      report_id: r.report_id,
      location: { latitude: r.latitude, longitude: r.longitude },
      merchant: r.merchant,
      category: r.category as ReportCategory,
      observationType: r.observationType as ObservationType,
      description: r.description,
      timestamp: new Date(r.timestamp).toISOString(),
      status: r.status as any
    })) as Report[];
  }, [dbData]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [timeFilter, setTimeFilter] = useState(30);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError || (dbError ? dbError.message : null);
  const loading = dbLoading;
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Wrapper for existing code that uses setError
  const setError = setLocalError;


  const [activeTab, setActiveTab] = useState('');
  const [fullMap, setFullMap] = useState(false);


  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setActiveTab(hash);
      setLocationsOpen(hash === '#locations');
      setReportsOpen(hash === '#reports');
      // If we are navigating to a top-level hash, ensure nav is closed
      if (hash === '#locations' || hash === '#reports') {
        setNavOpen(false);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const closeOverlay = useCallback(() => {
    // If there is a hash, clear it (which triggers the listener to close panels)
    if (window.location.hash) {
      // Use pushState to avoid scroll jump if possible, or just setting hash
      history.pushState("", document.title, window.location.pathname + window.location.search);
      // Manually trigger handler since pushState doesn't trigger hashchange
      setLocationsOpen(false);
      setReportsOpen(false);
    } else {
      // Fallback if state was somehow set without hash
      setLocationsOpen(false);
      setReportsOpen(false);
    }
  }, []);

  // Form state
  const [category, setCategory] = useState<ReportCategory>('ATM');
  const [observationType, setObservationType] = useState<ObservationType>('Loose card slot');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLon, setManualLon] = useState<string>('');
  const [latError, setLatError] = useState<string>('');
  const [lonError, setLonError] = useState<string>('');
  const [showHotspots, setShowHotspots] = useState(true);
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState<{ label: string; location: Location }[]>([]);
  const [addressHintActive, setAddressHintActive] = useState(false);
  const [nearbyPOIs, setNearbyPOIs] = useState<POIResult[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);


  // Load reports status message
  useEffect(() => {
    if (loading) {
      setStatusMsg('Connecting to database...');
    } else if (error) {
      setStatusMsg('Connection failed');
    } else {
      setStatusMsg('Live data connected');
    }
  }, [loading, error]);


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
    (async () => {
      setPoiLoading(true);
      const results = await queryNearbyPOIs(loc, 600);
      setNearbyPOIs(results);
      setPoiLoading(false);
    })();
  }, []);

  const handlePOISelect = useCallback((loc: Location, name: string) => {
    setSelectedLocation(loc);
    setPanelOpen(true);
    setAddressHintActive(false);
    // Optionally set description or use it as context
    console.log('Selected POI:', name);
  }, []);

  const handleAutoLocate = useCallback((loc: Location) => {
    (async () => {
      setPoiLoading(true);
      const results = await queryNearbyPOIs(loc, 800);
      setNearbyPOIs(results);
      setPoiLoading(false);
    })();
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!selectedLocation) return;

    try {
      setSubmitting(true);
      setError(null);
      setStatusMsg('Submitting report...');

      const reportId = id();
      const timestamp = Date.now();
      const report_id_automation = Math.random().toString(36).substring(2, 11);

      await db.transact(
        db.tx.reports[reportId].update({
          report_id: report_id_automation,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          merchant: merchant || 'Unknown',
          category: category,
          observationType: observationType,
          description: description || undefined,
          timestamp: timestamp,
          status: 'Under Review'
        })
      );

      setReportsOpen(true);
      setPanelOpen(false);
      setDescription('');
      setMerchant('');
      setSelectedLocation(null);
      setStatusMsg('Report submitted');
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
      setStatusMsg('Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [selectedLocation, category, observationType, description, merchant]);

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
      if (e.key === 'Escape' && navOpen) {
        setNavOpen(false);
      }
      if (e.key === 'Escape' && (locationsOpen || reportsOpen)) {
        closeOverlay();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [panelOpen, handleClosePanel, navOpen, locationsOpen, reportsOpen]);

  useEffect(() => {
    if (fullMap) {
      setPanelOpen(false);
      setNavOpen(false);
      setLocationsOpen(false);
      setReportsOpen(false);
    }
  }, [fullMap]);

  useEffect(() => {
    const v = parseFloat(manualLat);
    if (manualLat && (isNaN(v) || v < -90 || v > 90)) setLatError('Latitude must be between -90 and 90');
    else setLatError('');
  }, [manualLat]);

  useEffect(() => {
    const v = parseFloat(manualLon);
    if (manualLon && (isNaN(v) || v < -180 || v > 180)) setLonError('Longitude must be between -180 and 180');
    else setLonError('');
  }, [manualLon]);

  return (
    <div className="app-container">
      {/* Header */}
      {!fullMap && (
        <header className="header" role="banner">
          <div className="header-logo">
            <ShieldIcon />
            <span className="header-title">SkimmerWatch</span>
            <span className="brand-badge">
              Developed by <a href={import.meta.env.VITE_BRAND_URL || 'https://darkstackstudiosinc.vercel.app/'} target="_blank" rel="noopener noreferrer">{import.meta.env.VITE_BRAND_NAME || 'DarkStackStudios Inc.'}</a>
            </span>
          </div>
          <button
            className="hamburger"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            aria-haspopup="menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
          <nav className="top-nav" aria-label="Primary">
            <Link to="/" aria-label="Home">Home</Link>
            <Link to="/transparency" aria-label="Transparency">Transparency</Link>
            <Link to="/privacy" aria-label="Privacy">Privacy</Link>
            {import.meta.env.VITE_SHOW_TEST_LINK === 'true' && (
              <Link to="/test" aria-label="Verify API">Verify API</Link>
            )}
            <button className="nav-link-btn" onClick={() => setFullMap(true)}>Full Map</button>
          </nav>
          <div className="legal-disclaimer" style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            margin: '0.5rem 0',
            fontSize: '0.85rem',
            color: '#92400e',
            gridColumn: '1 / -1'
          }}>
            <strong>Disclaimer</strong><br />
            Skimmer Watcher is an independent, community-driven reporting platform. It is not a law enforcement agency, is not affiliated with, endorsed by, or operated by any police department, government entity, or financial institution, and does not act on behalf of any authority.
            <br /><br />
            Information displayed on this platform is based on community submissions and internal review criteria only. Any classifications, labels, or statuses shown are not official determinations, are not investigative findings, and should not be interpreted as law enforcement confirmation or action.
            <br /><br />
            Skimmer Watcher does not replace 911, emergency services, or official police reports. For crimes in progress, emergencies, or situations requiring immediate response, users must contact local law enforcement directly.
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
                doc.text(`Time range: since ${startTs.toISOString().slice(0, 10)}`, 14, 30);
                doc.text(`Approximate center: (${avgLat.toFixed(4)}, ${avgLon.toFixed(4)})`, 14, 38);
                doc.text(`Unique reports: ${count}`, 14, 46);
                let y = 54;
                doc.text('Report categories:', 14, y); y += 8;
                categoryCounts.forEach(({ cat, count }) => { doc.text(`• ${cat}: ${count}`, 20, y); y += 8; });
                doc.text(`Most recent report: ${new Date(lastTs).toISOString().slice(0, 19).replace('T', ' ')}`, 14, y); y += 12;
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
                const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
                const url = `${window.location.origin}/?report=${encoded}`;
                navigator.clipboard.writeText(url);
                alert('Shareable report link copied to clipboard');
              }}
              aria-label="Copy shareable report link"
            >
              Share Report Link
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`main-content ${navOpen ? 'nav-open' : ''} ${fullMap ? 'full-map-mode' : ''}`} role="main">
        <aside className={`side-nav ${navOpen ? 'open' : ''}`}>
          <div className="side-nav-panel" id="primary-nav" role="navigation" aria-label="Primary">
            <div className="nav-list">
              <button className="nav-link" aria-label="Hide menu" onClick={() => setNavOpen(false)}>✖ Hide menu</button>
              <Link className="nav-link" to="/"><HomeIcon /> Home</Link>
              <button className="nav-link" onClick={() => { setFullMap(true); setNavOpen(false); }}>🗺️ Full Map View</button>
              <Link className="nav-link" to="/transparency"><div className="nav-icon">ℹ️</div> Transparency</Link>
              <Link className="nav-link" to="/privacy"><PrivacyIcon /> Privacy</Link>
              {import.meta.env.VITE_SHOW_TEST_LINK === 'true' && (
                <Link className="nav-link" to="/test"><ApiIcon /> Verify API</Link>
              )}
              <button className="nav-link" aria-label="Open locations list" onClick={() => { window.location.hash = 'locations'; setNavOpen(false); }}>📍 Locations</button>
              <button className="nav-link" aria-label="Open reports list" onClick={() => { window.location.hash = 'reports'; setNavOpen(false); }}>🗂️ Reports</button>
            </div>
          </div>
        </aside>
        {navOpen && <div className="nav-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />}
        <div className="toolbar" role="group" aria-label="Filters">
          <div className="time-filter">
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
        </div>
        <div className="map-container">
          {fullMap && (
            <button
              className="exit-full-map-btn"
              onClick={() => setFullMap(false)}
              aria-label="Exit full map view"
            >
              Exit Full View
            </button>
          )}
          {loading ? (
            <div className="map-loading">Loading map data...</div>
          ) : (
            <MapContainer
              center={center}
              zoom={13}
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
              <LocationFinder setCenter={setCenter} onLocationFound={handleAutoLocate} />
              <MapClickHandler onMapClick={handleMapClick} />
              {showHotspots ? <HotspotOverlay reports={filteredReports} /> : <ReportMarkers reports={filteredReports} />}
              <POIOverlay pois={nearbyPOIs} onSelect={handlePOISelect} />
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
        {panelOpen && <div className="panel-overlay" onClick={handleClosePanel} aria-hidden="true" />}
        <div
          className={`report-panel ${panelOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-panel-title"
        >
          <div className="report-panel-handle" aria-hidden="true" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClosePanel(); }}
            className="close-btn"
            aria-label="Close report panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="report-panel-title">Submit Observation</h2>
          </div>

          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          <p className="helper-text" style={{ marginBottom: '1rem' }}>
            {selectedLocation
              ? 'Location selected. Choose observation details below.'
              : 'Tap on the map to select an approximate location.'}
          </p>

          <div className="form-group">
            <div className="label-text">Category</div>
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
            <div className="label-text">Approximate location (optional)</div>
            <div className="grid grid-manual gap-sm" id="manual-location">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                aria-label="Latitude"
                step="0.0001"
              />
              {latError && <p className="helper-text" role="alert">{latError}</p>}
              <input
                type="number"
                inputMode="decimal"
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                aria-label="Longitude"
                step="0.0001"
              />
              {lonError && <p className="helper-text" role="alert">{lonError}</p>}
              <button
                onClick={() => {
                  const lat = parseFloat(manualLat);
                  const lon = parseFloat(manualLon);
                  if (!isNaN(lat) && !isNaN(lon)) {
                    const loc: Location = { latitude: lat, longitude: lon };
                    setSelectedLocation(loc);
                    setAddressHintActive(false);
                    (async () => {
                      setPoiLoading(true);
                      const results = await queryNearbyPOIs(loc, 600);
                      setNearbyPOIs(results);
                      setPoiLoading(false);
                    })();
                  }
                }}
                aria-label="Use typed coordinates"
                disabled={Boolean(latError || lonError) || !(manualLat && manualLon)}
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
            <div id="address-entry" className="grid gap-sm">
              <input
                type="text"
                placeholder="Street address"
                value={addrLine}
                onChange={(e) => setAddrLine(e.target.value)}
                aria-label="Street address"
                autoComplete="address-line1"
              />
              <div className="grid grid-addr-line gap-sm">
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
                    setPoiLoading(true);
                    const results = await queryNearbyPOIs(location, 600);
                    setNearbyPOIs(results);
                    setPoiLoading(false);
                  } else {
                    setError('Address not found. Please refine your entry or use map/coordinates.');
                  }
                }}
                aria-label="Approximate from address"
              >
                Use Address
              </button>
            </div>
            <p className="helper-text">
              Address is converted to an approximate zone; exact location is not stored.
            </p>

            <div className="form-group">
              <label>Nearby places (within ~600m)</label>
              <div className="poi-list" aria-live="polite">
                {poiLoading && <div className="empty-state">Searching nearby places...</div>}
                {!poiLoading && nearbyPOIs.length === 0 && (
                  <div className="empty-state">No nearby stores detected. You can tap on the map to choose a place.</div>
                )}
                {!poiLoading && nearbyPOIs.slice(0, 12).map((p) => {
                  const name = p.tags?.name || p.tags?.brand || p.tags?.operator || 'Unnamed place';
                  const type = p.tags?.amenity || p.tags?.shop || 'poi';
                  return (
                    <div key={`${p.type}-${p.id}`} className="poi-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div className="helper-text">{type}</div>
                      </div>
                      <button
                        onClick={() => {
                          const loc: Location = { latitude: p.lat, longitude: p.lon };
                          setSelectedLocation(loc);
                          setCenter([loc.latitude, loc.longitude]);
                          setAddressHintActive(true);
                        }}
                        aria-label={`Use ${name} as report location`}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="helper-text">Not seeing it? Tap on the map and choose the nearest place.</p>
            </div>
          </div>

          <div className="form-group">
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#92400e' }}>Before Submitting a Report</h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#92400e' }}>
                Please read and acknowledge the following:
              </p>
              <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#92400e' }}>
                <li>Skimmer Watcher is not affiliated with law enforcement and does not provide police services.</li>
                <li>Submitting a report on this platform does not notify police or initiate an investigation.</li>
                <li>This platform is for informational and awareness purposes only.</li>
                <li>For crimes in progress, emergencies, or immediate threats, you must contact 911 or your local police department directly.</li>
              </ul>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                required
                style={{ marginTop: '0.25rem' }}
                onChange={(e) => {
                  const submitBtn = document.querySelector('.sticky-actions button.primary') as HTMLButtonElement;
                  if (submitBtn) submitBtn.disabled = !e.target.checked || !selectedLocation || submitting;
                }}
              />
              <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                I understand that Skimmer Watcher is not a law enforcement agency, that this submission does not replace official police reporting, and that I am responsible for contacting authorities if immediate action is required.
              </span>
            </label>
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

          <div className="sticky-actions">
            <div aria-live="polite" role="status" className="helper-text">{statusMsg}</div>
            <button
              className="primary"
              onClick={handleSubmitReport}
              disabled={!selectedLocation || submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Observation'}
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
            This is an unverified user observation. No accusations are made. Report classifications are internal platform assessments based on non-law-enforcement criteria.
          </p>
        </div>
      </main>
      {locationsOpen && (
        <>
          <div className="panel-overlay" onClick={closeOverlay} aria-hidden="true" />
          <LocationList reports={reports} onClose={closeOverlay} />
        </>
      )}
      {reportsOpen && (
        <>
          <div className="panel-overlay" onClick={closeOverlay} aria-hidden="true" />
          <ReportsList reports={reports} onClose={closeOverlay} />
        </>
      )}
      <footer className="footer" role="contentinfo" style={fullMap ? { display: 'none' } : {}}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          <strong>Disclaimer</strong><br />
          Skimmer Watcher is an independent, community-driven reporting platform. It is not a law enforcement agency, is not affiliated with, endorsed by, or operated by any police department, government entity, or financial institution, and does not act on behalf of any authority.
          <br /><br />
          Information displayed on this platform is based on community submissions and internal review criteria only. Any classifications, labels, or statuses shown are not official determinations, are not investigative findings, and should not be interpreted as law enforcement confirmation or action.
          <br /><br />
          Skimmer Watcher does not replace 911, emergency services, or official police reports. For crimes in progress, emergencies, or situations requiring immediate response, users must contact local law enforcement directly.
        </div>
        Developed by {import.meta.env.VITE_BRAND_NAME || 'SaintLabs'} ·
        <a href={import.meta.env.VITE_BRAND_URL || 'https://github.com/MelroseSaint'} target="_blank" rel="noopener noreferrer" className="link-inherit">
          {import.meta.env.VITE_BRAND_URL || 'https://github.com/MelroseSaint'}
        </a>
        {' '}· <Link to="/privacy" className="link-inherit">Privacy</Link>
        {' '}· <Link to="/transparency" className="link-inherit">Transparency</Link>
      </footer>
      {!fullMap && <BottomNav activeTab={activeTab} />}
    </div>
  );
}

export default Home;
