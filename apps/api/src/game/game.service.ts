import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../infra/prisma.service';

// Temporary simple types for testing
interface MatchState {
  id: string;
  status: string;
  currentTurn: string;
  boardA: any;
  boardB: any;
}



@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private aiStates = new Map<string, any>(); // AI state for computer games
  private matches = new Map<string, MatchState>(); // In-memory matches
  private redis?: Redis;

  constructor(private _prisma: PrismaService) {
    // Optional Redis for AI matches persistence across requests/instances
    try {
      const privateUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
      const publicUrl = process.env.REDIS_PUBLIC_URL;
      const chosen = privateUrl || publicUrl;
      if (chosen) {
        const withFamily = chosen.includes('family=') ? chosen : `${chosen}${chosen.includes('?') ? '&' : '?'}family=0`;
        const enableTls = /^(rediss:\/\/)/i.test(withFamily) || /\.proxy\.rlwy\.net$/i.test(new URL(withFamily).hostname);
        this.redis = new Redis(withFamily, {
          tls: enableTls ? {} : undefined,
          name: 'game-ai',
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
          enableOfflineQueue: false,
        });
        this.redis.on('error', (e) => this.logger.warn(`Redis error (game-ai): ${e?.message || e}`));
      }
    } catch (e) {
      this.logger.warn('Failed to initialize Redis for game-ai');
    }
  }

  private async loadAiMatch(id: string): Promise<MatchState | undefined> {
    if (this.matches.has(id)) return this.matches.get(id);
    if (!this.redis) return undefined;
    try {
      const raw = await this.redis.get(`ai:match:${id}`);
      return raw ? (JSON.parse(raw) as MatchState) : undefined;
    } catch {
      return undefined;
    }
  }

  private async saveAiMatch(state: MatchState): Promise<void> {
    this.matches.set(state.id, state);
    if (this.redis) {
      try {
        await this.redis.set(`ai:match:${state.id}`, JSON.stringify(state), 'EX', 60 * 60); // 1h TTL
      } catch {}
    }
  }

  async setupBoard(matchId: string, playerId: string, ships: any[]): Promise<any> {
    try {
      // Simple validation for testing
      if (!ships || ships.length === 0) {
        throw new BadRequestException('Ships are required');
      }

      if (matchId === 'computer') {
        // Create new computer game
        const actualMatchId = `computer-${playerId}-${Date.now()}`;
        const match: MatchState = {
          id: actualMatchId,
          status: 'in_progress',
          currentTurn: 'A',
          boardA: { ships },
          boardB: { ships: [] }
        };
        
        // Store match (persist if Redis available)
        await this.saveAiMatch(match);
        
        return {
          success: true,
          data: {
            matchId: actualMatchId,
            status: match.status,
            currentTurn: match.currentTurn
          }
        };
      } else {
        // Multiplayer setup
        const dbMatch = await this._prisma.match.findUnique({
          where: { id: matchId }
        });

        if (!dbMatch) {
          throw new NotFoundException('Match not found');
        }

        const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
        if (!role) {
          throw new BadRequestException('Player not part of this match');
        }

        const state: any = (dbMatch.state as any) || { boards: { A: null, B: null }, ready: { A: false, B: false } };
        state.boards = state.boards || { A: null, B: null };
        state.ready = state.ready || { A: false, B: false };
        state.boards[role] = { ships };
        state.ready[role] = true;

        let nextStatus = dbMatch.status;
        let currentTurn = dbMatch.currentTurn;
        if (state.ready.A && state.ready.B) {
          nextStatus = 'in_progress';
          currentTurn = currentTurn || 'A';
          state.phase = 'in_progress';
        } else {
          state.phase = 'placing';
        }

        const updated = await this._prisma.match.update({
          where: { id: matchId },
          data: {
            status: nextStatus,
            currentTurn: currentTurn,
            state: state as any,
          }
        });

        return {
          success: true,
          data: {
            matchId: updated.id,
            status: updated.status,
            currentTurn: updated.currentTurn,
          }
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async makeMove(matchId: string, playerId: string, position: { x: number; y: number }): Promise<any> {
    try {
      if (matchId === 'computer' || matchId.startsWith('computer-')) {
        const actualId = matchId === 'computer' ? undefined : matchId;
        const key = actualId ?? Array.from(this.matches.keys()).find(k => k.startsWith(`computer-${playerId}-`));
        const match = key ? await this.loadAiMatch(key) : undefined;
        if (!match) {
          // Return a not-ready state instead of 404 to avoid breaking UI
          return {
            success: true,
            data: {
              id: actualId || 'computer',
              status: 'in_progress',
              currentTurn: 'A',
              playerRole: 'A',
              publicState: { fog: [], board: null }
            }
          };
        }
        const result = { kind: 'miss', message: 'Move recorded' };
        match.currentTurn = match.currentTurn === 'A' ? 'B' : 'A';
        await this.saveAiMatch(match);
        return {
          success: true,
          data: {
            result: result.kind,
            coord: position,
            gameOver: false,
            currentTurn: match.currentTurn
          }
        };
      }

      // Multiplayer
      // If not a computer match and not found in-memory, try DB
      const dbMatch = await this._prisma.match.findUnique({ where: { id: matchId } });
      if (!dbMatch) {
        throw new NotFoundException('Match not found');
      }
      const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
      if (!role) {
        throw new BadRequestException('Player not part of this match');
      }
      if (dbMatch.status !== 'in_progress') {
        throw new BadRequestException('Match is not in progress');
      }
      if (dbMatch.currentTurn && dbMatch.currentTurn !== role) {
        throw new BadRequestException('Not your turn');
      }

      const resultKind = 'miss';
      const nextTurn = role === 'A' ? 'B' : 'A';
      const state: any = (dbMatch.state as any) || {};
      state.lastMove = { x: position.x, y: position.y, result: resultKind, by: role };

      await this._prisma.gameMove.create({
        data: {
          matchId: dbMatch.id,
          playerId,
          x: position.x,
          y: position.y,
          result: resultKind,
        }
      });

      const updated = await this._prisma.match.update({
        where: { id: matchId },
        data: {
          currentTurn: nextTurn,
          state: state as any,
        }
      });

      return {
        success: true,
        data: {
          result: resultKind,
          coord: position,
          gameOver: false,
          currentTurn: updated.currentTurn,
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGameState(matchId: string, playerId: string): Promise<any> {
    try {
      if (matchId === 'computer' || matchId.startsWith('computer-')) {
        const actualId = matchId === 'computer' ? undefined : matchId;
        const key = actualId ?? Array.from(this.matches.keys()).find(k => k.startsWith(`computer-${playerId}-`));
        const match = key ? await this.loadAiMatch(key) : undefined;
        if (!match) {
          throw new NotFoundException('Match not found');
        }
        const publicState = { fog: [], board: match.boardA };
        return {
          success: true,
          data: {
            id: match.id,
            status: match.status,
            currentTurn: match.currentTurn,
            playerRole: 'A',
            publicState
          }
        };
      }

      const dbMatch = await this._prisma.match.findUnique({ where: { id: matchId } });
      if (!dbMatch) {
        throw new NotFoundException('Match not found');
      }
      const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
      if (!role) {
        throw new BadRequestException('Player not part of this match');
      }
      const state: any = (dbMatch.state as any) || {};
      const publicState = { lastMove: state.lastMove, phase: state.phase };
      return {
        success: true,
        data: {
          id: dbMatch.id,
          status: dbMatch.status,
          currentTurn: dbMatch.currentTurn,
          playerRole: role,
          publicState
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
