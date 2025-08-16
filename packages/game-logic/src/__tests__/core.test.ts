import { 
  validateFleet, 
  makeBoard, 
  makeEmptyFog, 
  shipCells, 
  inBounds, 
  coordKey,
  createMatch,
  placeFleet,
  applyMove,
  buildShipIndex,
  isShipSunk,
  getPublicState,
  getShipAdjacentCells,
  revealAdjacentCells
} from '../core';
import { 
  randomFleet, 
  createDefaultFleet, 
  toHuman, 
  fromHuman 
} from '../utils';
import { 
  Coord, 
  Ship, 
  Fleet, 
  MatchStatus, 
  PlayerRole, 
  MoveResultKind,
  CellMark 
} from '../types';

describe('Game Logic Core', () => {
  describe('Coordinate utilities', () => {
    test('inBounds should validate coordinates correctly', () => {
      expect(inBounds({ x: 0, y: 0 })).toBe(true);
      expect(inBounds({ x: 9, y: 9 })).toBe(true);
      expect(inBounds({ x: -1, y: 0 })).toBe(false);
      expect(inBounds({ x: 0, y: 10 })).toBe(false);
      expect(inBounds({ x: 10, y: 5 })).toBe(false);
    });

    test('coordKey should generate correct keys', () => {
      expect(coordKey({ x: 0, y: 0 })).toBe('0,0');
      expect(coordKey({ x: 5, y: 3 })).toBe('5,3');
      expect(coordKey({ x: 9, y: 9 })).toBe('9,9');
    });
  });

  describe('Ship utilities', () => {
    test('shipCells should generate correct coordinates for horizontal ship', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 2, y: 3 },
        length: 3,
        horizontal: true
      };
      
      const cells = shipCells(ship);
      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 }
      ]);
    });

    test('shipCells should generate correct coordinates for vertical ship', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 2, y: 3 },
        length: 3,
        horizontal: false
      };
      
      const cells = shipCells(ship);
      expect(cells);
      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 }
      ]);
    });
  });

  describe('Fleet validation', () => {
    test('should validate correct fleet', () => {
      const fleet = createDefaultFleet();
      const result = validateFleet(fleet);
      expect(result.ok).toBe(true);
    });

    test('should reject fleet with wrong size', () => {
      const fleet = createDefaultFleet().slice(0, 5); // Only 5 ships
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('FLEET_SIZE');
      }
    });

    test('should reject fleet with wrong composition', () => {
      const fleet = createDefaultFleet().map((ship, i) => ({
        ...ship,
        length: i < 5 ? 1 : 2 // Wrong composition
      }));
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('WRONG_COMPOSITION');
      }
    });

    test('should reject ship out of bounds', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 0 ? { ...ship, bow: { x: 10, y: 0 } } : ship
      );
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('OUT_OF_BOUNDS');
      }
    });

    test('should reject overlapping ships', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 1 ? { ...ship, bow: { x: 1, y: 1 } } : ship // Overlaps with first ship at (1,1)
      );
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('OVERLAP');
      }
    });

    test('should reject touching ships when not allowed', () => {
      // Create a simple fleet with just 2 ships that touch each other
      const fleet: Fleet = [
        { id: 'ship1', bow: { x: 0, y: 0 }, length: 1, horizontal: true }, // at (0,0)
        { id: 'ship2', bow: { x: 1, y: 0 }, length: 1, horizontal: true }, // at (1,0) - adjacent to ship1
        // Fill out the rest to make valid composition
        { id: 'ship3', bow: { x: 3, y: 0 }, length: 1, horizontal: true },
        { id: 'ship4', bow: { x: 5, y: 0 }, length: 1, horizontal: true },
        { id: 'ship5', bow: { x: 0, y: 2 }, length: 2, horizontal: true },
        { id: 'ship6', bow: { x: 3, y: 2 }, length: 2, horizontal: true },
        { id: 'ship7', bow: { x: 6, y: 2 }, length: 2, horizontal: true },
        { id: 'ship8', bow: { x: 0, y: 4 }, length: 3, horizontal: true },
        { id: 'ship9', bow: { x: 0, y: 6 }, length: 3, horizontal: true },
        { id: 'ship10', bow: { x: 0, y: 8 }, length: 4, horizontal: true }
      ];
      const result = validateFleet(fleet, false);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('TOUCHING');
      }
    });

    test('should allow touching ships when allowed', () => {
      // Same touching fleet but with allowTouching=true
      const fleet: Fleet = [
        { id: 'ship1', bow: { x: 0, y: 0 }, length: 1, horizontal: true }, // at (0,0)
        { id: 'ship2', bow: { x: 1, y: 0 }, length: 1, horizontal: true }, // at (1,0) - adjacent to ship1
        // Fill out the rest to make valid composition
        { id: 'ship3', bow: { x: 3, y: 0 }, length: 1, horizontal: true },
        { id: 'ship4', bow: { x: 5, y: 0 }, length: 1, horizontal: true },
        { id: 'ship5', bow: { x: 0, y: 2 }, length: 2, horizontal: true },
        { id: 'ship6', bow: { x: 3, y: 2 }, length: 2, horizontal: true },
        { id: 'ship7', bow: { x: 6, y: 2 }, length: 2, horizontal: true },
        { id: 'ship8', bow: { x: 0, y: 4 }, length: 3, horizontal: true },
        { id: 'ship9', bow: { x: 0, y: 6 }, length: 3, horizontal: true },
        { id: 'ship10', bow: { x: 0, y: 8 }, length: 4, horizontal: true }
      ];
      const result = validateFleet(fleet, true);
      expect(result.ok).toBe(true);
    });
  });

  describe('Board creation', () => {
    test('should create empty fog', () => {
      const fog = makeEmptyFog();
      expect(fog.length).toBe(10);
      expect(fog[0].length).toBe(10);
      expect(fog[0][0]).toBe(CellMark.Unknown);
    });

    test('should create board with fleet', () => {
      const fleet = createDefaultFleet();
      const board = makeBoard(fleet);
      expect(board.size).toBe(10);
      expect(board.ships).toBe(fleet);
      expect(board.hits.size).toBe(0);
      expect(board.misses.size).toBe(0);
      expect(board.sunkShipIds.size).toBe(0);
    });
  });

  describe('Ship sinking detection', () => {
    test('should detect sunk ship', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 0, y: 0 },
        length: 2,
        horizontal: true
      };
      
      const hits = new Set(['0,0', '1,0']);
      expect(isShipSunk(ship, hits)).toBe(true);
    });

    test('should not detect sunk ship when not all cells hit', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 0, y: 0 },
        length: 2,
        horizontal: true
      };
      
      const hits = new Set(['0,0']); // Only one cell hit
      expect(isShipSunk(ship, hits)).toBe(false);
    });
  });

  describe('Match creation and management', () => {
    test('should create match with default rules', () => {
      const match = createMatch('test-match');
      expect(match.id).toBe('test-match');
      expect(match.status).toBe(MatchStatus.Placing);
      expect(match.currentTurn).toBe(null);
      expect(match.rules.allowTouching).toBe(false);
      expect(match.rules.repeatTurnOnHit).toBe(true);
      expect(match.rules.turnSeconds).toBe(45);
      expect(match.rules.placementSeconds).toBe(60);
    });

    test('should create match with custom rules', () => {
      const match = createMatch('test-match', {
        allowTouching: true,
        repeatTurnOnHit: false,
        turnSeconds: 30,
        placementSeconds: 45
      });
      expect(match.rules.allowTouching).toBe(true);
      expect(match.rules.repeatTurnOnHit).toBe(false);
      expect(match.rules.turnSeconds).toBe(30);
      expect(match.rules.placementSeconds).toBe(45);
    });

    test('should place fleet and start game when both players ready', () => {
      const match = createMatch('test-match');
      const fleet = createDefaultFleet();
      
      placeFleet(match, 'A', fleet);
      expect(match.boardA.ships.length).toBe(10);
      expect(match.status).toBe(MatchStatus.Placing); // Still placing
      
      placeFleet(match, 'B', fleet);
      expect(match.boardB.ships.length).toBe(10);
      expect(match.status).toBe(MatchStatus.InProgress);
      expect(match.currentTurn).toBeDefined();
      expect(['A', 'B']).toContain(match.currentTurn);
      expect(match.turnNo).toBe(1);
    });
  });

  describe('Adjacent cells revelation', () => {
    test('getShipAdjacentCells should return correct adjacent cells for horizontal ship', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 2, y: 3 },
        length: 3,
        horizontal: true
      };
      
      const adjacentCells = getShipAdjacentCells(ship);
      
      // Ожидаемые соседние клетки (исключая сам корабль: x2,3; x3,3; x4,3)
      const expectedAdjacent = [
        // Верхний ряд
        { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
        // Левая и правая стороны
        { x: 1, y: 3 }, { x: 5, y: 3 },
        // Нижний ряд
        { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }
      ];
      
      expect(adjacentCells).toHaveLength(expectedAdjacent.length);
      expectedAdjacent.forEach(coord => {
        expect(adjacentCells).toContainEqual(coord);
      });
    });

    test('getShipAdjacentCells should return correct adjacent cells for vertical ship', () => {
      const ship: Ship = {
        id: 'test-ship',
        bow: { x: 3, y: 2 },
        length: 3,
        horizontal: false
      };
      
      const adjacentCells = getShipAdjacentCells(ship);
      
      // Ожидаемые соседние клетки (исключая сам корабль: x3,2; x3,3; x3,4)
      const expectedAdjacent = [
        // Левый столбец
        { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
        // Верх и низ
        { x: 3, y: 1 }, { x: 3, y: 5 },
        // Правый столбец
        { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }
      ];
      
      expect(adjacentCells).toHaveLength(expectedAdjacent.length);
      expectedAdjacent.forEach(coord => {
        expect(adjacentCells).toContainEqual(coord);
      });
    });

    test('getShipAdjacentCells should handle edge cases correctly', () => {
      // Корабль в углу доски
      const cornerShip: Ship = {
        id: 'corner-ship',
        bow: { x: 0, y: 0 },
        length: 1,
        horizontal: true
      };
      
      const adjacentCells = getShipAdjacentCells(cornerShip);
      const expectedAdjacent = [
        { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }
      ];
      
      expect(adjacentCells).toHaveLength(expectedAdjacent.length);
      expectedAdjacent.forEach(coord => {
        expect(adjacentCells).toContainEqual(coord);
      });
    });

    test('revealAdjacentCells should mark adjacent cells as misses', () => {
      const fleet = createDefaultFleet();
      const board = makeBoard(fleet);
      const fog = makeEmptyFog();
      const shipIndex = buildShipIndex(fleet);
      
      // Берем первый корабль (4-палубный)
      const ship = fleet[0];
      
      const revealedCells = revealAdjacentCells(ship, board, fog, shipIndex);
      
      expect(revealedCells.length).toBeGreaterThan(0);
      
      // Проверяем, что все открытые клетки помечены как промах
      revealedCells.forEach(cell => {
        const key = coordKey(cell);
        expect(board.misses.has(key)).toBe(true);
        expect(fog[cell.y][cell.x]).toBe(CellMark.Miss);
      });
      
      // Проверяем, что в открытых клетках нет кораблей
      revealedCells.forEach(cell => {
        const key = coordKey(cell);
        expect(shipIndex.has(key)).toBe(false);
      });
    });
  });

  describe('Move application', () => {
    let match: any;
    let shipIndexA: Map<string, string>;
    let shipIndexB: Map<string, string>;

    beforeEach(() => {
      match = createMatch('test-match');
      const fleet = createDefaultFleet();
      placeFleet(match, 'A', fleet);
      placeFleet(match, 'B', fleet);
      shipIndexA = buildShipIndex(match.boardA.ships);
      shipIndexB = buildShipIndex(match.boardB.ships);
      // Ensure deterministic first turn for tests
      match.currentTurn = 'A';
    });

    test('should handle miss correctly', () => {
      // Pick a cell guaranteed to be empty in createDefaultFleet
      const result = applyMove('A', { x: 9, y: 9 }, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Miss);
      expect(result.coord).toEqual({ x: 9, y: 9 });
      expect(match.boardB.misses.has('9,9')).toBe(true);
      expect(match.fogForA[9][9]).toBe(CellMark.Miss);
      expect(match.currentTurn).toBe('B');
      expect(match.turnNo).toBe(2);
    });

    test('should handle hit correctly', () => {
      // Find a ship cell to hit
      const ship = match.boardB.ships[0];
      const shipCell = shipCells(ship)[0];
      
      const result = applyMove('A', shipCell, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Hit);
      expect(result.coord).toEqual(shipCell);
      expect(match.boardB.hits.has(coordKey(shipCell))).toBe(true);
      expect(match.fogForA[shipCell.y][shipCell.x]).toBe(CellMark.Hit);
      expect(match.currentTurn).toBe('A'); // Should keep turn due to repeatTurnOnHit
    });

    test('should handle ship sinking correctly and reveal adjacent cells', () => {
      // Find a 1-length ship to sink
      const oneLengthShip = match.boardB.ships.find((s: Ship) => s.length === 1);
      const shipCell = shipCells(oneLengthShip)[0];
      
      const result = applyMove('A', shipCell, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Sunk);
      expect(result.shipId).toBe(oneLengthShip.id);
      expect(result.sunkCoords).toEqual([shipCell]);
      expect(result.revealedCells).toBeDefined();
      expect(Array.isArray(result.revealedCells)).toBe(true);
      expect(match.boardB.sunkShipIds.has(oneLengthShip.id)).toBe(true);
      expect(match.fogForA[shipCell.y][shipCell.x]).toBe(CellMark.Sunk);
      
      // Проверяем, что соседние клетки автоматически открылись как промахи
      if (result.revealedCells && result.revealedCells.length > 0) {
        result.revealedCells.forEach(cell => {
          const key = coordKey(cell);
          expect(match.boardB.misses.has(key)).toBe(true);
          expect(match.fogForA[cell.y][cell.x]).toBe(CellMark.Miss);
        });
      }
    });

    test('should handle win correctly and reveal adjacent cells', () => {
      // Sink all ships except one
      const ships = match.boardB.ships;
      for (let i = 0; i < ships.length - 1; i++) {
        const ship = ships[i];
        const cells = shipCells(ship);
        for (const cell of cells) {
          match.boardB.hits.add(coordKey(cell));
        }
        match.boardB.sunkShipIds.add(ship.id);
      }
      
      // Hit the last ship
      const lastShip = ships[ships.length - 1];
      const lastCell = shipCells(lastShip)[0];
      
      const result = applyMove('A', lastCell, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Win);
      expect(result.revealedCells).toBeDefined();
      expect(match.status).toBe(MatchStatus.Finished);
      expect(match.winner).toBe('A');
    });

    test('should reject move when not player turn', () => {
      expect(() => {
        applyMove('B', { x: 0, y: 0 }, match, shipIndexA, shipIndexB);
      }).toThrow('Not your turn');
    });

    test('should reject move to already fired cell', () => {
      // Fire at a cell first
      applyMove('A', { x: 0, y: 0 }, match, shipIndexA, shipIndexB);
      
      // Ensure it's still A's turn to test ALREADY_FIRED on the same target board
      match.currentTurn = 'A';
      
      // Try to fire at the same cell again by the same attacker
      expect(() => {
        applyMove('A', { x: 0, y: 0 }, match, shipIndexA, shipIndexB);
      }).toThrow('Already fired at this coordinate');
    });
  });

  describe('Public state', () => {
    test('should return correct public state for player A', () => {
      const match = createMatch('test-match');
      const publicState = getPublicState(match, 'A');
      
      expect(publicState.id).toBe('test-match');
      expect(publicState.status).toBe(MatchStatus.Placing);
      expect(publicState.fog).toBe(match.fogForA);
      expect(publicState.rules).toBe(match.rules);
    });

    test('should return correct public state for player B', () => {
      const match = createMatch('test-match');
      const publicState = getPublicState(match, 'B');
      
      expect(publicState.fog).toBe(match.fogForB);
    });
  });
});

