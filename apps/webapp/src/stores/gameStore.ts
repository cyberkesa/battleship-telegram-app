import { create } from 'zustand';
import { api } from '../services/api';
import { Position, GameEvent } from '@battleship/shared-types';

interface GameState {
  currentMatch: any | null;
  isInQueue: boolean;
  isLoading: boolean;
  error: string | null;
  events: GameEvent[];
  
  // Actions
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  getQueueStatus: () => Promise<void>;
  getActiveMatch: () => Promise<void>;
  setupBoard: (_matchId: string, _fleet: any[]) => Promise<string | undefined>;
  makeMove: (_matchId: string, _position: Position) => Promise<void>;
  getGameState: (_matchId: string) => Promise<void>;
  addEvent: (_event: GameEvent) => void;
  clearEvents: () => void;
  clearError: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentMatch: null,
  isInQueue: false,
  isLoading: false,
  error: null,
  events: [],

  joinQueue: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/matchmaking/join');
      
      if (response.data.success) {
        set({ 
          isInQueue: true, 
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false, 
          error: response.data.error 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to join queue' 
      });
    }
  },

  leaveQueue: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/matchmaking/leave');
      
      if (response.data.success) {
        set({ 
          isInQueue: false, 
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false, 
          error: response.data.error 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to leave queue' 
      });
    }
  },

  getQueueStatus: async () => {
    try {
      const response = await api.get('/matchmaking/status');
      
      if (response.data.success) {
        set({ 
          isInQueue: response.data.data.inQueue 
        });
      }
    } catch (error) {
      console.error('Failed to get queue status:', error);
    }
  },

  getActiveMatch: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get('/matchmaking/active-match');
      
      if (response.data.success) {
        set({ 
          currentMatch: response.data.data, 
          isLoading: false 
        });
      } else {
        set({ 
          currentMatch: null, 
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to get active match' 
      });
    }
  },

  setupBoard: async (matchId: string, fleet: any[]) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post(`/game/${matchId}/setup`, { ships: fleet });
      
      if (response.data.success) {
        const actualMatchId = response.data.data.matchId as string;
        set({ 
          isLoading: false,
          currentMatch: {
            id: actualMatchId,
            status: response.data.data.status,
            currentTurn: response.data.data.currentTurn
          }
        });
        return actualMatchId;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.error 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to setup board' 
      });
    }
  },

  makeMove: async (matchId: string, position: Position) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post(`/game/${matchId}/move`, { position });
      
      if (response.data.success) {
        set({ isLoading: false });
        return response.data.data;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.error 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to make move' 
      });
    }
  },

  getGameState: async (matchId: string) => {
    try {
      const response = await api.get(`/game/${matchId}/state`);
      
      if (response.data.success) {
        set({ currentMatch: response.data.data });
      }
    } catch (error) {
      console.error('Failed to get game state:', error);
    }
  },

  addEvent: (event: GameEvent) => {
    set(state => ({
      events: [...state.events, event]
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },

  clearError: () => {
    set({ error: null });
  }
}));
