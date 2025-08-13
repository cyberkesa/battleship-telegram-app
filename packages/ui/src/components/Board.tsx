import React from 'react';
import { motion } from 'framer-motion';
import { Cell, CellState } from './Cell';

export type BoardSize = 'sm' | 'md' | 'lg' | 'mini';

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

const sizeConfig = {
  sm: { cellSize: 'sm', gap: 'gap-0.5', padding: 'p-2' },
  md: { cellSize: 'md', gap: 'gap-0.5', padding: 'p-2' },
  lg: { cellSize: 'lg', gap: 'gap-0.5', padding: 'p-3' },
  mini: { cellSize: 'mini', gap: 'gap-0.5', padding: 'p-1' },
};

const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export const Board: React.FC<BoardProps> = ({
  size = 'md',
  cells,
  onCellClick,
  onCellLongPress,
  disabled = false,
  className = '',
  showCoordinates = true,
  isOpponent = false,
}) => {
  const config = sizeConfig[size];

  const handleCellClick = (row: number, col: number) => {
    if (!disabled && onCellClick) {
      onCellClick(row, col);
    }
  };

  const handleCellLongPress = (row: number, col: number) => {
    if (!disabled && onCellLongPress) {
      onCellLongPress(row, col);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {showCoordinates && (
        <>
          {/* Верхние координаты (буквы) */}
          <div className="absolute -top-6 left-0 right-0 flex justify-center">
            <div className="grid grid-cols-10 gap-0.5" style={{ width: 'calc(10 * 36px + 9 * 2px)' }}>
              {coordinates.letters.map((letter, index) => (
                <div
                  key={letter}
                  className="flex items-center justify-center text-caption font-mono text-mute"
                  style={{ width: '36px', height: '24px' }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          {/* Левые координаты (цифры) */}
          <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-center">
            <div className="grid grid-rows-10 gap-0.5" style={{ height: 'calc(10 * 36px + 9 * 2px)' }}>
              {coordinates.numbers.map((number, index) => (
                <div
                  key={number}
                  className="flex items-center justify-center text-caption font-mono text-mute"
                  style={{ width: '24px', height: '36px' }}
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Основная сетка */}
      <motion.div
        className={`
          grid grid-cols-10 gap-0.5 rounded-card bg-bg-graphite ring-1 ring-edge shadow-steel
          ${config.padding}
        `}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {cells.map((row, rowIndex) =>
          row.map((cellState, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              state={cellState}
              size={config.cellSize as any}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onLongPress={() => handleCellLongPress(rowIndex, colIndex)}
              disabled={disabled}
            />
          ))
        )}
      </motion.div>

      {/* Дополнительная рамка для противника */}
      {isOpponent && (
        <div className="absolute inset-0 rounded-card ring-2 ring-sonar/20 pointer-events-none" />
      )}
    </div>
  );
};
