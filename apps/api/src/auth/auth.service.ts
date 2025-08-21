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

  async getMatchHistory(userId: string | number, limit: number = 20) {
    const uid = Number(userId);
    if (!Number.isFinite(uid)) {
      throw new UnauthorizedException('Invalid user id');
    }
    // Fetch basic match rows where user participated
    const rows: any[] = await this._prisma.$queryRawUnsafe(
      `SELECT 
        m.id as match_id,
        m.status,
        m.created_at,
        m.finished_at,
        m.winner_id,
        CASE WHEN m.player_a_id = $1 THEN m.player_b_id ELSE m.player_a_id END AS opponent_id
      FROM matches m
      WHERE m.player_a_id = $1 OR m.player_b_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2`,
      uid,
      Math.max(1, Math.min(100, limit)),
    );

    if (!rows || rows.length === 0) return [];

    // Load opponents info
    const opponentIds = Array.from(new Set(rows.map(r => Number(r.opponent_id)).filter(Boolean)));
    let opponents: Record<number, any> = {};
    if (opponentIds.length > 0) {
      const users: any[] = await this._prisma.$queryRawUnsafe(
        `SELECT id, username, first_name, last_name, avatar_url FROM users WHERE id = ANY($1)`,
        opponentIds,
      );
      opponents = Object.fromEntries(users.map(u => [Number(u.id), u]));
    }

    // Load move aggregates per match (my/opponent, hit/miss/kill counts)
    const matchIds = rows.map(r => r.match_id);
    const aggregates: any[] = await this._prisma.$queryRawUnsafe(
      `SELECT 
        match_id,
        by_player_id,
        result,
        COUNT(1)::int as cnt
      FROM moves
      WHERE match_id = ANY($1)
      GROUP BY match_id, by_player_id, result`,
      matchIds,
    );

    const aggMap = new Map<string, any>();
    for (const a of aggregates) {
      const key = `${a.match_id}`;
      const entry = aggMap.get(key) || { my: { HIT:0, MISS:0, KILL:0 }, opp: { HIT:0, MISS:0, KILL:0 }, myTotal:0, oppTotal:0 };
      const bucket = Number(a.by_player_id) === uid ? entry.my : entry.opp;
      bucket[a.result] = (bucket[a.result] || 0) + Number(a.cnt);
      if (Number(a.by_player_id) === uid) entry.myTotal += Number(a.cnt); else entry.oppTotal += Number(a.cnt);
      aggMap.set(key, entry);
    }

    return rows.map(r => {
      const opp = opponents[Number(r.opponent_id)] || {};
      const agg = aggMap.get(`${r.match_id}`) || { my:{HIT:0,MISS:0,KILL:0}, opp:{HIT:0,MISS:0,KILL:0}, myTotal:0, oppTotal:0 };
      const startedAt = r.created_at instanceof Date ? r.created_at : new Date(r.created_at);
      const finishedAt = r.finished_at ? (r.finished_at instanceof Date ? r.finished_at : new Date(r.finished_at)) : null;
      const durationSec = finishedAt ? Math.max(0, Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000)) : null;
      return {
        id: String(r.match_id),
        status: r.status,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt ? finishedAt.toISOString() : null,
        durationSec,
        youWon: r.winner_id ? Number(r.winner_id) === uid : null,
        opponent: {
          id: String(r.opponent_id),
          name: [opp.first_name, opp.last_name].filter(Boolean).join(' ') || opp.username || 'Игрок',
          avatar: opp.avatar_url || null,
          username: opp.username || null,
        },
        stats: {
          myMoves: agg.myTotal,
          oppMoves: agg.oppTotal,
          myHits: (agg.my?.HIT || 0) + (agg.my?.KILL || 0),
          oppHits: (agg.opp?.HIT || 0) + (agg.opp?.KILL || 0),
        }
      };
    });
  }
}
