import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class TelegramInitDto { @IsString() initData!: string }

@Controller('auth')
export class AuthController {
  constructor(
    private readonly _authService: AuthService,
    private readonly _telegramAuthService: TelegramAuthService,
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() body: TelegramInitDto): Promise<any> {
    // Validate input
    if (!body.initData) {
      throw new BadRequestException('initData is required');
    }
    
    // Verify Telegram initData
    const telegramData = await this._telegramAuthService.verifyInitData(body.initData);
    
    // Authenticate user
    const result = await this._telegramAuthService.authenticateUser(telegramData);
    return {
      success: true,
      data: {
        token: result.sessionToken,
        user: result.user,
      },
    };
  }

  // Alias to match checklist: /auth/telegram/validate
  @Post('telegram/validate')
  @HttpCode(HttpStatus.OK)
  async validateInitData(@Body() body: TelegramInitDto): Promise<any> {
    if (!body.initData) {
      throw new BadRequestException('initData is required');
    }
    const telegramData = await this._telegramAuthService.verifyInitData(body.initData);
    const result = await this._telegramAuthService.authenticateUser(telegramData);
    return {
      success: true,
      data: {
        token: result.sessionToken,
        user: result.user,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    try {
      const user = await this._authService.validateUser(req.user.sub);
      // Coalesce with JWT payload (verified on this request) to avoid empty names/photos
      const firstName = user.firstName || req.user.firstName || user.username || 'Игрок';
      const lastName = user.lastName || req.user.lastName || null;
      const photoUrl = user.photoUrl || req.user.photoUrl || null;
      return {
        success: true,
        data: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName,
          lastName,
          photoUrl,
          createdAt: user.createdAt.toISOString(),
          rating: user.rating ?? 1000,
          gamesPlayed: user.gamesPlayed ?? 0,
          gamesWon: user.gamesWon ?? 0,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
