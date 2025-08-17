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
            const normalizedUser: User = {
              id: user.id,
              telegramId: user.telegramId,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              photoUrl: user.photoUrl || tgUser?.photo_url,
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
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false, error: response.data?.error || 'Authentication failed' }));
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
      } catch (error) {
        console.error('Authentication error:', error);
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

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
