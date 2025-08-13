import { Controller, Get, Param, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':gameId/subscribe')
  async subscribeToGame(
    @Param('gameId') gameId: string,
    @Request() req: any,
    @Res() res: Response
  ): Promise<void> {
    const playerId = req.user.sub;
    this.eventsService.subscribeToGame(gameId, playerId, res);
  }
}
