import { z } from 'zod';

export const PositionSchema = z.object({
  x: z.number().int().min(0).max(9),
  y: z.number().int().min(0).max(9),
});
export type Position = z.infer<typeof PositionSchema>;

export const FleetShipSchema = z.object({
  id: z.string().min(1),
  bow: PositionSchema,
  length: z.number().int().min(1).max(4),
  horizontal: z.boolean(),
});
export type FleetShip = z.infer<typeof FleetShipSchema>;

export const FleetSchema = z.array(FleetShipSchema).min(1).max(10);
export type Fleet = z.infer<typeof FleetSchema>;

export const MoveSchema = z.object({
  matchId: z.string().min(1),
  position: PositionSchema,
});
export type Move = z.infer<typeof MoveSchema>;

export const JoinSchema = z.object({
  matchId: z.string().min(1),
});
export type JoinPayload = z.infer<typeof JoinSchema>;

export const PlaceSchema = z.object({
  matchId: z.string().min(1),
  fleet: FleetSchema,
});
export type PlacePayload = z.infer<typeof PlaceSchema>;

export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heartbeat'), ts: z.number(), matchId: z.string(), playerId: z.string() }),
  z.object({ type: z.literal('joined'), matchId: z.string(), playerId: z.string() }),
  z.object({ type: z.literal('state'), matchId: z.string(), payload: z.any() }),
  z.object({ type: z.literal('move'), matchId: z.string(), payload: z.object({ position: PositionSchema, result: z.string() }) }),
]);
export type ServerEvent = z.infer<typeof ServerEventSchema>;

