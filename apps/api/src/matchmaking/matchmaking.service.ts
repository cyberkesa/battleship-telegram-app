import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../infra/prisma.service';
import { createMatch as createInitialMatch } from '@battleship/game-logic';
import { randomUUID } from 'crypto';

interface JoinQueueRequest {
  mode: 'CLASSIC' | 'RAPID' | 'BLITZ';
}

interface QueueResponse {
  queued: boolean;
  position?: number;
  estimatedWait?: number;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly redis?: Redis;

  constructor(private readonly _prisma: PrismaService) {
    const url = process.env.REDIS_URL || process.env.REDIS_TLS_URL || process.env.REDIS_PUBLIC_URL;
    const host = process.env.REDIS_HOST || process.env.REDISHOST;
    const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : (process.env.REDISPORT ? parseInt(process.env.REDISPORT, 10) : undefined);
    const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD;
    const username = process.env.REDIS_USERNAME || process.env.REDISUSER || 'default';
    try {
      if (url) {
        // Auto-TLS for Railway public proxy endpoints
        let enableTls = false;
        try {
          const u = new URL(url);
          enableTls = u.protocol === 'rediss:' || /\.proxy\.rlwy\.net$/i.test(u.hostname);
        } catch {}
        this.redis = new Redis(url, { tls: enableTls ? {} : undefined, name: 'matchmaking' });
      } else if (host && port) {
        this.redis = new Redis({ host, port, password, username, tls: process.env.REDIS_TLS === '1' ? {} : undefined, name: 'matchmaking' });
      }
      if (this.redis) {
        this.redis.on('error', (err) => {
          this.logger.error(`Redis error: ${err?.message || err}`);
        });
        this.redis.on('reconnecting', () => this.logger.warn('Redis reconnecting...'));
        const where = url ? `URL ${url}` : `${host}:${port}`;
        this.logger.log(`Redis client initialized for matchmaking (${where})`);
      } else {
        this.logger.warn('Redis not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT to enable matchmaking.');
      }
    } catch (e) {
      this.logger.error('Failed to initialize Redis client', e as any);
    }
  }

  private ensureRedis() {
    if (!this.redis) {
      throw new ServiceUnavailableException('Matchmaking is not available. Please try again later.');
    }
  }

  async joinQueue(userId: string, request: JoinQueueRequest): Promise<QueueResponse> {
    this.ensureRedis();
    const queueKey = `queue:${request.mode}`;
    const userKey = `user:${userId}`;
    
    try {
      const existingPosition = await this.redis!.zrank(queueKey, userId.toString());
      if (existingPosition !== null) {
        return {
          queued: true,
          position: existingPosition + 1,
          estimatedWait: await this.estimateWaitTime(request.mode),
        };
      }

      const timestamp = Date.now();
      await this.redis!.zadd(queueKey, timestamp, userId.toString());
      await this.redis!.setex(userKey, 300, 'queued'); // 5 minutes TTL

      const position = await this.redis!.zrank(queueKey, userId.toString());
      
      this.logger.log(`User ${userId} joined ${request.mode} queue at position ${position! + 1}`);

      return {
        queued: true,
        position: position! + 1,
        estimatedWait: await this.estimateWaitTime(request.mode),
      };
    } catch (error) {
      this.logger.error(`Failed to join queue for user ${userId}:`, error);
      throw error;
    }
  }

  async leaveQueue(userId: string, mode: string): Promise<QueueResponse> {
    this.ensureRedis();
    const queueKey = `queue:${mode}`;
    const userKey = `user:${userId}`;
    
    try {
      await this.redis!.zrem(queueKey, userId.toString());
      await this.redis!.del(userKey);

      this.logger.log(`User ${userId} left ${mode} queue`);

      return {
        queued: false,
      };
    } catch (error) {
      this.logger.error(`Failed to leave queue for user ${userId}:`, error);
      throw error;
    }
  }

  async findMatch(mode: string): Promise<{ player1: string; player2: string } | null> {
    this.ensureRedis();
    const queueKey = `queue:${mode}`;
    
    try {
      const players = await this.redis!.zrange(queueKey, 0, 1);
      
      if (players.length < 2) {
        return null;
      }

      const [player1, player2] = players;

      await this.redis!.zrem(queueKey, player1, player2);
      await this.redis!.del(`user:${player1}`, `user:${player2}`);

      this.logger.log(`Found match: ${player1} vs ${player2} in ${mode} mode`);

      return { player1, player2 };
    } catch (error) {
      this.logger.error(`Failed to find match in ${mode} queue:`, error);
      throw error;
    }
  }

  async createMatch(player1Id: string, player2Id: string, mode: string): Promise<string> {
    try {
      const matchId = randomUUID();
      const initialState = createInitialMatch(matchId);

      const match = await this._prisma.match.create({
        data: {
          id: initialState.id,
          status: initialState.status,
          currentTurn: initialState.currentTurn as any,
          state: initialState as any,
          playerA: { connect: { id: player1Id } },
          playerB: { connect: { id: player2Id } },
        },
      });

      this.logger.log(`Created match ${match.id} between ${player1Id} and ${player2Id}`);

      if (this.redis) {
        await this.redis.publish('match_found', JSON.stringify({
          matchId: match.id,
          player1: { id: player1Id, role: 'A' },
          player2: { id: player2Id, role: 'B' },
          mode,
        }));
      }

      return match.id;
    } catch (error) {
      this.logger.error(`Failed to create match between ${player1Id} and ${player2Id}:`, error);
      throw error;
    }
  }

  private async estimateWaitTime(mode: string): Promise<number> {
    this.ensureRedis();
    const queueKey = `queue:${mode}`;
    const queueSize = await this.redis!.zcard(queueKey);
    
    return Math.max(10, queueSize * 30);
  }

  async getQueuePosition(userId: number, mode: string): Promise<number | null> {
    this.ensureRedis();
    const queueKey = `queue:${mode}`;
    const position = await this.redis!.zrank(queueKey, userId.toString());
    return position !== null ? position + 1 : null;
  }

  async getQueueSize(mode: string): Promise<number> {
    this.ensureRedis();
    const queueKey = `queue:${mode}`;
    return await this.redis!.zcard(queueKey);
  }
}
