import { Controller, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface JoinQueueRequest {
  mode: 'CLASSIC' | 'RAPID' | 'BLITZ';
}

interface QueueResponse {
  queued: boolean;
  position?: number;
  estimatedWait?: number;
}

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly _matchmakingService: MatchmakingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async joinQueue(@Request() req: any, @Body() body: Partial<JoinQueueRequest> = {}): Promise<QueueResponse> {
    const userId = req.user.sub as string;
    const mode = (body.mode ?? 'CLASSIC') as JoinQueueRequest['mode'];
    return this._matchmakingService.joinQueue(userId, { mode });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('leave/:mode')
  async leaveQueue(@Request() req: any, @Param('mode') mode: string): Promise<QueueResponse> {
    const userId = req.user.sub as string;
    return this._matchmakingService.leaveQueue(userId, mode);
  }

  // Alias to match checklist naming: /matchmaking/cancel
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancel(@Request() req: any, @Body() body: Partial<JoinQueueRequest> = {}): Promise<QueueResponse> {
    const userId = req.user.sub as string;
    const mode = (body.mode ?? 'CLASSIC') as JoinQueueRequest['mode'];
    return this._matchmakingService.leaveQueue(userId, mode);
  }
}
