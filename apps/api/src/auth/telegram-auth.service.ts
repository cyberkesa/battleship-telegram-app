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
  photo_url?: string;
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
    photoUrl?: string;
    createdAt: string;
  };
}

@Injectable()
export class TelegramAuthService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  private async fetchTelegramPhotoUrl(telegramId: number): Promise<string | null> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    const apiBase = `https://api.telegram.org/bot${token}`;
    try {
      const photosRes = await fetch(`${apiBase}/getUserProfilePhotos?user_id=${telegramId}&limit=1` as any);
      const photosJson: any = await photosRes.json();
      if (!photosJson?.ok || !photosJson?.result || photosJson.result.total_count === 0) return null;
      const sizes: any[] = photosJson.result.photos?.[0];
      if (!sizes || sizes.length === 0) return null;
      const best = sizes[sizes.length - 1];
      const fileId = best.file_id;
      const fileRes = await fetch(`${apiBase}/getFile?file_id=${fileId}` as any);
      const fileJson: any = await fileRes.json();
      if (!fileJson?.ok || !fileJson?.result?.file_path) return null;
      const filePath: string = fileJson.result.file_path;
      return `https://api.telegram.org/file/bot${token}/${filePath}`;
    } catch {
      return null;
    }
  }

  async verifyInitData(initData: string): Promise<TelegramInitData> {
    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      throw new UnauthorizedException('Invalid initData: missing hash');
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new UnauthorizedException('Server misconfiguration: TELEGRAM_BOT_TOKEN is not set');
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

    // Validate auth_date to prevent replay (allow within 24h)
    const authDateParam = params.get('auth_date');
    if (!authDateParam) {
      throw new UnauthorizedException('Invalid initData: missing auth_date');
    }
    const authDateSec = Number(authDateParam);
    if (!Number.isFinite(authDateSec)) {
      throw new UnauthorizedException('Invalid initData: bad auth_date');
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const maxAgeSec = 24 * 60 * 60; // 24 hours
    if (nowSec - authDateSec > maxAgeSec) {
      throw new UnauthorizedException('initData expired');
    }

    return { initData, user: parsedUser };
  }

  async authenticateUser(telegramData: TelegramInitData): Promise<AuthResponse> {
    const { user } = telegramData;

    // Use raw SQL to match existing DB schema (users: id SERIAL, tg_id BIGINT, first_name, last_name, avatar_url)
    const tgId = BigInt(user.id);

    type Row = { id: number; tg_id: bigint; username: string | null; first_name: string; last_name: string | null; avatar_url: string | null; created_at: Date };
    const existing = await this._prisma.$queryRaw<Row[]>`SELECT id, tg_id, username, first_name, last_name, avatar_url, created_at FROM users WHERE tg_id = ${tgId} LIMIT 1`;

    let row: Row;
    if (existing.length === 0) {
      // Attempt to enrich avatar via Bot API if not provided in initData
      const enrichedPhoto = user.photo_url ?? (await this.fetchTelegramPhotoUrl(Number(tgId))) ?? null;
      const created = await this._prisma.$queryRaw<Row[]>`INSERT INTO users (tg_id, username, first_name, last_name, avatar_url) VALUES (${tgId}, ${user.username ?? null}, ${user.first_name}, ${user.last_name ?? null}, ${enrichedPhoto}) RETURNING id, tg_id, username, first_name, last_name, avatar_url, created_at`;
      row = created[0];
    } else {
      // Keep existing avatar if none provided; try to enrich if still null
      let avatar = user.photo_url ?? existing[0].avatar_url ?? null;
      if (!avatar) {
        avatar = await this.fetchTelegramPhotoUrl(Number(tgId));
      }
      const updated = await this._prisma.$queryRaw<Row[]>`UPDATE users SET username = ${user.username ?? null}, first_name = ${user.first_name}, last_name = ${user.last_name ?? null}, avatar_url = ${avatar ?? null}, updated_at = NOW() WHERE id = ${existing[0].id} RETURNING id, tg_id, username, first_name, last_name, avatar_url, created_at`;
      row = updated[0] || existing[0];
    }

    const payload = {
      sub: row.id,
      telegramId: row.tg_id.toString(),
      username: row.username || undefined,
      photoUrl: row.avatar_url || user.photo_url,
      firstName: row.first_name,
      lastName: row.last_name || undefined,
    };

    const sessionToken = this._jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.JWT_SECRET,
    });

    return {
      sessionToken,
      user: {
        id: String(row.id),
        telegramId: Number(row.tg_id),
        firstName: row.first_name,
        lastName: row.last_name || undefined,
        username: row.username || undefined,
        photoUrl: row.avatar_url || user.photo_url,
        createdAt: row.created_at.toISOString(),
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