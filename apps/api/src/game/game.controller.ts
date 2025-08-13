import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiResponse, Position } from '@battleship/shared-types';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post(':matchId/setup')
  async setupBoard(
    @Param('matchId') matchId: string,
    @Body() body: { ships: any[] },
    @Request() req: any
  ): Promise<ApiResponse<any>> {
    return this.gameService.setupBoard(matchId, req.user.sub, body.ships);
  }

  @Post(':matchId/move')
  async makeMove(
    @Param('matchId') matchId: string,
    @Body() body: { position: Position },
    @Request() req: any
  ): Promise<ApiResponse<any>> {
    return this.gameService.makeMove(matchId, req.user.sub, body.position);
  }

  @Get(':matchId/state')
  async getGameState(
    @Param('matchId') matchId: string,
    @Request() req: any
  ): Promise<ApiResponse<any>> {
    return this.gameService.getGameState(matchId, req.user.sub);
  }
}
