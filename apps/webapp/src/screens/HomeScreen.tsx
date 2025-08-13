import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { useGameStore } from '../stores/gameStore';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, user } = useAuth();
  const { getActiveMatch } = useGameStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Check if user has an active match
      getActiveMatch();
    }
  }, [isAuthenticated, getActiveMatch]);

  const handlePlayGame = () => {
    navigate('/matchmaking');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tg-button mx-auto mb-4"></div>
          <p className="text-tg-hint">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-tg-hint mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            🚢
          </motion.div>
          <h1 className="text-3xl font-bold text-tg-text mb-2">
            Морской бой
          </h1>
          <p className="text-tg-hint">
            Классическая игра в Telegram
          </p>
        </div>

        {/* User info */}
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-tg-secondary-bg rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-tg-button rounded-full flex items-center justify-center text-tg-button-text font-semibold mr-3">
                {user.first_name?.[0] || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-tg-text">
                  {user.first_name} {user.last_name}
                </h3>
                {user.username && (
                  <p className="text-tg-hint text-sm">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Game options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <Button
            onClick={handlePlayGame}
            size="lg"
            className="w-full"
          >
            🎮 Начать игру
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={() => {/* TODO: Show rules */}}
              className="w-full"
            >
              📖 Правила
            </Button>
            <Button
              variant="secondary"
              onClick={() => {/* TODO: Show stats */}}
              className="w-full"
            >
              📊 Статистика
            </Button>
          </div>
        </motion.div>

        {/* Game info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-tg-hint text-sm">
            Найдите противника и сразитесь в классической игре "Морской бой"
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
