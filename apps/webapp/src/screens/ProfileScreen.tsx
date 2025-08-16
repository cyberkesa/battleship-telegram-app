import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { 
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  User,
  Medal,
  Star
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    navigate('/');
  };

  // Моковые данные статистики
  const stats = {
    gamesPlayed: 42,
    gamesWon: 28,
    winRate: 67,
    averageTime: '3:24',
    bestTime: '1:12',
    currentStreak: 5,
    maxStreak: 8,
    rating: 1250,
    rank: 'Капитан'
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 bg-bg-graphite rounded-lg hover:bg-steel transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-mist" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-semibold text-h2 text-foam truncate">
                Мой профиль
              </h1>
              <p className="text-secondary text-mist truncate">
                Игровая статистика
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sonar rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-h3 text-foam truncate">
                {user?.firstName || 'Игрок'}
              </h2>
              <p className="text-body text-mist">
                Рейтинг: {stats.rating}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Medal className="w-4 h-4 text-sonar" />
                <span className="text-caption text-sonar font-semibold">
                  {stats.rank}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-sonar" />
              <span className="font-heading font-semibold text-body text-foam">
                Победы
              </span>
            </div>
            <div className="text-h2 font-bold text-foam">
              {stats.gamesWon}
            </div>
            <div className="text-caption text-mist">
              из {stats.gamesPlayed} игр
            </div>
          </div>

          <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-torpedo" />
              <span className="font-heading font-semibold text-body text-foam">
                Процент побед
              </span>
            </div>
            <div className="text-h2 font-bold text-foam">
              {stats.winRate}%
            </div>
            <div className="text-caption text-mist">
              успешность
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Детальная статистика
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-mist" />
                <span className="text-body text-foam">Среднее время игры</span>
              </div>
              <span className="font-mono font-semibold text-body text-sonar">
                {stats.averageTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-mist" />
                <span className="text-body text-foam">Лучшее время</span>
              </div>
              <span className="font-mono font-semibold text-body text-sonar">
                {stats.bestTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-mist" />
                <span className="text-body text-foam">Текущая серия побед</span>
              </div>
              <span className="font-mono font-semibold text-body text-sonar">
                {stats.currentStreak}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-mist" />
                <span className="text-body text-foam">Максимальная серия</span>
              </div>
              <span className="font-mono font-semibold text-body text-sonar">
                {stats.maxStreak}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Достижения
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="w-4 h-4 text-sonar" />
                <span className="font-heading font-semibold text-caption text-foam">
                  Первая победа
                </span>
              </div>
              <p className="text-caption text-mist">
                Выиграйте первую игру
              </p>
            </div>

            <div className="p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-sonar" />
                <span className="font-heading font-semibold text-caption text-foam">
                  Серия побед
                </span>
              </div>
              <p className="text-caption text-mist">
                5 побед подряд
              </p>
            </div>

            <div className="p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-sonar" />
                <span className="font-heading font-semibold text-caption text-foam">
                  Точный стрелок
                </span>
              </div>
              <p className="text-caption text-mist">
                80% точность попаданий
              </p>
            </div>

            <div className="p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-sonar" />
                <span className="font-heading font-semibold text-caption text-foam">
                  Быстрая игра
                </span>
              </div>
              <p className="text-caption text-mist">
                Победа за 2 минуты
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
