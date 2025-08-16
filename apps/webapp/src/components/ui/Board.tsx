import React from 'react';
import { motion } from 'framer-motion';
import { Cell, CellState, CellSize } from './Cell';

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

interface BoardProps {
  ships?: Ship[];
  shots?: Position[];
  hits?: Position[];
  misses?: Position[];
  size?: CellSize;
  showShips?: boolean;
  onCellClick?: (_position: Position) => void;
  onCellLongPress?: (_position: Position) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export const Board: React.FC<BoardProps> = ({
  ships = [],
  shots = [],
  size = 'md',
  showShips = false,
  onCellClick,
  onCellLongPress,
  disabled = false,
  className = '',
  title,
}) => {
  const getCellState = (x: number, y: number): CellState => {
    
    // Check if this position was shot
    const wasShot = shots.some(shot => shot.x === x && shot.y === y);
    
    if (!wasShot) {
      // Check if there's a ship at this position
      const ship = ships.find(ship =>
        ship.positions.some(pos => pos.x === x && pos.y === y)
      );
      
      if (ship && showShips) {
        const isHit = ship.hits.some(hit => hit.x === x && hit.y === y);
        if (ship.isSunk) return 'ship-sunk';
        if (isHit) return 'ship-hit';
        return 'ship';
      }
      
      return 'idle';
    }

    // Check if there's a ship at this position
    const ship = ships.find(ship =>
      ship.positions.some(pos => pos.x === x && pos.y === y)
    );

    if (ship) {
      if (ship.isSunk) return 'sunk';
      return 'hit';
    }

    return 'miss';
  };

  const handleCellClick = (_x: number, _y: number) => {
    if (!disabled && onCellClick) {
      onCellClick({ x: _x, y: _y });
    }
  };

  const handleCellLongPress = (_x: number, _y: number) => {
    if (!disabled && onCellLongPress) {
      onCellLongPress({ x: _x, y: _y });
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <div className="text-center mb-3">
          <h3 className="text-foam font-sans font-semibold text-lg">{title}</h3>
        </div>
      )}
      
      {/* Column labels (A-J) */}
      <div className="grid grid-cols-10 gap-0.5 mb-1">
        <div className="w-cell h-6"></div> {/* Empty corner */}
        {COLUMNS.map((letter) => (
          <div 
            key={letter} 
            className="w-cell h-6 flex items-center justify-center text-xs font-mono font-medium text-mute"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Game board with row labels */}
      {ROWS.map((row, y) => (
        <div key={y} className="flex gap-0.5 mb-1">
          {/* Row label (1-10) */}
          <div className="w-6 h-cell flex items-center justify-center text-xs font-mono font-medium text-mute">
            {row}
          </div>
          
          {/* Row cells */}
          {Array.from({ length: 10 }, (_, x) => (
            <Cell
              key={`${x}-${y}`}
              state={getCellState(x, y)}
              size={size}
              onClick={() => handleCellClick(x, y)}
              onLongPress={() => handleCellLongPress(x, y)}
              disabled={disabled}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
};
