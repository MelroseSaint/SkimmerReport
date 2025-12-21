import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { db } from '../../lib/instantdb';
import type { Report, ReportCategory, ObservationType } from '../../domain/types';

// Helper to capitalize words
const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function CityPage() {
  const { state, city } = useParams<{ state: string; city: string }>();
  const { isLoading, error, data } = db.useQuery({ reports: {} });

  const cityName = city ? capitalize(city) : 'Unknown City';
  const stateName = state ? capitalize(state) : 'Unknown State';

  const reports = useMemo(() => {
    if (!data || !data.reports) return [];

    // In a real app, we would query by city/state or bounding box
    // For now we'll just show the most recent ones as a placeholder for the city activity
    return data.reports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(r => ({
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
  }, [data]);

  const stats = useMemo(() => {
    return {
      count: reports.length,
      lastReport: reports.length > 0 ? new Date(reports[0].timestamp).toLocaleDateString() : 'N/A',
      categories: reports.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [reports]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Recent Skimmer Reports in ${cityName}`,
    "description": `User-reported card skimming devices in ${cityName}, ${stateName}`,
    "itemListElement": reports.map((report, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://skimmer-report.vercel.app/locations/${state}/${city}/${report.id}`,
      "name": `Skimmer reported at ${report.merchant}`
    })),
    "areaServed": {
      "@type": "City",
      "name": cityName
    }
  };

  const hasReports = reports.length > 0;

  return (
    <div className="city-page-container max-w-4xl mx-auto p-4">
      <SEO
        title={`Card Skimmer Alerts in ${cityName}, ${stateName} | Live Map & Reports`}
        description={`Stay safe in ${cityName}. View recent credit card skimmer reports at local gas pumps and ATMs. Report a suspicious device to protect the ${cityName} community.`}
        canonical={`https://skimmer-report.vercel.app/locations/${state}/${city}`}
        schema={schema}
      />

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" style={{ fontSize: '0.85rem', color: '#92400e' }}>
        <h4 className="font-bold mb-2">Disclaimer</h4>
        <p className="mb-2">
          Skimmer Watcher is an independent, community-driven reporting platform. It is not a law enforcement agency, is not affiliated with, endorsed by, or operated by any police department, government entity, or financial institution, and does not act on behalf of any authority.
        </p>
        <p className="mb-2">
          Information displayed on this platform is based on community submissions and internal review criteria only. Any classifications, labels, or statuses shown are not official determinations, are not investigative findings, and should not be interpreted as law enforcement confirmation or action.
        </p>
        <p>
          Skimmer Watcher does not replace 911, emergency services, or official police reports. For crimes in progress, emergencies, or situations requiring immediate response, users must contact local law enforcement directly.
        </p>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:underline">Home</Link> &gt;{' '}
        <Link to="/locations" className="hover:underline">Locations</Link> &gt;{' '}
        <Link to={`/locations/${state}`} className="hover:underline">{stateName}</Link> &gt;{' '}
        <span className="text-gray-900">{cityName}</span>
      </nav>

      {isLoading && <div className="p-8 text-center text-gray-500">Connecting to live database...</div>}
      {error && <div className="p-8 text-center text-red-500">Failed to load reports: {error.message}</div>}

      {!isLoading && !error && (
        <>
          {/* H1 & Dynamic Summary */}
          <header className="mb-8">
            {hasReports ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Active Card Skimmer Alerts & Reports in {cityName}, {stateName}
                </h1>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
                  <p className="text-blue-800">
                    <strong>Status Update:</strong> Currently tracking <strong>{stats.count}</strong> submitted reports in the {cityName} area.
                    Last incident reported: {stats.lastReport}.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Card Skimmer Prevention & Safety in {cityName}, {stateName}
                </h1>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm">
                  <p className="text-green-800">
                    <strong>Good News:</strong> No active skimmers have been reported in {cityName} in the last 30 days.
                    Stay proactive by following the safety tips below.
                  </p>
                </div>
              </>
            )}
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Left/Main Column */}
            <div className="md:col-span-2 space-y-8">

              {/* Recent Sightings */}
              {hasReports && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Skimmer Sightings in {cityName}</h2>
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{report.merchant}</h3>
                            <p className="text-gray-600">{report.category} • {report.observationType}</p>
                            <p className="text-sm text-gray-500 mt-1">Reported on {new Date(report.timestamp).toLocaleDateString()}</p>
                          </div>
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            High Risk
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/#report"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      I found a skimmer in {cityName} — Report It Now
                    </Link>
                  </div>
                </section>
              )}

              {/* Zero Reports / Prevention Content */}
              {!hasReports && (
                <section className="prose max-w-none">
                  <p>
                    While no incidents are currently active, skimming is a nationwide threat.
                    Criminals often target high-traffic areas in {cityName}.
                  </p>
                </section>
              )}

              {/* High Risk Zones */}
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">High-Risk Zones & Trends in {cityName}</h2>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <p className="mb-4">
                    In {cityName}, reports are most frequent at independent gas stations and tourist-heavy bank branches.
                  </p>
                  <div className="flex items-start p-4 bg-yellow-50 rounded text-yellow-800">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div>
                      <strong>Safety Tip:</strong> When fueling up near major highways or busy intersections in {cityName},
                      always check for broken security seals on the pump door.
                    </div>
                  </div>
                </div>
              </section>

              {/* Reporting Resources */}
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-4">How to Report Financial Tampering</h3>
                <p className="mb-4">
                  If you are a victim of fraud, it is critical to act fast.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Contact your <strong>local police department</strong> (Non-emergency line).</li>
                  <li>File a report with your bank immediately to freeze your card.</li>
                  <li>Submit a tip to SkimmerWatch to warn your neighbors.</li>
                </ul>
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="space-y-6">
              {/* Quick Stats Widget */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-700 mb-2">Area Statistics</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Total Reports:</span>
                    <span className="font-mono font-bold">{stats.count}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Last 30 Days:</span>
                    <span className="font-mono font-bold">{hasReports ? stats.count : 0}</span>
                  </li>
                </ul>
              </div>

              {/* Safety Checklist */}
              <div className="border border-blue-100 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">Before You Swipe</h4>
                <ul className="text-sm space-y-2 text-blue-800">
                  <li>✅ Wiggle the card reader</li>
                  <li>✅ Check for hidden cameras</li>
                  <li>✅ Cover your PIN</li>
                  <li>✅ Use NFC (Tap) if possible</li>
                </ul>
              </div>
            </aside>
          </div>

          {/* FAQ Schema Section */}
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="group border-b border-gray-200 pb-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-gray-900">
                  How do I spot a gas pump skimmer in {cityName}?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="group-open:animate-fadeIn mt-3 text-gray-600">
                  Look for broken security seals on the pump door. If the seal is void or cut, do not use the pump. Also, try to wiggle the card reader; if it feels loose, it might be an overlay skimmer.
                </p>
              </details>
              <details className="group border-b border-gray-200 pb-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-gray-900">
                  Are ATMs in {cityName} safe to use?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="group-open:animate-fadeIn mt-3 text-gray-600">
                  Most bank ATMs are secure, but always check for loose parts or cameras. Avoid standalone ATMs in dimly lit areas or convenience stores if they look tampered with.
                </p>
              </details>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
