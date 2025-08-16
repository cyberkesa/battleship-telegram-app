import React from 'react';
import { motion } from 'framer-motion';

export type CellState = 
  | 'idle' 
  | 'hover' 
  | 'selected' 
  | 'miss' 
  | 'hit' 
  | 'sunk' 
  | 'disabled'
  | 'ship'
  | 'ship-hit'
  | 'ship-sunk'
  | 'invalid';

export type CellSize = 'sm' | 'md' | 'lg' | 'mini';

interface CellProps {
  state: CellState;
  size?: CellSize;
  onClick?: () => void;
  onLongPress?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  draggable?: boolean;
}

const sizeClasses = {
  sm: 'w-cell-sm h-cell-sm',
  md: 'w-cell h-cell',
  lg: 'w-cell-lg h-cell-lg',
  mini: 'w-cell-mini h-cell-mini',
};

const stateClasses = {
  idle: 'bg-game-water/20 ring-1 ring-border-light hover:ring-primary-400 hover:bg-game-water/30 transition-all duration-200',
  hover: 'bg-primary-100 ring-2 ring-primary-400 shadow-game-glow',
  selected: 'bg-primary-200 ring-2 ring-primary-500 shadow-lg',
  miss: 'bg-game-miss/30 ring-1 ring-border-medium',
  hit: 'bg-game-hit ring-1 ring-game-hit shadow-game-hit',
  sunk: 'bg-game-sunk ring-1 ring-game-sunk shadow-game-hit',
  disabled: 'bg-secondary-100/50 ring-1 ring-border-light/50 cursor-not-allowed',
  ship: 'bg-game-ship/20 ring-1 ring-game-ship/50',
  'ship-hit': 'bg-game-hit/60 ring-1 ring-game-hit',
  'ship-sunk': 'bg-game-sunk/80 ring-1 ring-game-sunk',
  invalid: 'bg-red-300/40 ring-2 ring-red-500/70',
};

export const Cell: React.FC<CellProps> = ({
  state,
  size = 'md',
  onClick,
  onLongPress,
  onDragStart,
  disabled = false,
  className = '',
  children,
  draggable = false,
}) => {
  const [isLongPress, setIsLongPress] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const handleMouseDown = () => {
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true);
        onLongPress();
      }, 500);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPress(false);
  };

  const handleClick = () => {
    if (!disabled && onClick && !isLongPress) {
      onClick();
    }
  };

  const getCellContent = () => {
    switch (state) {
      case 'miss':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-2 h-2 bg-game-miss rounded-full animate-miss-ripple"
          />
        );
      case 'hit':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'sunk':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'ship':
        return (
          <div className="w-full h-full bg-game-ship/30 rounded-lg animate-ship-float" />
        );
      case 'ship-hit':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'ship-sunk':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      default:
        return children;
    }
  };

  const transitionClass = disabled ? 'transition-none' : 'transition-all duration-200';
  const fallbackPx = size === 'sm' ? 28 : size === 'lg' ? 40 : size === 'mini' ? 20 : 34;
  const hasNoScale = className.includes('no-scale');
  const cellClassName = `
    grid place-items-center rounded-cell ${transitionClass}
    ${sizeClasses[size]}
    ${stateClasses[state]}
    ${disabled ? 'cursor-not-allowed' : draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
    ${className}
  `;

  // Если ячейка перетаскиваемая, используем обычный div
  if (draggable) {
    return (
      <div
        className={cellClassName}
        style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)` }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onDragStart={onDragStart}
        draggable={draggable}
      >
        {getCellContent()}
      </div>
    );
  }

  // Иначе используем motion.div для анимаций
  return (
    <motion.div
      className={cellClassName}
      style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)` }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      whileHover={!disabled && !hasNoScale ? { scale: 1.05, y: -1 } : {}}
      whileTap={!disabled && !hasNoScale ? { scale: 0.95 } : {}}
      animate={
        state === 'hit' || state === 'sunk' || state === 'ship-hit' || state === 'ship-sunk'
          ? 'hit-explosion'
          : state === 'miss'
          ? 'miss-ripple'
          : {}
      }
      variants={{
        'hit-explosion': {
          scale: [1, 1.3, 1],
          rotate: [0, 360],
          transition: { duration: 0.4, ease: "easeOut" }
        },
        'miss-ripple': {
          scale: [0, 1.2, 1],
          opacity: [0, 0.6, 1],
          transition: { duration: 0.3, ease: "easeOut" }
        }
      }}
    >
      {getCellContent()}
    </motion.div>
  );
};
