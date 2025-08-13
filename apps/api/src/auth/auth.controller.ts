import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest, ApiResponse } from '@battleship/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async authenticateTelegram(@Body() authRequest: AuthRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.authService.authenticateUser(authRequest);
  }

  @Get('me')
  async getProfile(@Request() req: any): Promise<ApiResponse<any>> {
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
