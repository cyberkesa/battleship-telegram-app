import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() body: { initData: string }): Promise<any> {
    // Validate input
    if (!body.initData) {
      throw new Error('initData is required');
    }
    
    // Verify Telegram initData
    const telegramData = await this.telegramAuthService.verifyInitData(body.initData);
    
    // Authenticate user
    const result = await this.telegramAuthService.authenticateUser(telegramData);
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
      const user = await this.authService.validateUser(req.user.sub);
      return {
        success: true,
        data: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
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
