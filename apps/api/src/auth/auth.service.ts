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
        u.id,
        u.tg_id::text as "telegramId",
        u.username,
        COALESCE(u.first_name, u.username, 'Игрок') as "firstName",
        u.last_name as "lastName",
        u.avatar_url as "photoUrl",
        u.created_at as "createdAt",
        u.rating as "rating",
        (
          SELECT COUNT(1)::int 
          FROM matches m 
          WHERE (m.player_a_id = u.id OR m.player_b_id = u.id) AND m.status IN ('IN_PROGRESS','FINISHED')
        ) as "gamesPlayed",
        (
          SELECT COUNT(1)::int 
          FROM matches m2 
          WHERE m2.winner_id = u.id
        ) as "gamesWon"
      FROM users u WHERE u.id = ${numericId} LIMIT 1`;
    } else {
      user = await this._prisma.$queryRaw<any>`SELECT 
        u.id,
        u.tg_id::text as "telegramId",
        u.username,
        COALESCE(u.first_name, u.username, 'Игрок') as "firstName",
        u.last_name as "lastName",
        u.avatar_url as "photoUrl",
        u.created_at as "createdAt",
        u.rating as "rating",
        (
          SELECT COUNT(1)::int 
          FROM matches m 
          WHERE (m.player_a_id = u.id OR m.player_b_id = u.id) AND m.status IN ('IN_PROGRESS','FINISHED')
        ) as "gamesPlayed",
        (
          SELECT COUNT(1)::int 
          FROM matches m2 
          WHERE m2.winner_id = u.id
        ) as "gamesWon"
      FROM users u WHERE u.id = ${String(userId)} LIMIT 1`;
    }
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new UnauthorizedException('User not found');
    }
    return Array.isArray(user) ? user[0] : user;
  }
}
