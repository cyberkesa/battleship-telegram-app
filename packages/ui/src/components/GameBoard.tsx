import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Cell, CellState } from './Cell';
import { BoardSize, sizeConfig, gapPx, coordinates, BOARD_SIZE } from '../utils/boardConfig';

export interface Position {
  x: number;
  y: number;
}

export interface PlacedShip {
  id: string;
  size: number;
  positions: Position[];
  isHorizontal: boolean;
}

export interface GameBoardProps {
  size?: BoardSize;
  cells?: CellState[][]; // Для игрового режима
  placedShips?: PlacedShip[]; // Для режима расстановки
  mode: 'game' | 'placement'; // Режим работы
  onCellClick?: (row: number, col: number) => void;
  onCellLongPress?: (row: number, col: number) => void;
  onShipPlace?: (ship: PlacedShip) => void;
  onShipRemove?: (shipId: string) => void;
  onShipMove?: (oldShipId: string, newShip: PlacedShip) => void;
  disabled?: boolean;
  className?: string;
  showCoordinates?: boolean;
  isOpponent?: boolean;
}

interface DraggingShip {
  id: string;
  size: number;
  isHorizontal: boolean;
  isMoving: boolean;
  offset: { dx: number; dy: number };
}

interface PreviewShip {
  positions: Position[];
  isValid: boolean;
}

export interface GameBoardHandle {
  beginNewShipDrag: (size: number, nativeEvent: PointerEvent) => void;
}

// Функция для вычисления координат клетки под курсором
function getCellFromPointer(e: PointerEvent, boardEl: HTMLDivElement, cellPx: number, gap: number, pad: number): Position | null {
  try {
    const rect = boardEl.getBoundingClientRect();
    
    const cx = e.clientX - rect.left - pad;
    const cy = e.clientY - rect.top - pad;
    const step = cellPx + gap;
    
    const x = Math.floor(cx / step);
    const y = Math.floor(cy / step);
    
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
      return { x, y };
    }
    
    return null;
  } catch (error) {
    console.warn('Error calculating cell position:', error);
    return null;
  }
}

// Функция для генерации позиций корабля
function generateShipPositions(startPos: Position, size: number, isHorizontal: boolean): Position[] {
  const positions: Position[] = [];
  
  for (let i = 0; i < size; i++) {
    if (isHorizontal) {
      positions.push({ x: startPos.x + i, y: startPos.y });
    } else {
      positions.push({ x: startPos.x, y: startPos.y + i });
    }
  }
  
  return positions;
}

