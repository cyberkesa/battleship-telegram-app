import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthRequest, TelegramUser, ApiResponse } from '@battleship/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyTelegramInitData(initData: string): Promise<TelegramUser> {
    try {
      // Parse initData
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      const userStr = urlParams.get('user');
      
      if (!hash || !userStr) {
        throw new UnauthorizedException('Invalid initData');
      }

      const user: TelegramUser = JSON.parse(userStr);
      
      // Verify hash
      const dataCheckString = Array.from(urlParams.entries())
        .filter(([key]) => key !== 'hash')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(process.env.TELEGRAM_BOT_TOKEN!)
        .digest();

      const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid hash');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Failed to verify initData');
    }
  }

  async authenticateUser(authRequest: AuthRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    try {
      const telegramUser = await this.verifyTelegramInitData(authRequest.initData);
      
      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { telegramId: telegramUser.id }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            telegramId: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
          }
        });
      }

      // Generate JWT token
      const token = this.jwtService.sign({
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username,
      });

      // Store session in Redis
      await this.redis.setUserSession(user.id, {
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username,
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async logout(userId: string): Promise<void> {
    await this.redis.deleteUserSession(userId);
  }
}
