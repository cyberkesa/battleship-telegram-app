import React from 'react';
import { useDebugNetworkStore } from '../stores/debugNetworkStore';

export const NetworkDebugOverlay: React.FC = () => {
  const { enabled, logs, clear, setEnabled } = useDebugNetworkStore();

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 8,
      right: 8,
      width: 'min(95vw, 520px)',
      maxHeight: '70vh',
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontSize: 12,
      zIndex: 9999,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.08)' }}>
        <strong style={{ flex: 1 }}>Network Debug</strong>
        <button onClick={() => clear()} style={{ marginRight: 8 }}>Clear</button>
        <button onClick={() => setEnabled(false)}>Hide</button>
      </div>
      <div style={{ overflow: 'auto', maxHeight: '62vh' }}>
        {logs.length === 0 && (
          <div style={{ padding: 12, opacity: 0.7 }}>No requests yet</div>
        )}
        {logs.map((l) => (
          <details key={l.id} open style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <summary style={{ padding: '8px 10px', cursor: 'pointer' }}>
              <span style={{ marginRight: 8, color: '#8be9fd' }}>{l.method}</span>
              <span style={{ marginRight: 8 }}>{l.url}</span>
              {typeof l.status === 'number' && (
                <span style={{ color: l.status >= 400 ? '#ff5555' : '#50fa7b' }}>[{l.status}]</span>
              )}
              {typeof l.durationMs === 'number' && (
                <span style={{ marginLeft: 8, opacity: 0.8 }}>{l.durationMs}ms</span>
              )}
            </summary>
            <div style={{ padding: '0 10px 10px 10px' }}>
              {l.baseURL && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>baseURL</div>
                  <code>{l.baseURL}</code>
                </div>
              )}
              {l.requestHeaders && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>request headers</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(l.requestHeaders, null, 2)}</pre>
                </div>
              )}
              {typeof l.requestBody !== 'undefined' && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>request body</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(l.requestBody, null, 2)}</pre>
                </div>
              )}
              {typeof l.status === 'number' && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>response status</div>
                  <code>{l.status}</code>
                </div>
              )}
              {l.responseHeaders && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>response headers</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(l.responseHeaders, null, 2)}</pre>
                </div>
              )}
              {typeof l.responseBody !== 'undefined' && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.7 }}>response body</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{
                    typeof l.responseBody === 'string' ? l.responseBody : JSON.stringify(l.responseBody, null, 2)
                  }</pre>
                </div>
              )}
              {l.error && (
                <div style={{ marginBottom: 6, color: '#ffb86c' }}>
                  <div style={{ opacity: 0.7 }}>error</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{l.error}</pre>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

