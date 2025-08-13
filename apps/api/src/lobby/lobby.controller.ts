import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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

@ApiTags('lobby')
@Controller('lobby')
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать новое лобби' })
  @ApiResponse({ status: 201, description: 'Лобби создано', type: LobbyStatusDto })
  async createLobby(@Body() createLobbyDto: CreateLobbyDto, @Request() req) {
    const lobby = await this.lobbyService.createLobby({
      ...createLobbyDto,
      playerId: req.user.id,
    });
    return lobby;
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Присоединиться к лобби' })
  @ApiResponse({ status: 200, description: 'Успешно присоединились', type: LobbyStatusDto })
  async joinLobby(@Body() joinLobbyDto: JoinLobbyDto, @Request() req) {
    const lobby = await this.lobbyService.joinLobby({
      ...joinLobbyDto,
      playerId: req.user.id,
    });
    return lobby;
  }

  @Get(':lobbyId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Получить статус лобби' })
  @ApiResponse({ status: 200, description: 'Статус лобби', type: LobbyStatusDto })
  async getLobbyStatus(@Param('lobbyId') lobbyId: string) {
    const lobby = await this.lobbyService.getLobbyStatus(lobbyId);
    return lobby;
  }

  @Post(':lobbyId/ready')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Отметить игрока как готового' })
  @ApiResponse({ status: 200, description: 'Статус обновлен', type: LobbyStatusDto })
  async setPlayerReady(@Param('lobbyId') lobbyId: string, @Request() req) {
    const lobby = await this.lobbyService.setPlayerReady(lobbyId, req.user.id);
    return lobby;
  }

  @Post(':lobbyId/leave')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Покинуть лобби' })
  @ApiResponse({ status: 200, description: 'Успешно покинули лобби' })
  async leaveLobby(@Param('lobbyId') lobbyId: string, @Request() req) {
    await this.lobbyService.leaveLobby(lobbyId, req.user.id);
    return { success: true };
  }
}
