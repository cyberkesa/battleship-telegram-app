import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly _gameService: GameService) {}

  class PositionDto {
    @IsInt()
    @Min(0)
    @Max(9)
    x!: number;

    @IsInt()
    @Min(0)
    @Max(9)
    y!: number;
  }

  class PlaceFleetDto {
    @IsArray()
    ships!: any[];
  }

  class MoveDto {
    @ValidateNested()
    @Type(() => PositionDto)
    position!: PositionDto;
  }

  // Alias to match checklist: /game/:id/place
  @Post(':matchId/setup')
  async setupBoard(
    @Param('matchId') matchId: string,
    @Body() body: PlaceFleetDto,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.setupBoard(matchId, playerId, body.ships);
  }

  // Alias endpoint for placing fleet
  @Post(':matchId/place')
  async placeFleet(
    @Param('matchId') matchId: string,
    @Body() body: PlaceFleetDto,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.setupBoard(matchId, playerId, body.ships);
  }

  // Alias to match checklist: /game/:id/fire
  @Post(':matchId/move')
  async makeMove(
    @Param('matchId') matchId: string,
    @Body() body: MoveDto,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.makeMove(matchId, playerId, body.position);
  }

  // Alias endpoint for fire
  @Post(':matchId/fire')
  async fire(
    @Param('matchId') matchId: string,
    @Body() body: MoveDto,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.makeMove(matchId, playerId, body.position);
  }

  @Get(':matchId/state')
  async getGameState(
    @Param('matchId') matchId: string,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.getGameState(matchId, playerId);
  }

  // Quick game (computer) setup endpoint
  @Post('quick/setup')
  async quickSetup(
    @Body() body: PlaceFleetDto,
    @Request() req: any
  ) {
    const playerId = req.user.sub;
    return this._gameService.setupBoard('computer', playerId, body.ships);
  }
}
