import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../infra/prisma.service';

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
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async joinQueue(userId: number, request: JoinQueueRequest): Promise<QueueResponse> {
    const queueKey = `queue:${request.mode}`;
    const userKey = `user:${userId}`;
    
    try {
      // Check if user is already in queue
      const existingPosition = await this.redis.zrank(queueKey, userId.toString());
      if (existingPosition !== null) {
        return {
          queued: true,
          position: existingPosition + 1,
          estimatedWait: await this.estimateWaitTime(request.mode),
        };
      }

      // Add user to queue with timestamp as score
      const timestamp = Date.now();
      await this.redis.zadd(queueKey, timestamp, userId.toString());
      
      // Set user status
      await this.redis.setex(userKey, 300, 'queued'); // 5 minutes TTL

      const position = await this.redis.zrank(queueKey, userId.toString());
      
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

  async leaveQueue(userId: number, mode: string): Promise<QueueResponse> {
    const queueKey = `queue:${mode}`;
    const userKey = `user:${userId}`;
    
    try {
      // Remove from queue
      const removed = await this.redis.zrem(queueKey, userId.toString());
      
      // Remove user status
      await this.redis.del(userKey);

      this.logger.log(`User ${userId} left ${mode} queue`);

      return {
        queued: false,
      };
    } catch (error) {
      this.logger.error(`Failed to leave queue for user ${userId}:`, error);
      throw error;
    }
  }

  async findMatch(mode: string): Promise<{ player1: number; player2: number } | null> {
    const queueKey = `queue:${mode}`;
    
    try {
      // Get first two players from queue
      const players = await this.redis.zrange(queueKey, 0, 1);
      
      if (players.length < 2) {
        return null;
      }

      const [player1, player2] = players.map(p => parseInt(p));

      // Remove both players from queue
      await this.redis.zrem(queueKey, player1.toString(), player2.toString());

      // Clear user status
      await this.redis.del(`user:${player1}`, `user:${player2}`);

      this.logger.log(`Found match: ${player1} vs ${player2} in ${mode} mode`);

      return { player1, player2 };
    } catch (error) {
      this.logger.error(`Failed to find match in ${mode} queue:`, error);
      throw error;
    }
  }

  async createMatch(player1Id: number, player2Id: number, mode: string): Promise<string> {
    try {
      // Create match in database
      const match = await this.prisma.match.create({
        data: {
          playerAId: player1Id,
          playerBId: player2Id,
          mode: mode as any,
          status: 'AWAITING_SETUP',
        },
      });

      this.logger.log(`Created match ${match.id} between ${player1Id} and ${player2Id}`);

      // Publish match found event
      await this.redis.publish('match_found', JSON.stringify({
        matchId: match.id,
        player1: { id: player1Id, role: 'A' },
        player2: { id: player2Id, role: 'B' },
        mode,
      }));

      return match.id;
    } catch (error) {
      this.logger.error(`Failed to create match between ${player1Id} and ${player2Id}:`, error);
      throw error;
    }
  }

  private async estimateWaitTime(mode: string): Promise<number> {
    const queueKey = `queue:${mode}`;
    const queueSize = await this.redis.zcard(queueKey);
    
    // Rough estimate: 30 seconds per player in queue
    return Math.max(10, queueSize * 30);
  }

  async getQueuePosition(userId: number, mode: string): Promise<number | null> {
    const queueKey = `queue:${mode}`;
    const position = await this.redis.zrank(queueKey, userId.toString());
    return position !== null ? position + 1 : null;
  }

  async getQueueSize(mode: string): Promise<number> {
    const queueKey = `queue:${mode}`;
    return await this.redis.zcard(queueKey);
  }
}
