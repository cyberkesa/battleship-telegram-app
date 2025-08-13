import {
  Position,
  Ship,
  Board,
  GameState,
  Player,
  GameStatus,
  CellState,
  ShipType,
  GameEvent,
  GameEventType
} from '@battleship/shared-types';

export class BattleshipGame {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  // Создание новой игры
  static createGame(playerA: Player, playerB: Player): GameState {
    return {
      id: crypto.randomUUID(),
      status: GameStatus.SETTING_UP,
      playerA,
      playerB,
      currentTurn: null,
      winner: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Проверка валидности расстановки кораблей
  static validateShipPlacement(board: Board): boolean {
    const ships = board.ships;
    
    // Проверяем количество кораблей
    const shipCounts = {
      [ShipType.CARRIER]: 1,
      [ShipType.BATTLESHIP]: 1,
      [ShipType.CRUISER]: 1,
      [ShipType.SUBMARINE]: 1,
      [ShipType.DESTROYER]: 1
    };

    const actualCounts: Record<number, number> = {};
    ships.forEach(ship => {
      actualCounts[ship.size] = (actualCounts[ship.size] || 0) + 1;
    });

    // Проверяем количество
    for (const [size, count] of Object.entries(shipCounts)) {
      if (actualCounts[parseInt(size)] !== count) {
        return false;
      }
    }

    // Проверяем, что корабли не пересекаются
    const allPositions: Position[] = [];
    for (const ship of ships) {
      for (const pos of ship.positions) {
        if (allPositions.some(p => p.x === pos.x && p.y === pos.y)) {
          return false;
        }
        allPositions.push(pos);
      }
    }

    // Проверяем, что корабли в пределах поля
    for (const pos of allPositions) {
      if (pos.x < 0 || pos.x >= 10 || pos.y < 0 || pos.y >= 10) {
        return false;
      }
    }

    return true;
  }

  // Проверка, что корабли расположены правильно (горизонтально или вертикально)
  static validateShipShape(ship: Ship): boolean {
    if (ship.positions.length !== ship.size) {
      return false;
    }

    const positions = ship.positions;
    const isHorizontal = positions.every((pos, i) => 
      i === 0 || pos.y === positions[0].y
    );
    const isVertical = positions.every((pos, i) => 
      i === 0 || pos.x === positions[0].x
    );

    if (!isHorizontal && !isVertical) {
      return false;
    }

    // Проверяем, что позиции идут подряд
    if (isHorizontal) {
      const sorted = positions.sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].x !== sorted[i-1].x + 1) {
          return false;
        }
      }
    } else {
      const sorted = positions.sort((a, b) => a.y - b.y);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y !== sorted[i-1].y + 1) {
          return false;
        }
      }
    }

    return true;
  }

  // Выполнение хода
  makeMove(playerId: string, position: Position): { hit: boolean; sunk: boolean; shipId?: string } {
    if (this.gameState.status !== GameStatus.PLAYING) {
      throw new Error('Game is not in playing state');
    }

    if (this.gameState.currentTurn !== playerId) {
      throw new Error('Not your turn');
    }

    const opponent = this.getOpponent(playerId);
    const opponentBoard = opponent.board;

    // Проверяем, что ход еще не был сделан
    if (opponentBoard.shots.some(shot => shot.x === position.x && shot.y === position.y)) {
      throw new Error('Position already shot');
    }

    // Добавляем выстрел
    opponentBoard.shots.push(position);

    // Проверяем попадание
    const hitShip = opponentBoard.ships.find(ship =>
      ship.positions.some(pos => pos.x === position.x && pos.y === position.y)
    );

    if (hitShip) {
      // Попадание
      opponentBoard.hits.push(position);
      hitShip.hits.push(position);

      // Проверяем, потоплен ли корабль
      const isSunk = hitShip.positions.every(pos =>
        hitShip.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
      );

      if (isSunk) {
        hitShip.isSunk = true;
        // Отмечаем все позиции корабля как потопленные
        hitShip.positions.forEach(pos => {
          if (!opponentBoard.hits.some(hit => hit.x === pos.x && hit.y === pos.y)) {
            opponentBoard.hits.push(pos);
          }
        });
      }

      // Проверяем, закончена ли игра
      const allShipsSunk = opponentBoard.ships.every(ship => ship.isSunk);
      if (allShipsSunk) {
        this.gameState.status = GameStatus.FINISHED;
        this.gameState.winner = playerId;
        this.gameState.finishedAt = new Date();
      }

      this.gameState.updatedAt = new Date();
      return { hit: true, sunk: isSunk, shipId: hitShip.id };
    } else {
      // Промах
      opponentBoard.misses.push(position);
      this.gameState.updatedAt = new Date();
      return { hit: false, sunk: false };
    }
  }

  // Передача хода
  endTurn(playerId: string): void {
    if (this.gameState.currentTurn !== playerId) {
      throw new Error('Not your turn');
    }

    this.gameState.currentTurn = this.getOpponent(playerId).id;
    this.gameState.updatedAt = new Date();
  }

  // Готовность игрока
  setPlayerReady(playerId: string): void {
    const player = this.getPlayer(playerId);
    player.isReady = true;

    // Если оба игрока готовы, начинаем игру
    if (this.gameState.playerA.isReady && this.gameState.playerB.isReady) {
      this.gameState.status = GameStatus.PLAYING;
      this.gameState.currentTurn = this.gameState.playerA.id;
    }

    this.gameState.updatedAt = new Date();
  }

  // Получение состояния ячейки для отображения
  getCellState(board: Board, position: Position): CellState {
    // Проверяем, был ли выстрел в эту позицию
    const wasShot = board.shots.some(shot => shot.x === position.x && shot.y === position.y);
    
    if (!wasShot) {
      return CellState.EMPTY;
    }

    // Проверяем, есть ли корабль в этой позиции
    const ship = board.ships.find(ship =>
      ship.positions.some(pos => pos.x === position.x && pos.y === position.y)
    );

    if (!ship) {
      return CellState.MISS;
    }

    // Проверяем, потоплен ли корабль
    if (ship.isSunk) {
      return CellState.SUNK;
    }

    return CellState.HIT;
  }

  // Получение игрока по ID
  private getPlayer(playerId: string): Player {
    if (this.gameState.playerA.id === playerId) {
      return this.gameState.playerA;
    }
    if (this.gameState.playerB.id === playerId) {
      return this.gameState.playerB;
    }
    throw new Error('Player not found');
  }

  // Получение противника
  private getOpponent(playerId: string): Player {
    if (this.gameState.playerA.id === playerId) {
      return this.gameState.playerB;
    }
    if (this.gameState.playerB.id === playerId) {
      return this.gameState.playerA;
    }
    throw new Error('Player not found');
  }

  // Получение текущего состояния игры
  getGameState(): GameState {
    return { ...this.gameState };
  }

  // Создание события игры
  createGameEvent(type: GameEventType, data: any): GameEvent {
    return {
      type,
      gameId: this.gameState.id,
      data,
      timestamp: new Date()
    };
  }
}

