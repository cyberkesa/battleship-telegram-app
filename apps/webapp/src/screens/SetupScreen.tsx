import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, GameBoard, PlacedShip, Position, GameBoardHandle, Ship, RingTimer } from '@battleship/ui';
import { useGameStore } from '../stores/gameStore';
import { useAuth } from '../providers/AuthProvider';
import { randomFleet, validateFleet } from '@battleship/game-logic';
import { 
  Ship as ShipIcon, 
  RotateCcw, 
  Trash2, 
  Play, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Константы
const PLACEMENT_SECONDS = 60;

// Устойчивый UUID генератор
const safeUUID = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

// Правильные корабли по классическим правилам Морского боя
// Источник состава теперь из game-logic FLEET_COMPOSITION
import { FLEET_COMPOSITION } from '@battleship/game-logic';
const SHIP_TYPES = [
  { size: 4, name: 'Линкор', count: FLEET_COMPOSITION[4], color: 'red' as const },
  { size: 3, name: 'Крейсер', count: FLEET_COMPOSITION[3], color: 'blue' as const },
  { size: 2, name: 'Эсминец', count: FLEET_COMPOSITION[2], color: 'sonar' as const },
  { size: 1, name: 'Катер', count: FLEET_COMPOSITION[1], color: 'cyan' as const },
] as const;

// Конвертер PlacedShip → Fleet для валидации
const toFleet = (ps: PlacedShip[]) => ps.map(s => {
  const minX = Math.min(...s.positions.map(p => p.x));
  const minY = Math.min(...s.positions.map(p => p.y));
  return { 
    id: s.id, 
    bow: { x: minX, y: minY }, 
    length: s.size, 
    horizontal: s.isHorizontal 
  };
});

export const SetupScreen: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { setupBoard } = useGameStore();
  useAuth(); // Для быстрой игры
  
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [timeLeft, setTimeLeft] = useState(PLACEMENT_SECONDS);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Определяем тип игры
  const isQuickGame = matchId === 'computer';
  const gameId = matchId ?? 'computer'; // Исправляем роутинг

  // Подсчитываем доступные корабли (оптимизировано)
  const availableShips = React.useMemo(() => {
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
  }, [placedShips]);
  const boardRef = useRef<GameBoardHandle | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);

  // Оптимизированные обработчики кораблей
  const handleShipPlace = React.useCallback((ship: PlacedShip) => {
    setPlacedShips(prev => [...prev, ship]);
  }, []);

  const handleShipRemove = React.useCallback((shipId: string) => {
    setPlacedShips(prev => prev.filter(ship => ship.id !== shipId));
  }, []);

  const handleShipMove = React.useCallback((oldShipId: string, newShip: PlacedShip) => {
    setPlacedShips(prev => prev.map(ship => 
      ship.id === oldShipId ? newShip : ship
    ));
  }, []);

  const handleRandomPlacement = () => {
    try {
      const fleetShips = randomFleet();
      
      const shipToPositions = (ship: { bow: Position; length: number; horizontal: boolean }): Position[] => {
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
      
      const ships: PlacedShip[] = fleetShips.map((ship) => ({
        id: safeUUID(),
        size: ship.length,
        positions: shipToPositions(ship as any),
        isHorizontal: (ship as any).horizontal,
      }));
      
      setPlacedShips(ships);
    } catch (error) {
      console.error('Error generating random fleet:', error);
    }
  };

  const handleClearBoard = () => {
    setPlacedShips([]);
  };

  const startGame = async (overridePlaced?: PlacedShip[]) => {
    if (isGameStarted) return;

    // Валидация флота перед стартом
    const source = overridePlaced ?? placedShips;
    const fleet = toFleet(source);
    const v = validateFleet(fleet, false);
    if (!(v as any).ok) {
      console.error('Invalid fleet:', v);
      return;
    }

    setIsGameStarted(true);
    try {
      await setupBoard(gameId, fleet);
      navigate(`/game/${gameId}`);
    } catch (e) {
      console.error('Failed to setup board:', e);
      setIsGameStarted(false);
    }
  };

  const handleStartGame = () => {
    startGame();
  };

  // Валидация для UX: кнопка активна только при валидной расстановке
  const fleetValidation = React.useMemo(() => validateFleet(toFleet(placedShips), false), [placedShips]);
  const isBoardComplete = (fleetValidation as any).ok === true;
  const remainingShips = SHIP_TYPES.reduce((acc, t) => acc + t.count, 0) - placedShips.length;

  // Таймер для быстрой игры: авто-старт с автосборкой, если пользователь не успел
  useEffect(() => {
    if (!isQuickGame || isGameStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!isBoardComplete) {
            // Автосборка: генерируем и сразу запускаем без гонок состояния
            try {
              const fleetShips = randomFleet();
              const ships: PlacedShip[] = fleetShips.map((ship: any) => {
                const positions: Position[] = Array.from({ length: ship.length }, (_, i) => (
                  ship.horizontal 
                    ? { x: ship.bow.x + i, y: ship.bow.y } 
                    : { x: ship.bow.x, y: ship.bow.y + i }
                ));
                return {
                  id: safeUUID(),
                  size: ship.length,
                  positions,
                  isHorizontal: ship.horizontal,
                } as PlacedShip;
              });
              setPlacedShips(ships);
              startGame(ships);
            } catch (e) {
              console.error('Failed to autogenerate fleet:', e);
            }
          } else {
            startGame();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuickGame, isGameStarted, isBoardComplete]);

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-semibold text-h2 text-foam truncate">
              {isQuickGame ? 'Быстрая игра' : 'Расстановка флота'}
            </h1>
            <p className="text-secondary text-mist truncate">
              {isBoardComplete ? 'Флот готов' : remainingShips > 0 ? `Разместите ${remainingShips} кораблей` : 'Проверьте корректность расположения'}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isQuickGame ? (
              <RingTimer
                duration={PLACEMENT_SECONDS}
                currentTime={timeLeft}
                size="sm"
                className="text-sonar"
              />
            ) : (
              <>
                <Clock className="w-4 h-4 text-mist" />
                <div className="text-right">
                  <div className="text-caption text-mist">Время</div>
                  <div className="font-mono font-semibold text-h3 text-sonar">
                    —
                  </div>
                </div>
              </>
            )}
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
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableShips.map((ship) => (
              <div
                key={ship.id}
                className="p-3 rounded-lg border-2 border-edge hover:border-sonar/50 transition-all cursor-grab active:cursor-grabbing touch-none"
                style={{ 
                  '--cell': 'var(--cell, 28px)',
                  '--gap': 'var(--gap, 2px)'
                } as React.CSSProperties}
                role="button"
                tabIndex={0}
                onPointerDown={(e) => {
                  e.preventDefault();
                  // Исключаем pointer capture — перетаскивание ведёт сам GameBoard
                  if (boardRef.current) {
                    boardRef.current.beginNewShipDrag(ship.size, e.nativeEvent as PointerEvent);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Вместо фиктивного перетаскивания с клавиатуры — фокус на поле и подсказка про R для поворота
                    (boardWrapperRef.current as HTMLDivElement | null)?.focus?.();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-4 h-4 ${ship.color === 'sonar' ? 'bg-game-ship' : ship.color === 'red' ? 'bg-accent-red' : ship.color === 'blue' ? 'bg-accent-blue' : 'bg-accent-cyan'} rounded-sm flex items-center justify-center`}>
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
                <div className="flex justify-center">
                  <Ship
                    size={ship.size as 1 | 2 | 3 | 4}
                    isHorizontal={true}
                    color={ship.color}
                    className="scale-75"
                  />
                </div>
              </div>
            ))}
          </div>

          {availableShips.length === 0 && isBoardComplete && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sonar mb-2">
                <CheckCircle className="w-5 h-5" />
                <p className="font-heading font-semibold text-body">
                  Флот готов!
                </p>
              </div>
              <p className="text-caption text-mist">
                Все корабли размещены правильно
              </p>
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
          
          <div className="flex justify-center">
            <div ref={boardWrapperRef}>
              <GameBoard
              ref={boardRef}
              mode="placement"
              placedShips={placedShips}
              onShipPlace={handleShipPlace}
              onShipRemove={handleShipRemove}
              onShipMove={handleShipMove}
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
                {remainingShips > 0 ? `Разместите еще ${remainingShips} кораблей` : 'Исправьте расположение кораблей'}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
