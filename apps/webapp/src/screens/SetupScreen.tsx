import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Board } from '@battleship/ui';
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

// Правильные корабли по классическим правилам Морского боя
const SHIP_TYPES = [
  { size: 4, name: 'Линкор', count: 1, color: 'bg-torpedo' },
  { size: 3, name: 'Крейсер', count: 2, color: 'bg-radio' },
  { size: 2, name: 'Эсминец', count: 3, color: 'bg-sonar' },
  { size: 1, name: 'Катер', count: 4, color: 'bg-info' },
];

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
  const [timeLeft, setTimeLeft] = useState(80); // 80 секунд на расстановку

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
      id: 'player-board',
      playerId: 'player',
      ships: [],
      shots: [],
      hits: [],
      misses: []
    });
    setSelectedShip(null);
  };

  const handleStartGame = () => {
    if (board.ships.length === 10) { // Все 10 кораблей размещены
      setupBoard(matchId || 'quick-game', board.ships);
      navigate(`/game/${matchId || 'quick-game'}`);
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

  const handleCellClick = (row: number, col: number) => {
    if (selectedShip === null) return;

    const position = { x: col, y: row };
    const shipType = SHIP_TYPES[selectedShip];
    const positions: Position[] = [];

    // Generate ship positions
    if (isHorizontal) {
      for (let i = 0; i < shipType.size; i++) {
        positions.push({ x: position.x + i, y: position.y });
      }
    } else {
      for (let i = 0; i < shipType.size; i++) {
        positions.push({ x: position.x, y: position.y + i });
      }
    }

    // Check if ship can be placed
    const newShip: Ship = {
      id: crypto.randomUUID(),
      size: shipType.size,
      positions,
      hits: [],
      isSunk: false,
    };

    // Validation: check if positions are within bounds and not overlapping
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

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-semibold text-h2 text-foam">
              Расстановка флота
            </h1>
            <p className="text-secondary text-mist">
              Разместите {10 - board.ships.length} кораблей
            </p>
          </div>
          <div className="text-right">
            <div className="text-caption text-mist">Время</div>
            <div className="font-mono font-semibold text-h3 text-sonar">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Ship selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Выберите корабль
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {availableShips.map((ship, index) => (
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
                  <div className={`w-4 h-4 ${ship.color} rounded-sm`}></div>
                  <div className="text-left">
                    <div className="font-heading font-semibold text-body text-foam">
                      {ship.name}
                    </div>
                    <div className="text-caption text-mist">
                      {ship.size} клетки
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {availableShips.length === 0 && (
            <div className="text-center py-4">
              <p className="text-body text-sonar font-semibold">
                ✓ Все корабли размещены!
              </p>
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
              className="px-4 py-2 bg-steel rounded-lg hover:bg-bg-deep transition-colors"
            >
              <span className="text-sonar">
                {isHorizontal ? '↔️ Горизонтально' : '↕️ Вертикально'}
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
          
          <div className="flex justify-center">
            <Board
              cells={createBoardCells()}
              onCellClick={handleCellClick}
              isOpponent={false}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRandomPlacement}
              className="w-full"
            >
              🎲 Случайная расстановка
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClearBoard}
              className="w-full"
            >
              🗑️ Очистить поле
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            disabled={!isBoardComplete}
            className="w-full"
          >
            {isBoardComplete ? '🚀 Начать игру' : `Разместите еще ${10 - board.ships.length} кораблей`}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
