import { create } from 'zustand';

export interface NetworkLogEntry {
  id: string;
  method: string;
  url: string;
  baseURL?: string;
  requestHeaders?: Record<string, any>;
  requestBody?: any;
  status?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
  error?: string;
  startedAt: number;
  durationMs?: number;
}

interface DebugNetworkState {
  enabled: boolean;
  logs: NetworkLogEntry[];
  setEnabled: (enabled: boolean) => void;
  append: (entry: NetworkLogEntry) => void;
  update: (id: string, update: Partial<NetworkLogEntry>) => void;
  clear: () => void;
}

export const useDebugNetworkStore = create<DebugNetworkState>((set, get) => ({
  enabled: (() => {
    // Always on by default; allow explicit opt-out via localStorage or env
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem('network_debug');
        if (v === '0') return false;
        if (v === '1') return true;
      }
    } catch {}
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    if (env?.VITE_DEBUG_NET === 'false') return false;
    return true;
  })(),
  logs: [],
  setEnabled: (enabled: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('network_debug', enabled ? '1' : '0');
      }
    } catch {}
    set({ enabled });
  },
  append: (entry: NetworkLogEntry) => set({ logs: [entry, ...get().logs].slice(0, 200) }),
  update: (id: string, update: Partial<NetworkLogEntry>) =>
    set({
      logs: get().logs.map((l) => (l.id === id ? { ...l, ...update } : l)),
    }),
  clear: () => set({ logs: [] }),
}));

export const debugNetAppend = (entry: NetworkLogEntry) => useDebugNetworkStore.getState().append(entry);
export const debugNetUpdate = (id: string, update: Partial<NetworkLogEntry>) =>
  useDebugNetworkStore.getState().update(id, update);
export const setDebugNetEnabled = (enabled: boolean) => useDebugNetworkStore.getState().setEnabled(enabled);

