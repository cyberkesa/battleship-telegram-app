import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Enable CORS (permit from Telegram WebApp + Vercel + localhost)
  app.enableCors({
    origin: (origin, cb) => {
      // Allow non-browser requests (no Origin) and all origins for now
      if (!origin) return cb(null, true);
      const allowed = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URLS, // comma-separated list
        'http://localhost:5173',
      ]
        .filter(Boolean)
        .join(',');
      if (!allowed) return cb(null, true);
      const origins = allowed.split(',').map(s => s.trim());
      const ok = origins.some(o => o && origin.startsWith(o));
      return cb(null, ok);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 API server running on port ${port}`);
}

bootstrap();
