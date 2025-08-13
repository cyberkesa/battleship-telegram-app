import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApiResponse, GameStatus } from '@battleship/shared-types';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async joinQueue(playerId: string): Promise<ApiResponse<{ inQueue: boolean }>> {
    try {
      // Check if player is already in a game
      const activeGame = await this.prisma.match.findFirst({
        where: {
          OR: [
            { playerAId: playerId },
            { playerBId: playerId }
          ],
          status: {
            in: [GameStatus.SETTING_UP, GameStatus.PLAYING]
          }
        }
      });

      if (activeGame) {
        return {
          success: false,
          error: 'Player is already in a game'
        };
      }

      // Add to queue
      await this.redis.addToQueue(playerId);
      
      // Check for matchmaking
      await this.processMatchmaking();

      return {
        success: true,
        data: { inQueue: true }
      };
    } catch (error) {
      this.logger.error('Error joining queue:', error);
      return {
        success: false,
        error: 'Failed to join queue'
      };
    }
  }

  async leaveQueue(playerId: string): Promise<ApiResponse<{ left: boolean }>> {
    try {
      await this.redis.removeFromQueue(playerId);
      return {
        success: true,
        data: { left: true }
      };
    } catch (error) {
      this.logger.error('Error leaving queue:', error);
      return {
        success: false,
        error: 'Failed to leave queue'
      };
    }
  }

  async getQueueStatus(playerId: string): Promise<ApiResponse<{ inQueue: boolean; queueSize: number }>> {
    try {
      const queueMembers = await this.redis.getQueueMembers();
      const inQueue = queueMembers.includes(playerId);
      const queueSize = queueMembers.length;

      return {
        success: true,
        data: { inQueue, queueSize }
      };
    } catch (error) {
      this.logger.error('Error getting queue status:', error);
      return {
        success: false,
        error: 'Failed to get queue status'
      };
    }
  }

  private async processMatchmaking(): Promise<void> {
    try {
      const queueMembers = await this.redis.getQueueMembers();
      
      if (queueMembers.length >= 2) {
        // Get first two players
        const player1Id = queueMembers[0];
        const player2Id = queueMembers[1];

        // Remove them from queue
        await this.redis.removeFromQueue(player1Id);
        await this.redis.removeFromQueue(player2Id);

        // Get player details
        const [player1, player2] = await Promise.all([
          this.prisma.user.findUnique({ where: { id: player1Id } }),
          this.prisma.user.findUnique({ where: { id: player2Id } })
        ]);

        if (player1 && player2) {
          // Create match
          const match = await this.prisma.match.create({
            data: {
              status: GameStatus.SETTING_UP,
              playerAId: player1Id,
              playerBId: player2Id,
            }
          });

          this.logger.log(`Match created: ${match.id} between ${player1.username} and ${player2.username}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing matchmaking:', error);
    }
  }

  async getActiveMatch(playerId: string): Promise<ApiResponse<any>> {
    try {
      const match = await this.prisma.match.findFirst({
        where: {
          OR: [
            { playerAId: playerId },
            { playerBId: playerId }
          ],
          status: {
            in: [GameStatus.SETTING_UP, GameStatus.PLAYING]
          }
        },
        include: {
          playerA: true,
          playerB: true,
          boards: true,
          moves: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!match) {
        return {
          success: false,
          error: 'No active match found'
        };
      }

      return {
        success: true,
        data: match
      };
    } catch (error) {
      this.logger.error('Error getting active match:', error);
      return {
        success: false,
        error: 'Failed to get active match'
      };
    }
  }
}
