import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { LobbyModule } from './lobby/lobby.module';
import { PrismaService } from './infra/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    MatchmakingModule,
    LobbyModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
