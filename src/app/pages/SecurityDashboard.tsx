import { useState, useEffect } from 'react';
import { securityLogger } from '../../security/audit';
import type { SecurityEvent } from '../../security/audit';
import './SecurityDashboard.css';

export default function SecurityDashboard() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

    const loadEvents = () => {
        const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const allEvents = securityLogger.getEvents({
            since,
            severity: filter === 'all' ? undefined : filter,
            limit: 100
        });

        setEvents(allEvents);
    };

    useEffect(() => {
        loadEvents();
        const interval = setInterval(loadEvents, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [filter, timeRange]);

    const metrics = securityLogger.getSecurityMetrics();

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const exportLogs = () => {
        const data = securityLogger.exportEvents();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="security-dashboard">
            <header className="dashboard-header">
                <h1>🛡️ Security Dashboard</h1>
                <button onClick={exportLogs} className="export-btn">
                    Export Logs
                </button>
            </header>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Total Events</div>
                    <div className="metric-value">{metrics.total_events}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Last 24h</div>
                    <div className="metric-value">{metrics.last_24h}</div>
                </div>
                <div className="metric-card critical">
                    <div className="metric-label">Critical (1h)</div>
                    <div className="metric-value">{metrics.critical_in_last_hour}</div>
                </div>
            </div>

            <div className="events-by-type">
                <h3>Events by Type</h3>
                <div className="type-grid">
                    {Object.entries(metrics.events_by_type).map(([type, count]) => (
                        <div key={type} className="type-item">
                            <span className="type-name">{type.replace(/_/g, ' ')}</span>
                            <span className="type-count">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <label>Severity:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low')}>
                        <option value="all">All</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Time Range:</label>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}>
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                </div>
            </div>

            <div className="events-list">
                <h3>Security Events ({events.length})</h3>
                {events.length === 0 ? (
                    <div className="no-events">No security events in this time range</div>
                ) : (
                    <div className="events-table">
                        {events.map((event, idx) => (
                            <div key={idx} className="event-row">
                                <div
                                    className="severity-badge"
                                    style={{ backgroundColor: getSeverityColor(event.severity) }}
                                >
                                    {event.severity}
                                </div>
                                <div className="event-details">
                                    <div className="event-type">{event.event_type.replace(/_/g, ' ')}</div>
                                    <div className="event-time">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </div>
                                    {event.ip_address && (
                                        <div className="event-ip">IP: {event.ip_address}</div>
                                    )}
                                    {event.endpoint && (
                                        <div className="event-endpoint">{event.method} {event.endpoint}</div>
                                    )}
                                    {event.details && (
                                        <details className="event-details-expand">
                                            <summary>Details</summary>
                                            <pre>{JSON.stringify(event.details, null, 2)}</pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}