export default function Privacy() {
  return (
    <div className="privacy-page">
      <h1>Privacy</h1>
      
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

      <p>
        SkimmerWatch is designed with intentional engineering and clean code principles. The platform focuses on
        anonymous reporting, approximate zones, and non-accusatory language.
      </p>
      <ul>
        <li>No accounts; no IP logging</li>
        <li>Location fuzzing; exact addresses are not stored</li>
        <li>Zone-based visualization; risk density rather than accusations</li>
      </ul>
      <p>
        This approach aligns with the DarkStackStudios commitment to precise, purpose-built software experiences led by
        ObscuraCode — efficiency, elegance, and clarity.
      </p>
      <p>
        Learn more: <a href="https://darkstackstudiosinc.vercel.app/" target="_blank" rel="noopener noreferrer">darkstackstudiosinc.vercel.app</a>
      </p>
      <p><a href="/">Back</a></p>
    </div>
  );
}
