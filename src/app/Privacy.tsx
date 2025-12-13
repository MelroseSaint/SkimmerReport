export default function Privacy() {
  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Privacy</h1>
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

