export type BoardSize = 'sm' | 'md' | 'lg' | 'mini';

// Единый источник размеров в пикселях
export const sizeConfig = {
  sm: { cellPx: 28, padPx: 8 },
  md: { cellPx: 34, padPx: 12 },
  lg: { cellPx: 40, padPx: 12 },
  mini: { cellPx: 20, padPx: 6 },
} as const;

export const gapPx = 2;

// Координаты для поля 10x10
export const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
} as const;

export const BOARD_SIZE = 10;
