// Оси 0-based на сервере, клиент может показывать A–J/1–10
export type Coord = { x: number; y: number }; // 0..9

export enum CellMark { 
  Unknown = 'U', 
  Miss = 'M', 
  Hit = 'H', 
  Sunk = 'S' 
}

export type Ship = {
  id: string;               // устойчивый ID корабля
  bow: Coord;               // нос (минимум по x,y)
  length: number;           // 1..4
  horizontal: boolean;      // true=горизонталь, false=вертикаль
};

export type Fleet = Ship[]; // ровно 10 кораблей по дефолтным правилам

export type Board = {
  size: 10;
  ships: Fleet;             // сохраняется только на сервере (секрет)
  hits: Set<string>;        // координаты ударов соперника: 'x,y'
  misses: Set<string>;
  sunkShipIds: Set<string>;
};

export type FogOfWar = CellMark[][]; // что можно показать оппоненту

export enum MoveResultKind { 
  Miss = 'miss', 
  Hit = 'hit', 
  Sunk = 'sunk', 
  Win = 'win' 
}

export type MoveResult = {
  kind: MoveResultKind;
  coord: Coord;
  shipId?: string;
  sunkCoords?: Coord[];     // клетки потопленного корабля
  revealedCells?: Coord[];  // автоматически открытые соседние клетки при потоплении
};

export enum MatchStatus { 
  Placing = 'placing', 
  InProgress = 'in_progress', 
  Finished = 'finished' 
}

export type PlayerRole = 'A' | 'B';

export type MatchState = {
  id: string;
  status: MatchStatus;
  currentTurn: PlayerRole | null;     // кто ходит
  winner?: PlayerRole;
  // приватные доски — не выдавать целиком клиентам
  boardA: Board;                      // доска игрока A (истинная раскладка)
  boardB: Board;                      // доска игрока B
  // публичные части для клиентов
  fogForA: FogOfWar;                  // что A видит на поле B
  fogForB: FogOfWar;                  // что B видит на поле A
  rules: {
    boardSize: 10;
    allowTouching: boolean;           // false по умолчанию
    repeatTurnOnHit: boolean;         // true по умолчанию
    turnSeconds: number;              // 45
    placementSeconds: number;         // 60
  };
  turnNo: number;                     // счетчик ходов (1,2,3…)
};

// Ошибки API
export enum GameError {
  INVALID_LAYOUT = 'INVALID_LAYOUT',
  ALREADY_FIRED = 'ALREADY_FIRED',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  MATCH_NOT_IN_PROGRESS = 'MATCH_NOT_IN_PROGRESS',
  INVITE_CONSUMED = 'INVITE_CONSUMED',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  RATE_LIMIT = 'RATE_LIMIT',
  IDEMPOTENT_REPLAY = 'IDEMPOTENT_REPLAY',
  OUT_OF_BOUNDS = 'OUT_OF_BOUNDS',
  BAD_LENGTH = 'BAD_LENGTH',
  ORIENTATION = 'ORIENTATION',
  OVERLAP = 'OVERLAP',
  WRONG_COMPOSITION = 'WRONG_COMPOSITION',
  TOUCHING = 'TOUCHING',
  FLEET_SIZE = 'FLEET_SIZE',
  RANDOM_PLACEMENT_FAILED = 'RANDOM_PLACEMENT_FAILED',
  BAD_COORD = 'BAD_COORD'
}

export class GameLogicError extends Error {
  constructor(
    public code: GameError,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GameLogicError';
  }
}
