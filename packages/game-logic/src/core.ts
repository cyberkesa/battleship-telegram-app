import { 
  Coord, 
  CellMark, 
  Ship, 
  Fleet, 
  Board, 
  FogOfWar, 
  MoveResult, 
  MoveResultKind, 
  MatchState, 
  MatchStatus, 
  PlayerRole,
  GameError,
  GameLogicError
} from './types';

export const BOARD_SIZE = 10;

// New: expected composition constant for classic rules
export const FLEET_COMPOSITION: Readonly<Record<number, number>> = Object.freeze({ 1: 4, 2: 3, 3: 2, 4: 1 });

// Утилиты для координат
export const inBounds = ({ x, y }: Coord): boolean =>
  x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

export const coordKey = ({ x, y }: Coord): string => `${x},${y}`;

// Получение всех клеток корабля
export function shipCells(s: Ship): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < s.length; i++) {
    cells.push({ 
      x: s.bow.x + (s.horizontal ? i : 0),
      y: s.bow.y + (s.horizontal ? 0 : i) 
    });
  }
  return cells;
}

// Получение всех соседних клеток для корабля (клетки, которые должны быть пустыми)
export function getShipAdjacentCells(ship: Ship): Coord[] {
  const shipOwnCells = shipCells(ship);
  const adjacent = new Set<string>();
  
  const dirs = [-1, 0, 1];
  for (const cell of shipOwnCells) {
    for (const dy of dirs) {
      for (const dx of dirs) {
        if (dx === 0 && dy === 0) continue; // Пропускаем саму клетку корабля
        
        const adjCoord = { x: cell.x + dx, y: cell.y + dy };
        if (inBounds(adjCoord)) {
          adjacent.add(coordKey(adjCoord));
        }
      }
    }
  }
  
  // Исключаем клетки самого корабля из соседних
  const shipKeys = new Set(shipOwnCells.map(coordKey));
  const result: Coord[] = [];
  
  for (const key of adjacent) {
    if (!shipKeys.has(key)) {
      const [x, y] = key.split(',').map(Number);
      result.push({ x, y });
    }
  }
  
  return result;
}

// NEW: Валидация одного корабля относительно существующего флота (для realtime-предпросмотра)
export function validatePlacementAgainstFleet(
  existingFleet: Fleet,
  candidate: Ship,
  allowTouching = false,
  excludeShipId?: string
): { ok: true } | { ok: false; reason: GameError } {
  // 1) Проверка длины и ориентации
  if (candidate.length < 1 || candidate.length > 4) return { ok: false, reason: GameError.BAD_LENGTH };
  if (candidate.horizontal === undefined) return { ok: false, reason: GameError.ORIENTATION };

  // 2) Собираем сетку занятости без исключаемого корабля
  const occ: (null | string)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (const sh of existingFleet) {
    if (excludeShipId && sh.id === excludeShipId) continue;
    const cells = shipCells(sh);
    for (const c of cells) {
      if (!inBounds(c)) return { ok: false, reason: GameError.OUT_OF_BOUNDS };
      if (occ[c.y][c.x]) return { ok: false, reason: GameError.OVERLAP };
      occ[c.y][c.x] = sh.id;
    }
  }

  // 3) Проверяем клетки кандидата на выход за пределы и пересечение
  const cells = shipCells(candidate);
  for (const c of cells) {
    if (!inBounds(c)) return { ok: false, reason: GameError.OUT_OF_BOUNDS };
    if (occ[c.y][c.x]) return { ok: false, reason: GameError.OVERLAP };
  }

  // 4) Проверка касаний (8 направлений), если запрещены
  if (!allowTouching) {
    const dirs = [-1, 0, 1];
    for (const c of cells) {
      for (const dy of dirs) {
        for (const dx of dirs) {
          if (dx === 0 && dy === 0) continue;
          const nx = c.x + dx;
          const ny = c.y + dy;
          if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
          if (occ[ny][nx]) return { ok: false, reason: GameError.TOUCHING };
        }
      }
    }
  }

  return { ok: true };
}

