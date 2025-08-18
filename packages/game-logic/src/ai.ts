import { Coord, FogOfWar, CellMark, MoveResultKind } from './types';
import { BOARD_SIZE, inBounds } from './core';

// Уровни сложности ИИ
export enum AILevel {
  Easy = 'easy',       // Случайные выстрелы
  Medium = 'medium',   // После попадания стреляет в соседние клетки
  Hard = 'hard'        // Использует статистические стратегии и паттерны
}

// Состояние ИИ для отслеживания стратегии
export interface AIState {
  level: AILevel;
  lastHit?: Coord;           // Последнее попадание
  targetQueue: Coord[];      // Очередь целей для обследования
  huntMode: boolean;         // Режим охоты (после попадания)
  hitSequence: Coord[];      // Последовательность попаданий в текущий корабль
  probabilities?: number[][]; // Карта вероятностей для сложного уровня
}

// Создание начального состояния ИИ
export function createAIState(level: AILevel): AIState {
  return {
    level,
    targetQueue: [],
    huntMode: false,
    hitSequence: [],
    probabilities: level === AILevel.Hard ? initializeProbabilities() : undefined
  };
}

// Инициализация карты вероятностей для сложного ИИ
function initializeProbabilities(): number[][] {
  const probs = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(1));
  
  // Увеличиваем вероятности в центральных областях
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      // Чем ближе к центру, тем выше базовая вероятность
      const centerDistance = Math.abs(x - 4.5) + Math.abs(y - 4.5);
      probs[y][x] = Math.max(0.1, 2 - centerDistance / 5);
    }
  }
  
  return probs;
}

// Получение всех соседних клеток
function getAdjacentCells(coord: Coord): Coord[] {
  const adjacent: Coord[] = [];
  const directions = [
    { x: 0, y: -1 }, // вверх
    { x: 1, y: 0 },  // вправо
    { x: 0, y: 1 },  // вниз
    { x: -1, y: 0 }  // влево
  ];
  
  for (const dir of directions) {
    const newCoord = { x: coord.x + dir.x, y: coord.y + dir.y };
    if (inBounds(newCoord)) {
      adjacent.push(newCoord);
    }
  }
  
  return adjacent;
}

// Получение клеток на одной линии с последовательностью попаданий
function getLineTargets(hitSequence: Coord[]): Coord[] {
  if (hitSequence.length < 2) return [];
  
  const first = hitSequence[0];
  const second = hitSequence[1];
  
  // Определяем направление
  const isHorizontal = first.y === second.y;
  const targets: Coord[] = [];
  
  if (isHorizontal) {
    // Горизонтальное направление
    const y = first.y;
    const minX = Math.min(...hitSequence.map(h => h.x));
    const maxX = Math.max(...hitSequence.map(h => h.x));
    
    // Добавляем цели слева и справа от последовательности
    if (inBounds({ x: minX - 1, y })) targets.push({ x: minX - 1, y });
    if (inBounds({ x: maxX + 1, y })) targets.push({ x: maxX + 1, y });
  } else {
    // Вертикальное направление
    const x = first.x;
    const minY = Math.min(...hitSequence.map(h => h.y));
    const maxY = Math.max(...hitSequence.map(h => h.y));
    
    // Добавляем цели сверху и снизу от последовательности
    if (inBounds({ x, y: minY - 1 })) targets.push({ x, y: minY - 1 });
    if (inBounds({ x, y: maxY + 1 })) targets.push({ x, y: maxY + 1 });
  }
  
  return targets;
}

// Случайный выстрел для легкого уровня
function getRandomMove(fog: FogOfWar): Coord {
  const availableCells: Coord[] = [];
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (fog[y][x] === CellMark.Unknown) {
        availableCells.push({ x, y });
      }
    }
  }
  
  if (availableCells.length === 0) {
    throw new Error('No available cells for AI move');
  }
  
  return availableCells[Math.floor(Math.random() * availableCells.length)];
}

// Интеллектуальный выстрел для среднего уровня
function getMediumMove(fog: FogOfWar, aiState: AIState): Coord {
  // Если есть цели в очереди, выбираем первую
  if (aiState.targetQueue.length > 0) {
    const target = aiState.targetQueue.shift()!;
    // Проверяем, что цель все еще доступна
    if (fog[target.y][target.x] === CellMark.Unknown) {
      return target;
    }
    // Если цель недоступна, пробуем следующую
    return getMediumMove(fog, aiState);
  }
  
  // Если нет целей в очереди, делаем случайный выстрел
  return getRandomMove(fog);
}

