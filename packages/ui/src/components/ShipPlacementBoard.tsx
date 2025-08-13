import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cell } from './Cell';

export interface Position {
  x: number;
  y: number;
}

export interface PlacedShip {
  id: string;
  size: number;
  positions: Position[];
  isHorizontal: boolean;
}

interface ShipPlacementBoardProps {
  placedShips: PlacedShip[];
  onShipPlace?: (ship: PlacedShip) => void;
  onShipRemove?: (shipId: string) => void;
  onCellHover?: (position: Position) => void;
  onCellLeave?: () => void;
  className?: string;
  disabled?: boolean;
}

const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export const ShipPlacementBoard: React.FC<ShipPlacementBoardProps> = ({
  placedShips,
  onShipPlace,
  onShipRemove,
  onCellHover,
  onCellLeave,
  className = '',
  disabled = false,
}) => {
  const [dragOverPosition, setDragOverPosition] = useState<Position | null>(null);
  const [dragOverShip, setDragOverShip] = useState<{ size: number; isHorizontal: boolean } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 36);
    const y = Math.floor((e.clientY - rect.top) / 36);

    if (x >= 0 && x < 10 && y >= 0 && y < 10) {
      setDragOverPosition({ x, y });
      
      // Получаем данные о корабле из drag event
      const shipData = e.dataTransfer.getData('application/json');
      if (shipData) {
        try {
          const ship = JSON.parse(shipData);
          setDragOverShip({ size: ship.size, isHorizontal: ship.isHorizontal });
        } catch (error) {
          console.error('Error parsing ship data:', error);
        }
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
    setDragOverShip(null);
    onCellLeave?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOverPosition || !dragOverShip) return;

    const shipData = e.dataTransfer.getData('application/json');
    if (shipData) {
      try {
        const ship = JSON.parse(shipData);
        const positions: Position[] = [];
        
        // Генерируем позиции корабля
        for (let i = 0; i < ship.size; i++) {
          if (ship.isHorizontal) {
            positions.push({ x: dragOverPosition.x + i, y: dragOverPosition.y });
          } else {
            positions.push({ x: dragOverPosition.x, y: dragOverPosition.y + i });
          }
        }

        // Проверяем, что корабль помещается на поле
        const isValidPlacement = positions.every(pos => 
          pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
        );

        if (isValidPlacement) {
          const newShip: PlacedShip = {
            id: ship.id,
            size: ship.size,
            positions,
            isHorizontal: ship.isHorizontal,
          };
          onShipPlace?.(newShip);
        }
      } catch (error) {
        console.error('Error processing ship drop:', error);
      }
    }

    setDragOverPosition(null);
    setDragOverShip(null);
  };

  const getCellState = (x: number, y: number): any => {
    // Проверяем, есть ли корабль на этой позиции
    const shipAtPosition = placedShips.find(ship =>
      ship.positions.some(pos => pos.x === x && pos.y === y)
    );

    if (shipAtPosition) {
      return {
        position: { x, y },
        hasShip: true,
        shipSize: shipAtPosition.size,
        isHit: false,
        isMiss: false,
        isSunk: false,
      };
    }

    // Проверяем, находится ли ячейка под перетаскиваемым кораблем
    if (dragOverPosition && dragOverShip) {
      const isUnderDragShip = Array.from({ length: dragOverShip.size }, (_, i) => {
        if (dragOverShip.isHorizontal) {
          return { x: dragOverPosition.x + i, y: dragOverPosition.y };
        } else {
          return { x: dragOverPosition.x, y: dragOverPosition.y + i };
        }
      }).some(pos => pos.x === x && pos.y === y);

      if (isUnderDragShip) {
        return {
          position: { x, y },
          hasShip: true,
          shipSize: dragOverShip.size,
          isHit: false,
          isMiss: false,
          isSunk: false,
          isPreview: true,
        };
      }
    }

    return {
      position: { x, y },
      hasShip: false,
      shipSize: 0,
      isHit: false,
      isMiss: false,
      isSunk: false,
    };
  };

  const handleCellClick = (row: number, col: number) => {
    // Находим корабль на этой позиции
    const shipAtPosition = placedShips.find(ship =>
      ship.positions.some(pos => pos.x === col && pos.y === row)
    );

    if (shipAtPosition) {
      onShipRemove?.(shipAtPosition.id);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Верхние координаты (буквы) */}
      <div className="absolute -top-6 left-0 right-0 flex justify-center">
        <div className="grid grid-cols-10 gap-0.5" style={{ width: 'calc(10 * 36px + 9 * 2px)' }}>
          {coordinates.letters.map((letter) => (
            <div
              key={letter}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: '36px', height: '24px' }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Левые координаты (цифры) */}
      <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-center">
        <div className="grid grid-rows-10 gap-0.5" style={{ height: 'calc(10 * 36px + 9 * 2px)' }}>
          {coordinates.numbers.map((number) => (
            <div
              key={number}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: '24px', height: '36px' }}
            >
              {number}
            </div>
          ))}
        </div>
      </div>

      {/* Основная сетка */}
      <motion.div
        ref={boardRef}
        className="grid grid-cols-10 gap-0.5 rounded-card bg-bg-graphite ring-1 ring-edge shadow-steel p-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {Array.from({ length: 10 }, (_, y) =>
          Array.from({ length: 10 }, (_, x) => {
            const cellState = getCellState(x, y);
            return (
              <Cell
                key={`${x}-${y}`}
                state={cellState.hasShip ? 'ship' : 'idle'}
                size="md"
                onClick={() => handleCellClick(y, x)}
                disabled={disabled}
                className={cellState.isPreview ? 'opacity-50' : ''}
              />
            );
          })
        )}
      </motion.div>
    </div>
  );
};
