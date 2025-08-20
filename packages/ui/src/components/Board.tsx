import React from 'react';
import { Cell, CellState } from './Cell';
import { BoardSize, adaptiveSizeConfig, gapPx, coordinates, BOARD_SIZE } from '../utils/boardConfig';

interface BoardProps {
  size?: BoardSize;
  cells: CellState[][];
  onCellClick?: (row: number, col: number) => void;
  onCellLongPress?: (row: number, col: number) => void;
  disabled?: boolean;
  className?: string;
  showCoordinates?: boolean;
  isOpponent?: boolean;
  cellPxOverride?: number;
  padPxOverride?: number;
}

export const Board: React.FC<BoardProps> = React.memo(({ 
  size = 'md',
  cells,
  onCellClick,
  onCellLongPress,
  disabled = false,
  className = '',
  showCoordinates = true,
  isOpponent = false,
  cellPxOverride,
  padPxOverride,
}) => {
  const { cellPx, padPx } = adaptiveSizeConfig[size];
  const resolvedCell = typeof cellPxOverride === 'number' ? `${Math.max(10, Math.floor(cellPxOverride))}px` : cellPx;
  const resolvedPad = typeof padPxOverride === 'number' ? `${Math.max(0, Math.floor(padPxOverride))}px` : padPx;

  if (process.env.NODE_ENV !== 'production') {
    if (cells.length !== BOARD_SIZE || cells.some(r => r.length !== BOARD_SIZE)) {
      console.warn('Board: expected 10x10 cells, got', cells.length, 'x', cells[0]?.length);
    }
  }

  const handleCellClick = React.useCallback((row: number, col: number) => {
    if (!disabled && onCellClick) {
      onCellClick(row, col);
    }
  }, [disabled, onCellClick]);

  const handleCellLongPress = React.useCallback((row: number, col: number) => {
    if (!disabled && onCellLongPress) {
      onCellLongPress(row, col);
    }
  }, [disabled, onCellLongPress]);

  return (
    <div 
      className={`relative overflow-visible max-w-full ${className}`}
      style={{
        ['--cell' as any]: resolvedCell,
        ['--gap' as any]: `${gapPx}px`,
        ['--pad' as any]: resolvedPad,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Внешние координаты убраны — координаты рендерим в изометрии внутри плоскости */}

      <div
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        className="relative grid rounded-[6px] ring-1 ring-edge transition-colors duration-200"
        style={{
          gap: 'var(--gap)',
          padding: 'var(--pad)',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell))`,
          gridAutoRows: 'var(--cell)',
          width: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          height: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          // Lighter base slab
          background: 'linear-gradient(180deg, #7FE7FA 0%, #5FD3EE 100%)',
          transform: 'rotateX(55deg) rotateZ(45deg) scale(0.92)',
          transformOrigin: 'center',
          boxShadow: '0 18px 28px rgba(0,0,0,0.35), 0 6px 0 rgba(0,0,0,0.15) inset',
        }}
      >
        {showCoordinates && (
          <>
            {/* Верхние буквы в изометрии */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                left: 'var(--pad)',
                top: 0,
                width: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
                height: '24px',
                transform: 'translateY(-28px) rotateX(55deg) rotateZ(45deg) scale(0.92)',
                transformOrigin: 'left bottom',
              }}
            >
              <div
                className="grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell))`,
                  columnGap: 'var(--gap)'
                }}
              >
                {coordinates.letters.map((letter) => (
                  <div key={letter} className="text-caption font-mono text-mute flex items-center justify-center">
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Левые цифры в изометрии */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: 'var(--pad)',
                left: 0,
                width: '24px',
                height: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
                transform: 'translateX(-28px) rotateX(55deg) rotateZ(45deg) scale(0.92)',
                transformOrigin: 'right top',
              }}
            >
              <div
                className="grid"
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${BOARD_SIZE}, var(--cell))`,
                  rowGap: 'var(--gap)'
                }}
              >
                {coordinates.numbers.map((n) => (
                  <div key={n} className="text-caption font-mono text-mute flex items-center justify-center">
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {/* removed underside full overlay per request */}
        {/* two visible side faces for volume */}
        <div
          aria-hidden
          className="absolute"
          style={{
            left: 0,
            bottom: 0,
            width: '100%',
            height: '12px',
            transform: 'translateY(6px) rotateX(55deg) rotateZ(45deg)',
            transformOrigin: 'top',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.28))',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            zIndex: -1,
          }}
        />
        <div
          aria-hidden
          className="absolute"
          style={{
            right: 0,
            top: 0,
            width: '12px',
            height: '100%',
            transform: 'translateX(6px) rotateX(55deg) rotateZ(45deg)',
            transformOrigin: 'left',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.22))',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            zIndex: -1,
          }}
        />
        {cells.map((row, rowIndex) =>
          row.map((cellState, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              state={cellState}
              size={size}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onLongPress={() => handleCellLongPress(rowIndex, colIndex)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {isOpponent && (
        <div
          className="pointer-events-none absolute inset-[calc(var(--pad)-2px)] rounded-card ring-2 ring-[#1e3a8a]/50"
          aria-hidden
        />
      )}
    </div>
  );
});