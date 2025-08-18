import axios from 'axios';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
  leaveQueue: () => api.post('/matchmaking/leave'),
  getStatus: () => api.get('/matchmaking/status'),
  getActiveMatch: () => api.get('/matchmaking/active-match'),
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
