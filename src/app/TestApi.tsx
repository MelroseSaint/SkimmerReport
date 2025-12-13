import { useState } from 'react';

export default function TestApi() {
  const [status, setStatus] = useState('');
  const [payload, setPayload] = useState('');

  const getReports = async () => {
    setStatus('');
    setPayload('');
    try {
      const res = await fetch('/api/reports');
      const text = await res.text();
      setStatus(`GET /api/reports → ${res.status}`);
      setPayload(text);
    } catch (e: any) {
      setStatus(`GET error`);
      setPayload(String(e?.message || e));
    }
  };

  const postSample = async () => {
    setStatus('');
    setPayload('');
    try {
      const body = {
        location: { latitude: 40.7128, longitude: -74.006 },
        category: 'ATM',
        observationType: 'Loose card slot',
        description: 'API verification sample',
      };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      setStatus(`POST /api/reports → ${res.status}`);
      setPayload(text);
    } catch (e: any) {
      setStatus(`POST error`);
      setPayload(String(e?.message || e));
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>API Verification</h1>
      <p>Use these quick actions to verify the production API.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={getReports}>GET /api/reports</button>
        <button onClick={postSample}>POST /api/reports (sample)</button>
        <a href="/" style={{ marginLeft: 'auto' }}>Back</a>
      </div>
      <div style={{ padding: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{status}</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{payload}</pre>
      </div>
    </div>
  );
}

