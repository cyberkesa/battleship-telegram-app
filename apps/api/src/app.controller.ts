import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('api/health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'battleship-api',
      version: '1.0.0'
    };
  }
}
