import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, LoadingScreen } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { api } from '../services/api';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isStartingQuickGame, setIsStartingQuickGame] = useState(false);

  const handleCreateLobby = async () => {
    if (!user) return;

    try {
      setIsCreatingLobby(true);
      const response = await api.post('/lobby/create', {
        playerId: user.id,
        playerName: user.firstName,
        playerAvatar: user.photoUrl,
      });
      
      // Перенаправляем в лобби
      navigate(`/lobby/${response.data.id}`);
    } catch (err: any) {
      console.error('Ошибка создания лобби:', err);
      // Можно добавить toast уведомление об ошибке
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleQuickGame = async () => {
    try {
      setIsStartingQuickGame(true);
      // Для быстрой игры сразу переходим к расстановке кораблей
      // Создаем временный матч или используем демо-режим
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

  if (!user) {
    return <LoadingScreen status="connecting" message="Загрузка профиля..." />;
  }

  return (
    <div className="min-h-screen bg-bg-deep text-foam selection-sonar">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bg-graphite rounded-full ring-2 ring-sonar flex items-center justify-center">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-full h-full rounded-full" />
              ) : (
                <span className="font-heading font-semibold text-sonar">
                  {user.firstName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-body text-foam">
                {user.firstName}
              </h3>
              <p className="font-mono text-caption text-mist">
                Рейтинг: 1250
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
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
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1">
                  Быстрый бой
                </h3>
                <p className="text-secondary text-mist">
                  Сразитесь с ИИ или потренируйтесь
                </p>
              </div>
              <div className="w-12 h-12 bg-sonar/10 rounded-full flex items-center justify-center">
                <span className="text-sonar text-xl">⚡</span>
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
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1">
                  Игра с другом
                </h3>
                <p className="text-secondary text-mist">
                  Создайте приватную игру
                </p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
                <span className="text-info text-xl">👥</span>
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
            className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-h3 text-foam mb-1">
                  Обучение
                </h3>
                <p className="text-secondary text-mist">
                  Изучите правила за 3 шага
                </p>
              </div>
              <div className="w-12 h-12 bg-radio/10 rounded-full flex items-center justify-center">
                <span className="text-radio text-xl">📚</span>
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
            <span className="text-xl">⚡</span>
            <span className="text-caption font-heading">Играть</span>
          </button>
          
          <button
            onClick={handleHistory}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <span className="text-xl">🏆</span>
            <span className="text-caption font-heading">История</span>
          </button>
          
          <button
            onClick={handleInventory}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <span className="text-xl">📦</span>
            <span className="text-caption font-heading">Инвентарь</span>
          </button>
          
          <button
            onClick={handleSettings}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-caption font-heading">Настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
