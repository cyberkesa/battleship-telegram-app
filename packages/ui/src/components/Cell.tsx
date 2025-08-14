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
  | 'ship-sunk';

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
  idle: 'bg-steel ring-1 ring-edge hover:ring-sonar/50 hover:bg-steel/80',
  hover: 'bg-steel ring-2 ring-sonar/50 bg-sonar-sweep',
  selected: 'bg-steel ring-2 ring-sonar shadow-sonar',
  miss: 'bg-steel/60 ring-1 ring-edge',
  hit: 'bg-torpedo ring-1 ring-torpedo shadow-torpedo',
  sunk: 'bg-torpedo/80 ring-1 ring-torpedo',
  disabled: 'bg-mute/30 ring-1 ring-edge/50 cursor-not-allowed',
  ship: 'bg-mute/40 ring-1 ring-edge',
  'ship-hit': 'bg-torpedo/60 ring-1 ring-torpedo',
  'ship-sunk': 'bg-torpedo/80 ring-1 ring-torpedo',
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
            className="w-1 h-1 bg-foam rounded-full"
          />
        );
      case 'hit':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-3 h-3 bg-foam transform rotate-45"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'sunk':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-3 h-3 bg-foam transform rotate-45"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'ship':
        return (
          <div className="w-full h-full bg-mute/20 rounded-sm" />
        );
      case 'ship-hit':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-3 h-3 bg-foam transform rotate-45"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'ship-sunk':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-3 h-3 bg-foam transform rotate-45"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      default:
        return children;
    }
  };

  const cellClassName = `
    grid place-items-center rounded-cell transition-all duration-200
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
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={
        state === 'hit' || state === 'sunk' || state === 'ship-hit' || state === 'ship-sunk'
          ? 'torpedo-hit'
          : state === 'miss'
          ? 'miss-splash'
          : {}
      }
      variants={{
        'torpedo-hit': {
          scale: [1, 1.2, 1],
          rotate: [0, 180, 45],
          transition: { duration: 0.3, ease: "easeOut" }
        },
        'miss-splash': {
          scale: [0, 1],
          opacity: [0, 1],
          transition: { duration: 0.2, ease: "easeOut" }
        }
      }}
    >
      {getCellContent()}
    </motion.div>
  );
};
