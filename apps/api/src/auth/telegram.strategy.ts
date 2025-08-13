import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor() {
    super();
  }

  async validate(req: any): Promise<any> {
    // This strategy is used for Telegram Web App authentication
    // The actual validation is done in AuthService.verifyTelegramInitData
    return req.user;
  }
}
