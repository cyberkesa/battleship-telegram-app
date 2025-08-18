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
  isOpen: boolean;
  logs: NetworkLogEntry[];
  setEnabled: (enabled: boolean) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  append: (entry: NetworkLogEntry) => void;
  update: (id: string, update: Partial<NetworkLogEntry>) => void;
  clear: () => void;
}

export const useDebugNetworkStore = create<DebugNetworkState>((set, get) => ({
  enabled: (() => {
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem('network_debug');
        if (v === '0') return false;
        if (v === '1') return true;
      }
    } catch {}
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    return env?.VITE_DEBUG_NET === 'true';
  })(),
  isOpen: (() => {
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem('network_debug_open');
        if (v === '0') return false;
        if (v === '1') return true;
      }
    } catch {}
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    return env?.VITE_DEBUG_NET === 'true';
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
  setOpen: (open: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('network_debug_open', open ? '1' : '0');
      }
    } catch {}
    set({ isOpen: open });
  },
  toggleOpen: () => {
    const next = !get().isOpen;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('network_debug_open', next ? '1' : '0');
      }
    } catch {}
    set({ isOpen: next });
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
export const setDebugNetOpen = (open: boolean) => useDebugNetworkStore.getState().setOpen(open);
export const toggleDebugNetOpen = () => useDebugNetworkStore.getState().toggleOpen();

