import {
  createMatch,
  placeFleet,
  applyMove,
  buildShipIndex,
  getPublicState,
  GameLogicError,
  GameError,
  MatchState,
  PlayerRole,
  Coord
} from '../index';

// Пример интеграции с сервером (NestJS/Express)

interface MoveRequest {
  matchId: string;
  player: PlayerRole;
  coord: Coord;
  idempotencyKey: string;
}

interface PlaceRequest {
  matchId: string;
  player: PlayerRole;
  fleet: any[];
}

// Сервис для управления матчами
export class MatchService {
  protected matches = new Map<string, MatchState>();
  private moveResults = new Map<string, any>(); // idempotencyKey -> result

  // Создание нового матча
  createMatch(matchId: string, rules?: any): MatchState {
    const match = createMatch(matchId, rules);
    this.matches.set(matchId, match);
    return match;
  }

  // Размещение флота
  placeFleet(request: PlaceRequest): void {
    const match = this.matches.get(request.matchId);
    if (!match) {
      throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Match not found');
    }

    try {
      placeFleet(match, request.player, request.fleet);
      this.matches.set(request.matchId, match);
    } catch (error) {
      if (error instanceof GameLogicError) {
        throw error;
      }
      throw new GameLogicError(GameError.INVALID_LAYOUT, 'Invalid fleet placement');
    }
  }

  // Выполнение хода с идемпотентностью
  makeMove(request: MoveRequest): any {
    const match = this.matches.get(request.matchId);
    if (!match) {
      throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Match not found');
    }

    // Проверка идемпотентности
    const idempotencyKey = `${request.matchId}:${request.player}:${request.idempotencyKey}`;
    if (this.moveResults.has(idempotencyKey)) {
      return this.moveResults.get(idempotencyKey);
    }

    try {
      // Построение индексов кораблей
      const shipIndexA = buildShipIndex(match.boardA.ships);
      const shipIndexB = buildShipIndex(match.boardB.ships);

      // Выполнение хода
      const result = applyMove(request.player, request.coord, match, shipIndexA, shipIndexB);

      // Сохранение результата для идемпотентности
      this.moveResults.set(idempotencyKey, result);
      this.matches.set(request.matchId, match);

      return result;
    } catch (error) {
      if (error instanceof GameLogicError) {
        throw error;
      }
      throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Move failed');
    }
  }

  // Получение публичного состояния для игрока
  getPublicState(matchId: string, player: PlayerRole): any {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Match not found');
    }

    return getPublicState(match, player);
  }

  // Получение полного состояния матча (для админов)
  getMatchState(matchId: string): MatchState | undefined {
    return this.matches.get(matchId);
  }

  // Очистка завершенных матчей
  cleanupFinishedMatches(): void {
    for (const [matchId, match] of this.matches.entries()) {
      if (match.status === 'finished') {
        // Можно добавить логику сохранения в БД
        this.matches.delete(matchId);
      }
    }
  }
}

// Пример контроллера (NestJS)
export class MatchController {
  constructor(private matchService: MatchService) {}

