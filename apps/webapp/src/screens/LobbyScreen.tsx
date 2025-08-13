import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, BookOpen, Settings, Trophy, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';

interface LobbyScreenProps {
  onStartGame: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  onShowInventory: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onStartGame,
  onShowHistory,
  onShowSettings,
  onShowInventory,
}) => {
  const { user } = useAuth();
  const { showMainButton, hideMainButton } = useTelegram();

  React.useEffect(() => {
    showMainButton('🎮 БЫСТРЫЙ БОЙ', onStartGame);
    return () => hideMainButton();
  }, [showMainButton, hideMainButton, onStartGame]);

  const stats = [
    { label: 'Игр', value: user?.gamesPlayed || 0, color: 'text-sonar' },
    { label: 'Побед', value: user?.gamesWon || 0, color: 'text-success' },
    { label: 'Рейтинг', value: user?.rating || 1000, color: 'text-amber' },
  ];

  const winRate = user?.gamesPlayed 
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-steel-depth text-foam selection:bg-sonar/30">
      {/* Header */}
      <div className="bg-steel ring-1 ring-edge shadow-steel">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sonar/20 ring-1 ring-sonar/30 rounded-lg flex items-center justify-center">
                <span className="text-sonar font-sans font-semibold text-lg">
                  {user?.firstName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-foam font-sans font-semibold">
                  {user?.firstName}
                </h2>
                <p className="text-mist text-sm font-mono">
                  {user?.rating} ELO
                </p>
              </div>
            </div>
            
            {/* Stars balance */}
            <div className="flex items-center gap-1 px-2 py-1 bg-amber/10 ring-1 ring-amber/30 rounded-lg">
              <Star size={16} className="text-amber" />
              <span className="text-amber font-mono font-medium text-sm">
                0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-graphite ring-1 ring-edge rounded-lg p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`text-xl font-mono font-semibold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-mist text-xs mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Win rate */}
        <motion.div
          className="bg-graphite ring-1 ring-edge rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-mist text-sm">Процент побед</span>
            <span className="text-foam font-mono font-semibold">{winRate}%</span>
          </div>
          <div className="w-full bg-steel rounded-full h-2">
            <motion.div
              className="bg-success h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${winRate}%` }}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </div>
        </motion.div>

        {/* Game options */}
        <div className="space-y-3">
          {/* Quick play */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onStartGame}
              className="w-full"
              icon={<Play size={20} />}
            >
              БЫСТРЫЙ БОЙ
            </Button>
          </motion.div>

          {/* Play with friend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {/* TODO: Implement */}}
              className="w-full"
              icon={<Users size={20} />}
            >
              ИГРА С ДРУГОМ
            </Button>
          </motion.div>

          {/* Tutorial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {/* TODO: Implement */}}
              className="w-full"
              icon={<BookOpen size={20} />}
            >
              ОБУЧЕНИЕ
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-steel ring-1 ring-edge shadow-steel">
        <div className="flex items-center justify-around p-2">
          <button
            onClick={onStartGame}
            className="flex flex-col items-center gap-1 p-2 text-sonar"
          >
            <Play size={20} />
            <span className="text-xs font-medium">Играть</span>
          </button>
          
          <button
            onClick={onShowHistory}
            className="flex flex-col items-center gap-1 p-2 text-mist hover:text-foam transition-colors"
          >
            <Trophy size={20} />
            <span className="text-xs font-medium">История</span>
          </button>
          
          <button
            onClick={onShowInventory}
            className="flex flex-col items-center gap-1 p-2 text-mist hover:text-foam transition-colors"
          >
            <Star size={20} />
            <span className="text-xs font-medium">Инвентарь</span>
          </button>
          
          <button
            onClick={onShowSettings}
            className="flex flex-col items-center gap-1 p-2 text-mist hover:text-foam transition-colors"
          >
            <Settings size={20} />
            <span className="text-xs font-medium">Настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