// Автоматическое открытие соседних клеток потопленного корабля
export function revealAdjacentCells(
  ship: Ship, 
  targetBoard: Board, 
  fogForAttacker: FogOfWar,
  shipIndex: Map<string, string>
): Coord[] {
  const adjacentCells = getShipAdjacentCells(ship);
  const revealedCells: Coord[] = [];
  
  for (const cell of adjacentCells) {
    const key = coordKey(cell);
    
    // Проверяем, что в этой клетке точно нет корабля
    const hasShip = shipIndex.has(key);
    
    // Проверяем, что мы ещё не стреляли в эту клетку
    const alreadyFired = targetBoard.hits.has(key) || targetBoard.misses.has(key);
    
    // Если в клетке нет корабля и мы ещё не стреляли в неё
    if (!hasShip && !alreadyFired) {
      targetBoard.misses.add(key);
      fogForAttacker[cell.y][cell.x] = CellMark.Miss;
      revealedCells.push(cell);
    }
  }
  
  return revealedCells;
}

// Валидация флота
export function validateFleet(fleet: Fleet, allowTouching = false): { ok: true } | { ok: false; reason: string } {
	if (fleet.length !== 10) return { ok: false, reason: 'FLEET_SIZE' };

	const expected = { 1: 4, 2: 3, 3: 2, 4: 1 } as Record<number, number>;
	const byLen: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

	const occ = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null as null | string));
	const idByCell = new Map<string, string>();

	for (const sh of fleet) {
		if (sh.length < 1 || sh.length > 4) return { ok: false, reason: 'BAD_LENGTH' };
		const cells = shipCells(sh);
		for (const c of cells) if (!inBounds(c)) return { ok: false, reason: 'OUT_OF_BOUNDS' };
		if (sh.horizontal === undefined) return { ok: false, reason: 'ORIENTATION' };

		for (const c of cells) {
			if (occ[c.y][c.x]) return { ok: false, reason: 'OVERLAP' };
			occ[c.y][c.x] = sh.id;
			idByCell.set(coordKey(c), sh.id);
		}
		byLen[sh.length] = (byLen[sh.length] ?? 0) + 1;
	}

	// 1) Проверка набора длин
	for (const len of [1, 2, 3, 4]) {
		if ((byLen[len] ?? 0) !== expected[len]) return { ok: false, reason: 'WRONG_COMPOSITION' };
	}

	// 2) Запрет контактов (8 направлений)
	if (!allowTouching) {
		const dirs = [-1, 0, 1];
		for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
			const id = occ[y][x]; if (!id) continue;
			for (const dy of dirs) for (const dx of dirs) {
				if (dx === 0 && dy === 0) continue;
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
				const nid = occ[ny][nx];
				if (nid && nid !== id) return { ok: false, reason: 'TOUCHING' };
			}
		}
	}

	return { ok: true };
}

// Создание пустого тумана войны
export function makeEmptyFog(): FogOfWar {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(CellMark.Unknown));
}

// Создание доски
export function makeBoard(fleet: Fleet): Board {
  return {
    size: BOARD_SIZE,
    ships: fleet,
    hits: new Set<string>(),
    misses: new Set<string>(),
    sunkShipIds: new Set<string>()
  };
}

// Построение индекса кораблей по клеткам
export function buildShipIndex(fleet: Fleet): Map<string, string> {
  const idx = new Map<string, string>();
  for (const sh of fleet) for (const c of shipCells(sh)) idx.set(coordKey(c), sh.id);
  return idx;
}

// Проверка потопления корабля
export function isShipSunk(ship: Ship, hits: Set<string>): boolean {
  return shipCells(ship).every(c => hits.has(coordKey(c)));
}

