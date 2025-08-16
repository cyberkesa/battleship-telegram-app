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
  | 'ship-sunk';

export type CellSize = 'sm' | 'md' | 'lg' | 'mini';

interface CellProps {
  state: CellState;
  size?: CellSize;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-cell-sm h-cell-sm',
  md: 'w-cell h-cell',
  lg: 'w-cell-lg h-cell-lg',
  mini: 'w-cell-mini h-cell-mini',
};

const stateClasses = {
  idle: 'bg-steel ring-1 ring-edge hover:bg-steel',
  hover: 'bg-steel ring-2 ring-sonar/40',
  selected: 'bg-steel ring-2 ring-sonar',
  miss: 'bg-steel/70 ring-1 ring-edge',
  hit: 'bg-torpedo ring-1 ring-torpedo',
  sunk: 'bg-torpedo/80 ring-1 ring-torpedo',
  disabled: 'bg-mute/30 ring-1 ring-edge/50 cursor-not-allowed',
  ship: 'bg-mute/20 ring-1 ring-edge',
  'ship-hit': 'bg-torpedo/60 ring-1 ring-torpedo',
  'ship-sunk': 'bg-torpedo/80 ring-1 ring-torpedo',
};

export const Cell: React.FC<CellProps> = ({
  state,
  size = 'md',
  onClick,
  onLongPress,
  disabled = false,
  className = '',
  children,
}) => {
  const [isLongPress, setIsLongPress] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout>>();

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
        return <div className="w-1 h-1 bg-foam rounded-full" />;
      case 'hit':
        return <div className="w-3 h-3 bg-foam rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />;
      case 'sunk':
        return <div className="w-3 h-3 bg-foam rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />;
      case 'ship':
        return <div className="w-full h-full bg-mute/20 rounded-sm" />;
      case 'ship-hit':
        return <div className="w-3 h-3 bg-foam rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />;
      case 'ship-sunk':
        return <div className="w-3 h-3 bg-foam rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />;
      default:
        return children;
    }
  };

  return (
    <div
      className={`
        grid place-items-center rounded-cell transition-colors duration-150
        ${sizeClasses[size]}
        ${stateClasses[state]}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
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
