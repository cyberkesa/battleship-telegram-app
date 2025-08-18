import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

type Status = 'ok' | 'error' | 'unknown';

interface HealthData {
  api: { ok: boolean };
  db: { ok: boolean; latencyMs?: number; error?: string };
  redis: { ok: boolean; latencyMs?: number; error?: string };
  telegram: { configured: boolean };
  jwt: { configured: boolean };
  time: string;
  durationMs: number;
}

const Dot: React.FC<{ status: Status }> = ({ status }) => {
  const color = status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#9ca3af';
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color }} />;
};

export const SystemStatus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      if (res.data?.success) {
        setHealth(res.data.data);
      } else {
        setError('Failed to fetch health');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const statusOf = (ok?: boolean): Status => ok == null ? 'unknown' : ok ? 'ok' : 'error';

  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: 'white', padding: '8px 10px', borderRadius: 8, fontSize: 12, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <strong>System</strong>
        {loading ? <span style={{ fontSize: 11, opacity: 0.8 }}>loading…</span> : null}
        {error ? <span style={{ color: '#f87171' }}>{error}</span> : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot status={statusOf(true)} /> <span>API</span>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.85 }}>{health?.durationMs ? `${health.durationMs}ms` : ''}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot status={statusOf(health?.db?.ok)} /> <span>DB</span>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.85 }}>{health?.db?.latencyMs != null ? `${health?.db?.latencyMs}ms` : health?.db?.error || ''}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot status={statusOf(health?.redis?.ok)} /> <span>Redis</span>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.85 }}>{health?.redis?.latencyMs != null ? `${health?.redis?.latencyMs}ms` : health?.redis?.error || ''}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot status={statusOf(health?.telegram?.configured)} /> <span>Telegram Bot</span>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.85 }}>{health?.telegram?.configured ? 'configured' : 'not set'}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot status={statusOf(health?.jwt?.configured)} /> <span>JWT</span>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.85 }}>{health?.jwt?.configured ? 'configured' : 'not set'}</div>
      </div>
    </div>
  );
};

