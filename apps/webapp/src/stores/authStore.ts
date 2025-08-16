import { create } from 'zustand';
import { api } from '../services/api';
import { TelegramUser } from '@battleship/shared-types';

interface AuthState {
  user: TelegramUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeTelegram: () => Promise<void>;
  authenticate: (_initData: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initializeTelegram: async () => {
    try {
      set({ isLoading: true, error: null });

      if (window.Telegram?.WebApp) {
        const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
        const initData = window.Telegram.WebApp.initData;

        if (telegramUser && initData) {
          await get().authenticate(initData);
        } else {
          set({ 
            isLoading: false, 
            error: 'Telegram user data not available' 
          });
        }
      } else {
        set({ 
          isLoading: false, 
          error: 'Telegram Web App not available' 
        });
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  },

  authenticate: async (initData: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.post('/auth/telegram', {
        initData,
        user: window.Telegram.WebApp.initDataUnsafe.user
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Set auth token for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        set({
          isLoading: false,
          error: response.data.error || 'Authentication failed'
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  },

  logout: () => {
    // Clear auth token
    delete api.defaults.headers.common['Authorization'];
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));
