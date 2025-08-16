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
        // Handle regular multiplayer game
        const dbMatch = await this._prisma.match.findUnique({
          where: { id: matchId }
        });

        if (!dbMatch) {
          throw new NotFoundException('Match not found');
        }

        // TODO: Implement multiplayer setup logic
        throw new BadRequestException('Multiplayer setup not implemented yet');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async makeMove(matchId: string, _playerId: string, position: { x: number; y: number }): Promise<any> {
    try {
      const match = this.matches.get(matchId);
      if (!match) {
        throw new NotFoundException('Match not found');
      }

      // Simple move logic for testing
      const result = {
        kind: 'miss',
        message: 'Move recorded'
      };
      
      // Toggle turn
      match.currentTurn = match.currentTurn === 'A' ? 'B' : 'A';
      
      // Store updated match state
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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGameState(matchId: string, _playerId: string): Promise<any> {
    try {
      const match = this.matches.get(matchId);
      if (!match) {
        throw new NotFoundException('Match not found');
      }

      // Simple state for testing
      const publicState = { 
        fog: [],
        board: match.boardA 
      };

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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