// Применение хода
export function applyMove(
  attacker: PlayerRole,
  coord: Coord,
  state: MatchState,
  shipIndexA: Map<string, string>,
  shipIndexB: Map<string, string>
): MoveResult {
  if (state.status !== MatchStatus.InProgress) {
    throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Match is not in progress');
  }
  if (state.currentTurn !== attacker) {
    throw new GameLogicError(GameError.NOT_YOUR_TURN, 'Not your turn');
  }
  if (!inBounds(coord)) {
    throw new GameLogicError(GameError.OUT_OF_BOUNDS, 'Coordinate out of bounds');
  }

  const targetBoard = attacker === 'A' ? state.boardB : state.boardA;
  const fogForAttacker = attacker === 'A' ? state.fogForA : state.fogForB;
  const key = coordKey(coord);

  if (targetBoard.hits.has(key) || targetBoard.misses.has(key)) {
    throw new GameLogicError(GameError.ALREADY_FIRED, 'Already fired at this coordinate');
  }

  // Попадание?
  const shipIndex = attacker === 'A' ? shipIndexB : shipIndexA;
  const shipId = shipIndex.get(key);

  if (!shipId) {
    // Промах
    targetBoard.misses.add(key);
    fogForAttacker[coord.y][coord.x] = CellMark.Miss;
    // смена хода
    state.currentTurn = attacker === 'A' ? 'B' : 'A';
    state.turnNo++;
    return { kind: MoveResultKind.Miss, coord };
  }

  // Попали
  targetBoard.hits.add(key);
  fogForAttacker[coord.y][coord.x] = CellMark.Hit;

  // найти корабль
  const ship = (attacker === 'A' ? state.boardB.ships : state.boardA.ships)
    .find(s => s.id === shipId)!;

  if (isShipSunk(ship, targetBoard.hits)) {
    // Корабль потоплен
    targetBoard.sunkShipIds.add(shipId);
    const sunkCoords = shipCells(ship);
    for (const c of sunkCoords) fogForAttacker[c.y][c.x] = CellMark.Sunk;

    // Потопленный корабль открывает соседние клетки
    const revealedCells = revealAdjacentCells(ship, targetBoard, fogForAttacker, shipIndex);

    // победа?
    const allSunk = (attacker === 'A' ? state.boardB : state.boardA)
      .ships.every(s => (attacker === 'A' ? state.boardB : state.boardA).sunkShipIds.has(s.id));
    if (allSunk) {
      state.status = MatchStatus.Finished;
      state.winner = attacker;
      return { kind: MoveResultKind.Win, coord, shipId, sunkCoords, revealedCells };
    }

    // право ещё хода при попадании — по правилу
    if (!state.rules.repeatTurnOnHit) {
      state.currentTurn = attacker === 'A' ? 'B' : 'A';
      state.turnNo++;
    }
    return { kind: MoveResultKind.Sunk, coord, shipId, sunkCoords, revealedCells };
  }

  // просто Хит
  if (!state.rules.repeatTurnOnHit) {
    state.currentTurn = attacker === 'A' ? 'B' : 'A';
    state.turnNo++;
  }
  return { kind: MoveResultKind.Hit, coord };
}

// Создание нового матча
export function createMatch(
  id: string,
  rules: {
    allowTouching?: boolean;
    repeatTurnOnHit?: boolean;
    turnSeconds?: number;
    placementSeconds?: number;
  } = {}
): MatchState {
  return {
    id,
    status: MatchStatus.Placing,
    currentTurn: null,
    boardA: makeBoard([]),
    boardB: makeBoard([]),
    fogForA: makeEmptyFog(),
    fogForB: makeEmptyFog(),
    rules: {
      boardSize: 10,
      allowTouching: rules.allowTouching ?? false,
      repeatTurnOnHit: rules.repeatTurnOnHit ?? true,
      turnSeconds: rules.turnSeconds ?? 45,
      placementSeconds: rules.placementSeconds ?? 60
    },
    turnNo: 0
  };
}

// Размещение флота игроком
export function placeFleet(
  state: MatchState,
  player: PlayerRole,
  fleet: Fleet
): void {
  if (state.status !== MatchStatus.Placing) {
    throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Cannot place fleet: match not in placing phase');
  }

  const validation = validateFleet(fleet, state.rules.allowTouching);
  if (!validation.ok) {
    const reason = (validation as { ok: false; reason: string }).reason;
    throw new GameLogicError(GameError.INVALID_LAYOUT, `Invalid fleet layout: ${reason}`);
  }

  if (player === 'A') {
    state.boardA = makeBoard(fleet);
  } else {
    state.boardB = makeBoard(fleet);
  }

  // Проверяем, готовы ли оба игрока
  if (state.boardA.ships.length > 0 && state.boardB.ships.length > 0) {
    // Начинаем игру
    state.status = MatchStatus.InProgress;
    state.currentTurn = Math.random() < 0.5 ? 'A' : 'B'; // Случайный первый ход
    state.turnNo = 1;
  }
}

// Получение публичного состояния для игрока
export function getPublicState(state: MatchState, player: PlayerRole) {
  return {
    id: state.id,
    status: state.status,
    currentTurn: state.currentTurn,
    winner: state.winner,
    fog: player === 'A' ? state.fogForA : state.fogForB,
    rules: state.rules,
    turnNo: state.turnNo
  };
}
