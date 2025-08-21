import axios from 'axios';
import { debugNetAppend, debugNetUpdate } from '../stores/debugNetworkStore';
import { randomUUID } from './uuid';

const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    try {
      const u = new URL(window.location.href);
      u.port = u.port || '3000';
      u.pathname = '/api';
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {}
  }
  return 'http://localhost:3000/api';
})();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug capture: request
    const id = randomUUID();
    (config as any).__dbg_id = id;
    (config as any).__dbg_startedAt = Date.now();
    debugNetAppend({
      id,
      method: (config.method || 'GET').toUpperCase(),
      url: config.url || '',
      baseURL: config.baseURL,
      requestHeaders: { ...(config.headers as any) },
      requestBody: config.data,
      startedAt: (config as any).__dbg_startedAt,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    const cfg: any = response.config || {};
    const id: string | undefined = cfg.__dbg_id;
    if (id) {
      debugNetUpdate(id, {
        status: response.status,
        responseHeaders: response.headers as any,
        responseBody: response.data,
        durationMs: Date.now() - (useStart(cfg) || Date.now()),
      });
    }
    return response;
  },
  (error) => {
    try {
      const cfg: any = error.config || {};
      const id: string | undefined = cfg.__dbg_id;
      if (id) {
        debugNetUpdate(id, {
          status: error.response?.status,
          responseHeaders: error.response?.headers,
          responseBody: error.response?.data,
          error: error.message,
          durationMs: Date.now() - (useStart(cfg) || Date.now()),
        });
      }
    } catch {}
    if (error.response?.status === 401) {
      // Handle unauthorized access without causing reload loops
      try {
        localStorage.removeItem('auth_token');
        if ((api as any)?.defaults?.headers?.common?.Authorization) {
          delete (api as any).defaults.headers.common.Authorization;
        }
        const evt = new CustomEvent('auth:unauthorized');
        window.dispatchEvent(evt);
      } catch {}
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  authenticate: (data: any) => api.post('/auth/telegram/validate', data, { timeout: 30000 }),
  getProfile: () => api.get('/auth/me'),
};

export const lobbyAPI = {
  create: (playerName: string, playerAvatar?: string) =>
    api.post('/lobby/create', { playerName, playerAvatar }),
  join: (lobbyId: string, playerName: string, playerAvatar?: string) =>
    api.post('/lobby/join', { lobbyId, playerName, playerAvatar }),
  status: (lobbyId: string) => api.get(`/lobby/${lobbyId}`),
  ready: (lobbyId: string) => api.post(`/lobby/${lobbyId}/ready`),
  unready: (lobbyId: string) => api.post(`/lobby/${lobbyId}/unready`),
  start: (lobbyId: string) => api.post(`/lobby/${lobbyId}/start`),
  leave: (lobbyId: string) => api.post(`/lobby/${lobbyId}/leave`),
};

export const matchmakingAPI = {
  joinQueue: () => api.post('/matchmaking/join'),
  leaveQueue: (mode: 'CLASSIC' | 'RAPID' | 'BLITZ' = 'CLASSIC') => api.delete(`/matchmaking/leave/${mode}`),
};

export const gameAPI = {
  setupBoard: (matchId: string, ships: any[]) => 
    matchId === 'computer' ? api.post(`/game/quick/setup`, { ships }) : api.post(`/game/${matchId}/setup`, { ships }),
  makeMove: (matchId: string, position: any) => 
    api.post(`/game/${matchId}/move`, { position }),
  getState: (matchId: string) => api.get(`/game/${matchId}/state`),
};

export const eventsAPI = {
  subscribe: (matchId: string) => 
    api.get(`/events/${matchId}/subscribe`, { 
      responseType: 'stream' 
    }),
};

function useStart(cfg: any): number | undefined {
  const id: string | undefined = cfg?.__dbg_id;
  if (!id) return undefined;
  // find in store for start time
  // lightweight approach: we stored startedAt in append; duration computed via start on update using closure is not available here,
  // so we stash it into config too
  return cfg.__dbg_startedAt;
}
