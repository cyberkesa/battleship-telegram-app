import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  @Post('verifyInitData')
  @HttpCode(HttpStatus.OK)
  async verifyInitData(@Body() body: { initData: string }): Promise<any> {
    // Validate input
    if (!body.initData) {
      throw new Error('initData is required');
    }
    
    // Verify Telegram initData
    const telegramData = await this.telegramAuthService.verifyInitData(body.initData);
    
    // Authenticate user
    return this.telegramAuthService.authenticateUser(telegramData);
  }

  @Get('me')
  async getProfile(@Request() req: any) {
    try {
      const user = await this.authService.validateUser(req.user.sub);
      return {
        success: true,
        data: {
          id: user.id,
          telegramId: Number(user.telegramId),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          rating: user.rating,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          createdAt: user.createdAt.toISOString(),
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
