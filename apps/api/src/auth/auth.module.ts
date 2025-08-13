import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../infra/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TelegramAuthService, JwtStrategy, PrismaService],
  exports: [AuthService, TelegramAuthService, JwtStrategy],
})
export class AuthModule {}
