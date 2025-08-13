import { useState, useEffect } from 'react';
import { useTelegram } from './useTelegram';

interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  gamesPlayed: number;
  gamesWon: number;
  rating: number;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = () => {
  const { user: tgUser, isReady, initData } = useTelegram();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  const authenticate = async () => {
    if (!tgUser || !initData) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Telegram user data not available'
      }));
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch('/api/auth/telegram', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ initData, user: tgUser })
      // });

      // Пока симулируем создание профиля
      const mockUser: User = {
        id: 1,
        telegramId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        gamesPlayed: 0,
        gamesWon: 0,
        rating: 1000,
        createdAt: new Date().toISOString()
      };

      // Сохраняем в localStorage для демонстрации
      localStorage.setItem('battleship_user', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        error: null
      });

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed'
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('battleship_user');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null
    });
  };

  const updateUserStats = (gamesPlayed: number, gamesWon: number, rating: number) => {
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        gamesPlayed,
        gamesWon,
        rating
      };
      
      localStorage.setItem('battleship_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  // Проверяем сохраненного пользователя при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('battleship_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });
      } catch (error) {
        localStorage.removeItem('battleship_user');
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Аутентифицируемся когда Telegram готов
  useEffect(() => {
    if (isReady && tgUser && !authState.isAuthenticated && !authState.isLoading) {
      authenticate();
    }
  }, [isReady, tgUser, authState.isAuthenticated, authState.isLoading]);

  return {
    ...authState,
    authenticate,
    logout,
    updateUserStats
  };
};
