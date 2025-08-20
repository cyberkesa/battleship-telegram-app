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
      className={`relative overflow-hidden max-w-full ${className}`}
      style={{
        ['--cell' as any]: resolvedCell,
        ['--gap' as any]: `${gapPx}px`,
        ['--pad' as any]: resolvedPad,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {showCoordinates && (
        <>
          <div className="absolute left-[var(--pad)] -top-6 right-0 flex justify-start pointer-events-none">
            <div
              className="grid grid-cols-10"
              style={{
                width: `calc(${BOARD_SIZE} * var(--cell) + ${BOARD_SIZE - 1} * var(--gap))`,
                gap: 'var(--gap)',
              }}
              aria-hidden
            >
              {coordinates.letters.map((letter) => (
                <div
                  key={letter}
                  className="flex items-center justify-center text-caption font-mono text-mute"
                  style={{ width: 'var(--cell)', height: '24px' }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute top-[var(--pad)] -left-6 bottom-0 flex flex-col justify-start pointer-events-none">
            <div
              className="grid grid-rows-10"
              style={{
                height: `calc(${BOARD_SIZE} * var(--cell) + ${BOARD_SIZE - 1} * var(--gap))`,
                rowGap: 'var(--gap)',
              }}
              aria-hidden
            >
              {coordinates.numbers.map((number) => (
                <div
                  key={number}
                  className="flex items-center justify-center text-caption font-mono text-mute"
                  style={{ width: '24px', height: 'var(--cell)' }}
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        className="relative grid rounded-card ring-1 ring-edge transition-colors duration-200"
        style={{
          gap: 'var(--gap)',
          padding: 'var(--pad)',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell))`,
          gridAutoRows: 'var(--cell)',
          width: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          height: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          background: 'linear-gradient(180deg, #58C3E4 0%, #2BA1C8 100%)',
          transform: 'rotateX(55deg) rotateZ(45deg)',
          transformOrigin: 'center',
          boxShadow: '0 18px 28px rgba(0,0,0,0.35), 0 6px 0 rgba(0,0,0,0.15) inset',
        }}
      >
        {/* slab underside shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-card"
          style={{
            transform: 'translate3d(10px, 16px, 0)',
            filter: 'brightness(0.65) saturate(0.9)',
            background: 'linear-gradient(180deg, #2BA1C8 0%, #1E6C8B 100%)',
            zIndex: -1,
            boxShadow: '0 22px 40px rgba(0,0,0,0.45)'
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
          className="pointer-events-none absolute inset-[calc(var(--pad)-2px)] rounded-card ring-2 ring-sonar/20"
          aria-hidden
        />
      )}
    </div>
  );
});