import axios from 'axios';
import { debugNetAppend, debugNetUpdate } from '../stores/debugNetworkStore';
import { randomUUID } from './uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin.replace(/:\\d+$/, ':3000')}/api` : 'http://localhost:3000/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  authenticate: (data: any) => api.post('/auth/telegram', data),
  getProfile: () => api.get('/auth/me'),
};

export const lobbyAPI = {
  create: (playerName: string, playerAvatar?: string) =>
    api.post('/lobby/create', { playerName, playerAvatar }),
  join: (lobbyId: string, playerName: string, playerAvatar?: string) =>
    api.post('/lobby/join', { lobbyId, playerName, playerAvatar }),
  status: (lobbyId: string) => api.get(`/lobby/${lobbyId}`),
  ready: (lobbyId: string) => api.post(`/lobby/${lobbyId}/ready`),
  leave: (lobbyId: string) => api.post(`/lobby/${lobbyId}/leave`),
};

export const matchmakingAPI = {
  joinQueue: () => api.post('/matchmaking/join'),
  leaveQueue: (mode: 'CLASSIC' | 'RAPID' | 'BLITZ' = 'CLASSIC') => api.delete(`/matchmaking/leave/${mode}`),
};

export const gameAPI = {
  setupBoard: (matchId: string, ships: any[]) => 
    api.post(`/game/${matchId}/setup`, { ships }),
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
