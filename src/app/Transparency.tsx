import React from 'react';
import './App.css';

export default function Transparency() {
    return (
        <div className="app-container" style={{ overflow: 'auto' }}>
            <header className="header">
                <div className="header-logo">
                    <span className="header-title">SkimmerWatch Transparency</span>
                </div>
                <nav className="top-nav">
                    <a href="/">Home</a>
                </nav>
            </header>

            <main className="privacy-page">
                <section style={{ marginBottom: '2rem' }}>
                    <h1>Transparency & Methodology</h1>

                    <h2>Our Mission</h2>
                    <p>
                        SkimmerWatch provides a community-driven layer of visibility into payment card security risks.
                        We empower individuals to share observations and make informed decisions about where they use their cards.
                    </p>

                    <h2>Data Collection Policy</h2>
                    <p>We collect specific, minimal data points necessary to contextualize risk:</p>
                    <ul>
                        <li><strong>Location:</strong> The approximate geospatial coordinates of the observation.</li>
                        <li><strong>Timestamp:</strong> When the observation occurred.</li>
                        <li><strong>Observation Type:</strong> The specific anomaly observed (e.g., loose card slot, hidden camera, keypad overlay).</li>
                        <li><strong>Category:</strong> The type of terminal (ATM, Gas Pump, Point of Sale).</li>
                    </ul>

                    <h3>What We Do Not Collect</h3>
                    <ul>
                        <li>We do not collect personal identities of reporters for public display.</li>
                        <li>We do not track users' movements beyond the specific act of reporting.</li>
                        <li>We never collect payment card numbers, PINs, or financial data.</li>
                    </ul>

                    <h2>How Reports Are Processed</h2>
                    <p>All submissions are treated as "User-Submitted Observations." They are not judgments of guilt or criminality.</p>
                    <ol>
                        <li><strong>Submission:</strong> A user submits an observation.</li>
                        <li><strong>Indexing:</strong> The report is indexed by location and time.</li>
                        <li><strong>Display:</strong> The report appears on the public map as an unverified signal.</li>
                        <li><strong>Aging:</strong> Reports automatically fade in visual prominence as they age (<a href="#freshness">see Data Freshness</a>).</li>
                    </ol>

                    <h2>Status Indicators</h2>
                    <ul>
                        <li><strong>User Reported:</strong> The default status for all incoming community data.</li>
                        <li><strong>Cluster/Hot Zone:</strong> Indicates a higher volume of recent reports in this specific area.</li>
                        <li><strong>Historical:</strong> Data older than 30 days, kept for reference but possibly no longer reflecting current conditions.</li>
                    </ul>

                    <h2>Commitment to Neutrality</h2>
                    <p>
                        SkimmerWatch is a neutral platform. We do not inspect terminals, we do not arrest suspects, and we do not certify devices as safe.
                        We provide the aggregate data so you can assess your own risk tolerance. Errors or outdated reports can be flagged for review.
                    </p>
                </section>

                <section id="freshness" style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h1>Understanding "Last Activity"</h1>

                    <p>
                        When viewing the SkimmerWatch map, you will see a "Last Activity" timestamp for Locations.
                        It is crucial to interpret this correctly.
                    </p>

                    <h3>What It Means</h3>
                    <p>
                        This timestamp indicates the most recent user-submitted report received for that specific location or zone.
                        It reflects the last time a community member observed and logged a potential issue.
                    </p>

                    <h3>Why Freshness Matters</h3>
                    <p>
                        Physical skimming devices are often transient; criminals may plant them for a few hours and remove them. Therefore:
                    </p>
                    <ul>
                        <li><strong>Recent Activity (&lt; 24 hours):</strong> Suggests a potentially active or highly relevant risk.</li>
                        <li><strong>Older Activity (&gt; 7 days):</strong> Suggests a historical risk pattern, though the specific device reported may have been removed.</li>
                    </ul>

                    <div className="alert" style={{ marginTop: '1rem', borderLeft: '4px solid var(--color-warning)' }}>
                        <strong>Important:</strong> "No Recent Reports" does <em>not</em> mean "Safe."
                        The absence of activity simply means no one has submitted a report recently.
                        Always inspect the card reader yourself regardless of what the map indicates.
                    </div>
                </section>

                <section style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h1>Glossary of Terms</h1>
                    <dl className="glossary-list">
                        <dt>Report</dt>
                        <dd>A single, discrete user submission detailing an observation at a specific time and place.</dd>

                        <dt>Location</dt>
                        <dd>The physical venue or coordinate where a Report is attached.</dd>

                        <dt>Risk Indicator</dt>
                        <dd>Quantifiable data (visual or digital) suggesting a terminal may be compromised.</dd>

                        <dt>Hot Zone / High-Density Area</dt>
                        <dd>A geographic radius where the frequency of recent Reports exceeds the standard deviation for that region.</dd>

                        <dt>User-Submitted</dt>
                        <dd>Data provided by community members. It is not externally verified by platform operators unless explicitly stated.</dd>
                    </dl>
                </section>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <a href="/" className="category-btn active" style={{ textDecoration: 'none' }}>Return to Map</a>
                </div>
            </main>

            <footer className="footer" style={{ position: 'static', padding: '2rem' }}>
                <p>&copy; {new Date().getFullYear()} SkimmerWatch. All rights reserved.</p>
            </footer>
        </div>
    );
}
