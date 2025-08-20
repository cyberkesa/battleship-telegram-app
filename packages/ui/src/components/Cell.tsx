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
    const renderIsoTile = (options?: { fill?: string; border?: string; shadow?: string; borderWidth?: number }) => {
      const baseSize = 'calc(var(--cell, 32px) * 0.7071)';
      const fill = options?.fill ?? 'linear-gradient(180deg, #0F5774 0%, #0A3C53 100%)';
      const border = options?.border ?? 'rgba(46,170,215,0.35)';
      const borderWidth = options?.borderWidth ?? 1;
      const shadow = options?.shadow ?? '0 2px 6px rgba(0,0,0,0.25) inset, 0 1px 0 rgba(255,255,255,0.05)';
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
            border: `${borderWidth}px solid ${border}`,
            borderRadius: '3px',
          }}
        />
      );
    };

    switch (state) {
      case 'miss':
        return (
          <>
            {renderIsoTile({ fill: 'linear-gradient(180deg, #0F5774 0%, #0A3C53 100%)', border: 'rgba(229,64,43,0.9)', borderWidth: 2 })}
          </>
        );
      case 'hit':
        return renderIsoTile({ fill: 'linear-gradient(180deg, #103E54 0%, #0B2C3D 100%)', border: 'rgba(229,64,43,0.95)', borderWidth: 2 });
      case 'sunk':
        return renderIsoTile({ fill: 'linear-gradient(180deg, #301616 0%, #1E0D0D 100%)', border: 'rgba(229,64,43,0.95)', borderWidth: 2 });
      case 'ship':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(60,60,60,0.95), rgba(28,28,28,0.95))', border: 'rgba(255,255,255,0.12)', shadow: '0 2px 8px rgba(0,0,0,0.45) inset, 0 1px 0 rgba(255,255,255,0.08)' });
      case 'ship-hit':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(60,60,60,0.95), rgba(28,28,28,0.95))', border: 'rgba(229,64,43,0.95)', borderWidth: 2 });
      case 'ship-sunk':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(48,22,22,0.95), rgba(30,13,13,0.95))', border: 'rgba(229,64,43,0.95)', borderWidth: 2 });
      case 'hover':
        return renderIsoTile({ fill: 'linear-gradient(180deg, #11739A 0%, #0C5573 100%)', border: 'rgba(64,160,255,0.6)' });
      case 'selected':
        return renderIsoTile({ fill: 'linear-gradient(180deg, #1A86B6 0%, #0F6F97 100%)', border: 'rgba(64,160,255,0.85)', borderWidth: 2 });
      case 'invalid':
        return renderIsoTile({ fill: 'linear-gradient(180deg, rgba(120,40,40,0.5), rgba(80,20,20,0.6))', border: 'rgba(255,80,80,0.8)', borderWidth: 2 });
      default:
        // 'idle'
        return (
          <>
            {renderIsoTile()}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 'calc(var(--cell, 32px) * 0.18)',
                height: 'calc(var(--cell, 32px) * 0.18)',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(180deg, #0D2A3A 0%, #071A25 100%)',
                borderRadius: '3px',
                boxShadow: '0 -1px 0 rgba(255,255,255,0.08) inset, 0 2px 2px rgba(0,0,0,0.35)'
              }}
            />
          </>
        );
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