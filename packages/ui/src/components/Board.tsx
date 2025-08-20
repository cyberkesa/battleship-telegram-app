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
}) => {
  const { cellPx, padPx } = adaptiveSizeConfig[size];

  // Валидация размера поля в dev-режиме
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
        // CSS-vars — единый источник размеров с адаптивными значениями
        ['--cell' as any]: cellPx,
        ['--gap' as any]: `${gapPx}px`,
        ['--pad' as any]: padPx,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {showCoordinates && (
        <>
          {/* Верхние координаты (буквы), сдвинуты на паддинг поля */}
          <div className="absolute left-[var(--pad)] -top-6 right-0 flex justify-start pointer-events-none">
            <div
              className="grid grid-cols-10"
              style={{
                width: `calc(${BOARD_SIZE} * var(--cell))`,
                gap: '0px',
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

          {/* Левые координаты (цифры), сдвинуты на паддинг поля */}
          <div className="absolute top-[var(--pad)] -left-6 bottom-0 flex flex-col justify-start pointer-events-none">
            <div
              className="grid grid-rows-10"
              style={{
                height: `calc(${BOARD_SIZE} * var(--cell))`,
                rowGap: '0px',
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

      {/* Подложка с разметкой "тетрадь в клетку" */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: 'var(--pad)',
          top: 'var(--pad)',
          width: `calc(${BOARD_SIZE} * var(--cell))`,
          height: `calc(${BOARD_SIZE} * var(--cell))`,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)
          `,
          backgroundSize: 'var(--cell) var(--cell)',
          backgroundPosition: '0 0',
        }}
      />

      {/* Основная сетка */}
      <div
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        className="relative grid bg-bg-graphite transition-colors duration-200"
        style={{
          gap: '0px',
          padding: 'var(--pad)',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, var(--cell))`,
          gridAutoRows: 'var(--cell)',
          width: `calc(${BOARD_SIZE} * var(--cell))`,
          height: `calc(${BOARD_SIZE} * var(--cell))`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
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

      {/* Рамка противника — ниже координат, но поверх поля */}
      {isOpponent && (
        <div
          className="pointer-events-none absolute inset-[calc(var(--pad)-2px)] rounded-card ring-2 ring-sonar/20"
          aria-hidden
        />
            )}
    </div>
  );
});