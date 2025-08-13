import { Controller, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

interface JoinQueueRequest {
  mode: 'CLASSIC' | 'RAPID' | 'BLITZ';
}

interface QueueResponse {
  queued: boolean;
  position?: number;
  estimatedWait?: number;
}

@Controller('queue')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('join')
  async joinQueue(@Request() req: any, @Body() body: JoinQueueRequest): Promise<QueueResponse> {
    const userId = req.user.sub;
    return this.matchmakingService.joinQueue(userId, body);
  }

  @Delete('leave/:mode')
  async leaveQueue(@Request() req: any, @Param('mode') mode: string): Promise<QueueResponse> {
    const userId = req.user.sub;
    return this.matchmakingService.leaveQueue(userId, mode);
  }
}
