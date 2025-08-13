import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GameEvent, GameEventType } from '@battleship/shared-types';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly clients = new Map<string, any>();

  constructor(private readonly redis: RedisService) {}

  // Subscribe client to game events
  subscribeToGame(gameId: string, playerId: string, res: any): void {
    const clientKey = `${gameId}:${playerId}`;
    this.clients.set(clientKey, res);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection event
    this.sendEvent(clientKey, {
      type: GameEventType.PLAYER_JOINED,
      gameId,
      data: { gameId, playerId },
      timestamp: new Date()
    });

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(clientKey);
      this.logger.log(`Client disconnected: ${clientKey}`);
    });

    this.logger.log(`Client subscribed: ${clientKey}`);
  }

  // Send event to specific client
  sendEvent(clientKey: string, event: GameEvent): void {
    const client = this.clients.get(clientKey);
    if (client && !client.destroyed) {
      const sseData = `data: ${JSON.stringify(event)}\n\n`;
      client.write(sseData);
    }
  }

  // Send event to all players in a game
  sendGameEvent(gameId: string, event: GameEvent): void {
    this.clients.forEach((client, key) => {
      if (key.startsWith(gameId + ':')) {
        this.sendEvent(key, event);
      }
    });
  }

  // Send event to specific player
  sendPlayerEvent(gameId: string, playerId: string, event: GameEvent): void {
    const clientKey = `${gameId}:${playerId}`;
    this.sendEvent(clientKey, event);
  }

  // Broadcast game events
  broadcastGameEvent(gameId: string, type: GameEventType, data: any): void {
    const event: GameEvent = {
      type,
      gameId,
      data,
      timestamp: new Date()
    };

    this.sendGameEvent(gameId, event);
  }

  // Get connected clients count for a game
  getGameClientsCount(gameId: string): number {
    let count = 0;
    this.clients.forEach((_, key) => {
      if (key.startsWith(gameId + ':')) {
        count++;
      }
    });
    return count;
  }

  // Disconnect all clients for a game
  disconnectGameClients(gameId: string): void {
    this.clients.forEach((client, key) => {
      if (key.startsWith(gameId + ':')) {
        if (!client.destroyed) {
          client.end();
        }
        this.clients.delete(key);
      }
    });
  }
}
