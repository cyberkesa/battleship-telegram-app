import React from 'react';

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
  idle: 'bg-game-water/10 hover:bg-game-water/20 transition-colors duration-150',
  hover: 'bg-primary-100',
  selected: 'bg-primary-200',
  miss: 'bg-game-miss/30',
  hit: 'bg-game-hit',
  sunk: 'bg-game-sunk',
  disabled: 'bg-secondary-100/50 cursor-not-allowed',
  ship: 'bg-game-ship/20',
  'ship-hit': 'bg-game-hit/60',
  'ship-sunk': 'bg-game-sunk/80',
  invalid: 'bg-red-300/40',
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
          <div
            className="w-2 h-2 bg-game-miss rounded-full animate-miss-ripple"
          />
        );
      case 'hit':
        return (
          <div
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'sunk':
        return (
          <div
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
          <div
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      case 'ship-sunk':
        return (
          <div
            className="w-4 h-4 bg-white transform rotate-45 animate-hit-explosion"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          />
        );
      default:
        return children;
    }
  };

  const transitionClass = disabled ? 'transition-none' : 'transition-colors duration-150';
  const fallbackPx = size === 'sm' ? 28 : size === 'lg' ? 40 : size === 'mini' ? 20 : 34;
  const hasNoScale = className.includes('no-scale');
  const cellClassName = `
    grid place-items-center ${transitionClass}
    ${sizeClasses[size]}
    ${stateClasses[state]}
    will-change-transform
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
    <div
      className={cellClassName}
      style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)` }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {getCellContent()}
    </div>
  );
};