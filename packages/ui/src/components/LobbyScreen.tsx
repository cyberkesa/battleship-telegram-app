import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { LoadingScreen } from './LoadingScreen';
import { Play, Users, BookOpen, Settings, History, Package } from 'lucide-react';

interface LobbyScreenProps {
  onQuickPlay: () => void;
  onPlayWithFriend: () => void;
  onTutorial: () => void;
  onHistory: () => void;
  onInventory: () => void;
  onSettings: () => void;
  isLoading?: boolean;
  userProfile?: {
    name: string;
    avatar?: string;
    rating?: number;
  };
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onQuickPlay,
  onPlayWithFriend,
  onTutorial,
  onHistory,
  onInventory,
  onSettings,
  isLoading = false,
  userProfile,
}) => {
  if (isLoading) {
    return <LoadingScreen status="connecting" />;
  }

  return (
    <div className="min-h-screen bg-bg-deep text-foam selection-sonar">
      {/* Верхняя панель */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bg-graphite rounded-full ring-2 ring-sonar flex items-center justify-center">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full rounded-full" />
              ) : (
                <span className="font-heading font-semibold text-sonar">
                  {userProfile?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-body text-foam">
                {userProfile?.name || 'Игрок'}
              </h3>
              {userProfile?.rating && (
                <p className="font-mono text-secondary text-mist">
                  Рейтинг: {userProfile.rating}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-4 space-y-6">
        {/* Приветствие */}
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

        {/* Карточки режимов */}
        <div className="space-y-4">
          {/* Быстрый бой */}
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
                  Сразитесь с случайным соперником
                </p>
              </div>
              <div className="w-12 h-12 bg-sonar/10 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-sonar" strokeWidth={2} />
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={onQuickPlay}
              className="w-full"
            >
              НАЧАТЬ
            </Button>
          </motion.div>

          {/* Игра с другом */}
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
              <Users className="w-6 h-6 text-info" strokeWidth={2} />
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={onPlayWithFriend}
            className="w-full"
          >
            СОЗДАТЬ ИГРУ
          </Button>
        </motion.div>

        {/* Обучение */}
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
              <BookOpen className="w-6 h-6 text-radio" strokeWidth={2} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onTutorial}
            className="w-full"
          >
            НАЧАТЬ ОБУЧЕНИЕ
          </Button>
        </motion.div>
      </div>
    </div>

    {/* Нижняя навигация */}
    <div className="fixed bottom-0 left-0 right-0 bg-steel border-t border-edge/50 px-4 py-3">
      <div className="flex items-center justify-around">
        <button
          onClick={onQuickPlay}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-sonar hover:bg-bg-graphite transition-colors"
        >
          <Play className="w-5 h-5" strokeWidth={2} />
          <span className="text-caption font-heading">Играть</span>
        </button>
        
        <button
          onClick={onHistory}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
        >
          <History className="w-5 h-5" strokeWidth={2} />
          <span className="text-caption font-heading">История</span>
        </button>
        
        <button
          onClick={onInventory}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
        >
          <Package className="w-5 h-5" strokeWidth={2} />
          <span className="text-caption font-heading">Инвентарь</span>
        </button>
        
        <button
          onClick={onSettings}
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-mist hover:text-foam hover:bg-bg-graphite transition-colors"
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
          <span className="text-caption font-heading">Настройки</span>
        </button>
      </div>
    </div>
  </div>
  );
};
