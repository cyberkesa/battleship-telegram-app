import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { PrismaService } from '../infra/prisma.service';

@Module({
  controllers: [MatchmakingController],
  providers: [MatchmakingService, PrismaService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
