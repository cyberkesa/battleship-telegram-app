export type BoardSize = 'sm' | 'md' | 'lg' | 'mini';

// Единый источник размеров в пикселях
export const sizeConfig = {
  sm: { cellPx: 28, padPx: 8 },
  md: { cellPx: 34, padPx: 12 },
  lg: { cellPx: 40, padPx: 12 },
  mini: { cellPx: 20, padPx: 6 },
} as const;

// Адаптивные CSS значения для использования в стилях
export const adaptiveSizeConfig = {
  sm: { cellPx: 'min(6vmin, 28px)', padPx: 'min(2vmin, 8px)' },
  md: { cellPx: 'min(7vmin, 34px)', padPx: 'min(3vmin, 12px)' },
  lg: { cellPx: 'min(8vmin, 40px)', padPx: 'min(3vmin, 12px)' },
  mini: { cellPx: 'min(4vmin, 20px)', padPx: 'min(1.5vmin, 6px)' },
} as const;

export const gapPx = 0;

// Координаты для поля 10x10
export const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
} as const;

export const BOARD_SIZE = 10;