import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function isEnabled() {
  return String(import.meta.env.VITE_SHOW_ADMIN || '').toLowerCase() === 'true';
}

export default function AdminControls() {
  const enabled = useMemo(() => isEnabled(), []);
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('adminToken', token);
  }, [token]);

  if (!enabled) return null;

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  async function run(path, body) {
    setBusy(true);
    setMessage('');
    try {
      const res = await api.post(path, body || {}, { headers: authHeaders, timeout: 30000 });
      setMessage(`OK: ${path}`);
      return res.data;
    } catch (e) {
      setMessage(`ERROR: ${path} (${e?.response?.status || ''}) ${e?.response?.data?.error || e.message}`);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    setBusy(true);
    setMessage('');
    try {
      const res = await api.get('/admin/status', { headers: authHeaders, timeout: 10000 });
      setStatus(res.data);
      setMessage('Loaded admin status');
    } catch (e) {
      setMessage(`ERROR: /admin/status (${e?.response?.status || ''}) ${e?.response?.data?.error || e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full px-4 pt-6">
      <div className="bg-white p-4 shadow rounded-lg border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Admin Controls</h2>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ADMIN_TOKEN"
              className="p-2 border border-gray-300 rounded w-[280px]"
            />
            <button
              onClick={refreshStatus}
              disabled={busy}
              className="!bg-gray-800 !text-white px-4 py-2 rounded hover:!bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Working...' : 'Status'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => run('/admin/sync/opensky')}
            disabled={busy}
            className="!bg-blue-600 !text-white px-3 py-2 rounded hover:!bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync OpenSky once
          </button>
          <button
            onClick={() => run('/admin/sync/weather')}
            disabled={busy}
            className="!bg-cyan-600 !text-white px-3 py-2 rounded hover:!bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync Weather once
          </button>
          <button
            onClick={() => run('/admin/sync/nfz')}
            disabled={busy}
            className="!bg-rose-600 !text-white px-3 py-2 rounded hover:!bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync NFZ once
          </button>
          <button
            onClick={() => run('/admin/sync/airspaces')}
            disabled={busy}
            className="!bg-amber-600 !text-white px-3 py-2 rounded hover:!bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync Airspaces
          </button>
          <button
            onClick={() => run('/admin/sync/prices')}
            disabled={busy}
            className="!bg-violet-600 !text-white px-3 py-2 rounded hover:!bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync Prices (default routes)
          </button>
          <button
            onClick={() => run('/admin/sync/neo4j')}
            disabled={busy}
            className="!bg-indigo-600 !text-white px-3 py-2 rounded hover:!bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync Neo4j Routes
          </button>
        </div>

        {status && (
          <pre className="mt-4 text-xs bg-gray-50 border rounded p-3 overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        )}

        {message && (
          <div className="mt-3 text-sm text-gray-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

