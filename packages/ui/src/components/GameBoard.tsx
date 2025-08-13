import React from 'react';
import { motion } from 'framer-motion';
import { Board, Position, CellState } from '@battleship/shared-types';
import { Cell } from './Cell';
import { cn } from '../utils/cn';

interface GameBoardProps {
  board: Board;
  onCellClick?: (position: Position) => void;
  showShips?: boolean;
  className?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  showShips = false,
  className
}) => {
  const getCellState = (x: number, y: number): CellState => {
    // Check if this position was shot
    const wasShot = board.shots.some((shot: Position) => 
      shot.x === x && shot.y === y
    );

    if (!wasShot) {
      // Check if there's a ship at this position
      const hasShip = board.ships.some((ship: any) =>
        ship.positions.some((pos: Position) => pos.x === x && pos.y === y)
      );
      return hasShip ? CellState.SHIP : CellState.EMPTY;
    }

    // Check if there's a ship at this position
    const ship = board.ships.find((ship: any) =>
      ship.positions.some((pos: Position) => pos.x === x && pos.y === y)
    );

    if (ship) {
      // Check if ship is sunk
      const isSunk = ship.positions.every((pos: Position) =>
        board.hits.some((hit: Position) => hit.x === pos.x && hit.y === pos.y)
      );
      return isSunk ? CellState.SUNK : CellState.HIT;
    }

    return CellState.MISS;
  };

  const handleCellClick = (x: number, y: number) => {
    if (onCellClick) {
      onCellClick({ x, y });
    }
  };

  return (
    <motion.div
      className={cn('grid grid-cols-10 gap-1 p-4 bg-gray-100 rounded-lg', className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Column labels */}
      <div className="col-span-10 grid grid-cols-10 gap-1 mb-2">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter) => (
          <div key={letter} className="text-center text-xs font-bold text-gray-600">
            {letter}
          </div>
        ))}
      </div>

      {/* Game board */}
      {Array.from({ length: 10 }, (_, y) => (
        <React.Fragment key={y}>
          {/* Row label */}
          <div className="text-center text-xs font-bold text-gray-600 flex items-center justify-center">
            {y + 1}
          </div>
          
          {/* Row cells */}
          {Array.from({ length: 10 }, (_, x) => (
            <Cell
              key={`${x}-${y}`}
              position={{ x, y }}
              state={getCellState(x, y)}
              onClick={() => handleCellClick(x, y)}
              showShip={showShips}
              size="md"
            />
          ))}
        </React.Fragment>
      ))}
    </motion.div>
  );
};
