import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Board, RingTimer } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { randomFleet } from '@battleship/game-logic';
import { 
  Ship, 
  RotateCcw, 
  Trash2, 
  Play, 
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

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

// Правильные корабли по классическим правилам Морского боя
const SHIP_TYPES = [
  { size: 4, name: 'Линкор', count: 1, color: 'bg-torpedo', icon: Ship },
  { size: 3, name: 'Крейсер', count: 2, color: 'bg-radio', icon: Ship },
  { size: 2, name: 'Эсминец', count: 3, color: 'bg-sonar', icon: Ship },
  { size: 1, name: 'Катер', count: 4, color: 'bg-info', icon: Ship },
];

export const QuickGameSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [board, setBoard] = useState<BoardState>({
    id: 'quick-game-board',
    playerId: user?.id?.toString() || 'player',
    ships: [],
    shots: [],
    hits: [],
    misses: []
  });
  const [selectedShip, setSelectedShip] = useState<number | null>(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [timeLeft, setTimeLeft] = useState(80); // 80 секунд на расстановку
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Подсчитываем доступные корабли
  const getAvailableShips = () => {
    const available = [];
    for (let i = 0; i < SHIP_TYPES.length; i++) {
      const shipType = SHIP_TYPES[i];
      const placedCount = board.ships.filter(ship => ship.size === shipType.size).length;
      const remaining = shipType.count - placedCount;
      
      for (let j = 0; j < remaining; j++) {
        available.push({
          ...shipType,
          id: `${shipType.size}_${j}`,
          index: i
        });
      }
    }
    return available;
  };

  const availableShips = getAvailableShips();

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

  const handleCellClick = (row: number, col: number) => {
    if (selectedShip === null || isGameStarted) return;

    const position = { x: col, y: row };
    const shipType = SHIP_TYPES[selectedShip];
    const positions: Position[] = [];

    // Генерируем позиции корабля
    if (isHorizontal) {
      for (let i = 0; i < shipType.size; i++) {
        positions.push({ x: position.x + i, y: position.y });
      }
    } else {
      for (let i = 0; i < shipType.size; i++) {
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
        size: shipType.size,
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
    try {
      const fleetShips = randomFleet();
      
      // Простая функция для конвертации корабля в позиции
      const shipToPositions = (ship: any): Position[] => {
        const positions: Position[] = [];
        for (let i = 0; i < ship.length; i++) {
          if (ship.horizontal) {
            positions.push({ x: ship.bow.x + i, y: ship.bow.y });
          } else {
            positions.push({ x: ship.bow.x, y: ship.bow.y + i });
          }
        }
        return positions;
      };
      
      const ships: Ship[] = fleetShips.map((ship: any) => ({
        id: crypto.randomUUID(),
        size: ship.length,
        positions: shipToPositions(ship),
        hits: [],
        isSunk: false,
      }));
      
      setBoard({
        ...board,
        ships
      });
    } catch (error) {
      console.error('Error generating random fleet:', error);
    }
  };

  const handleClearBoard = () => {
    setBoard({
      id: 'quick-game-board',
      playerId: user?.id?.toString() || 'player',
      ships: [],
      shots: [],
      hits: [],
      misses: []
    });
    setSelectedShip(null);
  };

  const startGame = () => {
    setIsGameStarted(true);
    // Переходим к игре
    navigate('/game/quick-game');
  };

  const handleStartGame = () => {
    if (board.ships.length === 10) { // Все 10 кораблей размещены
      startGame();
    }
  };

  const isBoardComplete = board.ships.length === 10;

  // Создаем правильную структуру клеток для Board компонента
  const createBoardCells = () => {
    const cells: any[][] = [];
    for (let y = 0; y < 10; y++) {
      const row: any[] = [];
      for (let x = 0; x < 10; x++) {
        const position = { x, y };
        
        // Check if cell has a ship
        const ship = board.ships.find(s => 
          s.positions.some(pos => pos.x === x && pos.y === y)
        );
        
        row.push({
          position,
          hasShip: !!ship,
          shipSize: ship?.size || 0,
          isHit: false,
          isMiss: false,
          isSunk: ship?.isSunk || false,
        });
      }
      cells.push(row);
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-sonar" />
              <h1 className="font-heading font-semibold text-h2 text-foam truncate">
                Быстрая игра
              </h1>
            </div>
            <p className="text-secondary text-mist truncate">
              Разместите {10 - board.ships.length} кораблей
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Clock className="w-4 h-4 text-mist" />
            <RingTimer
              duration={80}
              currentTime={timeLeft}
              size="lg"
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 sm:space-y-6">
        {/* Ship selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Выберите корабль
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableShips.map((ship, index) => {
              const IconComponent = ship.icon;
              return (
                <button
                  key={ship.id}
                  onClick={() => setSelectedShip(ship.index)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedShip === ship.index
                      ? 'border-sonar bg-sonar/10'
                      : 'border-edge hover:border-sonar/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${ship.color} rounded-sm flex items-center justify-center`}>
                      <IconComponent className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-heading font-semibold text-body text-foam truncate">
                        {ship.name}
                      </div>
                      <div className="text-caption text-mist">
                        {ship.size} клетки
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {availableShips.length === 0 && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sonar mb-2">
                <CheckCircle className="w-5 h-5" />
                <p className="font-heading font-semibold text-body">
                  Все корабли размещены!
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Orientation toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-heading font-semibold text-body text-foam">
              Ориентация корабля
            </span>
            <button
              onClick={() => setIsHorizontal(!isHorizontal)}
              className="px-4 py-2 bg-steel rounded-lg hover:bg-bg-deep transition-colors flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 text-sonar transition-transform ${!isHorizontal ? 'rotate-90' : ''}`} />
              <span className="text-sonar font-medium">
                {isHorizontal ? 'Горизонтально' : 'Вертикально'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Game board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Ваше поле
          </h3>
          
          <div className="flex justify-center overflow-x-auto">
            <div className="min-w-0">
              <Board
                cells={createBoardCells()}
                onCellClick={handleCellClick}
                isOpponent={false}
              />
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRandomPlacement}
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Случайная расстановка
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClearBoard}
              className="w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Очистить поле
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            disabled={!isBoardComplete}
            className="w-full flex items-center justify-center gap-2"
          >
            {isBoardComplete ? (
              <>
                <Play className="w-4 h-4" />
                Начать игру
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Разместите еще {10 - board.ships.length} кораблей
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
