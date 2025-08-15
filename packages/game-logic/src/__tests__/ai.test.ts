import {
  AILevel,
  createAIState,
  getAIMove,
  updateAIState,
  getAIStateDebugInfo
} from '../ai';
import { CellMark, MoveResultKind } from '../types';
import { makeEmptyFog } from '../core';

describe('AI Opponent', () => {
  describe('AI State Creation', () => {
    test('should create easy AI state correctly', () => {
      const aiState = createAIState(AILevel.Easy);
      
      expect(aiState.level).toBe(AILevel.Easy);
      expect(aiState.huntMode).toBe(false);
      expect(aiState.targetQueue).toEqual([]);
      expect(aiState.hitSequence).toEqual([]);
      expect(aiState.probabilities).toBeUndefined();
    });

    test('should create medium AI state correctly', () => {
      const aiState = createAIState(AILevel.Medium);
      
      expect(aiState.level).toBe(AILevel.Medium);
      expect(aiState.huntMode).toBe(false);
      expect(aiState.targetQueue).toEqual([]);
      expect(aiState.hitSequence).toEqual([]);
      expect(aiState.probabilities).toBeUndefined();
    });

    test('should create hard AI state with probabilities', () => {
      const aiState = createAIState(AILevel.Hard);
      
      expect(aiState.level).toBe(AILevel.Hard);
      expect(aiState.huntMode).toBe(false);
      expect(aiState.targetQueue).toEqual([]);
      expect(aiState.hitSequence).toEqual([]);
      expect(aiState.probabilities).toBeDefined();
      expect(aiState.probabilities).toHaveLength(10);
      expect(aiState.probabilities![0]).toHaveLength(10);
    });
  });

  describe('Easy AI Moves', () => {
    test('should make random moves on empty board', () => {
      const aiState = createAIState(AILevel.Easy);
      const fog = makeEmptyFog();
      
      const moves = new Set();
      for (let i = 0; i < 10; i++) {
        const move = getAIMove(fog, aiState);
        expect(move.x).toBeGreaterThanOrEqual(0);
        expect(move.x).toBeLessThan(10);
        expect(move.y).toBeGreaterThanOrEqual(0);
        expect(move.y).toBeLessThan(10);
        moves.add(`${move.x},${move.y}`);
      }
      
      // Проверяем, что делаются разные ходы (случайность)
      expect(moves.size).toBeGreaterThan(1);
    });

    test('should avoid already fired cells', () => {
      const aiState = createAIState(AILevel.Easy);
      const fog = makeEmptyFog();
      
      // Помечаем некоторые клетки как уже обстрелянные
      fog[0][0] = CellMark.Miss;
      fog[0][1] = CellMark.Hit;
      fog[1][0] = CellMark.Sunk;
      
      const move = getAIMove(fog, aiState);
      
      // Проверяем, что ИИ не выберет уже обстрелянные клетки
      expect(fog[move.y][move.x]).toBe(CellMark.Unknown);
    });
  });

  describe('Medium AI Behavior', () => {
    test('should enter hunt mode after hit', () => {
      const aiState = createAIState(AILevel.Medium);
      const coord = { x: 5, y: 5 };
      
      updateAIState(aiState, coord, MoveResultKind.Hit);
      
      expect(aiState.huntMode).toBe(true);
      expect(aiState.lastHit).toEqual(coord);
      expect(aiState.hitSequence).toContain(coord);
      expect(aiState.targetQueue.length).toBeGreaterThan(0);
    });

    test('should target adjacent cells after hit', () => {
      const aiState = createAIState(AILevel.Medium);
      const fog = makeEmptyFog();
      const hitCoord = { x: 5, y: 5 };
      
      // Симулируем попадание
      updateAIState(aiState, hitCoord, MoveResultKind.Hit);
      
      // Получаем несколько ходов и проверяем, что они соседние с попаданием
      const moves = [];
      for (let i = 0; i < Math.min(4, aiState.targetQueue.length); i++) {
        const move = getAIMove(fog, aiState);
        moves.push(move);
        // Помечаем клетку как промах, чтобы ИИ не выбрал её снова
        fog[move.y][move.x] = CellMark.Miss;
      }
      
      // Проверяем, что все ходы являются соседними с исходным попаданием
      const expectedAdjacent = [
        { x: 5, y: 4 }, { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 5 }
      ];
      
      moves.forEach(move => {
        const isAdjacent = expectedAdjacent.some(adj => adj.x === move.x && adj.y === move.y);
        expect(isAdjacent).toBe(true);
      });
    });

    test('should exit hunt mode after sinking ship', () => {
      const aiState = createAIState(AILevel.Medium);
      const coord = { x: 5, y: 5 };
      
      // Сначала попадание
      updateAIState(aiState, coord, MoveResultKind.Hit);
      expect(aiState.huntMode).toBe(true);
      
      // Затем потопление
      updateAIState(aiState, coord, MoveResultKind.Sunk, [coord]);
      
      expect(aiState.huntMode).toBe(false);
      expect(aiState.targetQueue).toEqual([]);
      expect(aiState.hitSequence).toEqual([]);
    });
  });

  describe('Hard AI Behavior', () => {
    test('should use probability map', () => {
      const aiState = createAIState(AILevel.Hard);
      const fog = makeEmptyFog();
      
      expect(aiState.probabilities).toBeDefined();
      
      // Делаем несколько ходов и проверяем, что они имеют тенденцию к центру
      const moves = [];
      for (let i = 0; i < 5; i++) {
        const move = getAIMove(fog, aiState);
        moves.push(move);
        fog[move.y][move.x] = CellMark.Miss;
        updateAIState(aiState, move, MoveResultKind.Miss);
      }
      
      // Центральные клетки должны быть предпочтительными
      const centerMoves = moves.filter(m => 
        m.x >= 3 && m.x <= 6 && m.y >= 3 && m.y <= 6
      );
      
      // Ожидаем, что большинство ходов будут ближе к центру
      expect(centerMoves.length).toBeGreaterThanOrEqual(2);
    });

    test('should update probabilities after miss', () => {
      const aiState = createAIState(AILevel.Hard);
      const missCoord = { x: 5, y: 5 };
      
      const initialProb = aiState.probabilities![missCoord.y][missCoord.x];
      updateAIState(aiState, missCoord, MoveResultKind.Miss);
      const afterProb = aiState.probabilities![missCoord.y][missCoord.x];
      
      expect(afterProb).toBe(0);
      expect(afterProb).toBeLessThan(initialProb);
    });

    test('should reduce probabilities around sunk ship', () => {
      const aiState = createAIState(AILevel.Hard);
      const sunkCoords = [{ x: 5, y: 5 }];
      const adjacentCoord = { x: 5, y: 4 };
      
      const initialProb = aiState.probabilities![adjacentCoord.y][adjacentCoord.x];
      updateAIState(aiState, sunkCoords[0], MoveResultKind.Sunk, sunkCoords);
      const afterProb = aiState.probabilities![adjacentCoord.y][adjacentCoord.x];
      
      expect(afterProb).toBeLessThan(initialProb);
    });
  });

  describe('AI State Updates', () => {
    test('should handle win result', () => {
      const aiState = createAIState(AILevel.Medium);
      
      // Устанавливаем некоторое состояние
      aiState.huntMode = true;
      aiState.targetQueue = [{ x: 1, y: 1 }];
      aiState.hitSequence = [{ x: 0, y: 0 }];
      
      updateAIState(aiState, { x: 5, y: 5 }, MoveResultKind.Win);
      
      expect(aiState.huntMode).toBe(false);
      expect(aiState.targetQueue).toEqual([]);
      expect(aiState.hitSequence).toEqual([]);
    });
  });

  describe('Debug Information', () => {
    test('should provide useful debug info', () => {
      const aiState = createAIState(AILevel.Medium);
      aiState.huntMode = true;
      aiState.targetQueue = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
      aiState.hitSequence = [{ x: 0, y: 0 }];
      
      const debugInfo = getAIStateDebugInfo(aiState);
      
      expect(debugInfo).toContain('medium');
      expect(debugInfo).toContain('Hunt Mode: true');
      expect(debugInfo).toContain('Targets in Queue: 2');
      expect(debugInfo).toContain('Hit Sequence: 1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty board for all AI levels', () => {
      const levels = [AILevel.Easy, AILevel.Medium, AILevel.Hard];
      
      levels.forEach(level => {
        const aiState = createAIState(level);
        const fog = makeEmptyFog();
        
        expect(() => {
          const move = getAIMove(fog, aiState);
          expect(move).toBeDefined();
          expect(move.x).toBeGreaterThanOrEqual(0);
          expect(move.x).toBeLessThan(10);
          expect(move.y).toBeGreaterThanOrEqual(0);
          expect(move.y).toBeLessThan(10);
        }).not.toThrow();
      });
    });

    test('should handle board with only one available cell', () => {
      const aiState = createAIState(AILevel.Easy);
      const fog = makeEmptyFog();
      
      // Заполняем почти всю доску
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (!(x === 9 && y === 9)) { // Оставляем одну свободную клетку
            fog[y][x] = CellMark.Miss;
          }
        }
      }
      
      const move = getAIMove(fog, aiState);
      expect(move).toEqual({ x: 9, y: 9 });
    });

    test('should throw error when no moves available', () => {
      const aiState = createAIState(AILevel.Easy);
      const fog = makeEmptyFog();
      
      // Заполняем всю доску
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          fog[y][x] = CellMark.Miss;
        }
      }
      
      expect(() => {
        getAIMove(fog, aiState);
      }).toThrow('No available cells for AI move');
    });
  });
});