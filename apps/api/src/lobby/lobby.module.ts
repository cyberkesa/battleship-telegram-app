import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller';
import { LobbyService } from './lobby.service';
import { PrismaService } from '../infra/prisma.service';

@Module({
  controllers: [LobbyController],
  providers: [LobbyService, PrismaService],
  exports: [LobbyService],
})
export class LobbyModule {}
