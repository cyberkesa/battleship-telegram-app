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
  getPublicState
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
      expect(result.reason).toBe('FLEET_SIZE');
    });

    test('should reject fleet with wrong composition', () => {
      const fleet = createDefaultFleet().map((ship, i) => ({
        ...ship,
        length: i < 5 ? 1 : 2 // Wrong composition
      }));
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('WRONG_COMPOSITION');
    });

    test('should reject ship out of bounds', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 0 ? { ...ship, bow: { x: 10, y: 0 } } : ship
      );
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('OUT_OF_BOUNDS');
    });

    test('should reject overlapping ships', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 1 ? { ...ship, bow: { x: 0, y: 0 } } : ship // Overlaps with first ship
      );
      const result = validateFleet(fleet);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('OVERLAP');
    });

    test('should reject touching ships when not allowed', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 1 ? { ...ship, bow: { x: 1, y: 0 } } : ship // Touches first ship
      );
      const result = validateFleet(fleet, false);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('TOUCHING');
    });

    test('should allow touching ships when allowed', () => {
      const fleet = createDefaultFleet().map((ship, i) => 
        i === 1 ? { ...ship, bow: { x: 1, y: 0 } } : ship // Touches first ship
      );
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
    });

    test('should handle miss correctly', () => {
      const result = applyMove('A', { x: 5, y: 5 }, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Miss);
      expect(result.coord).toEqual({ x: 5, y: 5 });
      expect(match.boardB.misses.has('5,5')).toBe(true);
      expect(match.fogForA[5][5]).toBe(CellMark.Miss);
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

    test('should handle ship sinking correctly', () => {
      // Find a 1-length ship to sink
      const oneLengthShip = match.boardB.ships.find((s: Ship) => s.length === 1);
      const shipCell = shipCells(oneLengthShip)[0];
      
      const result = applyMove('A', shipCell, match, shipIndexA, shipIndexB);
      
      expect(result.kind).toBe(MoveResultKind.Sunk);
      expect(result.shipId).toBe(oneLengthShip.id);
      expect(result.sunkCoords).toEqual([shipCell]);
      expect(match.boardB.sunkShipIds.has(oneLengthShip.id)).toBe(true);
      expect(match.fogForA[shipCell.y][shipCell.x]).toBe(CellMark.Sunk);
    });

    test('should handle win correctly', () => {
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
      
      // Try to fire at the same cell again
      expect(() => {
        applyMove('B', { x: 0, y: 0 }, match, shipIndexA, shipIndexB);
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
