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
    // Континуальность: shipCells строит линейно — отдельная проверка не нужна, но защитимся
    if (sh.horizontal === undefined) return { ok: false, reason: 'ORIENTATION' };

    for (const c of cells) {
      if (occ[c.y][c.x]) return { ok: false, reason: 'OVERLAP' };
      occ[c.y][c.x] = sh.id;
      idByCell.set(coordKey(c), sh.id);
    }
    byLen[sh.length] = (byLen[sh.length] ?? 0) + 1;
  }

  // Проверка набора длин
  for (const len of [1, 2, 3, 4]) {
    if (byLen[len] ?? 0 !== expected[len]) return { ok: false, reason: 'WRONG_COMPOSITION' };
  }

  // Запрет контактов (8 направлений)
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

    // победа?
    const allSunk = (attacker === 'A' ? state.boardB : state.boardA)
      .ships.every(s => (attacker === 'A' ? state.boardB : state.boardA).sunkShipIds.has(s.id));
    if (allSunk) {
      state.status = MatchStatus.Finished;
      state.winner = attacker;
      return { kind: MoveResultKind.Win, coord, shipId, sunkCoords };
    }

    // право ещё хода при попадании — по правилу
    if (!state.rules.repeatTurnOnHit) {
      state.currentTurn = attacker === 'A' ? 'B' : 'A';
      state.turnNo++;
    }
    return { kind: MoveResultKind.Sunk, coord, shipId, sunkCoords };
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
