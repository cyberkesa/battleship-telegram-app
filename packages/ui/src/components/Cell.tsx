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
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-cell-sm h-cell-sm',
  md: 'w-cell h-cell',
  lg: 'w-cell-lg h-cell-lg',
  mini: 'w-cell-mini h-cell-mini',
};

// Minimalist visual scheme per spec (paper grid, no animations)
const stateClasses = {
  idle: '',
  hover: '',
  selected: '',
  miss: '',
  hit: '',
  sunk: '',
  disabled: 'cursor-not-allowed',
  ship: '',
  'ship-hit': '',
  'ship-sunk': '',
  invalid: '',
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
            style={{
              width: 'calc(var(--cell, 32px) * 0.22)',
              height: 'calc(var(--cell, 32px) * 0.22)',
              backgroundColor: '#204A86',
              borderRadius: '50%'
            }}
          />
        );
      case 'hit':
        return (
          <div className="relative w-full h-full" aria-hidden>
            <div
              style={{
                position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center'
              }}
            />
            <div
              style={{
                position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center'
              }}
            />
          </div>
        );
      case 'sunk':
        return (
          <div className="relative w-full h-full" aria-hidden>
            <div
              style={{
                position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center'
              }}
            />
            <div
              style={{
                position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center'
              }}
            />
          </div>
        );
      case 'ship':
        return (
          <div
            style={{
              position: 'absolute',
              inset: '12%',
              backgroundColor: '#222222',
            }}
          />
        );
      case 'ship-hit':
        return (
          <div className="relative w-full h-full" aria-hidden>
            <div
              style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center' }}
            />
            <div
              style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center' }}
            />
          </div>
        );
      case 'ship-sunk':
        return (
          <div className="relative w-full h-full" aria-hidden>
            <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center' }} />
            <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
          </div>
        );
      default:
        return children;
    }
  };

  const transitionClass = disabled ? 'transition-none' : '';
  const fallbackPx = size === 'sm' ? 28 : size === 'lg' ? 40 : size === 'mini' ? 20 : 34;
  const cellClassName = `
    grid place-items-center ${transitionClass}
    ${sizeClasses[size]}
    ${stateClasses[state]}
    will-change-transform
    ${disabled ? 'cursor-not-allowed' : draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
    ${className}
  `;

  function getStrokePx() {
    // 2px at c=32 → scale linearly and round to int
    return `calc(max(1px, round((var(--cell, 32px) / 32) * 2px)))` as any;
  }

  // Если ячейка перетаскиваемая, используем обычный div
  if (draggable) {
    return (
      <div
        className={cellClassName}
        style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)`, backgroundColor: '#FAFAFA' }}
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
      style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)`, backgroundColor: '#FAFAFA', position: 'relative' }}
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