describe('Coordinate notation', () => {
  test('toHuman should convert coordinates correctly', () => {
    expect(toHuman({ x: 0, y: 0 })).toBe('A1');
    expect(toHuman({ x: 9, y: 9 })).toBe('J10');
    expect(toHuman({ x: 2, y: 4 })).toBe('C5');
  });

  test('fromHuman should parse coordinates correctly', () => {
    expect(fromHuman('A1')).toEqual({ x: 0, y: 0 });
    expect(fromHuman('J10')).toEqual({ x: 9, y: 9 });
    expect(fromHuman('C5')).toEqual({ x: 2, y: 4 });
  });

  test('fromHuman should handle case insensitive input', () => {
    expect(fromHuman('a1')).toEqual({ x: 0, y: 0 });
    expect(fromHuman('j10')).toEqual({ x: 9, y: 9 });
  });

  test('fromHuman should reject invalid coordinates', () => {
    expect(() => fromHuman('K1')).toThrow();
    expect(() => fromHuman('A11')).toThrow();
    expect(() => fromHuman('A0')).toThrow();
    expect(() => fromHuman('1A')).toThrow();
    expect(() => fromHuman('')).toThrow();
  });
});

describe('Random fleet generation', () => {
  test('should generate valid fleet', () => {
    const fleet = randomFleet();
    expect(fleet.length).toBe(10);
    
    const validation = validateFleet(fleet);
    expect(validation.ok).toBe(true);
  });

  test('should generate fleet with touching allowed', () => {
    const fleet = randomFleet(undefined, true);
    expect(fleet.length).toBe(10);
    
    const validation = validateFleet(fleet, true);
    expect(validation.ok).toBe(true);
  });
});
