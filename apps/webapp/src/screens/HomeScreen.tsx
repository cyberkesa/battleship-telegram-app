import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, LoadingScreen } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { 
  Zap, 
  Users, 
  BookOpen, 
  Trophy, 
  Package, 
  Settings,
  User,
  Crown
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, error } = useAuth();
  
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isStartingQuickGame, setIsStartingQuickGame] = useState(false);

  const handleCreateLobby = async () => {
    if (!user) return;

    try {
      setIsCreatingLobby(true);
      
      // Создаем локальное лобби с уникальным ID
      const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Сохраняем в localStorage для демонстрации
      const lobby = {
        id: lobbyId,
        host: user,
        players: [user],
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`lobby_${lobbyId}`, JSON.stringify(lobby));
      
      // Перенаправляем в лобби
      navigate(`/lobby/${lobbyId}`);
    } catch (err: any) {
      console.error('Ошибка создания лобби:', err);
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleQuickGame = async () => {
    try {
      setIsStartingQuickGame(true);
      // Для быстрой игры сразу переходим к расстановке кораблей
      navigate('/setup/quick-game');
    } catch (err: any) {
      console.error('Ошибка запуска быстрой игры:', err);
    } finally {
      setIsStartingQuickGame(false);
    }
  };

  const handleTutorial = () => {
    navigate('/tutorial');
  };

  const handleHistory = () => {
    navigate('/history');
  };

  const handleInventory = () => {
    navigate('/inventory');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Показываем загрузку пока Telegram не готов
  if (isLoading) {
    return <LoadingScreen status="connecting" message="Загрузка профиля..." />;
  }

  // Показываем ошибку если что-то пошло не так
  if (error) {
    return (
      <div className="min-h-screen bg-bg-deep text-foam flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="font-heading font-semibold text-h2 text-foam mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-body text-mist mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  // Показываем загрузку если пользователь еще не загружен
  if (!user) {
    return <LoadingScreen status="connecting" message="Загрузка профиля..." />;
  }

  return (
    <div className="min-h-screen bg-bg-deep text-foam selection-sonar">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-bg-graphite rounded-full ring-2 ring-sonar flex items-center justify-center flex-shrink-0">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-full h-full rounded-full" />
              ) : (
                <User className="w-5 h-5 text-sonar" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-body text-foam truncate">
                {user.firstName}
              </h3>
              <p className="font-mono text-caption text-mist truncate">
                Рейтинг: {user.rating}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 sm:space-y-6">
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-heading font-semibold text-h1 text-foam mb-2">
            Готовы нырнуть в бой?
          </h1>
          <p className="text-body text-mist">
            Выберите режим игры и отправляйтесь в морское сражение
          </p>
        </motion.div>

        {/* Game options */}
        <div className="space-y-4">
          {/* Quick play */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1 truncate">
                  Быстрый бой
                </h3>
                <p className="text-secondary text-mist truncate">
                  Сразитесь с ИИ или потренируйтесь
                </p>
              </div>
              <div className="w-12 h-12 bg-sonar/10 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Zap className="w-6 h-6 text-sonar" />
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleQuickGame}
              loading={isStartingQuickGame}
              disabled={isStartingQuickGame}
              className="w-full"
            >
              {isStartingQuickGame ? 'Запуск...' : 'НАЧАТЬ'}
            </Button>
          </motion.div>

          {/* Play with friend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1 truncate">
                  Игра с другом
                </h3>
                <p className="text-secondary text-mist truncate">
                  Создайте приватную игру
                </p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Users className="w-6 h-6 text-info" />
              </div>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCreateLobby}
              loading={isCreatingLobby}
              disabled={isCreatingLobby}
              className="w-full"
            >
              {isCreatingLobby ? 'Создание...' : 'СОЗДАТЬ ИГРУ'}
            </Button>
          </motion.div>

          {/* Tutorial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1 truncate">
                  Обучение
                </h3>
                <p className="text-secondary text-mist truncate">
                  Изучите правила за 3 шага
                </p>
              </div>
              <div className="w-12 h-12 bg-radio/10 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <BookOpen className="w-6 h-6 text-radio" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleTutorial}
              className="w-full"
            >
              НАЧАТЬ ОБУЧЕНИЕ
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-steel border-t border-edge/50 px-4 py-3">
        <div className="flex items-center justify-around">
          <button
            onClick={handleQuickGame}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-sonar hover:bg-bg-graphite transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span className="text-caption font-heading">Играть</span>
          </button>
          
          <button
            onClick={handleHistory}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-caption font-heading">История</span>
          </button>
          
          <button
            onClick={handleInventory}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <Package className="w-5 h-5" />
            <span className="text-caption font-heading">Инвентарь</span>
          </button>
          
          <button
            onClick={handleSettings}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-caption font-heading">Настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
