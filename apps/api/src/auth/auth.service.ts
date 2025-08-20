import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../infra/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async validateUser(userId: string | number) {
    // Support numeric IDs for legacy integer PKs
    const numericId = Number(userId);
    let user: any[];
    if (Number.isFinite(numericId)) {
      user = await this._prisma.$queryRaw<any>`SELECT 
        id,
        tg_id::text as "telegramId",
        username,
        COALESCE(first_name, username, 'Игрок') as "firstName",
        last_name as "lastName",
        avatar_url as "photoUrl",
        created_at as "createdAt"
      FROM users WHERE id = ${numericId} LIMIT 1`;
    } else {
      user = await this._prisma.$queryRaw<any>`SELECT 
        id,
        tg_id::text as "telegramId",
        username,
        COALESCE(first_name, username, 'Игрок') as "firstName",
        last_name as "lastName",
        avatar_url as "photoUrl",
        created_at as "createdAt"
      FROM users WHERE id = ${String(userId)} LIMIT 1`;
    }
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new UnauthorizedException('User not found');
    }
    return Array.isArray(user) ? user[0] : user;
  }
}
