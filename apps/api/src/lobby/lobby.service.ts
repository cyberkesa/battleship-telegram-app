import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { randomUUID } from 'crypto';

export interface LobbyPlayer {
	id: string;
	name: string;
	avatar?: string;
	isReady: boolean;
	isHost: boolean;
}

export interface Lobby {
	id: string;
	status: 'waiting' | 'ready' | 'playing' | 'finished';
	players: LobbyPlayer[];
	inviteLink: string;
	createdAt: Date;
	matchId?: string;
}

@Injectable()
export class LobbyService {
	constructor(private readonly _prisma: PrismaService) {}

	async createLobby(data: { playerId: string; playerName: string; playerAvatar?: string }): Promise<Lobby> {
		const lobbyId = randomUUID();
		const rawBotUsername = process.env.TELEGRAM_BOT_USERNAME;
		const botUsername = rawBotUsername?.startsWith('@') ? rawBotUsername.slice(1) : rawBotUsername;
		const inviteLink = botUsername
			? `https://t.me/${botUsername}?startapp=${encodeURIComponent(`join:${lobbyId}`)}`
			: `${process.env.FRONTEND_URL}/lobby/${lobbyId}`;

		await this._prisma.$executeRawUnsafe(
			`INSERT INTO lobbies (id, status, invite_link, updated_at) VALUES ($1, $2, $3, NOW())`,
			lobbyId,
			'waiting',
			inviteLink,
		);

		await this._prisma.$executeRawUnsafe(
			`INSERT INTO lobby_players (lobby_id, player_id, name, avatar, is_ready, is_host) VALUES ($1, $2, $3, $4, $5, $6)`,
			lobbyId,
			Number(data.playerId) || data.playerId,
			data.playerName,
			data.playerAvatar ?? null,
			false,
			true,
		);

		const rows: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT l.id, l.status, l.invite_link, l.created_at, lp.player_id, lp.name, lp.avatar, lp.is_ready, lp.is_host
			 FROM lobbies l LEFT JOIN lobby_players lp ON lp.lobby_id = l.id WHERE l.id = $1`,
			lobbyId,
		);
		const players = rows.map(r => ({
			id: String(r.player_id),
			name: r.name,
			avatar: r.avatar ?? undefined,
			isReady: !!r.is_ready,
			isHost: !!r.is_host,
		}));
		return {
			id: String(lobbyId),
			status: rows[0]?.status || 'waiting',
			players,
			inviteLink: rows[0]?.invite_link || inviteLink,
			createdAt: rows[0]?.created_at || new Date(),
		};
	}

	async joinLobby(data: { lobbyId: string; playerId: string; playerName: string; playerAvatar?: string }): Promise<Lobby> {
		const lobbyRows: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT id, status, invite_link, created_at FROM lobbies WHERE id = $1`,
			data.lobbyId,
		);
		if (lobbyRows.length === 0) throw new NotFoundException('Лобби не найдено');
		if (lobbyRows[0].status !== 'waiting') throw new BadRequestException('Лобби уже заполнено или игра началась');

		const countRows: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT COUNT(*)::int as cnt FROM lobby_players WHERE lobby_id = $1`,
			data.lobbyId,
		);
		if (countRows[0].cnt >= 2) throw new BadRequestException('Лобби уже заполнено');

		const exists: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT 1 FROM lobby_players WHERE lobby_id = $1 AND player_id = $2 LIMIT 1`,
			data.lobbyId,
			Number(data.playerId),
		);
		if (exists.length > 0) throw new BadRequestException('Вы уже в этом лобби');

		const userRow: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT first_name, last_name, avatar_url FROM users WHERE id = $1`,
			Number(data.playerId),
		);
		const playerName = data.playerName || `${userRow[0]?.first_name ?? 'Игрок'}${userRow[0]?.last_name ? ' ' + userRow[0].last_name : ''}`.trim();
		const playerAvatar = data.playerAvatar || userRow[0]?.avatar_url || null;

		await this._prisma.$executeRawUnsafe(
			`INSERT INTO lobby_players (lobby_id, player_id, name, avatar, is_ready, is_host) VALUES ($1, $2, $3, $4, $5, $6)`,
			data.lobbyId,
			Number(data.playerId),
			playerName,
			playerAvatar,
			false,
			false,
		);

		const rows: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT l.id, l.status, l.invite_link, l.created_at, lp.player_id, lp.name, lp.avatar, lp.is_ready, lp.is_host
			 FROM lobbies l LEFT JOIN lobby_players lp ON lp.lobby_id = l.id WHERE l.id = $1`,
			data.lobbyId,
		);
		const players = rows.map(r => ({
			id: String(r.player_id),
			name: r.name,
			avatar: r.avatar ?? undefined,
			isReady: !!r.is_ready,
			isHost: !!r.is_host,
		}));
		return {
			id: String(rows[0].id),
			status: rows[0].status,
			players,
			inviteLink: rows[0].invite_link,
			createdAt: rows[0].created_at,
		};
	}

	async getLobbyStatus(lobbyId: string): Promise<Lobby> {
		const rows: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT l.id, l.status, l.invite_link, l.created_at, lp.player_id, lp.name, lp.avatar, lp.is_ready, lp.is_host
			 FROM lobbies l LEFT JOIN lobby_players lp ON lp.lobby_id = l.id WHERE l.id = $1`,
			lobbyId,
		);
		if (rows.length === 0) throw new NotFoundException('Лобби не найдено');
		const players = rows.map(r => ({
			id: String(r.player_id),
			name: r.name,
			avatar: r.avatar ?? undefined,
			isReady: !!r.is_ready,
			isHost: !!r.is_host,
		}));
		return {
			id: String(rows[0].id),
			status: rows[0].status,
			players,
			inviteLink: rows[0].invite_link,
			createdAt: rows[0].created_at,
		};
	}

	async setPlayerReady(lobbyId: string, playerId: string): Promise<Lobby> {
		await this._prisma.$executeRawUnsafe(
			`UPDATE lobby_players SET is_ready = TRUE WHERE lobby_id = $1 AND player_id = $2`,
			lobbyId,
			Number(playerId),
		);
		return this.getLobbyStatus(lobbyId);
	}

	async leaveLobby(lobbyId: string, playerId: string): Promise<void> {
		const res: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT id FROM lobby_players WHERE lobby_id = $1 AND player_id = $2 LIMIT 1`,
			lobbyId,
			Number(playerId),
		);
		if (res.length === 0) throw new NotFoundException('Игрок не найден в лобби');
		await this._prisma.$executeRawUnsafe(`DELETE FROM lobby_players WHERE id = $1`, res[0].id);
		const remain: any[] = await this._prisma.$queryRawUnsafe(
			`SELECT COUNT(*)::int as cnt FROM lobby_players WHERE lobby_id = $1`,
			lobbyId,
		);
		if (remain[0].cnt === 0) {
			await this._prisma.$executeRawUnsafe(`DELETE FROM lobbies WHERE id = $1`, lobbyId);
		}
	}
}

