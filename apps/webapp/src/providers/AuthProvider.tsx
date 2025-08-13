import React, { createContext, useContext, useEffect } from 'react';
import { useTelegram } from './TelegramProvider';

interface User {
  id: number;
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
  const { user: tgUser, isReady } = useTelegram();
  const [authState, setAuthState] = React.useState<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  });

  useEffect(() => {
    if (isReady && tgUser) {
      // Создаем пользователя из Telegram данных
      const user: User = {
        id: tgUser.id,
        telegramId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photoUrl: undefined, // Telegram не предоставляет фото в WebApp
        gamesPlayed: 0,
        gamesWon: 0,
        rating: 1000,
        createdAt: new Date().toISOString()
      };

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        user,
        clearError: () => setAuthState(prev => ({ ...prev, error: null }))
      });
    } else if (isReady && !tgUser) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Telegram user data not available',
        user: null,
        clearError: () => setAuthState(prev => ({ ...prev, error: null }))
      });
    }
  }, [isReady, tgUser]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
