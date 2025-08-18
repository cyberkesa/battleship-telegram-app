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
  enabled:
    (typeof window !== 'undefined' && localStorage.getItem('network_debug') === '1') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_NET === 'true')
      ? true
      : false,
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

