import React from 'react';
import { motion } from 'framer-motion';

export interface ShipProps {
  size: number;
  isHorizontal?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isPlaced?: boolean;
  color?: string;
  className?: string;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const Ship: React.FC<ShipProps> = ({
  size,
  isHorizontal = true,
  isSelected = false,
  isDragging = false,
  isPlaced = false,
  color = 'bg-sonar',
  className = '',
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const shipCells = Array.from({ length: size }, (_, i) => i);

  return (
    <motion.div
      className={`
        inline-flex cursor-pointer select-none
        ${isHorizontal ? 'flex-row' : 'flex-col'}
        ${className}
      `}
      draggable={!isPlaced}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileHover={!isPlaced ? { scale: 1.05 } : {}}
      whileTap={!isPlaced ? { scale: 0.95 } : {}}
      animate={{
        scale: isSelected ? 1.1 : 1,
        opacity: isDragging ? 0.5 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {shipCells.map((index) => (
        <div
          key={index}
          className={`
            w-8 h-8 border-2 border-edge
            ${color}
            ${index === 0 ? 'rounded-l-sm' : ''}
            ${index === size - 1 ? 'rounded-r-sm' : ''}
            ${!isHorizontal && index === 0 ? 'rounded-t-sm' : ''}
            ${!isHorizontal && index === size - 1 ? 'rounded-b-sm' : ''}
            ${isSelected ? 'ring-2 ring-sonar ring-offset-1' : ''}
            ${isPlaced ? 'opacity-80' : 'opacity-100'}
          `}
          style={{
            boxShadow: isSelected ? '0 0 0 2px rgba(255, 200, 87, 0.5)' : 'none',
          }}
        />
      ))}
    </motion.div>
  );
};
