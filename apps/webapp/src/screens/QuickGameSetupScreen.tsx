import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, ShipPlacementBoard, PlacedShip, Position, RingTimer } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { randomFleet } from '@battleship/game-logic';
import { 
  Ship as ShipIcon, 
  RotateCcw, 
  Trash2, 
  Play, 
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

// Правильные корабли по классическим правилам Морского боя
const SHIP_TYPES = [
  { size: 4, name: 'Линкор', count: 1, color: 'bg-torpedo' },
  { size: 3, name: 'Крейсер', count: 2, color: 'bg-radio' },
  { size: 2, name: 'Эсминец', count: 3, color: 'bg-sonar' },
  { size: 1, name: 'Катер', count: 4, color: 'bg-info' },
];

export const QuickGameSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [timeLeft, setTimeLeft] = useState(80);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Подсчитываем доступные корабли
  const getAvailableShips = () => {
    const available = [];
    for (let i = 0; i < SHIP_TYPES.length; i++) {
      const shipType = SHIP_TYPES[i];
      const placedCount = placedShips.filter(ship => ship.size === shipType.size).length;
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
            startGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isGameStarted]);

  const handleShipPlace = (ship: PlacedShip) => {
    const isOverlapping = placedShips.some(existingShip =>
      existingShip.positions.some(existingPos =>
        ship.positions.some(newPos => 
          existingPos.x === newPos.x && existingPos.y === newPos.y
        )
      )
    );

    if (!isOverlapping) {
      setPlacedShips(prev => [...prev, ship]);
    }
  };

  const handleShipRemove = (shipId: string) => {
    setPlacedShips(prev => prev.filter(ship => ship.id !== shipId));
  };

  const handleRandomPlacement = () => {
    try {
      const fleetShips = randomFleet();
      
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
      
      const ships: PlacedShip[] = fleetShips.map((ship: any) => ({
        id: crypto.randomUUID(),
        size: ship.length,
        positions: shipToPositions(ship),
        isHorizontal: ship.horizontal,
      }));
      
      setPlacedShips(ships);
    } catch (error) {
      console.error('Error generating random fleet:', error);
    }
  };

  const handleClearBoard = () => {
    setPlacedShips([]);
  };

  const startGame = () => {
    setIsGameStarted(true);
    navigate('/game/quick-game');
  };

  const handleStartGame = () => {
    if (placedShips.length === 10) {
      startGame();
    }
  };

  const isBoardComplete = placedShips.length === 10;

  const handleDragStart = (e: React.DragEvent, shipType: any) => {
    const shipData = {
      id: crypto.randomUUID(),
      size: shipType.size,
      isHorizontal: true,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(shipData));
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
              Разместите {10 - placedShips.length} кораблей
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
            Корабли
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableShips.map((ship, index) => (
              <div
                key={ship.id}
                draggable
                onDragStart={(e) => handleDragStart(e, ship)}
                className="p-3 rounded-lg border-2 border-edge hover:border-sonar/50 transition-all cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${ship.color} rounded-sm flex items-center justify-center`}>
                    <ShipIcon className="w-3 h-3 text-white" />
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
                <div className="mt-2 flex justify-center">
                  <div className="flex">
                    {Array.from({ length: ship.size }, (_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 border border-edge ${ship.color} ${
                          i === 0 ? 'rounded-l-sm' : ''
                        } ${
                          i === ship.size - 1 ? 'rounded-r-sm' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
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

        {/* Game board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Поле
          </h3>
          
          <div className="flex justify-center overflow-x-auto">
            <div className="min-w-0">
              <ShipPlacementBoard
                placedShips={placedShips}
                onShipPlace={handleShipPlace}
                onShipRemove={handleShipRemove}
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
                Разместите еще {10 - placedShips.length} кораблей
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
