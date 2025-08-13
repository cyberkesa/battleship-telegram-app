import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { createMatch } from '@battleship/game-logic';
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
  constructor(private readonly prisma: PrismaService) {}

  async createLobby(data: { playerId: string; playerName: string; playerAvatar?: string }): Promise<Lobby> {
    const lobbyId = randomUUID();
    const inviteLink = `${process.env.FRONTEND_URL}/lobby/${lobbyId}`;

    const lobby = await this.prisma.lobby.create({
      data: {
        id: lobbyId,
        status: 'waiting',
        inviteLink,
        players: {
          create: {
            id: data.playerId,
            name: data.playerName,
            avatar: data.playerAvatar,
            isReady: false,
            isHost: true,
          },
        },
      },
      include: {
        players: true,
      },
    });

    return {
      id: lobby.id,
      status: lobby.status as any,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
      })),
      inviteLink: lobby.inviteLink,
      createdAt: lobby.createdAt,
    };
  }

  async joinLobby(data: { lobbyId: string; playerId: string; playerName: string; playerAvatar?: string }): Promise<Lobby> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: data.lobbyId },
      include: { players: true },
    });

    if (!lobby) {
      throw new NotFoundException('Лобби не найдено');
    }

    if (lobby.status !== 'waiting') {
      throw new BadRequestException('Лобби уже заполнено или игра началась');
    }

    if (lobby.players.length >= 2) {
      throw new BadRequestException('Лобби уже заполнено');
    }

    if (lobby.players.some(p => p.id === data.playerId)) {
      throw new BadRequestException('Вы уже в этом лобби');
    }

    const updatedLobby = await this.prisma.lobby.update({
      where: { id: data.lobbyId },
      data: {
        players: {
          create: {
            id: data.playerId,
            name: data.playerName,
            avatar: data.playerAvatar,
            isReady: false,
            isHost: false,
          },
        },
      },
      include: { players: true },
    });

    return {
      id: updatedLobby.id,
      status: updatedLobby.status as any,
      players: updatedLobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
      })),
      inviteLink: updatedLobby.inviteLink,
      createdAt: updatedLobby.createdAt,
    };
  }

  async getLobbyStatus(lobbyId: string): Promise<Lobby> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { players: true },
    });

    if (!lobby) {
      throw new NotFoundException('Лобби не найдено');
    }

    return {
      id: lobby.id,
      status: lobby.status as any,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
      })),
      inviteLink: lobby.inviteLink,
      createdAt: lobby.createdAt,
      matchId: lobby.matchId,
    };
  }

  async setPlayerReady(lobbyId: string, playerId: string): Promise<Lobby> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { players: true },
    });

    if (!lobby) {
      throw new NotFoundException('Лобби не найдено');
    }

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      throw new NotFoundException('Игрок не найден в лобби');
    }

    // Обновляем статус готовности игрока
    await this.prisma.lobbyPlayer.update({
      where: { id: player.id },
      data: { isReady: true },
    });

    // Проверяем, готовы ли все игроки
    const updatedLobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { players: true },
    });

    const allReady = updatedLobby.players.every(p => p.isReady);
    
    if (allReady && updatedLobby.players.length === 2) {
      // Создаем матч
      const match = createMatch({
        playerA: { id: updatedLobby.players[0].id, name: updatedLobby.players[0].name },
        playerB: { id: updatedLobby.players[1].id, name: updatedLobby.players[1].name },
      });

      // Сохраняем матч в БД
      const savedMatch = await this.prisma.match.create({
        data: {
          id: match.id,
          status: match.status,
          playerAId: match.playerA.id,
          playerBId: match.playerB.id,
          currentTurn: match.currentTurn,
          rules: match.rules,
          state: match as any,
        },
      });

      // Обновляем статус лобби
      await this.prisma.lobby.update({
        where: { id: lobbyId },
        data: {
          status: 'playing',
          matchId: savedMatch.id,
        },
      });

      return {
        id: updatedLobby.id,
        status: 'playing',
        players: updatedLobby.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isReady: p.isReady,
          isHost: p.isHost,
        })),
        inviteLink: updatedLobby.inviteLink,
        createdAt: updatedLobby.createdAt,
        matchId: savedMatch.id,
      };
    }

    return {
      id: updatedLobby.id,
      status: updatedLobby.status as any,
      players: updatedLobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
      })),
      inviteLink: updatedLobby.inviteLink,
      createdAt: updatedLobby.createdAt,
    };
  }

  async leaveLobby(lobbyId: string, playerId: string): Promise<void> {
    const lobby = await this.prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { players: true },
    });

    if (!lobby) {
      throw new NotFoundException('Лобби не найдено');
    }

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      throw new NotFoundException('Игрок не найден в лобби');
    }

    // Удаляем игрока из лобби
    await this.prisma.lobbyPlayer.delete({
      where: { id: player.id },
    });

    // Если лобби пустое, удаляем его
    const remainingPlayers = await this.prisma.lobbyPlayer.count({
      where: { lobbyId },
    });

    if (remainingPlayers === 0) {
      await this.prisma.lobby.delete({
        where: { id: lobbyId },
      });
    }
  }
}
