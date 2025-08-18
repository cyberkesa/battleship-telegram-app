import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
// Use compiled schema JS directly to avoid ESM/CJS interop issues in Nest build
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { JoinSchema, MoveSchema, PlaceSchema } from '@battleship/shared-types/schemas';
import { GameService } from './game.service';

@WebSocketGateway({ cors: true, namespace: '/ws' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = JoinSchema.safeParse(payload);
    if (!parsed.success) {
      client.emit('error', { message: 'Invalid join payload' });
      return;
    }
    const { matchId } = parsed.data;
    await client.join(`match:${matchId}`);
    client.emit('joined', { matchId });
  }

  @SubscribeMessage('place')
  async handlePlace(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = PlaceSchema.safeParse(payload);
    if (!parsed.success) {
      client.emit('error', { message: 'Invalid place payload' });
      return;
    }
    // Persist via HTTP service to reuse logic; or call gameService.setupBoard if adapted
    // Placeholder: broadcast state event
    const { matchId } = parsed.data;
    this.server.to(`match:${matchId}`).emit('state', { matchId, updated: true });
  }

  @SubscribeMessage('fire')
  async handleFire(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    const parsed = MoveSchema.safeParse(payload);
    if (!parsed.success) {
      client.emit('error', { message: 'Invalid move payload' });
      return;
    }
    const { matchId, position } = parsed.data;
    // Placeholder: broadcast move
    this.server.to(`match:${matchId}`).emit('move', { matchId, position, result: 'pending' });
  }
}

