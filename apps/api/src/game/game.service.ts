import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { 
  createMatch, 
  placeFleet, 
  applyMove, 
  validateFleet,
  randomFleet,
  buildShipIndex,
  AILevel,
  createAIState,
  getAIMove,
  updateAIState,
  MatchState
} from '@battleship/game-logic';



@Injectable()
export class GameService {
  private aiStates = new Map<string, any>(); // AI state for computer games
  private matches = new Map<string, MatchState>(); // In-memory matches

  constructor(private _prisma: PrismaService) {}

  async setupBoard(matchId: string, playerId: string, ships: any[]): Promise<any> {
    try {
      // Validate fleet
      const validation = validateFleet(ships as any, false);
      if (!(validation as any).ok) {
        throw new BadRequestException('Invalid fleet layout');
      }

      let match: MatchState;

      if (matchId === 'computer') {
        // Create new computer game
        const actualMatchId = `computer-${playerId}-${Date.now()}`;
        match = createMatch(actualMatchId);
        
        // Place player fleet
        placeFleet(match, 'A', ships as any);
        
        // Generate and place AI fleet
        const aiFleet = randomFleet();
        placeFleet(match, 'B', aiFleet as any);
        
        // Initialize AI state
        const aiState = createAIState(AILevel.Medium);
        this.aiStates.set(actualMatchId, aiState);
        
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

      // In computer games, player is always 'A', AI is 'B'
      const playerRole = 'A';
      
      // Build ship indexes
      const shipIndexA = buildShipIndex(match.boardA.ships as any);
      const shipIndexB = buildShipIndex(match.boardB.ships as any);

      // Apply player move
      const result = applyMove(playerRole, position, match, shipIndexA, shipIndexB);
      
      // Store updated match state
      this.matches.set(matchId, match);

      // If it's a computer game and AI should move
      if (matchId.startsWith('computer-') && match.currentTurn === 'B' && match.status === 'in_progress') {
        // AI move
        const aiState = this.aiStates.get(matchId);
        if (aiState) {
          const aiMove = getAIMove(match.fogForB, aiState);
          const aiResult = applyMove('B', aiMove, match, shipIndexA, shipIndexB);
          updateAIState(aiState, aiMove, aiResult.kind, aiResult.sunkCoords);
          
          // Store updated match state again
          this.matches.set(matchId, match);
        }
      }

      return {
        success: true,
        data: {
          result: result.kind,
          coord: result.coord,
          shipId: result.shipId,
          sunkCoords: result.sunkCoords,
          gameOver: match.status === 'finished',
          winner: match.winner,
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

      // In computer games, player is always 'A'
      const playerRole = 'A';
      
      // Get public state for the player
      const publicState = { 
        fog: match.fogForA, 
        board: match.boardA 
      };

      return {
        success: true,
        data: {
          id: match.id,
          status: match.status,
          currentTurn: match.currentTurn,
          winner: match.winner,
          playerRole,
          publicState,
          turnNo: match.turnNo
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
