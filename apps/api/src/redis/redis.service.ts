import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // Matchmaking queue methods
  async addToQueue(playerId: string): Promise<void> {
    await this.redis.sadd('matchmaking_queue', playerId);
  }

  async removeFromQueue(playerId: string): Promise<void> {
    await this.redis.srem('matchmaking_queue', playerId);
  }

  async getQueueMembers(): Promise<string[]> {
    return await this.redis.smembers('matchmaking_queue');
  }

  async getQueueSize(): Promise<number> {
    return await this.redis.scard('matchmaking_queue');
  }

  // Game session methods
  async setGameSession(gameId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(`game:${gameId}`, ttl, JSON.stringify(data));
  }

  async getGameSession(gameId: string): Promise<any> {
    const data = await this.redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteGameSession(gameId: string): Promise<void> {
    await this.redis.del(`game:${gameId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, ttl);
    }
    return count;
  }

  async getRateLimit(key: string): Promise<number> {
    const count = await this.redis.get(key);
    return count ? parseInt(count) : 0;
  }

  // User sessions
  async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.redis.setex(`user_session:${userId}`, ttl, JSON.stringify(sessionData));
  }

  async getUserSession(userId: string): Promise<any> {
    const data = await this.redis.get(`user_session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.redis.del(`user_session:${userId}`);
  }
}
