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
  variant?: 'flat' | 'isometric';
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
  variant = 'flat',
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

  const coordsVisible = showCoordinates && variant !== 'isometric';

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
      {coordsVisible && (
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
        className="relative grid rounded-[6px] ring-1 ring-edge transition-colors duration-200"
        style={{
          gap: 'var(--gap)',
          padding: 'var(--pad)',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell))`,
          gridAutoRows: 'var(--cell)',
          width: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          height: `calc(${BOARD_SIZE} * var(--cell) + ${(BOARD_SIZE - 1)} * var(--gap))`,
          transform: variant === 'isometric' ? 'rotateX(58deg) rotateZ(45deg)' : undefined,
          transformOrigin: variant === 'isometric' ? 'center' : undefined,
          
        }}
      >
        {/* В изометрии координаты отключены для пиксель‑перфект выравнивания */}
        {/* removed underside full overlay per request */}
        {/* two visible side faces for volume */}
        {/* side faces (isometric slab) */}
        <div
          aria-hidden
          className="absolute"
          style={{
            left: 0,
            bottom: 0,
            width: '100%',
            height: '12px',
            transform: variant === 'isometric' ? 'translateY(6px) rotateX(58deg) rotateZ(45deg)' : 'none',
            transformOrigin: 'top',
            background: variant === 'isometric' ? '#3e8fe1' : 'transparent',
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
            transform: variant === 'isometric' ? 'translateX(6px) rotateX(58deg) rotateZ(45deg)' : 'none',
            transformOrigin: 'left',
            background: variant === 'isometric' ? '#2870bd' : 'transparent',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            zIndex: -1,
          }}
        />
        {cells.map((row, rowIndex) =>
          row.map((cellState, colIndex) => {
            const isShip = (s: CellState) => s === 'ship' || s === 'ship-hit' || s === 'ship-sunk';
            const topNeighbor = rowIndex > 0 ? cells[rowIndex - 1][colIndex] : 'idle';
            const rightNeighbor = colIndex < (BOARD_SIZE - 1) ? row[colIndex + 1] : 'idle';
            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                state={cellState}
                size={size}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onLongPress={() => handleCellLongPress(rowIndex, colIndex)}
                disabled={disabled}
                isometric={variant === 'isometric'}
                shipNeighborTop={isShip(topNeighbor)}
                shipNeighborRight={isShip(rightNeighbor)}
              />
            );
          })
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