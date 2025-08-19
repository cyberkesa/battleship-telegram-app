import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { 
  Play,
  Users,
  Bot,
  UserPlus,
  Trophy,
  Settings,
  User,
  Crown,
  Globe,
  Flag
} from 'lucide-react';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const GAME_MODES: GameMode[] = [
  {
    id: 'online',
    title: 'Онлайн с человеком',
    description: 'Играйте с случайным игроком',
    icon: <Users className="w-6 h-6" />,
    route: '/matchmaking'
  },
  {
    id: 'computer',
    title: 'С компьютером',
    description: 'Играйте против ИИ',
    icon: <Bot className="w-6 h-6" />,
    route: '/setup/computer'
  },
  {
    id: 'friend',
    title: 'С другом',
    description: 'Создайте лобби и пригласите друга',
    icon: <UserPlus className="w-6 h-6" />,
    route: '/lobby/create'
  }
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGameModes, setShowGameModes] = useState(false);

  const handleStartGame = () => {
    setShowGameModes(true);
  };

  const handleGameModeSelect = (mode: GameMode) => {
    setShowGameModes(false);
    navigate(mode.route);
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
          <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-h1 text-foam truncate">
              Морской бой
            </h1>
            <p className="text-secondary text-mist truncate">
              Стратегическая игра для двух игроков
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {/* Profile */}
            <button
              onClick={handleProfile}
              className="flex items-center gap-2 px-3 py-2 bg-bg-graphite rounded-lg hover:bg-steel transition-colors"
            >
              <div className="w-8 h-8 bg-sonar rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  {user ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'Игрок'}
                </div>
                <div className="text-caption text-mist">
                  Рейтинг: 1200
                </div>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={handleSettings}
              className="p-2 bg-bg-graphite rounded-lg hover:bg-steel transition-colors"
            >
              <Settings className="w-5 h-5 text-mist" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="mb-6 px-2">
            <div className="w-24 h-24 bg-sonar rounded-full mx-auto mb-4 flex items-center justify-center">
              <Flag className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-heading font-bold text-h2 text-foam mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-body text-mist max-w-md mx-auto">
              Разместите флот и уничтожьте корабли противника. 
              Кто первым потопит все корабли, тот победит!
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            className="flex items-center gap-2 mx-auto w-full max-w-xs"
          >
            <Play className="w-5 h-5" />
            Начать игру
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={handleLeaderboard}
            className="p-4 bg-bg-graphite rounded-card ring-1 ring-edge"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-torpedo rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  Рейтинг игроков
                </div>
                <div className="text-caption text-mist">
                  Топ игроков
                </div>
              </div>
              <Crown className="w-4 h-4 text-sonar" />
            </div>
          </button>

          <button
            onClick={handleProfile}
            className="p-4 bg-bg-graphite rounded-card ring-1 ring-edge"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-radio rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  Мой профиль
                </div>
                <div className="text-caption text-mist">
                  Статистика игр
                </div>
              </div>
              <Globe className="w-4 h-4 text-radio" />
            </div>
          </button>
        </div>

        {/* Game Rules */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Правила игры
          </h3>
          <div className="space-y-2 text-body text-mist">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-sonar rounded-full mt-2 flex-shrink-0"></div>
              <p>Разместите 10 кораблей на поле 10×10</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-sonar rounded-full mt-2 flex-shrink-0"></div>
              <p>По очереди стреляйте по полю противника</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-sonar rounded-full mt-2 flex-shrink-0"></div>
              <p>Потопите все корабли противника для победы</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-sonар rounded-full mt-2 flex-shrink-0"></div>
              <p>На ход дается 5 секунд, на расстановку 80 секунд</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Modes Modal */}
      <Modal
        isOpen={showGameModes}
        onClose={() => setShowGameModes(false)}
        title="Выберите режим игры"
      >
        <div className="space-y-3 p-1">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleGameModeSelect(mode)}
              className="w-full p-4 bg-bg-graphite rounded-lg border-2 border-edge hover:border-sonar/50 hover:bg-steel transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sonar rounded-lg flex items-center justify-center">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-body text-foam truncate">
                    {mode.title}
                  </div>
                  <div className="text-caption text-mist">
                    {mode.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};
