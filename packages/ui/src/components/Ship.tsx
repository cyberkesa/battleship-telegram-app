import React from 'react';

export interface ShipProps {
  size: 1 | 2 | 3 | 4; // сузили тип — меньше ошибок
  isHorizontal?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isPlaced?: boolean;
  color?: 'sonar' | 'radio' | 'torpedo' | 'info' | 'blue' | 'red' | 'cyan'; // варианты
  className?: string;
  onClick?: () => void;
  
  // Pointer-подход вместо HTML5 DnD:
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
}

// Константы для цветов кораблей
const COLOR_CLASS: Record<NonNullable<ShipProps['color']>, string> = {
  sonar: 'bg-game-ship',
  radio: 'bg-accent-blue',
  torpedo: 'bg-accent-red',
  info: 'bg-accent-cyan',
  blue: 'bg-accent-blue',
  red: 'bg-accent-red',
  cyan: 'bg-accent-cyan',
};

export const Ship: React.FC<ShipProps> = React.memo(({
  size,
  isHorizontal = true,
  isSelected = false,
  isDragging = false,
  isPlaced = false,
  color = 'sonar',
  className = '',
  onClick,
  onPointerDown,
  onPointerUp,
}) => {
  const cells = React.useMemo(() => Array.from({ length: size }, (_, i) => i), [size]);
  const bgClass = COLOR_CLASS[color];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Корабль ${size} клетки, ${isHorizontal ? 'горизонтально' : 'вертикально'}`}
      className={`
        inline-flex select-none
        ${isHorizontal ? 'flex-row' : 'flex-col'}
        ${isPlaced ? 'cursor-default' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        gap: 'var(--gap)',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
          >
        {cells.map((i) => {
          // Скругления корректные: только по направлению ориентации
          const rounded = isHorizontal
            ? `${i === 0 ? 'rounded-l-sm' : ''} ${i === size - 1 ? 'rounded-r-sm' : ''}`
            : `${i === 0 ? 'rounded-t-sm' : ''} ${i === size - 1 ? 'rounded-b-sm' : ''}`;

          return (
            <div
              key={i}
              data-seg
              className={`
                box-border
                ${bgClass}
                ${rounded}
                ${isPlaced ? 'opacity-90' : 'opacity-100'}
                ring-1 ring-black/10
              `}
              style={{
                width: 'var(--cell)',
                height: 'var(--cell)',
              }}
            />
          );
        })}
      </div>
    );
  });
