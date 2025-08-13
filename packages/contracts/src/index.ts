import { z } from 'zod';

// Base schemas
export const PositionSchema = z.object({
  x: z.number().min(0).max(9),
  y: z.number().min(0).max(9),
});

export const ShipSchema = z.object({
  id: z.string(),
  size: z.number().min(1).max(5),
  positions: z.array(PositionSchema),
  hits: z.array(PositionSchema),
  isSunk: z.boolean(),
});

export const BoardSchema = z.object({
  ships: z.array(ShipSchema),
  shots: z.array(PositionSchema),
  hits: z.array(PositionSchema),
  misses: z.array(PositionSchema),
});

// Auth schemas
export const TelegramInitDataSchema = z.object({
  initData: z.string(),
  user: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
  }),
});

export const AuthResponseSchema = z.object({
  sessionToken: z.string(),
  user: z.object({
    id: z.number(),
    telegramId: z.number(),
    firstName: z.string(),
    lastName: z.string().optional(),
    username: z.string().optional(),
    rating: z.number(),
    gamesPlayed: z.number(),
    gamesWon: z.number(),
    createdAt: z.string(),
  }),
});

// Matchmaking schemas
export const JoinQueueSchema = z.object({
  mode: z.enum(['CLASSIC', 'RAPID', 'BLITZ']).default('CLASSIC'),
});

export const QueueResponseSchema = z.object({
  queued: z.boolean(),
  position: z.number().optional(),
  estimatedWait: z.number().optional(),
});

// Match schemas
export const MatchStateSchema = z.object({
  id: z.string(),
  status: z.enum(['CREATED', 'AWAITING_SETUP', 'PLACING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']),
  playerA: z.object({
    id: z.number(),
    firstName: z.string(),
    rating: z.number(),
  }),
  playerB: z.object({
    id: z.number(),
    firstName: z.string(),
    rating: z.number(),
  }),
  turn: z.enum(['A', 'B']).optional(),
  mode: z.enum(['CLASSIC', 'RAPID', 'BLITZ']),
  createdAt: z.string(),
  finishedAt: z.string().optional(),
  winnerId: z.number().optional(),
  myBoard: BoardSchema,
  opponentBoard: BoardSchema.omit({ ships: true }), // Hide ships from opponent
});

export const PlaceShipsSchema = z.object({
  layout: z.array(ShipSchema),
});

export const MakeMoveSchema = z.object({
  x: z.number().min(0).max(9),
  y: z.number().min(0).max(9),
  idemKey: z.string().optional(),
});

export const MoveResultSchema = z.object({
  result: z.enum(['HIT', 'MISS', 'KILL']),
  turn: z.enum(['A', 'B']),
  sunk: ShipSchema.optional(),
  gameOver: z.boolean(),
  winnerId: z.number().optional(),
});

// Realtime schemas
export const RealtimeEventSchema = z.object({
  type: z.enum(['state', 'move', 'chat', 'system']),
  data: z.any(),
  timestamp: z.string(),
});

// Payment schemas
export const TelegramPaymentSchema = z.object({
  providerTxId: z.string(),
  amount: z.number(),
  currency: z.string(),
  payload: z.record(z.string(), z.any()),
});

// Admin schemas
export const BanUserSchema = z.object({
  userId: z.number(),
  reason: z.string(),
  duration: z.number(), // seconds
});

// Types
export type Position = z.infer<typeof PositionSchema>;
export type Ship = z.infer<typeof ShipSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type TelegramInitData = z.infer<typeof TelegramInitDataSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type JoinQueueRequest = z.infer<typeof JoinQueueSchema>;
export type QueueResponse = z.infer<typeof QueueResponseSchema>;
export type MatchState = z.infer<typeof MatchStateSchema>;
export type PlaceShipsRequest = z.infer<typeof PlaceShipsSchema>;
export type MakeMoveRequest = z.infer<typeof MakeMoveSchema>;
export type MoveResult = z.infer<typeof MoveResultSchema>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
export type TelegramPayment = z.infer<typeof TelegramPaymentSchema>;
export type BanUserRequest = z.infer<typeof BanUserSchema>;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
