import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  TrendingUp
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  rank: number;
  isCurrentUser: boolean;
}

// Моковые данные игроков
const PLAYERS: Player[] = [
  {
    id: '1',
    name: 'Капитан_Морской',
    rating: 1850,
    gamesPlayed: 156,
    gamesWon: 134,
    winRate: 86,
    rank: 1,
    isCurrentUser: false
  },
  {
    id: '2',
    name: 'Адмирал_Волн',
    rating: 1780,
    gamesPlayed: 142,
    gamesWon: 118,
    winRate: 83,
    rank: 2,
    isCurrentUser: false
  },
  {
    id: '3',
    name: 'Командор_Бури',
    rating: 1720,
    gamesPlayed: 98,
    gamesWon: 82,
    winRate: 84,
    rank: 3,
    isCurrentUser: false
  },
  {
    id: '4',
    name: 'Лейтенант_Ветра',
    rating: 1680,
    gamesPlayed: 87,
    gamesWon: 71,
    winRate: 82,
    rank: 4,
    isCurrentUser: false
  },
  {
    id: '5',
    name: 'Матрос_Океана',
    rating: 1650,
    gamesPlayed: 76,
    gamesWon: 62,
    winRate: 82,
    rank: 5,
    isCurrentUser: false
  },
  {
    id: '6',
    name: 'Игрок',
    rating: 1250,
    gamesPlayed: 42,
    gamesWon: 28,
    winRate: 67,
    rank: 15,
    isCurrentUser: true
  }
];

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');

  const handleBack = () => {
    navigate('/');
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="font-bold text-mist">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 2:
        return 'bg-gray-300/10 border-gray-300/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-steel border-edge';
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
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
                Рейтинг игроков
              </h1>
              <p className="text-secondary text-mist truncate">
                Топ игроков Морского боя
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Период
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPeriod === 'all'
                  ? 'border-sonar bg-sonar/10'
                  : 'border-edge hover:border-sonar/50'
              }`}
            >
              <div className="text-center">
                <div className="font-heading font-semibold text-body text-foam">
                  Все время
                </div>
                <div className="text-caption text-mist">
                  Общий рейтинг
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPeriod('month')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPeriod === 'month'
                  ? 'border-sonar bg-sonar/10'
                  : 'border-edge hover:border-sonar/50'
              }`}
            >
              <div className="text-center">
                <div className="font-heading font-semibold text-body text-foam">
                  Месяц
                </div>
                <div className="text-caption text-mist">
                  За 30 дней
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPeriod('week')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPeriod === 'week'
                  ? 'border-sonar bg-sonar/10'
                  : 'border-edge hover:border-sonar/50'
              }`}
            >
              <div className="text-center">
                <div className="font-heading font-semibold text-body text-foam">
                  Неделя
                </div>
                <div className="text-caption text-mist">
                  За 7 дней
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Top Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {PLAYERS.slice(0, 10).map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`p-4 rounded-card ring-1 ring-edge shadow-steel transition-all ${
                player.isCurrentUser 
                  ? 'bg-sonar/10 ring-sonar/50' 
                  : getRankColor(player.rank)
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(player.rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-body text-foam truncate">
                      {player.name}
                    </h3>
                    {player.isCurrentUser && (
                      <span className="px-2 py-1 bg-sonar text-white text-caption rounded-full">
                        Вы
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-mist" />
                      <span className="text-caption text-mist">
                        {player.gamesWon}/{player.gamesPlayed}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-mist" />
                      <span className="text-caption text-mist">
                        {player.winRate}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono font-bold text-h3 text-sonar">
                    {player.rating}
                  </div>
                  <div className="text-caption text-mist">
                    рейтинг
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Статистика
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-h2 font-bold text-foam">
                {PLAYERS.length}
              </div>
              <div className="text-caption text-mist">
                Всего игроков
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-h2 font-bold text-foam">
                {Math.round(PLAYERS.reduce((sum, p) => sum + p.winRate, 0) / PLAYERS.length)}%
              </div>
              <div className="text-caption text-mist">
                Средний % побед
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