// Функция для проверки валидности размещения
function validateShipPlacement(
  positions: Position[],
  placedShips: PlacedShip[],
  excludeShipId?: string
): boolean {
  // Проверяем границы поля
  const isValidBounds = positions.every(pos => 
    pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE
  );
  
  if (!isValidBounds) return false;
  
  // Создаем множество занятых позиций (исключая текущий корабль)
  const occupied = new Set<string>();
  for (const ship of placedShips) {
    if (ship.id === excludeShipId) continue;
    for (const pos of ship.positions) {
      occupied.add(`${pos.x},${pos.y}`);
    }
  }
  
  // Проверяем пересечения с другими кораблями
  for (const pos of positions) {
    if (occupied.has(`${pos.x},${pos.y}`)) {
      return false;
    }
  }
  
  // Проверяем касания (корабли не должны касаться друг друга)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const pos of positions) {
    for (const [dx, dy] of directions) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      
      // Проверяем границы
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        if (occupied.has(`${nx},${ny}`)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

export const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(({
  size = 'md',
  cells = [],
  placedShips = [],
  mode,
  onCellClick,
  onCellLongPress,
  onShipPlace,
  onShipRemove,
  onShipMove,
  disabled = false,
  className = '',
  showCoordinates = true,
  isOpponent = false,
}, ref) => {
  const config = sizeConfig[size];
  const { cellPx, padPx } = config;

  // Состояние для режима расстановки
  const [draggingShip, setDraggingShip] = useState<DraggingShip | null>(null);
  const [previewShip, setPreviewShip] = useState<PreviewShip | null>(null);
  const [pointerId, setPointerId] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<PointerEvent | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  
  // Флаги для предотвращения "скрытого клика после драга"
  const justDroppedRef = useRef(false);
  const draggingRef = useRef(false);
  
  // Синхронизируем флаг с состоянием драга
  React.useEffect(() => {
    draggingRef.current = !!draggingShip;
  }, [draggingShip]);

  // Валидация размера поля в dev-режиме
  if (process.env.NODE_ENV !== 'production') {
    if (mode === 'game' && (cells.length !== BOARD_SIZE || cells.some(r => r.length !== BOARD_SIZE))) {
      console.warn('GameBoard: expected 10x10 cells, got', cells.length, 'x', cells[0]?.length);
    }
  }

  // Вспомогательная функция: ограничение значения по диапазону
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  // Вычисляем позицию носа корабля с учетом смещения курсора
  const getBowFromPointer = useCallback((cellPos: Position, ship: DraggingShip): Position => {
    if (ship.isHorizontal) {
      const bowX = clamp(cellPos.x - ship.offset.dx, 0, BOARD_SIZE - ship.size);
      return { x: bowX, y: clamp(cellPos.y, 0, BOARD_SIZE - 1) };
    } else {
      const bowY = clamp(cellPos.y - ship.offset.dy, 0, BOARD_SIZE - ship.size);
      return { x: clamp(cellPos.x, 0, BOARD_SIZE - 1), y: bowY };
    }
  }, [clamp]);

  // Обработчики для игрового режима
  const handleCellClick = useCallback((row: number, col: number) => {
    // Игнорируем клики "после драга" и во время драга
    if (justDroppedRef.current || draggingRef.current) return;
    
    if (mode === 'placement') {
      // В режиме расстановки клик по кораблю удаляет его
      const shipAtPosition = placedShips.find(ship =>
        ship.positions.some(pos => pos.x === row && pos.y === col)
      );
      if (shipAtPosition) {
        onShipRemove?.(shipAtPosition.id);
        return;
      }
    }
    
    if (!disabled && onCellClick) {
      onCellClick(row, col);
    }
  }, [disabled, onCellClick, mode, placedShips, onShipRemove]);

  const handleCellLongPress = useCallback((row: number, col: number) => {
    if (!disabled && onCellLongPress) {
      onCellLongPress(row, col);
    }
  }, [disabled, onCellLongPress]);

  // Обработчики для режима расстановки
  const handleShipPointerDown = useCallback((ship: PlacedShip) => (e: React.PointerEvent) => {
    if (disabled || mode !== 'placement') return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Вычисляем смещение между курсором и носом корабля
    const cellPos = boardRef.current ? getCellFromPointer(e.nativeEvent, boardRef.current, cellPx, gapPx, padPx) : null;
    if (!cellPos) return;
    
    const minX = Math.min(...ship.positions.map(p => p.x));
    const minY = Math.min(...ship.positions.map(p => p.y));
    const dx = cellPos.x - minX;
    const dy = cellPos.y - minY;

    setDraggingShip({
      id: ship.id,
      size: ship.size,
      isHorizontal: ship.isHorizontal,
      isMoving: true,
      offset: { dx, dy },
    });
    setPointerId(e.pointerId);

    // Начинаем таймер длинного тапа для удаления
    longPressTimerRef.current = window.setTimeout(() => {
      onShipRemove?.(ship.id);
    }, 550);
  }, [disabled, mode, cellPx, gapPx, padPx, onShipRemove]);

  const updatePreviewFromNativeEvent = useCallback((nativeEvent: PointerEvent) => {
    if (!draggingShip || !boardRef.current || nativeEvent.pointerId !== pointerId) return;
    
    const cellPos = getCellFromPointer(nativeEvent, boardRef.current, cellPx, gapPx, padPx);
    if (!cellPos) {
      setPreviewShip(null);
      return;
    }
    
    const start = getBowFromPointer(cellPos, draggingShip);
    const positions = generateShipPositions(start, draggingShip.size, draggingShip.isHorizontal);
    const isValid = validateShipPlacement(positions, placedShips, draggingShip.isMoving ? draggingShip.id : undefined);
    
    setPreviewShip({ positions, isValid });
  }, [draggingShip, placedShips, pointerId, getBowFromPointer, cellPx, gapPx, padPx]);

  const finalizeFromNativeEvent = useCallback((nativeEvent: PointerEvent) => {
    if (!draggingShip || nativeEvent.pointerId !== pointerId) {
      setDraggingShip(null);
      setPreviewShip(null);
      setPointerId(null);
      return;
    }
    
    // Проверяем, что корабль можно разместить
    if (previewShip?.isValid) {
      const newShip: PlacedShip = {
        id: draggingShip.id,
        size: draggingShip.size,
        positions: previewShip.positions,
        isHorizontal: draggingShip.isHorizontal,
      };
      
      if (draggingShip.isMoving) {
        onShipMove?.(draggingShip.id, newShip);
      } else {
        onShipPlace?.(newShip);
      }
    }
    
    // Пометить, что был драг-дроп и возможно прилетит click
    justDroppedRef.current = true;
    setTimeout(() => {
      justDroppedRef.current = false;
    }, 80);
    
    // Очищаем состояние
    setDraggingShip(null);
    setPreviewShip(null);
    setPointerId(null);
  }, [draggingShip, previewShip, pointerId, onShipMove, onShipPlace]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (mode !== 'placement') return;
    lastPointerRef.current = e.nativeEvent;
    updatePreviewFromNativeEvent(e.nativeEvent);
  }, [mode, updatePreviewFromNativeEvent]);

  // Обработчик поворота корабля с re-anchor логикой
  const handleRotate = useCallback(() => {
    if (!draggingShip || !boardRef.current || !lastPointerRef.current) return;
    
    const cellPos = getCellFromPointer(lastPointerRef.current, boardRef.current, cellPx, gapPx, padPx);
    if (!cellPos) return;
    
    const nextHorizontal = !draggingShip.isHorizontal;
    
    // Создаем временный корабль с новой ориентацией
    const flippedShip: DraggingShip = { 
      ...draggingShip, 
      isHorizontal: nextHorizontal 
    };
    
    // Вычисляем новую позицию носа с учетом текущего курсора
    const newBow = getBowFromPointer(cellPos, flippedShip);
    
    // Вычисляем новый offset относительно курсора
    const newOffset = {
      dx: cellPos.x - newBow.x,
      dy: cellPos.y - newBow.y,
    };
    
    // Обновляем корабль с новым offset
    setDraggingShip(prev => prev ? { 
      ...prev, 
      isHorizontal: nextHorizontal,
      offset: newOffset
    } : null);
    
    // Обновить превью
    updatePreviewFromNativeEvent(lastPointerRef.current);
  }, [draggingShip, getBowFromPointer, updatePreviewFromNativeEvent, cellPx, gapPx, padPx]);

  // Публичный API: начать перетаскивание нового корабля из палитры
  useImperativeHandle(ref, () => ({
    beginNewShipDrag: (size: number, nativeEvent: PointerEvent) => {
      if (disabled || mode !== 'placement' || !boardRef.current) return;
      const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
      const cellPos = getCellFromPointer(nativeEvent, boardRef.current, cellPx, gapPx, padPx);
      const newDragging: DraggingShip = {
        id,
        size,
        isHorizontal: true,
        isMoving: false,
        offset: { dx: 0, dy: 0 }, // новый корабль начинается с носа
      };
      setDraggingShip(newDragging);
      setPointerId(nativeEvent.pointerId);
      // сразу показать превью
      updatePreviewFromNativeEvent(nativeEvent);
    }
  }), [disabled, mode, updatePreviewFromNativeEvent, cellPx, gapPx, padPx]);

  // Глобальные события для перетаскивания
  React.useEffect(() => {
    if (!draggingShip || mode !== 'placement') return;
    const onMove = (ev: PointerEvent) => updatePreviewFromNativeEvent(ev);
    const onUp = (ev: PointerEvent) => finalizeFromNativeEvent(ev);
    const onCancel = (ev: PointerEvent) => finalizeFromNativeEvent(ev);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
    };
  }, [draggingShip, mode, updatePreviewFromNativeEvent, finalizeFromNativeEvent]);

  // Обработчик клавиш
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') {
      handleRotate();
    } else if (e.key === 'Escape' && draggingShip) {
      // Отмена перетаскивания по Escape
      setDraggingShip(null);
      setPreviewShip(null);
      setPointerId(null);
    }
  }, [handleRotate, draggingShip]);

  // Добавляем обработчик клавиш
  React.useEffect(() => {
    if (mode === 'placement') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [mode, handleKeyDown]);

  // Функция для получения состояния ячейки
  const getCellState = useCallback((x: number, y: number): CellState => {
    // Для игрового режима используем переданные cells
    if (mode === 'game' && cells.length > 0) {
      return cells[y]?.[x] || 'idle';
    }

    // Для режима расстановки вычисляем состояние
    // Проверяем, есть ли корабль на этой позиции
    const shipAtPosition = placedShips.find(ship =>
      ship.positions.some(pos => pos.x === x && pos.y === y)
    );

    if (shipAtPosition) {
      return 'ship';
    }

    // Проверяем, находится ли ячейка под превью корабля
    if (previewShip) {
      const isUnderPreview = previewShip.positions.some(pos => pos.x === x && pos.y === y);
      if (isUnderPreview) {
        return previewShip.isValid ? 'hover' : 'selected';
      }
    }

    return 'idle';
  }, [mode, cells, placedShips, previewShip]);

  return (
    <div 
      className={`relative ${className}`}
      style={{
        // CSS-vars — единый источник размеров
        ['--cell' as any]: `${cellPx}px`,
        ['--gap' as any]: `${gapPx}px`,
        ['--pad' as any]: `${padPx}px`,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {showCoordinates && (
        <>
          {/* Верхние координаты (буквы), сдвинуты на паддинг поля */}
          <div className="absolute left-[var(--pad)] -top-6 right-0 flex justify-start pointer-events-none">
            <div
              className="grid grid-cols-10"
              style={{
                width: `calc(${BOARD_SIZE} * var(--cell) + ${BOARD_SIZE - 1} * var(--gap))`,
                gap: 'var(--gap)',
              }}
              aria-hidden
            >
              {coordinates.letters.map((letter) => (
                <div
                  key={letter}
                  className="flex items-center justify-center text-sm font-semibold text-text-secondary"
                  style={{ width: 'var(--cell)', height: '24px' }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          {/* Левые координаты (цифры), сдвинуты на паддинг поля */}
          <div className="absolute top-[var(--pad)] -left-6 bottom-0 flex flex-col justify-start pointer-events-none">
            <div
              className="grid grid-rows-10"
              style={{
                height: `calc(${BOARD_SIZE} * var(--cell) + ${BOARD_SIZE - 1} * var(--gap))`,
                rowGap: 'var(--gap)',
              }}
              aria-hidden
            >
              {coordinates.numbers.map((number) => (
                <div
                  key={number}
                  className="flex items-center justify-center text-sm font-semibold text-text-secondary"
                  style={{ width: '24px', height: 'var(--cell)' }}
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Основная сетка */}
      <motion.div
        ref={boardRef}
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        className="relative grid grid-cols-10 rounded-2xl bg-gradient-to-br from-game-water/10 to-game-water/5 ring-1 ring-border-light shadow-xl touch-none select-none backdrop-blur-sm"
        style={{
          gap: 'var(--gap)',
          padding: 'var(--pad)',
          gridAutoRows: 'var(--cell)',
        }}
        onClickCapture={(e) => {
          // Перехватываем клики на уровне контейнера
          if (draggingRef.current || justDroppedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          if (!draggingShip) setPreviewShip(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Ячейки сетки */}
        {Array.from({ length: BOARD_SIZE }, (_, y) => (
          <React.Fragment key={y}>
            {Array.from({ length: BOARD_SIZE }, (_, x) => {
              const cellState = getCellState(x, y);
              return (
                <Cell
                  key={`${x}-${y}`}
                  state={cellState}
                  size={size}
                  onClick={() => handleCellClick(y, x)}
                  onLongPress={() => handleCellLongPress(y, x)}
                  disabled={disabled || (mode === 'placement' && !!draggingShip)}
                  className={`${draggingShip ? 'pointer-events-none transition-none' : ''} ${mode === 'placement' ? 'no-scale' : ''}`}
                />
              );
            })}
          </React.Fragment>
        ))}

        {/* Абсолютно позиционированные корабли (только в режиме расстановки) */}
        {mode === 'placement' && placedShips.map((ship) => {
          const minX = Math.min(...ship.positions.map(p => p.x));
          const minY = Math.min(...ship.positions.map(p => p.y));
          const maxX = Math.max(...ship.positions.map(p => p.x));
          const maxY = Math.max(...ship.positions.map(p => p.y));
          
          return (
            <div
              key={ship.id}
              className={`absolute bg-gradient-to-r from-game-ship/20 to-game-ship/10 outline outline-2 outline-game-ship/50 rounded-lg cursor-grab active:cursor-grabbing z-10 touch-none shadow-md hover:shadow-lg transition-all duration-200 ${draggingShip?.id === ship.id ? 'opacity-40 pointer-events-none' : ''}`}
              style={{
                boxSizing: 'border-box',
                left: `calc(var(--pad) + ${minX} * (var(--cell) + var(--gap)))`,
                top: `calc(var(--pad) + ${minY} * (var(--cell) + var(--gap)))`,
                width: ship.isHorizontal
                  ? `calc(${maxX - minX + 1} * var(--cell) + ${maxX - minX} * var(--gap))`
                  : 'var(--cell)',
                height: ship.isHorizontal
                  ? 'var(--cell)'
                  : `calc(${maxY - minY + 1} * var(--cell) + ${maxY - minY} * var(--gap))`,
              }}
              onPointerDown={(e) => {
                handleShipPointerDown(ship)(e);
                // Начинаем таймер длинного тапа для удаления
                longPressTimerRef.current = window.setTimeout(() => {
                  onShipRemove?.(ship.id);
                }, 550);
              }}
              onPointerUp={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onPointerLeave={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }}
              onDoubleClick={() => onShipRemove?.(ship.id)}
              onContextMenu={(e) => { e.preventDefault(); }}
            />
          );
        })}
      </motion.div>

      {/* Рамка противника — ниже координат, но поверх поля */}
      {isOpponent && (
        <div
          className="pointer-events-none absolute inset-[calc(var(--pad)-2px)] rounded-card ring-2 ring-sonar/20"
          aria-hidden
        />
      )}

      {/* Инструкции для режима расстановки */}
      {mode === 'placement' && draggingShip && (
        <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl text-center shadow-lg border border-primary-200">
          <p className="text-base font-semibold text-text-primary">
            Перетащите корабль на поле
          </p>
          <p className="text-sm text-text-secondary mt-1">
            Нажмите R для поворота • Двойной клик или долгий тап для удаления
          </p>
        </div>
      )}
    </div>
  );
});
