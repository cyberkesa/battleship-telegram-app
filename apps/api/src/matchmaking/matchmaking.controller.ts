import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { ApiResponse } from '@battleship/shared-types';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('join')
  async joinQueue(@Request() req: any): Promise<ApiResponse<{ inQueue: boolean }>> {
    return this.matchmakingService.joinQueue(req.user.sub);
  }

  @Post('leave')
  async leaveQueue(@Request() req: any): Promise<ApiResponse<{ left: boolean }>> {
    return this.matchmakingService.leaveQueue(req.user.sub);
  }

  @Get('status')
  async getQueueStatus(@Request() req: any): Promise<ApiResponse<{ inQueue: boolean; queueSize: number }>> {
    return this.matchmakingService.getQueueStatus(req.user.sub);
  }

  @Get('active-match')
  async getActiveMatch(@Request() req: any): Promise<ApiResponse<any>> {
    return this.matchmakingService.getActiveMatch(req.user.sub);
  }
}
