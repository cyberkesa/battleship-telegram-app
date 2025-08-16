import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Board } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';
import { useAuth } from '../providers/AuthProvider';
import { Position } from '@battleship/shared-types';
import { CellState } from '@battleship/ui';

// Convert fog of war to cell states
const convertFogToCellStates = (fog: any[][]): CellState[][] => {
  const board = Array(10).fill(null).map(() => Array(10).fill('idle'));
  
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = fog[y][x];
      if (cell === 'H') { // Hit
        board[y][x] = 'hit';
      } else if (cell === 'M') { // Miss
        board[y][x] = 'miss';
      } else if (cell === 'S') { // Sunk
        board[y][x] = 'sunk';
      }
    }
  }
  
  return board;
};

// Convert player board data to cell states
const convertPlayerBoardToCellStates = (hits: Set<string>, misses: Set<string>, ships: any[]): CellState[][] => {
  const board = Array(10).fill(null).map(() => Array(10).fill('idle'));
  
  // Mark ships
  ships.forEach(ship => {
    // Generate ship positions based on bow, length, and orientation
    const positions = [];
    for (let i = 0; i < ship.length; i++) {
      if (ship.horizontal) {
        positions.push({ x: ship.bow.x + i, y: ship.bow.y });
      } else {
        positions.push({ x: ship.bow.x, y: ship.bow.y + i });
      }
    }
    
    positions.forEach((pos: any) => {
      board[pos.y][pos.x] = 'ship';
    });
  });
  
  // Mark hits and misses
  hits.forEach(hitKey => {
    const [x, y] = hitKey.split(',').map(Number);
    board[y][x] = 'ship-hit';
  });
  
  misses.forEach(missKey => {
    const [x, y] = missKey.split(',').map(Number);
    board[y][x] = 'miss';
  });
  
  return board;
};

interface GameState {
  id: string;
  status: string;
  currentTurn: string;
  winner: string | null;
  playerRole: string;
  publicState: {
    fog: any[][];
    board: any;
  };
  turnNo: number;
}

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

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (matchId) {
      getGameState(matchId);
    }
  }, [matchId, getGameState]);

  useEffect(() => {
    if (currentMatch && user) {
      // For computer games, player is always 'A'
      setIsMyTurn(currentMatch.currentTurn === 'A');
    }
  }, [currentMatch, user]);

  // Poll for game state updates
  useEffect(() => {
    if (!matchId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/game/${matchId}/state`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setGameState(data.data);
            setIsMyTurn(data.data.currentTurn === 'A');
          }
        }
      } catch (error) {
        console.error('Failed to poll game state:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [matchId]);

  const handleCellClick = async (position: Position) => {
    if (!isMyTurn || !matchId) return;

    try {
      await makeMove(matchId, position);
      // Refresh game state after move
      setTimeout(() => {
        getGameState(matchId);
      }, 500);
    } catch (error) {
      console.error('Failed to make move:', error);
    }
  };

  const getOpponentName = () => {
    return 'Компьютер';
  };

  const getGameStatusText = () => {
    if (!gameState) return 'Загрузка...';
    
    if (gameState.status === 'finished') {
      return gameState.winner === 'A' ? 'Победа!' : 'Поражение';
    }
    
    return isMyTurn ? 'Ваш ход' : 'Ход компьютера';
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

  if (!gameState) {
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
              <Board
                cells={convertPlayerBoardToCellStates(gameState.publicState.board.hits, gameState.publicState.board.misses, gameState.publicState.board.ships)}
                disabled={true}
                size="sm"
              />
            </div>
          </div>

          {/* Opponent board */}
          <div>
            <h3 className="text-lg font-semibold text-tg-text mb-3 text-center">
              Поле противника
            </h3>
            <div className="flex justify-center">
              <Board
                cells={convertFogToCellStates(gameState.publicState.fog)}
                onCellClick={(row, col) => handleCellClick({ x: col, y: row })}
                disabled={!isMyTurn || gameState.status !== 'in_progress'}
                size="sm"
                isOpponent={true}
              />
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
