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

// Keep only rings and interaction states on the outer container; visuals are rendered via an isometric tile inside
const stateClasses = {
  idle: 'ring-1 ring-border-light hover:ring-primary-400 transition-colors duration-150',
  hover: 'ring-2 ring-primary-400',
  selected: 'ring-2 ring-primary-500',
  miss: 'ring-1 ring-border-medium',
  hit: 'ring-1 ring-game-hit',
  sunk: 'ring-1 ring-game-sunk',
  disabled: 'ring-1 ring-border-light/50 cursor-not-allowed',
  ship: 'ring-1 ring-game-ship/50',
  'ship-hit': 'ring-1 ring-game-hit',
  'ship-sunk': 'ring-1 ring-game-sunk',
  invalid: 'ring-2 ring-red-500/70',
} as const;

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
    // Helper to render an isometric diamond tile
    const renderIsoTile = (options?: { fill?: string; border?: string; shadow?: string }) => {
      const baseSize = 'calc(var(--cell, 32px) * 0.7071)'; // fits rotated square into the outer square
      const fill = options?.fill ?? '#0F2A40';
      const border = options?.border ?? 'rgba(255,255,255,0.08)';
      const shadow = options?.shadow ?? '0 2px 6px rgba(0,0,0,0.25) inset, 0 1px 0 rgba(255,255,255,0.06)';
      return (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: baseSize,
            height: baseSize,
            transform: 'translate(-50%, -50%) rotate(45deg) scaleY(0.5)',
            transformOrigin: 'center',
            background: fill,
            boxShadow: shadow,
            border: `1px solid ${border}`,
            borderRadius: '2px',
          }}
        />
      );
    };

    switch (state) {
      case 'miss':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, rgba(20,60,100,0.6), rgba(8,24,40,0.7))' })}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 'calc(var(--cell, 32px) * 0.18)',
                height: 'calc(var(--cell, 32px) * 0.18)',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#204A86',
                borderRadius: '50%'
              }}
            />
          </>
        );
      case 'hit':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, rgba(20,60,100,0.6), rgba(8,24,40,0.7))', border: 'rgba(255,0,0,0.35)' })}
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
          </>
        );
      case 'sunk':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, rgba(40,20,20,0.6), rgba(20,8,8,0.7))', border: 'rgba(255,0,0,0.5)' })}
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
          </>
        );
      case 'ship':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(40,40,40,0.95), rgba(28,28,28,0.95))', border: 'rgba(255,255,255,0.12)', shadow: '0 2px 8px rgba(0,0,0,0.45) inset, 0 1px 0 rgba(255,255,255,0.08)'});
      case 'ship-hit':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, rgba(40,40,40,0.95), rgba(28,28,28,0.95))', border: 'rgba(255,0,0,0.4)' })}
            <div className="relative w-full h-full" aria-hidden>
              <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center' }} />
              <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
            </div>
          </>
        );
      case 'ship-sunk':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, rgba(40,20,20,0.95), rgba(22,10,10,0.95))', border: 'rgba(255,0,0,0.5)' })}
            <div className="relative w-full h-full" aria-hidden>
              <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(45deg)', transformOrigin: 'center' }} />
              <div style={{ position: 'absolute', left: '12%', top: '50%', width: '76%', height: getStrokePx(), backgroundColor: '#C22121', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
            </div>
          </>
        );
      case 'hover':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(40,100,160,0.6), rgba(16,48,80,0.7))', border: 'rgba(64,160,255,0.5)' });
      case 'selected':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(56,120,200,0.6), rgba(24,64,112,0.7))', border: 'rgba(64,160,255,0.7)' });
      case 'invalid':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(120,40,40,0.5), rgba(80,20,20,0.6))', border: 'rgba(255,80,80,0.6)' });
      default:
        // 'idle' and any other fallbacks
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(20,60,100,0.6), rgba(8,24,40,0.7))' });
    }
  };

  const transitionClass = disabled ? 'transition-none' : 'transition-colors duration-150';
  const fallbackPx = size === 'sm' ? 28 : size === 'lg' ? 40 : size === 'mini' ? 20 : 34;
  const cellClassName = `
    grid place-items-center rounded-cell ${transitionClass}
    ${sizeClasses[size]}
    ${stateClasses[state]}
    bg-transparent
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
        style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)`, backgroundColor: 'transparent', position: 'relative' }}
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
      style={{ width: `var(--cell, ${fallbackPx}px)`, height: `var(--cell, ${fallbackPx}px)`, backgroundColor: 'transparent', position: 'relative' }}
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