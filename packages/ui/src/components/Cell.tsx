import React from 'react';
import { motion } from 'framer-motion';
import { CellState, Position } from '@battleship/shared-types';
import { cn } from '../utils/cn';

interface CellProps {
  position: Position;
  state: CellState;
  onClick?: () => void;
  disabled?: boolean;
  showShip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Cell: React.FC<CellProps> = ({
  state,
  onClick,
  disabled = false,
  showShip = false,
  size = 'md'
}) => {
  const sizes: Record<string, string> = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getCellContent = () => {
    switch (state) {
      case CellState.HIT:
        return '💥';
      case CellState.MISS:
        return '💧';
      case CellState.SHIP:
        return showShip ? '🚢' : '';
      case CellState.SUNK:
        return '💀';
      default:
        return '';
    }
  };

  const getCellClasses = () => {
    const baseClasses = 'border border-gray-300 flex items-center justify-center font-bold transition-all cursor-pointer';
    
    switch (state) {
      case CellState.HIT:
        return cn(baseClasses, 'bg-red-500 text-white');
      case CellState.MISS:
        return cn(baseClasses, 'bg-blue-200 text-blue-800');
      case CellState.SHIP:
        return cn(baseClasses, showShip ? 'bg-gray-600 text-white' : 'bg-gray-100');
      case CellState.SUNK:
        return cn(baseClasses, 'bg-red-700 text-white');
      default:
        return cn(baseClasses, 'bg-white hover:bg-gray-50');
    }
  };

  return (
    <motion.div
      className={cn(getCellClasses(), sizes[size])}
      onClick={!disabled ? onClick : undefined}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {getCellContent()}
    </motion.div>
  );
};
