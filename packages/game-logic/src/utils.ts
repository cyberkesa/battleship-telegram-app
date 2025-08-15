import { Coord, Fleet, Ship, GameError, GameLogicError } from './types';
import { BOARD_SIZE, inBounds, shipCells } from './core';

// Утилиты для координат и нотации
export const alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Преобразование координат в человекочитаемый формат (A1..J10)
export const toHuman = ({ x, y }: Coord): string => `${alpha[x]}${y + 1}`;

// Преобразование человекочитаемого формата в координаты
export function fromHuman(s: string): Coord {
  const m = /^([A-J])([1-9]|10)$/i.exec(s.trim());
  if (!m) {
    throw new GameLogicError(GameError.BAD_COORD, `Invalid coordinate format: ${s}`);
  }
  return { 
    x: alpha.indexOf(m[1].toUpperCase()), 
    y: parseInt(m[2], 10) - 1 
  };
}

// Генерация случайного ID
function cryptoRandomId(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `s_${Math.random().toString(36).slice(2, 10)}`);
}

// Проверка отсутствия контактов для новых клеток
function noTouch(cells: Coord[], occ: boolean[][]): boolean {
  const dirs = [-1, 0, 1];
  for (const c of cells) {
    for (const dy of dirs) for (const dx of dirs) {
      if (dx === 0 && dy === 0) continue;
      const nx = c.x + dx, ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
      if (occ[ny][nx]) return false;
    }
  }
  return true;
}

// Рандом-расстановка флота без касаний
export function randomFleet(seed?: string, allowTouching = false): Fleet {
  // При желании используйте seedrandom(seed) для детерминизма
  const lengths = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  let tries = 0;
  
  while (tries++ < 500) {
    const ships: Ship[] = [];
    const occ = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    
    const okPlace = (cells: Coord[]) => 
      cells.every(c => inBounds(c) && !occ[c.y][c.x]) &&
      (!allowTouching ? noTouch(cells, occ) : true);

    for (const len of lengths) {
      let placed = false;
      for (let t = 0; t < 200 && !placed; t++) {
        const horizontal = Math.random() < 0.5;
        const maxX = horizontal ? BOARD_SIZE - len : BOARD_SIZE - 1;
        const maxY = horizontal ? BOARD_SIZE - 1 : BOARD_SIZE - len;
        const bow = { 
          x: Math.floor(Math.random() * (maxX + 1)), 
          y: Math.floor(Math.random() * (maxY + 1)) 
        };
        
        const candidate: Ship = { 
          id: cryptoRandomId(), 
          bow, 
          length: len, 
          horizontal 
        };
        
        const cells = shipCells(candidate);
        if (!okPlace(cells)) continue;
        
        for (const c of cells) occ[c.y][c.x] = true;
        ships.push(candidate);
        placed = true;
      }
      if (!placed) break;
    }
    
    if (ships.length === 10) return ships;
  }
  
  throw new GameLogicError(GameError.RANDOM_PLACEMENT_FAILED, 'Failed to generate random fleet after 500 attempts');
}

// Создание флота по умолчанию (для тестов) - простая валидная расстановка
export function createDefaultFleet(): Fleet {
  return [
    // 1 четырехпалубный корабль (верх доски)
    { id: 'ship-4-1', bow: { x: 1, y: 1 }, length: 4, horizontal: true },
    
    // 2 трехпалубных корабля
    { id: 'ship-3-1', bow: { x: 1, y: 3 }, length: 3, horizontal: true },
    { id: 'ship-3-2', bow: { x: 6, y: 1 }, length: 3, horizontal: false },
    
    // 3 двухпалубных корабля
    { id: 'ship-2-1', bow: { x: 1, y: 5 }, length: 2, horizontal: true },
    { id: 'ship-2-2', bow: { x: 4, y: 5 }, length: 2, horizontal: true },
    { id: 'ship-2-3', bow: { x: 8, y: 1 }, length: 2, horizontal: false },
    
    // 4 однопалубных корабля
    { id: 'ship-1-1', bow: { x: 1, y: 7 }, length: 1, horizontal: true },
    { id: 'ship-1-2', bow: { x: 3, y: 7 }, length: 1, horizontal: true },
    { id: 'ship-1-3', bow: { x: 5, y: 7 }, length: 1, horizontal: true },
    { id: 'ship-1-4', bow: { x: 7, y: 7 }, length: 1, horizontal: true }
  ];
}

// Утилиты для работы с координатами
export function getAdjacentCoords(coord: Coord): Coord[] {
  const adjacent: Coord[] = [];
  const dirs = [-1, 0, 1];
  
  for (const dy of dirs) {
    for (const dx of dirs) {
      if (dx === 0 && dy === 0) continue;
      const nx = coord.x + dx;
      const ny = coord.y + dy;
      if (inBounds({ x: nx, y: ny })) {
        adjacent.push({ x: nx, y: ny });
      }
    }
  }
  
  return adjacent;
}

// Получение координат в радиусе
export function getCoordsInRadius(center: Coord, radius: number): Coord[] {
  const coords: Coord[] = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = center.x + dx;
      const ny = center.y + dy;
      if (inBounds({ x: nx, y: ny })) {
        coords.push({ x: nx, y: ny });
      }
    }
  }
  
  return coords;
}

// Проверка, находятся ли координаты на одной линии
export function isOnSameLine(coord1: Coord, coord2: Coord): boolean {
  return coord1.x === coord2.x || coord1.y === coord2.y;
}

// Получение направления между двумя координатами
export function getDirection(from: Coord, to: Coord): { dx: number; dy: number } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  if (dx === 0 && dy === 0) return null;
  
  return {
    dx: dx === 0 ? 0 : dx / Math.abs(dx),
    dy: dy === 0 ? 0 : dy / Math.abs(dy)
  };
}

// Создание корабля из двух координат
export function createShipFromCoords(bow: Coord, stern: Coord): Ship {
  const direction = getDirection(bow, stern);
  if (!direction) {
    throw new GameLogicError(GameError.BAD_LENGTH, 'Invalid ship coordinates: bow and stern are the same');
  }
  
  const horizontal = direction.dy === 0;
  const length = horizontal ? Math.abs(stern.x - bow.x) + 1 : Math.abs(stern.y - bow.y) + 1;
  
  if (length < 1 || length > 4) {
    throw new GameLogicError(GameError.BAD_LENGTH, `Invalid ship length: ${length}`);
  }
  
  return {
    id: cryptoRandomId(),
    bow: bow.x < stern.x || (bow.x === stern.x && bow.y < stern.y) ? bow : stern,
    length,
    horizontal
  };
}
