import React from 'react';
import { motion } from 'framer-motion';
import { CellState, Position } from '@battleship/shared-types';
import { cn } from '../utils/cn';

interface CellProps {
  position: Position;
  state: CellState;
  onClick?: (position: Position) => void;
  disabled?: boolean;
  showShip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Cell: React.FC<CellProps> = ({
  position,
  state,
  onClick,
  disabled = false,
  showShip = false,
  size = 'md'
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(position);
    }
  };

  const getCellContent = () => {
    switch (state) {
      case CellState.HIT:
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-full h-full bg-red-500 rounded-full"
          />
        );
      case CellState.MISS:
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-full h-full bg-gray-400 rounded-full"
          />
        );
      case CellState.SUNK:
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-full h-full bg-red-700 rounded-full"
          />
        );
      case CellState.SHIP:
        if (showShip) {
          return (
            <div className="w-full h-full bg-blue-600 rounded-sm" />
          );
        }
        return null;
      default:
        return null;
    }
  };

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={cn(
        'border border-gray-300 bg-white cursor-pointer transition-colors',
        sizes[size],
        {
          'hover:bg-gray-100': !disabled && state === CellState.EMPTY,
          'cursor-not-allowed': disabled,
          'bg-gray-200': disabled
        }
      )}
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {getCellContent()}
    </motion.div>
  );
};
