import React, { createContext, useContext, useEffect } from 'react';
import { useTelegram } from './TelegramProvider';
import { authAPI, api } from '../services/api';

interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  gamesPlayed: number;
  gamesWon: number;
  rating: number;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: tgUser, isReady, webApp } = useTelegram();
  const [authState, setAuthState] = React.useState<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  });

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Prefer server-side authentication when initData is available to obtain JWT
        const initData = (webApp as any)?.initData || (window as any)?.Telegram?.WebApp?.initData;
        if (initData) {
          const response = await authAPI.authenticate({ initData });
          if (response.data?.success) {
            const { token, user } = response.data.data;
            if (token) {
              localStorage.setItem('auth_token', token);
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            // Clear any one-time retry flag after successful auth
            try { localStorage.removeItem('tg_auth_retry'); } catch {}

            // Prefer fetching fresh profile to ensure normalized fields and avatar
            try {
              const me = await authAPI.getProfile();
              if (me.data?.success && me.data?.data) {
                const u = me.data.data;
                const normalizedUser: User = {
                  id: u.id,
                  telegramId: u.telegramId,
                  firstName: u.firstName || tgUser?.first_name || 'Игрок',
                  lastName: u.lastName ?? tgUser?.last_name,
                  username: u.username ?? tgUser?.username,
                  photoUrl: u.photoUrl || tgUser?.photo_url,
                  gamesPlayed: u.gamesPlayed ?? 0,
                  gamesWon: u.gamesWon ?? 0,
                  rating: u.rating ?? 1000,
                  createdAt: u.createdAt
                };
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                  user: normalizedUser,
                  clearError: () => setAuthState(prev => ({ ...prev, error: null }))
                });
                return;
              }
            } catch {}

            // Fallback: use data from authenticate response
            const normalizedUser: User = {
              id: user.id,
              telegramId: user.telegramId,
              firstName: user.firstName || tgUser?.first_name || 'Игрок',
              lastName: user.lastName ?? tgUser?.last_name,
              username: user.username ?? tgUser?.username,
              photoUrl: user.photoUrl || tgUser?.photo_url,
              gamesPlayed: 0,
              gamesWon: 0,
              rating: 1000,
              createdAt: user.createdAt
            };

            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              error: null,
              user: normalizedUser,
              clearError: () => setAuthState(prev => ({ ...prev, error: null }))
            });
            return;
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false, error: response.data?.error || 'Authentication failed' }));
            return;
          }
        }

        // If we already have a token, restore session by fetching profile
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
          const me = await authAPI.getProfile();
          if (me.data?.success && me.data?.data) {
            const u = me.data.data;
            const normalizedUser: User = {
              id: u.id,
              telegramId: u.telegramId,
              firstName: u.firstName,
              lastName: u.lastName,
              username: u.username,
              photoUrl: u.photoUrl || tgUser?.photo_url,
              gamesPlayed: u.gamesPlayed ?? 0,
              gamesWon: u.gamesWon ?? 0,
              rating: u.rating ?? 1000,
              createdAt: u.createdAt
            };
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              error: null,
              user: normalizedUser,
              clearError: () => setAuthState(prev => ({ ...prev, error: null }))
            });
            return;
          }
        }

        // Fallback: if Telegram user is available but no initData (e.g., dev mode), use local auth
        if (tgUser) {
          const normalizedUser: User = {
            id: tgUser.id,
            telegramId: tgUser.id,
            firstName: tgUser.first_name || 'Игрок',
            lastName: tgUser.last_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
            gamesPlayed: 0,
            gamesWon: 0,
            rating: 1000,
            createdAt: new Date().toISOString()
          };

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            user: normalizedUser,
            clearError: () => setAuthState(prev => ({ ...prev, error: null }))
          });
          return;
        }

        // Neither initData nor tgUser available
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Telegram initData not available' }));
      } catch (error: any) {
        console.error('Authentication error:', error);
        // If Telegram initData might have expired, attempt a one-time reload to refresh it
        const status = error?.response?.status;
        const isTelegramCtx = Boolean((window as any)?.Telegram?.WebApp);
        const retryKey = 'tg_auth_retry';
        const alreadyRetried = localStorage.getItem(retryKey) === '1';
        if (isTelegramCtx && status === 401 && !alreadyRetried) {
          try {
            localStorage.setItem(retryKey, '1');
          } catch {}
          // A single reload inside Telegram refreshes initData/auth_date
          window.location.reload();
          return;
        }
        setAuthState(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Authentication error' }));
      }
    };

    if (isReady) {
      // Attempt authentication once when Telegram WebApp context is ready
      if (!authState.isAuthenticated && authState.isLoading) {
        authenticate();
      }
    } else {
      // Wait until Telegram is ready
      setAuthState(prev => ({ ...prev, isLoading: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, webApp, tgUser]);

  // Listen for unauthorized events and reflect in auth state without reloading
  useEffect(() => {
    const onUnauthorized = () => {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Сессия истекла. Повторите вход.'
      }));
    };
    window.addEventListener('auth:unauthorized', onUnauthorized as EventListener);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized as EventListener);
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

