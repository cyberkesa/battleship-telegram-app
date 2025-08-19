import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class CreateLobbyDto {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
}

export class JoinLobbyDto {
  lobbyId: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
}

export class LobbyStatusDto {
  lobbyId: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  players: {
    id: string;
    name: string;
    avatar?: string;
    isReady: boolean;
    isHost: boolean;
  }[];
  inviteLink: string;
  createdAt: Date;
}

@Controller('lobby')
export class LobbyController {
  constructor(private readonly _lobbyService: LobbyService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createLobby(@Body() createLobbyDto: CreateLobbyDto, @Request() req) {
    // Ensure playerName fallback
    const safeName = createLobbyDto.playerName || req.user.firstName || req.user.username || 'Игрок';
    const lobby = await this._lobbyService.createLobby({
      ...createLobbyDto,
      playerId: req.user.sub,
      playerName: safeName,
    });
    return lobby;
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinLobby(@Body() joinLobbyDto: JoinLobbyDto, @Request() req) {
    const lobby = await this._lobbyService.joinLobby({
      ...joinLobbyDto,
      playerId: req.user.sub,
    });
    return lobby;
  }

  @Get(':lobbyId')
  @UseGuards(JwtAuthGuard)
  async getLobbyStatus(@Param('lobbyId') lobbyId: string) {
    const lobby = await this._lobbyService.getLobbyStatus(lobbyId);
    return lobby;
  }

  @Post(':lobbyId/ready')
  @UseGuards(JwtAuthGuard)
  async setPlayerReady(@Param('lobbyId') lobbyId: string, @Request() req) {
    const lobby = await this._lobbyService.setPlayerReady(lobbyId, req.user.sub);
    return lobby;
  }

  @Post(':lobbyId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveLobby(@Param('lobbyId') lobbyId: string, @Request() req) {
    await this._lobbyService.leaveLobby(lobbyId, req.user.sub);
    return { success: true };
  }
}
