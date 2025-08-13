import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { BattleshipGame, BoardUtils } from '@battleship/game-logic';
import { ApiResponse, Position, GameStatus, GameEvent, GameEventType } from '@battleship/shared-types';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async setupBoard(matchId: string, playerId: string, ships: any[]): Promise<ApiResponse<any>> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { playerA: true, playerB: true }
      });

      if (!match) {
        return { success: false, error: 'Match not found' };
      }

      if (match.playerAId !== playerId && match.playerBId !== playerId) {
        return { success: false, error: 'Not a player in this match' };
      }

      if (match.status !== GameStatus.SETTING_UP) {
        return { success: false, error: 'Game is not in setup phase' };
      }

      // Validate ship placement
      const board = BoardUtils.createEmptyBoard(playerId);
      board.ships = ships;

      if (!BattleshipGame.validateShipPlacement(board)) {
        return { success: false, error: 'Invalid ship placement' };
      }

      // Save board to database
      await this.prisma.board.upsert({
        where: {
          matchId_playerId: {
            matchId,
            playerId
          }
        },
        update: {
          layout: JSON.stringify(board.ships),
          fogOfWar: []
        },
        create: {
          matchId,
          playerId,
          layout: JSON.stringify(board.ships),
          fogOfWar: []
        }
      });

      // Check if both players are ready
      const boards = await this.prisma.board.findMany({
        where: { matchId }
      });

      if (boards.length === 2) {
        // Start the game
        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            status: GameStatus.PLAYING,
            currentTurn: match.playerAId
          }
        });

        this.logger.log(`Game ${matchId} started`);
      }

      return { success: true, data: { board } };
    } catch (error) {
      this.logger.error('Error setting up board:', error);
      return { success: false, error: 'Failed to setup board' };
    }
  }

  async makeMove(matchId: string, playerId: string, position: Position): Promise<ApiResponse<any>> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          playerA: true,
          playerB: true,
          boards: {
            include: { player: true }
          }
        }
      });

      if (!match) {
        return { success: false, error: 'Match not found' };
      }

      if (match.currentTurn !== playerId) {
        return { success: false, error: 'Not your turn' };
      }

      if (match.status !== GameStatus.PLAYING) {
        return { success: false, error: 'Game is not in playing state' };
      }

      // Get opponent
      const opponentId = match.playerAId === playerId ? match.playerBId : match.playerAId;
      const opponentBoard = match.boards.find(b => b.playerId === opponentId);

      if (!opponentBoard) {
        return { success: false, error: 'Opponent board not found' };
      }

      // Check if position was already shot
      const existingMove = await this.prisma.gameMove.findFirst({
        where: {
          matchId,
          x: position.x,
          y: position.y
        }
      });

      if (existingMove) {
        return { success: false, error: 'Position already shot' };
      }

      // Process the move
      const game = new BattleshipGame({
        id: matchId,
        status: match.status as GameStatus,
        playerA: {
          id: match.playerAId,
          telegramId: match.playerA.telegramId,
          firstName: match.playerA.firstName,
          board: this.parseBoardFromDb(match.boards.find(b => b.playerId === match.playerAId)!),
          isReady: true
        },
        playerB: {
          id: match.playerBId,
          telegramId: match.playerB.telegramId,
          firstName: match.playerB.firstName,
          board: this.parseBoardFromDb(match.boards.find(b => b.playerId === match.playerBId)!),
          isReady: true
        },
        currentTurn: match.currentTurn,
        winner: match.winnerId,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        finishedAt: match.finishedAt
      });

      const result = game.makeMove(playerId, position);

      // Save move to database
      await this.prisma.gameMove.create({
        data: {
          matchId,
          playerId,
          x: position.x,
          y: position.y,
          result: result.hit ? (result.sunk ? 'sunk' : 'hit') : 'miss'
        }
      });

      // Update match status if game is over
      if (game.getGameState().status === GameStatus.FINISHED) {
        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            status: GameStatus.FINISHED,
            winnerId: game.getGameState().winner,
            finishedAt: new Date()
          }
        });
      } else {
        // Switch turns
        await this.prisma.match.update({
          where: { id: matchId },
          data: {
            currentTurn: opponentId
          }
        });
      }

      return {
        success: true,
        data: {
          hit: result.hit,
          sunk: result.sunk,
          shipId: result.shipId,
          gameOver: game.getGameState().status === GameStatus.FINISHED
        }
      };
    } catch (error) {
      this.logger.error('Error making move:', error);
      return { success: false, error: 'Failed to make move' };
    }
  }

  async getGameState(matchId: string, playerId: string): Promise<ApiResponse<any>> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          playerA: true,
          playerB: true,
          boards: {
            include: { player: true }
          },
          moves: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!match) {
        return { success: false, error: 'Match not found' };
      }

      if (match.playerAId !== playerId && match.playerBId !== playerId) {
        return { success: false, error: 'Not a player in this match' };
      }

      // Build game state
      const gameState = {
        id: match.id,
        status: match.status,
        playerA: {
          id: match.playerA.id,
          telegramId: match.playerA.telegramId,
          username: match.playerA.username,
          firstName: match.playerA.firstName,
          isReady: !!match.boards.find(b => b.playerId === match.playerAId)
        },
        playerB: {
          id: match.playerB.id,
          telegramId: match.playerB.telegramId,
          username: match.playerB.username,
          firstName: match.playerB.firstName,
          isReady: !!match.boards.find(b => b.playerId === match.playerBId)
        },
        currentTurn: match.currentTurn,
        winner: match.winnerId,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        finishedAt: match.finishedAt
      };

      return { success: true, data: gameState };
    } catch (error) {
      this.logger.error('Error getting game state:', error);
      return { success: false, error: 'Failed to get game state' };
    }
  }

  private parseBoardFromDb(dbBoard: any) {
    return {
      id: dbBoard.id,
      playerId: dbBoard.playerId,
      ships: dbBoard.layout,
      shots: [],
      hits: [],
      misses: []
    };
  }
}