// Сложный выстрел с учетом вероятностей
function getHardMove(fog: FogOfWar, aiState: AIState): Coord {
  // Если есть цели в очереди, выбираем с наивысшим приоритетом
  if (aiState.targetQueue.length > 0) {
    return aiState.targetQueue.shift()!;
  }
  
  // Используем карту вероятностей
  if (!aiState.probabilities) {
    return getRandomMove(fog);
  }
  
  let bestCoord: Coord | null = null;
  let bestProbability = -1;
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (fog[y][x] === CellMark.Unknown && aiState.probabilities[y][x] > bestProbability) {
        bestProbability = aiState.probabilities[y][x];
        bestCoord = { x, y };
      }
    }
  }
  
  return bestCoord || getRandomMove(fog);
}

// Основная функция для получения хода ИИ
export function getAIMove(fog: FogOfWar, aiState: AIState): Coord {
  switch (aiState.level) {
    case AILevel.Easy:
      return getRandomMove(fog);
    case AILevel.Medium:
      return getMediumMove(fog, aiState);
    case AILevel.Hard:
      return getHardMove(fog, aiState);
    default:
      return getRandomMove(fog);
  }
}

// Обновление состояния ИИ после хода
export function updateAIState(aiState: AIState, coord: Coord, resultKind: MoveResultKind, sunkCoords?: Coord[]): void {
  switch (resultKind) {
    case MoveResultKind.Hit:
      aiState.lastHit = coord;
      aiState.huntMode = true;
      aiState.hitSequence.push(coord);
      
      if (aiState.level === AILevel.Medium || aiState.level === AILevel.Hard) {
        // Добавляем соседние клетки в очередь целей
        const adjacent = getAdjacentCells(coord);
        for (const adj of adjacent) {
          if (!aiState.targetQueue.some(t => t.x === adj.x && t.y === adj.y)) {
            aiState.targetQueue.push(adj);
          }
        }
      }
      break;
      
    case MoveResultKind.Sunk:
      aiState.lastHit = coord;
      aiState.hitSequence.push(coord);
      
      // Корабль потоплен - сбрасываем режим охоты
      aiState.huntMode = false;
      aiState.hitSequence = [];
      aiState.targetQueue = [];
      
      if (aiState.level === AILevel.Hard && aiState.probabilities && sunkCoords) {
        // Обновляем вероятности: снижаем вокруг потопленного корабля
        for (const sunkCoord of sunkCoords) {
          const adjacent = getAdjacentCells(sunkCoord);
          for (const adj of adjacent) {
            aiState.probabilities[adj.y][adj.x] *= 0.1;
          }
        }
      }
      break;
      
    case MoveResultKind.Miss:
      // Для сложного ИИ снижаем вероятность в этой области
      if (aiState.level === AILevel.Hard && aiState.probabilities) {
        aiState.probabilities[coord.y][coord.x] = 0;
        
        // Если мы в режиме охоты, корректируем стратегию
        if (aiState.huntMode && aiState.hitSequence.length >= 2) {
          // Перестраиваем очередь целей на основе линейных попаданий
          aiState.targetQueue = getLineTargets(aiState.hitSequence);
        }
      }
      break;
      
    case MoveResultKind.Win:
      // Игра окончена
      aiState.huntMode = false;
      aiState.targetQueue = [];
      aiState.hitSequence = [];
      break;
  }
  
  // Для сложного ИИ обновляем общие вероятности
  if (aiState.level === AILevel.Hard && aiState.probabilities && aiState.huntMode && aiState.hitSequence.length >= 2) {
    // Повышаем вероятности на линии с попаданиями
    const lineTargets = getLineTargets(aiState.hitSequence);
    for (const target of lineTargets) {
      aiState.probabilities[target.y][target.x] *= 3;
    }
  }
}

// Вспомогательная функция для отладки - показать состояние ИИ
export function getAIStateDebugInfo(aiState: AIState): string {
  return `AI Level: ${aiState.level}, Hunt Mode: ${aiState.huntMode}, Targets in Queue: ${aiState.targetQueue.length}, Hit Sequence: ${aiState.hitSequence.length}`;
}