  // POST /matches
  createMatch(req: any, res: any) {
    try {
      const { id, rules } = req.body;
      const match = this.matchService.createMatch(id, rules);
      
      res.status(201).json({
        success: true,
        data: {
          id: match.id,
          status: match.status,
          rules: match.rules
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /matches/:id/place
  placeFleet(req: any, res: any) {
    try {
      const { id } = req.params;
      const { player, fleet } = req.body;

      this.matchService.placeFleet({ matchId: id, player, fleet });

      res.json({
        success: true,
        message: 'Fleet placed successfully'
      });
    } catch (error) {
      if (error instanceof GameLogicError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR'
        });
      }
    }
  }

  // POST /matches/:id/move
  makeMove(req: any, res: any) {
    try {
      const { id } = req.params;
      const { player, coord, idempotencyKey } = req.body;

      const result = this.matchService.makeMove({
        matchId: id,
        player,
        coord,
        idempotencyKey
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof GameLogicError) {
        const statusCode = this.getErrorStatusCode(error.code);
        res.status(statusCode).json({
          success: false,
          error: error.code,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR'
        });
      }
    }
  }

  // GET /matches/:id/state
  getMatchState(req: any, res: any) {
    try {
      const { id } = req.params;
      const { player } = req.query;

      const state = this.matchService.getPublicState(id, player);
      
      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'MATCH_NOT_FOUND'
      });
    }
  }

  // Приватный метод для определения HTTP статуса ошибки
  private getErrorStatusCode(errorCode: string): number {
    switch (errorCode) {
      case GameError.INVALID_LAYOUT:
      case GameError.ALREADY_FIRED:
      case GameError.OUT_OF_BOUNDS:
        return 400;
      case GameError.NOT_YOUR_TURN:
        return 403;
      case GameError.MATCH_NOT_IN_PROGRESS:
        return 409;
      case GameError.INVITE_CONSUMED:
      case GameError.INVITE_EXPIRED:
        return 410;
      case GameError.RATE_LIMIT:
        return 429;
      default:
        return 500;
    }
  }
}

// Пример использования с Redis для идемпотентности
export class RedisMatchService extends MatchService {
  constructor(private redis: any) {
    super();
  }

  async makeMove(request: MoveRequest): Promise<any> {
    const match = this.matches.get(request.matchId);
    if (!match) {
      throw new GameLogicError(GameError.MATCH_NOT_IN_PROGRESS, 'Match not found');
    }

    // Redis-лок для предотвращения гонок
    const lockKey = `match:${request.matchId}:turn`;
    const lockValue = Date.now().toString();
    
    const acquired = await this.redis.set(lockKey, lockValue, 'PX', 5000, 'NX');
    if (!acquired) {
      throw new GameLogicError(GameError.RATE_LIMIT, 'Too many concurrent requests');
    }

    try {
      // Проверка идемпотентности в Redis
      const idempotencyKey = `${request.matchId}:${request.player}:${request.idempotencyKey}`;
      const existingResult = await this.redis.get(idempotencyKey);
      
      if (existingResult) {
        return JSON.parse(existingResult);
      }

      // Выполнение хода
      const shipIndexA = buildShipIndex(match.boardA.ships);
      const shipIndexB = buildShipIndex(match.boardB.ships);
      const result = applyMove(request.player, request.coord, match, shipIndexA, shipIndexB);

      // Сохранение результата в Redis (TTL 1 час)
      await this.redis.setex(idempotencyKey, 3600, JSON.stringify(result));
      this.matches.set(request.matchId, match);

      return result;
    } finally {
      // Освобождение лока
      await this.redis.del(lockKey);
    }
  }
}

// Пример воркера для обработки таймеров
export class TimerWorker {
  constructor(private matchService: MatchService) {}

  async processTimeouts(): Promise<void> {
    // const now = Date.now();
    
    for (const [matchId, match] of this.matchService['matches'].entries()) {
      if (match.status === 'in_progress' && match.currentTurn) {
        // Здесь должна быть логика проверки дедлайнов
        // Например, если turnDeadline < now, то автопропуск
        console.log(`Checking timeout for match ${matchId}`);
      }
    }
  }

  start(): void {
    // Проверка каждые 2 секунды
    setInterval(() => {
      this.processTimeouts();
    }, 2000);
  }
}

// Пример SSE (Server-Sent Events) для уведомлений
export class SSEService {
  private clients = new Map<string, any[]>();

  addClient(matchId: string, client: any): void {
    if (!this.clients.has(matchId)) {
      this.clients.set(matchId, []);
    }
    this.clients.get(matchId)!.push(client);
  }

  removeClient(matchId: string, client: any): void {
    const clients = this.clients.get(matchId);
    if (clients) {
      const index = clients.indexOf(client);
      if (index > -1) {
        clients.splice(index, 1);
      }
    }
  }

  notifyMatch(matchId: string, event: string, data: any): void {
    const clients = this.clients.get(matchId);
    if (clients) {
      const message = `data: ${JSON.stringify({ event, data })}\n\n`;
      clients.forEach(client => {
        client.write(message);
      });
    }
  }
}
