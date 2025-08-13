import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Board } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';
import { useAuth } from '../providers/AuthProvider';
import { Position, GameStatus } from '@battleship/shared-types';

export const GameScreen: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentMatch, 
    isLoading, 
    error, 
    makeMove, 
    getGameState 
  } = useGameStore();

  const [playerBoard, setPlayerBoard] = useState<any>(null);
  const [opponentBoard, setOpponentBoard] = useState<any>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (matchId) {
      getGameState(matchId);
    }
  }, [matchId, getGameState]);

  useEffect(() => {
    if (currentMatch && user) {
      // Determine if it's current user's turn
      setIsMyTurn(currentMatch.currentTurn === user.id);
      
      // Set up boards (this would come from the API)
      // For now, using placeholder data
      setPlayerBoard({
        id: 'player-board',
        playerId: user.id,
        ships: [],
        shots: [],
        hits: [],
        misses: []
      });
      
      setOpponentBoard({
        id: 'opponent-board',
        playerId: 'opponent',
        ships: [],
        shots: [],
        hits: [],
        misses: []
      });
    }
  }, [currentMatch, user]);

  const handleCellClick = async (position: Position) => {
    if (!isMyTurn || !matchId) return;

    try {
      const result = await makeMove(matchId, position);
      if (result) {
        // Update opponent board with the result
        const newOpponentBoard = { ...opponentBoard };
        newOpponentBoard.shots.push(position);
        
        if (result.hit) {
          newOpponentBoard.hits.push(position);
        } else {
          newOpponentBoard.misses.push(position);
        }
        
        setOpponentBoard(newOpponentBoard);
        setIsMyTurn(false);
      }
    } catch (error) {
      console.error('Failed to make move:', error);
    }
  };

  const getOpponentName = () => {
    if (!currentMatch || !user) return 'Противник';
    
    if (currentMatch.playerA.id === user.id) {
      return currentMatch.playerB.firstName || 'Противник';
    } else {
      return currentMatch.playerA.firstName || 'Противник';
    }
  };

  const getGameStatusText = () => {
    if (!currentMatch) return 'Загрузка...';
    
    switch (currentMatch.status) {
      case GameStatus.SETTING_UP:
        return 'Ожидание готовности игроков...';
      case GameStatus.PLAYING:
        return isMyTurn ? 'Ваш ход' : `Ход ${getOpponentName()}`;
      case GameStatus.FINISHED:
        return currentMatch.winner === user?.id ? 'Победа!' : 'Поражение';
      default:
        return 'Игра в процессе...';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tg-button mx-auto mb-4"></div>
          <p className="text-tg-hint">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">
            Игра не найдена
          </h2>
          <Button onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-tg-text mb-2">
            Морской бой
          </h1>
          <p className="text-tg-hint">
            {getGameStatusText()}
          </p>
        </div>

        {/* Game status */}
        <div className="bg-tg-secondary-bg rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-tg-text font-medium">Вы:</span>
              <span className="text-tg-hint ml-2">
                {user?.firstName || 'Игрок'}
              </span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-tg-hint ml-1">
                {isMyTurn ? 'Ваш ход' : 'Ожидание'}
              </span>
            </div>
            <div>
              <span className="text-tg-text font-medium">Противник:</span>
              <span className="text-tg-hint ml-2">
                {getOpponentName()}
              </span>
            </div>
          </div>
        </div>

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

        {/* Game boards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Player board */}
          <div>
            <h3 className="text-lg font-semibold text-tg-text mb-3 text-center">
              Ваше поле
            </h3>
            <div className="flex justify-center">
              {playerBoard && (
                <Board
                  cells={playerBoard?.cells || []}
                  disabled={true}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Opponent board */}
          <div>
            <h3 className="text-lg font-semibold text-tg-text mb-3 text-center">
              Поле противника
            </h3>
            <div className="flex justify-center">
              {opponentBoard && (
                <Board
                  cells={opponentBoard?.cells || []}
                  onCellClick={handleCellClick}
                  disabled={!isMyTurn || currentMatch.status !== GameStatus.PLAYING}
                  size="sm"
                  isOpponent={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Game controls */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/')}
            variant="secondary"
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </div>

        {/* Game info */}
        <div className="mt-6 text-center">
          <p className="text-tg-hint text-sm">
            Кликайте по полю противника, чтобы сделать выстрел
          </p>
        </div>
      </motion.div>
    </div>
  );
};
