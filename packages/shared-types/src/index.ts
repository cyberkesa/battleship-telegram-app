// Game types
export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  size: number;
  positions: Position[];
  hits: Position[];
  isSunk: boolean;
}

export interface Board {
  id: string;
  playerId: string;
  ships: Ship[];
  shots: Position[];
  hits: Position[];
  misses: Position[];
}

export interface GameState {
  id: string;
  status: GameStatus;
  playerA: Player;
  playerB: Player;
  currentTurn: string | null;
  winner: string | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

export interface Player {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  board: Board;
  isReady: boolean;
}

export enum GameStatus {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  SETTING_UP = 'setting_up',
  PLAYING = 'playing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export enum CellState {
  EMPTY = 'empty',
  SHIP = 'ship',
  HIT = 'hit',
  MISS = 'miss',
  SUNK = 'sunk'
}

export enum ShipType {
  CARRIER = 5,
  BATTLESHIP = 4,
  CRUISER = 3,
  SUBMARINE = 2,
  DESTROYER = 1
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest {
  initData: string;
  user: TelegramUser;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface MatchmakingRequest {
  playerId: string;
}

export interface MoveRequest {
  gameId: string;
  playerId: string;
  position: Position;
}

export interface GameEvent {
  type: GameEventType;
  gameId: string;
  data: any;
  timestamp: Date;
}

export enum GameEventType {
  PLAYER_JOINED = 'player_joined',
  PLAYER_READY = 'player_ready',
  GAME_STARTED = 'game_started',
  MOVE_MADE = 'move_made',
  SHIP_HIT = 'ship_hit',
  SHIP_SUNK = 'ship_sunk',
  GAME_OVER = 'game_over',
  PLAYER_DISCONNECTED = 'player_disconnected'
}

// Database types
export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  status: GameStatus;
  playerAId: string;
  playerBId: string;
  currentTurn: string | null;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

export interface GameMove {
  id: string;
  matchId: string;
  playerId: string;
  x: number;
  y: number;
  result: 'hit' | 'miss' | 'sunk';
  createdAt: Date;
}

// WebSocket/SSE types
export interface ServerEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface ClientEvent {
  type: string;
  data: any;
}
