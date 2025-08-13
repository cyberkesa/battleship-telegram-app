import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';

export const MatchmakingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isInQueue, 
    isLoading, 
    error, 
    currentMatch,
    joinQueue, 
    leaveQueue, 
    getQueueStatus 
  } = useGameStore();

  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    // Check if user already has an active match
    if (currentMatch) {
      if (currentMatch.status === 'setting_up') {
        navigate(`/setup/${currentMatch.id}`);
      } else if (currentMatch.status === 'playing') {
        navigate(`/game/${currentMatch.id}`);
      }
      return;
    }

    // Check current queue status
    getQueueStatus();
  }, [currentMatch, navigate, getQueueStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInQueue) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInQueue]);

  const handleJoinQueue = async () => {
    await joinQueue();
  };

  const handleLeaveQueue = async () => {
    await leaveQueue();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            className="text-4xl mb-4"
          >
            🔍
          </motion.div>
          <h1 className="text-2xl font-bold text-tg-text mb-2">
            Поиск противника
          </h1>
          <p className="text-tg-hint">
            Ожидание подключения игрока...
          </p>
        </div>

        {/* Search status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-tg-secondary-bg rounded-lg p-6 mb-6"
        >
          {isInQueue ? (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <div className="w-8 h-8 border-2 border-tg-button border-t-transparent rounded-full"></div>
              </motion.div>
              <h3 className="text-lg font-semibold text-tg-text mb-2">
                Поиск противника
              </h3>
              <p className="text-tg-hint mb-4">
                Время поиска: {formatTime(searchTime)}
              </p>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-tg-button rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-tg-button rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-tg-button rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold text-tg-text mb-2">
                Готов к игре
              </h3>
              <p className="text-tg-hint">
                Нажмите кнопку ниже, чтобы найти противника
              </p>
            </div>
          )}
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {isInQueue ? (
            <Button
              onClick={handleLeaveQueue}
              variant="danger"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Отмена...' : 'Отменить поиск'}
            </Button>
          ) : (
            <Button
              onClick={handleJoinQueue}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Подключение...' : 'Найти противника'}
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Назад
          </Button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-tg-hint text-sm">
            Обычно поиск занимает 10-30 секунд
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
