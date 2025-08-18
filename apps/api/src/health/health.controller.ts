import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const startedAt = Date.now();
    const result: any = {
      api: { ok: true },
      db: { ok: false },
      redis: { ok: false },
      telegram: { configured: Boolean(process.env.TELEGRAM_BOT_TOKEN) },
      jwt: { configured: Boolean(process.env.JWT_SECRET) },
      time: new Date().toISOString(),
    };

    // DB check
    try {
      const t0 = Date.now();
      await this.prisma.$queryRawUnsafe('SELECT 1');
      result.db.ok = true;
      result.db.latencyMs = Date.now() - t0;
    } catch (e: any) {
      result.db.error = e?.message || String(e);
    }

    // Redis check (construct ephemeral client using the same env logic as matchmaking)
    const url = process.env.REDIS_URL || process.env.REDIS_TLS_URL || process.env.REDIS_PUBLIC_URL;
    const host = process.env.REDIS_HOST || process.env.REDISHOST;
    const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : (process.env.REDISPORT ? parseInt(process.env.REDISPORT, 10) : undefined);
    const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD;
    const username = process.env.REDIS_USERNAME || process.env.REDISUSER || 'default';
    let client: Redis | undefined;
    try {
      // Use strict, fast-failing options to avoid long retries during health checks
      const commonOpts: any = {
        name: 'health',
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableReadyCheck: false,
        enableOfflineQueue: false,
        connectTimeout: 1500,
      };
      if (url) {
        let enableTls = false;
        try {
          const u = new URL(url);
          enableTls = u.protocol === 'rediss:' || /\.proxy\.rlwy\.net$/i.test(u.hostname);
        } catch {}
        client = new Redis(url, { ...commonOpts, tls: enableTls ? {} : undefined });
      } else if (host && port) {
        client = new Redis({ host, port, password, username, tls: process.env.REDIS_TLS === '1' ? {} : undefined, ...commonOpts });
      }
      if (client) {
        // Wait briefly for a connection before issuing commands since offlineQueue is disabled
        const connectStart = Date.now();
        await new Promise<void>((resolve, reject) => {
          if (client.status === 'ready' || client.status === 'connect') {
            resolve();
            return;
          }
          const onConnect = () => { cleanup(); resolve(); };
          const onError = (err: any) => { cleanup(); reject(err); };
          const onEnd = () => { cleanup(); reject(new Error('connection ended')); };
          const timer = setTimeout(() => { cleanup(); reject(new Error('connect timeout')); }, 1200);
          const cleanup = () => {
            client.off('connect', onConnect);
            client.off('error', onError);
            client.off('end', onEnd);
            clearTimeout(timer);
          };
          client.once('connect', onConnect);
          client.once('error', onError);
          client.once('end', onEnd);
        });

        const t0 = Date.now();
        const timed = Promise.race([
          client.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PING timeout')), 800)),
        ]);
        const pong = (await timed) as string;
        result.redis.ok = pong === 'PONG';
        result.redis.latencyMs = Date.now() - t0;
      } else {
        result.redis.error = 'Not configured';
      }
    } catch (e: any) {
      result.redis.error = e?.message || String(e);
    } finally {
      try { await client?.quit(); } catch {}
    }

    result.durationMs = Date.now() - startedAt;
    return { success: true, data: result };
  }
}