// Утилиты для работы с полем
export class BoardUtils {
  static readonly BOARD_SIZE = 10;
  static readonly SHIPS = [
    { type: ShipType.CARRIER, count: 1 },
    { type: ShipType.BATTLESHIP, count: 1 },
    { type: ShipType.CRUISER, count: 1 },
    { type: ShipType.SUBMARINE, count: 1 },
    { type: ShipType.DESTROYER, count: 1 }
  ];

  // Создание пустого поля
  static createEmptyBoard(playerId: string): Board {
    return {
      id: crypto.randomUUID(),
      playerId,
      ships: [],
      shots: [],
      hits: [],
      misses: []
    };
  }

  // Проверка, можно ли разместить корабль
  static canPlaceShip(board: Board, ship: Ship): boolean {
    // Проверяем, что все позиции в пределах поля
    for (const pos of ship.positions) {
      if (pos.x < 0 || pos.x >= this.BOARD_SIZE || pos.y < 0 || pos.y >= this.BOARD_SIZE) {
        return false;
      }
    }

    // Проверяем, что позиции не заняты другими кораблями
    for (const existingShip of board.ships) {
      for (const existingPos of existingShip.positions) {
        for (const newPos of ship.positions) {
          if (existingPos.x === newPos.x && existingPos.y === newPos.y) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Генерация случайной расстановки кораблей
  static generateRandomPlacement(playerId: string): Board {
    const board = this.createEmptyBoard(playerId);
    
    for (const { type, count } of this.SHIPS) {
      for (let i = 0; i < count; i++) {
        const ship = this.generateRandomShip(type);
        let attempts = 0;
        
        while (!this.canPlaceShip(board, ship) && attempts < 100) {
          ship.positions = this.generateRandomShipPositions(type);
          attempts++;
        }
        
        if (attempts < 100) {
          board.ships.push(ship);
        }
      }
    }
    
    return board;
  }

  // Генерация случайного корабля
  private static generateRandomShip(type: ShipType): Ship {
    return {
      id: crypto.randomUUID(),
      size: type,
      positions: this.generateRandomShipPositions(type),
      hits: [],
      isSunk: false
    };
  }

  // Генерация случайных позиций для корабля
  private static generateRandomShipPositions(type: ShipType): Position[] {
    const isHorizontal = Math.random() > 0.5;
    const positions: Position[] = [];
    
    if (isHorizontal) {
      const y = Math.floor(Math.random() * this.BOARD_SIZE);
      const startX = Math.floor(Math.random() * (this.BOARD_SIZE - type + 1));
      
      for (let i = 0; i < type; i++) {
        positions.push({ x: startX + i, y });
      }
    } else {
      const x = Math.floor(Math.random() * this.BOARD_SIZE);
      const startY = Math.floor(Math.random() * (this.BOARD_SIZE - type + 1));
      
      for (let i = 0; i < type; i++) {
        positions.push({ x, y: startY + i });
      }
    }
    
    return positions;
  }
}
