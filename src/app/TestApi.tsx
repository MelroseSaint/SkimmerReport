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
    <div className="api-page">
      <h1>API Verification</h1>
      <p>Use these quick actions to verify the production API.</p>
      <div className="api-actions">
        <button onClick={getReports}>GET /api/reports</button>
        <button onClick={postSample}>POST /api/reports (sample)</button>
        <a href="/" style={{ marginLeft: 'auto' }}>Back</a>
      </div>
      <div className="api-card">
        <div className="api-status">{status}</div>
        <pre className="pre-wrap">{payload}</pre>
      </div>
    </div>
  );
}
