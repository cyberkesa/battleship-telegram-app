import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  private aiStates = new Map<string, any>(); // AI state for computer games
  private matches = new Map<string, MatchState>(); // In-memory matches

  constructor(private _prisma: PrismaService) {}

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
        
        // Store match
        this.matches.set(actualMatchId, match);
        
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
      if (matchId.startsWith('computer-')) {
        const match = this.matches.get(matchId);
        if (!match) {
          throw new NotFoundException('Match not found');
        }
        const result = { kind: 'miss', message: 'Move recorded' };
        match.currentTurn = match.currentTurn === 'A' ? 'B' : 'A';
        this.matches.set(matchId, match);
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
      if (matchId.startsWith('computer-')) {
        const match = this.matches.get(matchId);
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
