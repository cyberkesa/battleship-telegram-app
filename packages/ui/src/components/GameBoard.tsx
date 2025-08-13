import React from 'react';
import { motion } from 'framer-motion';
import { Board, Position, CellState } from '@battleship/shared-types';
import { Cell } from './Cell';
import { cn } from '../utils/cn';

interface GameBoardProps {
  board: Board;
  onCellClick?: (position: Position) => void;
  disabled?: boolean;
  showShips?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  disabled = false,
  showShips = false,
  size = 'md',
  className
}) => {
  const getCellState = (position: Position): CellState => {
    // Проверяем, был ли выстрел в эту позицию
    const wasShot = board.shots.some(shot => shot.x === position.x && shot.y === position.y);
    
    if (!wasShot) {
      // Если не было выстрела, показываем корабль только если showShips = true
      const hasShip = board.ships.some(ship =>
        ship.positions.some(pos => pos.x === position.x && pos.y === position.y)
      );
      return hasShip && showShips ? CellState.SHIP : CellState.EMPTY;
    }

    // Проверяем, есть ли корабль в этой позиции
    const ship = board.ships.find(ship =>
      ship.positions.some(pos => pos.x === position.x && pos.y === position.y)
    );

    if (!ship) {
      return CellState.MISS;
    }

    // Проверяем, потоплен ли корабль
    if (ship.isSunk) {
      return CellState.SUNK;
    }

    return CellState.HIT;
  };

  const renderCell = (x: number, y: number) => {
    const position: Position = { x, y };
    const state = getCellState(position);

    return (
      <Cell
        key={`${x}-${y}`}
        position={position}
        state={state}
        onClick={onCellClick}
        disabled={disabled}
        showShip={showShips}
        size={size}
      />
    );
  };

  const renderRow = (y: number) => (
    <div key={y} className="flex">
      {Array.from({ length: 10 }, (_, x) => renderCell(x, y))}
    </div>
  );

  return (
    <motion.div
      className={cn('inline-block', className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, y) => renderRow(y))}
      </div>
    </motion.div>
  );
};
