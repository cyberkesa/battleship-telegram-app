import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../infra/prisma.service';

// Temporary simple types for testing
interface MatchState {
  id: string;
  status: string;
  currentTurn: string;
  boardA: any;
  boardB: any;
  winner?: 'A' | 'B' | null;
  lastActionAt?: number;
}



@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private aiStates = new Map<string, any>(); // AI state for computer games
  private matches = new Map<string, MatchState>(); // In-memory matches
  private redis?: Redis;
  private turnTimers = new Map<string, any>();

  private async sleep(ms: number): Promise<void> { return new Promise(res => setTimeout(res, ms)); }

  constructor(private _prisma: PrismaService) {
    // Optional Redis for AI matches persistence across requests/instances
    try {
      const privateUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
      const publicUrl = process.env.REDIS_PUBLIC_URL;
      const chosen = privateUrl || publicUrl;
      if (chosen) {
        const withFamily = chosen.includes('family=') ? chosen : `${chosen}${chosen.includes('?') ? '&' : '?'}family=0`;
        const enableTls = /^(rediss:\/\/)/i.test(withFamily) || /\.proxy\.rlwy\.net$/i.test(new URL(withFamily).hostname);
        this.redis = new Redis(withFamily, {
          tls: enableTls ? {} : undefined,
          name: 'game-ai',
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
          enableOfflineQueue: false,
        });
        this.redis.on('error', (e) => this.logger.warn(`Redis error (game-ai): ${e?.message || e}`));
      }
    } catch (e) {
      this.logger.warn('Failed to initialize Redis for game-ai');
    }
  }

  private async loadAiMatch(id: string): Promise<MatchState | undefined> {
    if (this.matches.has(id)) return this.matches.get(id);
    if (!this.redis) return undefined;
    try {
      const raw = await this.redis.get(`ai:match:${id}`);
      return raw ? (JSON.parse(raw) as MatchState) : undefined;
    } catch {
      return undefined;
    }
  }

  private async saveAiMatch(state: MatchState): Promise<void> {
    this.matches.set(state.id, state);
    if (this.redis) {
      try {
        await this.redis.set(`ai:match:${state.id}`, JSON.stringify(state), 'EX', 60 * 60); // 1h TTL
      } catch {}
    }
  }

  private clearTurnTimer(matchId: string) {
    const t = this.turnTimers.get(matchId);
    if (t) {
      clearTimeout(t);
      this.turnTimers.delete(matchId);
    }
  }

  private scheduleHumanAutoShot(match: MatchState) {
    this.clearTurnTimer(match.id);
    if (match.status !== 'in_progress') return;
    if (match.currentTurn !== 'A') return;
    const now = Date.now();
    const last = match.lastActionAt ?? now;
    const delay = Math.max(0, 5000 - (now - last));
    const t = setTimeout(() => this.handleHumanTimeout(match.id).catch(()=>{}), Math.max(0, delay + 50));
    this.turnTimers.set(match.id, t);
  }

  private async handleHumanTimeout(matchId: string) {
    const match = await this.loadAiMatch(matchId);
    if (!match) return;
    if (match.status !== 'in_progress') return;
    if (match.currentTurn !== 'A') return;
    const now = Date.now();
    const last = match.lastActionAt ?? 0;
    if (now - last < 4950) { // tolerance
      this.scheduleHumanAutoShot(match);
      return;
    }
    // Auto human shot
    const pos = this.pickRandomUntargeted(match.boardB);
    const { hit } = this.applyShot(match.boardB, pos);
    await this.logMoveSafe(match.id, 'A', pos.x, pos.y, hit ? 'hit' : 'miss');
    match.lastActionAt = Date.now();
    if (this.isGameOver(match.boardB)) {
      match.status = 'finished';
      match.winner = 'A';
      await this.saveAiMatch(match);
      this.clearTurnTimer(match.id);
      return;
    }
    if (hit) {
      // Stay on human turn and schedule next shot timeout
      await this.saveAiMatch(match);
      this.scheduleHumanAutoShot(match);
      return;
    }
    // Miss → AI's series turn
    match.currentTurn = 'B';
    await this.aiSeriesTurn(match);
    // After AI finishes, back to human turn and schedule timeout
    match.currentTurn = 'A';
    match.lastActionAt = Date.now();
    await this.saveAiMatch(match);
    if (match.status === 'in_progress') this.scheduleHumanAutoShot(match);
  }

  private async aiSeriesTurn(match: MatchState) {
    // AI keeps shooting until it misses or game over
    while (match.status === 'in_progress' && match.currentTurn === 'B') {
      const aiTarget = this.pickRandomUntargeted(match.boardA);
      const { hit } = this.applyShot(match.boardA, aiTarget);
      await this.logMoveSafe(match.id, 'B', aiTarget.x, aiTarget.y, hit ? 'hit' : 'miss');
      if (this.isGameOver(match.boardA)) {
        match.status = 'finished';
        match.winner = 'B';
        break;
      }
      if (!hit) break; // stop on miss
      // add small delay between consecutive AI shots for UX
      await this.sleep(1000);
    }
  }

  private async logMoveSafe(matchId: string, by: 'A'|'B', x: number, y: number, result: string) {
    try {
      // Prefer DB logging if model exists
      await (this._prisma as any).gameMove?.create?.({
        data: { matchId, playerId: by, x, y, result }
      });
    } catch (e) {
      this.logger.log(`game_move ${matchId} ${by} (${x},${y}) ${result}`);
    }
  }

  // --- Helpers for AI ---
  private generateAiFleet(): any[] {
    // Simple random non-overlapping placement for sizes 4,3,3,2,2,2,1,1,1,1
    const sizes = [4,3,3,2,2,2,1,1,1,1];
    const grid = Array.from({ length: 10 }, () => Array(10).fill(0));
    const ships: any[] = [];
    const fits = (x: number, y: number, len: number, horiz: boolean) => {
      for (let i = 0; i < len; i++) {
        const cx = horiz ? x + i : x;
        const cy = horiz ? y : y + i;
        if (cx < 0 || cy < 0 || cx >= 10 || cy >= 10) return false;
        if (grid[cy][cx] !== 0) return false;
        // no-touch rule: neighbors
        for (let ny = cy - 1; ny <= cy + 1; ny++) {
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx >= 0 && ny >= 0 && nx < 10 && ny < 10 && grid[ny][nx] !== 0) return false;
          }
        }
      }
      return true;
    };
    const place = (x: number, y: number, len: number, horiz: boolean) => {
      for (let i = 0; i < len; i++) {
        const cx = horiz ? x + i : x;
        const cy = horiz ? y : y + i;
        grid[cy][cx] = 1;
      }
    };
    for (const len of sizes) {
      let placed = false;
      for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
        const horiz = Math.random() < 0.5;
        const x = Math.floor(Math.random() * (horiz ? 11 - len : 10));
        const y = Math.floor(Math.random() * (horiz ? 10 : 11 - len));
        if (fits(x, y, len, horiz)) {
          place(x, y, len, horiz);
          ships.push({ bow: { x, y }, length: len, horizontal: horiz });
          placed = true;
        }
      }
      if (!placed) {
        // fallback naive
        ships.push({ bow: { x: 0, y: 0 }, length: len, horizontal: true });
      }
    }
    return ships;
  }

  private applyShot(board: { ships: any[]; hits: string[]; misses: string[] }, pos: { x: number; y: number }): { hit: boolean; sunk: boolean } {
    const key = `${pos.x},${pos.y}`;
    if (!board.hits) board.hits = [];
    if (!board.misses) board.misses = [];
    if (board.hits.includes(key) || board.misses.includes(key)) return { hit: false, sunk: false };
    const hit = board.ships?.some((ship: any) => {
      const cells = Array.from({ length: ship.length }, (_, i) => ship.horizontal ? { x: ship.bow.x + i, y: ship.bow.y } : { x: ship.bow.x, y: ship.bow.y + i });
      return cells.some(c => c.x === pos.x && c.y === pos.y);
    });
    if (hit) board.hits.push(key); else board.misses.push(key);
    // determine if any ship sunk due to this hit
    let sunk = false;
    if (hit) {
      for (const ship of board.ships || []) {
        const cells = Array.from({ length: ship.length }, (_, i) => ship.horizontal ? { x: ship.bow.x + i, y: ship.bow.y } : { x: ship.bow.x, y: ship.bow.y + i });
        const allHit = cells.every(c => board.hits.includes(`${c.x},${c.y}`));
        if (allHit) { sunk = true; break; }
      }
    }
    return { hit, sunk };
  }

  private pickRandomUntargeted(board: { hits: string[]; misses: string[] }): { x: number; y: number } {
    const tried = new Set([...(board.hits || []), ...(board.misses || [])]);
    const candidates: { x: number; y: number }[] = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
      const key = `${x},${y}`;
      if (!tried.has(key)) candidates.push({ x, y });
    }
    if (candidates.length === 0) return { x: 0, y: 0 };
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private buildFog(enemyBoard: { hits: string[]; misses: string[]; ships?: any[] }): string[][] {
    const fog = Array.from({ length: 10 }, () => Array(10).fill('')) as string[][];
    (enemyBoard.hits || []).forEach((k: string) => { const [x, y] = k.split(',').map(Number); fog[y][x] = 'H'; });
    (enemyBoard.misses || []).forEach((k: string) => { const [x, y] = k.split(',').map(Number); fog[y][x] = 'M'; });
    // mark sunk cells as 'S'
    for (const ship of enemyBoard.ships || []) {
      const cells = Array.from({ length: ship.length }, (_, i) => ship.horizontal ? { x: ship.bow.x + i, y: ship.bow.y } : { x: ship.bow.x, y: ship.bow.y + i });
      const allHit = cells.every(c => (enemyBoard.hits || []).includes(`${c.x},${c.y}`));
      if (allHit) {
        // Mark ship cells as sunk
        cells.forEach(c => { fog[c.y][c.x] = 'S'; });
        // Outline around the sunk ship (all surrounding cells)
        const outline = new Set<string>();
        for (const c of cells) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = c.x + dx;
              const ny = c.y + dy;
              if (nx >= 0 && ny >= 0 && nx < 10 && ny < 10) {
                outline.add(`${nx},${ny}`);
              }
            }
          }
        }
        // Remove ship cells from outline, keep only surroundings
        cells.forEach(c => outline.delete(`${c.x},${c.y}`));
        // Apply outline marks if not already hit/sunk/miss
        for (const key of outline) {
          const [nx, ny] = key.split(',').map(Number);
          if (fog[ny][nx] === '') fog[ny][nx] = 'M';
        }
      }
    }
    return fog;
  }

  private isGameOver(board: { ships: any[]; hits: string[] }): boolean {
    const totalCells = (board.ships || []).reduce((acc, ship) => acc + (ship.length || 0), 0);
    return (board.hits || []).length >= totalCells && totalCells > 0;
  }

  async setupBoard(matchId: string, playerId: string, ships: any[]): Promise<any> {
    try {
      // Simple validation for testing
      if (!ships || ships.length === 0) {
        throw new BadRequestException('Ships are required');
      }

      if (matchId === 'computer') {
        // Create new computer game
        const actualMatchId = `computer-${playerId}-${Date.now()}`;
        // Generate AI ships
        const aiShips = this.generateAiFleet();
        const match: MatchState = {
          id: actualMatchId,
          status: 'in_progress',
          currentTurn: 'A',
          boardA: { ships, hits: [], misses: [] },
          boardB: { ships: aiShips, hits: [], misses: [] },
          lastActionAt: Date.now(),
        };
        
        // Store match (persist if Redis available)
        await this.saveAiMatch(match);
        // Schedule human auto-shot timer
        this.scheduleHumanAutoShot(match);
        
        return {
          success: true,
          data: {
            matchId: actualMatchId,
            status: match.status,
            currentTurn: match.currentTurn
          }
        };
      } else {
        // Multiplayer setup
        const dbMatch = await this._prisma.match.findUnique({
          where: { id: matchId }
        });

        if (!dbMatch) {
          throw new NotFoundException('Match not found');
        }

        const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
        if (!role) {
          throw new BadRequestException('Player not part of this match');
        }

        const state: any = (dbMatch.state as any) || { boards: { A: null, B: null }, ready: { A: false, B: false } };
        state.boards = state.boards || { A: null, B: null };
        state.ready = state.ready || { A: false, B: false };
        state.boards[role] = { ships };
        state.ready[role] = true;

        let nextStatus = dbMatch.status;
        let currentTurn = dbMatch.currentTurn;
        if (state.ready.A && state.ready.B) {
          nextStatus = 'in_progress';
          currentTurn = currentTurn || 'A';
          state.phase = 'in_progress';
        } else {
          state.phase = 'placing';
        }

        const updated = await this._prisma.match.update({
          where: { id: matchId },
          data: {
            status: nextStatus,
            currentTurn: currentTurn,
            state: state as any,
          }
        });

        return {
          success: true,
          data: {
            matchId: updated.id,
            status: updated.status,
            currentTurn: updated.currentTurn,
          }
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async makeMove(matchId: string, playerId: string, position: { x: number; y: number }): Promise<any> {
    try {
      if (matchId === 'computer' || matchId.startsWith('computer-')) {
        const actualId = matchId === 'computer' ? undefined : matchId;
        const key = actualId ?? Array.from(this.matches.keys()).find(k => k.startsWith(`computer-${playerId}-`));
        const match = key ? await this.loadAiMatch(key) : undefined;
        if (!match) {
          // Return a not-ready state instead of 404 to avoid breaking UI
          return {
            success: true,
            data: {
              id: actualId || 'computer',
              status: 'in_progress',
              currentTurn: 'A',
              playerRole: 'A',
              publicState: { fog: [], board: null }
            }
          };
        }
        if (match.currentTurn !== 'A') {
          throw new BadRequestException('Not your turn');
        }
        // Human shoots AI board (boardB)
        const { hit: humanHit, sunk: humanSunk } = this.applyShot(match.boardB, position);
        await this.logMoveSafe(match.id, 'A', position.x, position.y, humanHit ? (humanSunk ? 'sunk' : 'hit') : 'miss');
        match.lastActionAt = Date.now();
        // Check game over after human shot
        if (this.isGameOver(match.boardB)) {
          match.status = 'finished';
          match.winner = 'A';
          await this.saveAiMatch(match);
          this.clearTurnTimer(match.id);
          return {
            success: true,
            data: {
              result: humanHit ? (humanSunk ? 'sunk' : 'hit') : 'miss',
              coord: position,
              gameOver: true,
              winner: 'A',
              currentTurn: 'A',
            }
          };
        }
        if (humanHit) {
          // Multi-hit rule: stay on human turn until a miss
          match.currentTurn = 'A';
          await this.saveAiMatch(match);
          this.scheduleHumanAutoShot(match);
          return {
            success: true,
            data: {
              result: humanSunk ? 'sunk' : 'hit',
              coord: position,
              gameOver: false,
              currentTurn: 'A',
            }
          };
        }
        // Human miss → AI takes a series of shots until it misses
        match.currentTurn = 'B';
        await this.aiSeriesTurn(match);
        let gameOver = false;
        let winner: 'A'|'B'|null = null;
        if (this.isGameOver(match.boardA)) { gameOver = true; winner = 'B'; }
        if (this.isGameOver(match.boardB)) { gameOver = true; winner = 'A'; }
        if (gameOver) {
          match.status = 'finished';
          match.winner = winner as any;
        }
        // After AI series (stop on miss or game over)
        if (match.status !== 'finished') {
          match.currentTurn = 'A';
          match.lastActionAt = Date.now();
        }
        await this.saveAiMatch(match);
        if (match.status === 'in_progress') this.scheduleHumanAutoShot(match);
        return {
          success: true,
          data: {
            result: 'miss',
            coord: position,
            gameOver: match.status === 'finished',
            winner: match.winner ?? null,
            currentTurn: match.currentTurn,
          }
        };
      }

      // Multiplayer
      // If not a computer match and not found in-memory, try DB
      const dbMatch = await this._prisma.match.findUnique({ where: { id: matchId } });
      if (!dbMatch) {
        throw new NotFoundException('Match not found');
      }
      const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
      if (!role) {
        throw new BadRequestException('Player not part of this match');
      }
      if (dbMatch.status !== 'in_progress') {
        throw new BadRequestException('Match is not in progress');
      }
      if (dbMatch.currentTurn && dbMatch.currentTurn !== role) {
        throw new BadRequestException('Not your turn');
      }

      const resultKind = 'miss';
      const nextTurn = role === 'A' ? 'B' : 'A';
      const state: any = (dbMatch.state as any) || {};
      state.lastMove = { x: position.x, y: position.y, result: resultKind, by: role };

      await this._prisma.gameMove.create({
        data: {
          matchId: dbMatch.id,
          playerId,
          x: position.x,
          y: position.y,
          result: resultKind,
        }
      });

      const updated = await this._prisma.match.update({
        where: { id: matchId },
        data: {
          currentTurn: nextTurn,
          state: state as any,
        }
      });

      return {
        success: true,
        data: {
          result: resultKind,
          coord: position,
          gameOver: false,
          currentTurn: updated.currentTurn,
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGameState(matchId: string, playerId: string): Promise<any> {
    try {
      if (matchId === 'computer' || matchId.startsWith('computer-')) {
        const actualId = matchId === 'computer' ? undefined : matchId;
        const key = actualId ?? Array.from(this.matches.keys()).find(k => k.startsWith(`computer-${playerId}-`));
        const match = key ? await this.loadAiMatch(key) : undefined;
        if (!match) {
          const fallbackBoard = { ships: [], hits: [], misses: [] };
          return {
            success: true,
            data: {
              id: actualId || `computer-${playerId}`,
              status: 'in_progress',
              currentTurn: 'A',
              playerRole: 'A',
              publicState: { fog: [], board: fallbackBoard }
            }
          };
        }
        const publicState = { fog: this.buildFog(match.boardB), board: match.boardA };
        const winner = match.winner ?? (this.isGameOver(match.boardB) ? 'A' : (this.isGameOver(match.boardA) ? 'B' : null));
        return {
          success: true,
          data: {
            id: match.id,
            status: match.status,
            currentTurn: match.currentTurn,
            playerRole: 'A',
            winner,
            publicState
          }
        };
      }

      const dbMatch = await this._prisma.match.findUnique({ where: { id: matchId } });
      if (!dbMatch) {
        throw new NotFoundException('Match not found');
      }
      const role = playerId === dbMatch.playerAId ? 'A' : playerId === dbMatch.playerBId ? 'B' : null;
      if (!role) {
        throw new BadRequestException('Player not part of this match');
      }
      const state: any = (dbMatch.state as any) || {};
      const publicState = { lastMove: state.lastMove, phase: state.phase };
      return {
        success: true,
        data: {
          id: dbMatch.id,
          status: dbMatch.status,
          currentTurn: dbMatch.currentTurn,
          playerRole: role,
          publicState
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
