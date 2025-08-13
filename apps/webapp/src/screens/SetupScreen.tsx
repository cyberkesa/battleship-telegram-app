import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@battleship/ui';
import { Board } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';
import { randomFleet } from '@battleship/game-logic';
// Define local types to avoid import issues
interface Position {
  x: number;
  y: number;
}

interface Ship {
  id: string;
  size: number;
  positions: Position[];
  hits: Position[];
  isSunk: boolean;
}

interface Board {
  id: string;
  playerId: string;
  ships: Ship[];
  shots: Position[];
  hits: Position[];
  misses: Position[];
}

export const SetupScreen: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { setupBoard, isLoading, error } = useGameStore();
  
  const [board, setBoard] = useState<Board>({
    id: 'player-board',
    playerId: 'player',
    ships: [],
    shots: [],
    hits: [],
    misses: []
  });
  const [selectedShip, setSelectedShip] = useState<number | null>(null);
  const [isHorizontal, setIsHorizontal] = useState(true);

  const ships = [
    { size: 5, name: 'Авианосец', count: 1 },
    { size: 4, name: 'Линкор', count: 1 },
    { size: 3, name: 'Крейсер', count: 1 },
    { size: 3, name: 'Подлодка', count: 1 },
    { size: 2, name: 'Эсминец', count: 1 },
  ];

  const handleCellClick = (position: Position) => {
    if (selectedShip === null) return;

    const shipSize = ships[selectedShip].size;
    const positions: Position[] = [];

    // Generate ship positions
    if (isHorizontal) {
      for (let i = 0; i < shipSize; i++) {
        positions.push({ x: position.x + i, y: position.y });
      }
    } else {
      for (let i = 0; i < shipSize; i++) {
        positions.push({ x: position.x, y: position.y + i });
      }
    }

    // Check if ship can be placed
    const newShip: Ship = {
      id: crypto.randomUUID(),
      size: shipSize,
      positions,
      hits: [],
      isSunk: false,
    };

    // Simple validation - check if positions are within bounds and not overlapping
    const isValidPlacement = positions.every(pos => 
      pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
    ) && !board.ships.some(ship => 
      ship.positions.some(pos => 
        positions.some(newPos => pos.x === newPos.x && pos.y === newPos.y)
      )
    );
    
    if (isValidPlacement) {
      const newBoard = { ...board, ships: [...board.ships, newShip] };
      setBoard(newBoard);
      setSelectedShip(null);
    }
  };

  const handleRandomPlacement = () => {
    // For now, just clear the board
    setBoard({
      id: 'player-board',
      playerId: 'player',
      ships: [],
      shots: [],
      hits: [],
      misses: []
    });
  };

  const handleClearBoard = () => {
    setBoard({
      id: 'player-board',
      playerId: 'player',
      ships: [],
      shots: [],
      hits: [],
      misses: []
    });
  };

  const handleStartGame = async () => {
    if (board.ships.length === 5) { // All ships placed
      await setupBoard(matchId!, board.ships);
      navigate(`/game/${matchId}`);
    }
  };

  const canStartGame = board.ships.length === 5;

  return (
    <div className="min-h-screen bg-tg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-tg-text mb-2">
            Расстановка кораблей
          </h1>
          <p className="text-tg-hint">
            Разместите все корабли на поле
          </p>
        </div>

        {/* Ship selection */}
        <div className="bg-tg-secondary-bg rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-tg-text mb-3">Корабли для размещения:</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ships.map((ship, index) => {
              const isPlaced = board.ships.some(s => s.size === ship.size);
              const isSelected = selectedShip === index;
              
              return (
                <button
                  key={index}
                  onClick={() => !isPlaced && setSelectedShip(index)}
                  disabled={isPlaced}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-tg-button bg-tg-button text-tg-button-text'
                      : isPlaced
                      ? 'border-gray-300 bg-gray-100 text-gray-500'
                      : 'border-gray-300 bg-white hover:border-tg-button'
                  }`}
                >
                  <div className="text-sm font-medium">{ship.name}</div>
                  <div className="text-xs">{ship.size} клетки</div>
                </button>
              );
            })}
          </div>

          {/* Orientation toggle */}
          {selectedShip !== null && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsHorizontal(true)}
                className={`px-4 py-2 rounded ${
                  isHorizontal
                    ? 'bg-tg-button text-tg-button-text'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Горизонтально
              </button>
              <button
                onClick={() => setIsHorizontal(false)}
                className={`px-4 py-2 rounded ${
                  !isHorizontal
                    ? 'bg-tg-button text-tg-button-text'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Вертикально
              </button>
            </div>
          )}
        </div>

        {/* Game board */}
        <div className="flex justify-center mb-6">
          <Board
            cells={board?.cells || []}
            onCellClick={handleCellClick}
            size="md"
          />
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

        {/* Action buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleRandomPlacement}
              variant="secondary"
              className="w-full"
            >
              🎲 Случайно
            </Button>
            <Button
              onClick={handleClearBoard}
              variant="secondary"
              className="w-full"
            >
              🗑️ Очистить
            </Button>
          </div>

          <Button
            onClick={handleStartGame}
            disabled={!canStartGame || isLoading}
            className="w-full"
          >
            {isLoading ? 'Загрузка...' : 'Начать игру'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Назад
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center">
          <p className="text-tg-hint text-sm">
            Размещено кораблей: {board.ships.length}/5
          </p>
          {canStartGame && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-sm font-medium mt-2"
            >
              ✅ Все корабли размещены!
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
