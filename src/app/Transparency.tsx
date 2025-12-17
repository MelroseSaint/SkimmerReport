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

                    <h2>Signal Quality & Integrity</h2>
                    <p>
                        We employ a <strong>Signal-to-Noise Ratio (SNR)</strong> philosophy. In an open reporting system, individual data points are less significant than clusters, trends, and corroborated patterns.
                    </p>
                    <ul>
                        <li><strong>Independent Weighting:</strong> We prioritize diversity of sources over volume. Multiple reports from a single source are dampening to prevent manipulation.</li>
                        <li><strong>Thresholds:</strong> A single report is a "Pre-Signal" (unverified observation). It becomes a confirmed "Signal" only when corroboration thresholds are met.</li>
                        <li><strong>Automated Abuse Detection:</strong> Velocity limits and heuristic analysis protect the ecosystem from spam or coordinated vandalism.</li>
                    </ul>

                    <h2>Data Collection & Lifecycle</h2>
                    <h3>What We Collect</h3>
                    <p>We collect specific, minimal data points necessary to contextualize risk:</p>
                    <ul>
                        <li><strong>Location:</strong> The approximate geospatial coordinates of the observation.</li>
                        <li><strong>Timestamp:</strong> When the observation occurred.</li>
                        <li><strong>Observation Type:</strong> The specific anomaly observed (e.g., loose card slot, hidden camera).</li>
                        <li><strong>Category:</strong> The type of terminal (ATM, Gas Pump, Point of Sale).</li>
                    </ul>

                    <h3>Data Retention</h3>
                    <p>
                        Risk information is highly time-sensitive.
                    </p>
                    <ul>
                        <li><strong>Active Decay:</strong> Reports are assigned a relevance score that degrades over a 30-day curve.</li>
                        <li><strong>Archiving:</strong> Reports exceeding the relevance window are automatically transitioned to "Historical" views. They remain accessible for research but do not trigger active alerts.</li>
                    </ul>

                    <h3>What We Do Not Collect</h3>
                    <ul>
                        <li>We do not collect personal identities of reporters for public display.</li>
                        <li>We do not track users' movements beyond the specific act of reporting.</li>
                        <li>We never collect payment card numbers, PINs, or financial data.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h2>Ethical Use & Non-Misuse</h2>
                    <p>
                        SkimmerWatch is a public-interest tool. By using this platform, you agree to:
                    </p>
                    <ul>
                        <li><strong>Use Responsibly:</strong> Do not use this platform to target, harass, or defame specific businesses or individuals.</li>
                        <li><strong>Report Honestly:</strong> Submit observations only when you genuinely suspect a physical anomaly.</li>
                        <li><strong>No Vigilantism:</strong> If you find a device, <strong>do not remove it yourself</strong>. Notify store management or local law enforcement. Tampering with evidence can hinder investigations.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h2>Threat Model & Limitations</h2>
                    <p>
                        <strong>"No Recent Reports" does not mean "Safe."</strong>
                    </p>
                    <p>
                        The absence of activity simply means no one has submitted a report recently. A zero-report location could still have a compromised device that has gone unnoticed.
                    </p>
                    <div className="alert" style={{ marginTop: '1rem', borderLeft: '4px solid var(--color-warning)' }}>
                        <strong>Always Self-Check:</strong> We cannot certify any terminal as safe. Pivot from "trusting the map" to "trusting your inspection." Tug the card reader. Check for alignment issues. Cover your PIN.
                    </div>
                </section>

                <section style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h2>Dispute / Correction Request</h2>
                    <p>
                        We strive for accuracy but acknowledge that user-submitted data provides "ground truth" which can sometimes be subjective.
                    </p>
                    <p>
                        If you are a business owner and believe a report is factually impossible or malicious:
                    </p>
                    <ol>
                        <li>Inspect your terminals immediately to ensure they are clear.</li>
                        <li>Contact our disputes team (via the "About" or "Contact" channels) with evidence of inspection.</li>
                        <li>We will review the report against our anomaly detection framework and reporter history. Validated disputes will result in report removal.</li>
                    </ol>
                </section>

                <section style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h2>Platform Status & Integrity</h2>
                    <p>
                        SkimmerWatch operates as a neutral, civilian-accessible risk intelligence system. We are not a law enforcement agency. We do not issue warrants. We do not verify crimes. We provide the aggregate data so you can assess your own risk tolerance.
                    </p>
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

                        <dt>Time Relevance</dt>
                        <dd>The concept that the validity of a risk signal decreases as time passes without corroboration.</dd>
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
