import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'battleship-api',
      version: '1.0.0'
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getMetrics(): string {
    const up = 1;
    const ts = Math.floor(Date.now() / 1000);
    return `# HELP battleship_up 1 if the service is up\n# TYPE battleship_up gauge\nbattleship_up ${up} ${ts}\n`;
  }
}
