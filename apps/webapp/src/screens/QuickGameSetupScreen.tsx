import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Board, RingTimer } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';

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

interface BoardState {
  id: string;
  playerId: string;
  ships: Ship[];
  shots: Position[];
  hits: Position[];
  misses: Position[];
}

export const QuickGameSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [board, setBoard] = useState<BoardState>({
    id: 'quick-game-board',
    playerId: user?.id || 'player',
    ships: [],
    shots: [],
    hits: [],
    misses: []
  });
  const [selectedShip, setSelectedShip] = useState<number | null>(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [timeLeft, setTimeLeft] = useState(80); // 80 секунд на расстановку
  const [isGameStarted, setIsGameStarted] = useState(false);

  const ships = [
    { size: 5, name: 'Авианосец', count: 1 },
    { size: 4, name: 'Линкор', count: 1 },
    { size: 3, name: 'Крейсер', count: 1 },
    { size: 3, name: 'Подлодка', count: 1 },
    { size: 2, name: 'Эсминец', count: 1 },
  ];

  // Таймер для расстановки
  useEffect(() => {
    if (timeLeft > 0 && !isGameStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Время истекло, начинаем игру
            startGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isGameStarted]);

  const handleCellClick = (position: Position) => {
    if (selectedShip === null || isGameStarted) return;

    const shipSize = ships[selectedShip].size;
    const positions: Position[] = [];

    // Генерируем позиции корабля
    if (isHorizontal) {
      for (let i = 0; i < shipSize; i++) {
        positions.push({ x: position.x + i, y: position.y });
      }
    } else {
      for (let i = 0; i < shipSize; i++) {
        positions.push({ x: position.x, y: position.y + i });
      }
    }

    // Проверяем, можно ли разместить корабль
    const isValidPlacement = positions.every(pos => 
      pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
    ) && !board.ships.some(ship => 
      ship.positions.some(pos => 
        positions.some(newPos => pos.x === newPos.x && pos.y === newPos.y)
      )
    );
    
    if (isValidPlacement) {
      const newShip: Ship = {
        id: crypto.randomUUID(),
        size: shipSize,
        positions,
        hits: [],
        isSunk: false,
      };

      const newBoard = { ...board, ships: [...board.ships, newShip] };
      setBoard(newBoard);
      setSelectedShip(null);
    }
  };

  const handleRandomPlacement = () => {
    // Простая случайная расстановка
    const newShips: Ship[] = [];
    const usedPositions = new Set<string>();

    ships.forEach(shipType => {
      for (let i = 0; i < shipType.count; i++) {
        let attempts = 0;
        let placed = false;

        while (attempts < 100 && !placed) {
          const x = Math.floor(Math.random() * 10);
          const y = Math.floor(Math.random() * 10);
          const horizontal = Math.random() > 0.5;
          
          const positions: Position[] = [];
          for (let j = 0; j < shipType.size; j++) {
            positions.push({
              x: horizontal ? x + j : x,
              y: horizontal ? y : y + j
            });
          }

          const isValid = positions.every(pos => 
            pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
          ) && !positions.some(pos => 
            usedPositions.has(`${pos.x},${pos.y}`)
          );

          if (isValid) {
            positions.forEach(pos => usedPositions.add(`${pos.x},${pos.y}`));
            newShips.push({
              id: crypto.randomUUID(),
              size: shipType.size,
              positions,
              hits: [],
              isSunk: false,
            });
            placed = true;
          }
          attempts++;
        }
      }
    });

    setBoard({ ...board, ships: newShips });
  };

  const handleClearBoard = () => {
    setBoard({ ...board, ships: [] });
  };

  const startGame = () => {
    if (board.ships.length === 5) {
      setIsGameStarted(true);
      // Переходим к игре с ИИ
      navigate('/game/quick-game', { 
        state: { 
          playerBoard: board,
          gameMode: 'ai'
        } 
      });
    }
  };

  const canStartGame = board.ships.length === 5;

  // Создаем клетки для отображения на доске
  const createCells = () => {
    const cells = Array(10).fill(null).map(() => Array(10).fill('idle'));
    
    // Отмечаем корабли
    board.ships.forEach(ship => {
      ship.positions.forEach(pos => {
        cells[pos.y][pos.x] = 'ship';
      });
    });

    return cells;
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-semibold text-h2 text-foam">
            Расстановка кораблей
          </h1>
          <div className="flex items-center gap-3">
            <RingTimer duration={80} currentTime={timeLeft} size="sm" />
            <span className="font-mono text-caption text-mist">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h2 className="font-heading font-semibold text-h3 text-foam mb-2">
            Инструкции
          </h2>
          <p className="text-body text-mist">
            Разместите все 5 кораблей на поле. У вас есть {timeLeft} секунд.
          </p>
        </motion.div>

        {/* Ship selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Корабли для размещения:
          </h3>
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
                      ? 'border-sonar bg-sonar/10'
                      : isPlaced
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-edge hover:border-sonar/50 hover:bg-steel/50'
                  }`}
                >
                  <div className="font-heading font-semibold text-body">
                    {ship.name}
                  </div>
                  <div className="text-caption text-mist">
                    Размер: {ship.size}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Orientation toggle */}
          {selectedShip !== null && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsHorizontal(true)}
                className={`px-4 py-2 rounded ${
                  isHorizontal
                    ? 'bg-sonar text-black'
                    : 'bg-steel text-mist'
                }`}
              >
                Горизонтально
              </button>
              <button
                onClick={() => setIsHorizontal(false)}
                className={`px-4 py-2 rounded ${
                  !isHorizontal
                    ? 'bg-sonar text-black'
                    : 'bg-steel text-mist'
                }`}
              >
                Вертикально
              </button>
            </div>
          )}
        </motion.div>

        {/* Game board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Board
            cells={createCells()}
            onCellClick={handleCellClick}
            size="md"
          />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
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
            onClick={startGame}
            disabled={!canStartGame || isGameStarted}
            loading={isGameStarted}
            className="w-full"
          >
            {isGameStarted ? 'Запуск игры...' : 'Начать игру'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Отмена
          </Button>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-body text-mist">
            Размещено кораблей: {board.ships.length}/5
          </p>
          {canStartGame && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sonar text-body font-semibold mt-2"
            >
              ✅ Все корабли размещены!
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
