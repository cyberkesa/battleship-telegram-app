import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../infra/prisma.service';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramInitData {
  initData: string;
  user: TelegramUser;
}

interface AuthResponse {
  sessionToken: string;
  user: {
    id: string;
    telegramId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    createdAt: string;
  };
}

@Injectable()
export class TelegramAuthService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async verifyInitData(initData: string): Promise<TelegramInitData> {
    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      throw new UnauthorizedException('Invalid initData: missing hash');
    }

    // Remove hash from params for verification
    params.delete('hash');
    
    // Sort parameters alphabetically
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC-SHA256
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();
    
    const calculatedHash = createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid initData: hash verification failed');
    }

    // Extract user data
    const userParam = params.get('user');
    if (!userParam) {
      throw new UnauthorizedException('Invalid initData: missing user');
    }
    const parsedUser = JSON.parse(userParam) as TelegramUser;

    return { initData, user: parsedUser };
  }

  async authenticateUser(telegramData: TelegramInitData): Promise<AuthResponse> {
    const { user } = telegramData;

    // Find or create user
    let dbUser = await this._prisma.user.findUnique({
      where: { telegramId: user.id },
    });

    if (!dbUser) {
      // Create new user
      dbUser = await this._prisma.user.create({
        data: {
          telegramId: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
        },
      });
    } else {
      // Update existing user info
      dbUser = await this._prisma.user.update({
        where: { id: dbUser.id },
        data: {
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
        },
      });
    }

    // Generate JWT token
    const payload = {
      sub: dbUser.id,
      telegramId: dbUser.telegramId.toString(),
      username: dbUser.username,
    };

    const sessionToken = this._jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.JWT_SECRET,
    });

    return {
      sessionToken,
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        username: dbUser.username,
        createdAt: dbUser.createdAt.toISOString(),
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this._jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      
      // Check if user still exists
      const user = await this._prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
