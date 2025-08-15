import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Cell } from './Cell';
import { useBoardLayout } from '../hooks/useBoardLayout';

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

export interface ShipPlacementBoardProps {
  placedShips: PlacedShip[];
  onShipPlace?: (ship: PlacedShip) => void;
  onShipRemove?: (shipId: string) => void;
  onShipMove?: (oldShipId: string, newShip: PlacedShip) => void;
  className?: string;
  disabled?: boolean;
}

interface DraggingShip {
  id: string;
  size: number;
  isHorizontal: boolean;
  isMoving: boolean; // true если перемещаем существующий корабль
  offset: { dx: number; dy: number }; // смещение между курсором и носом корабля
}

interface PreviewShip {
  positions: Position[];
  isValid: boolean;
}

const BOARD_SIZE = 10;
const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

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
    pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
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
      if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
        if (occupied.has(`${nx},${ny}`)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

export interface ShipPlacementBoardHandle {
  beginNewShipDrag: (size: number, nativeEvent: PointerEvent) => void;
}

export const ShipPlacementBoard = forwardRef<ShipPlacementBoardHandle, ShipPlacementBoardProps>(({ 
  placedShips,
  onShipPlace,
  onShipRemove,
  onShipMove,
  className = '',
  disabled = false,
}, ref) => {
  const [draggingShip, setDraggingShip] = useState<DraggingShip | null>(null);
  const [previewShip, setPreviewShip] = useState<PreviewShip | null>(null);
  const [pointerId, setPointerId] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<PointerEvent | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const { cellPx, pad, gap } = useBoardLayout(boardRef, { min: 20, max: 40, pad: 12, gap: 2 });

  // Вспомогательная функция: ограничение значения по диапазону
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  // Обработчик начала перемещения существующего корабля
  const handleShipPointerDown = useCallback((ship: PlacedShip) => (e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Вычисляем смещение между курсором и носом корабля
    const cellPos = boardRef.current ? getCellFromPointer(e.nativeEvent, boardRef.current, cellPx, gap, pad) : null;
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
  }, [disabled]);

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

  const updatePreviewFromNativeEvent = useCallback((nativeEvent: PointerEvent) => {
    if (!draggingShip || !boardRef.current || nativeEvent.pointerId !== pointerId) return;
    
    const cellPos = getCellFromPointer(nativeEvent, boardRef.current, cellPx, gap, pad);
    if (!cellPos) {
      setPreviewShip(null);
      return;
    }
    
    const start = getBowFromPointer(cellPos, draggingShip);
    const positions = generateShipPositions(start, draggingShip.size, draggingShip.isHorizontal);
    const isValid = validateShipPlacement(positions, placedShips, draggingShip.isMoving ? draggingShip.id : undefined);
    
    setPreviewShip({ positions, isValid });
  }, [draggingShip, placedShips, pointerId, getBowFromPointer, cellPx, gap, pad]);

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
    
    // Очищаем состояние
    setDraggingShip(null);
    setPreviewShip(null);
    setPointerId(null);
  }, [draggingShip, previewShip, pointerId, onShipMove, onShipPlace]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    lastPointerRef.current = e.nativeEvent;
    updatePreviewFromNativeEvent(e.nativeEvent);
  }, [updatePreviewFromNativeEvent]);

  // Обработчик поворота корабля с re-anchor логикой
  const handleRotate = useCallback(() => {
    if (!draggingShip || !boardRef.current || !lastPointerRef.current) return;
    
    const cellPos = getCellFromPointer(lastPointerRef.current, boardRef.current, cellPx, gap, pad);
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
  }, [draggingShip, getBowFromPointer, updatePreviewFromNativeEvent]);

  // Публичный API: начать перетаскивание нового корабля из палитры
  useImperativeHandle(ref, () => ({
    beginNewShipDrag: (size: number, nativeEvent: PointerEvent) => {
      if (disabled || !boardRef.current) return;
      const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
      const cellPos = getCellFromPointer(nativeEvent, boardRef.current, cellPx, gap, pad);
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
  }), [disabled, updatePreviewFromNativeEvent]);

  // Глобальные события для перетаскивания, чтобы обрабатывать начало из палитры
  React.useEffect(() => {
    if (!draggingShip) return;
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
  }, [draggingShip, updatePreviewFromNativeEvent, finalizeFromNativeEvent]);

  // Обработчик клика по ячейке (удаление корабля)
  const handleCellClick = useCallback((row: number, col: number) => {
    const shipAtPosition = placedShips.find(ship =>
      ship.positions.some(pos => pos.x === col && pos.y === row)
    );

    if (shipAtPosition) {
      onShipRemove?.(shipAtPosition.id);
    }
  }, [placedShips, onShipRemove]);

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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Функция для получения состояния ячейки
  const getCellState = useCallback((x: number, y: number) => {
    // Проверяем, есть ли корабль на этой позиции
    const shipAtPosition = placedShips.find(ship =>
      ship.positions.some(pos => pos.x === x && pos.y === y)
    );

    if (shipAtPosition) {
      return {
        position: { x, y },
        hasShip: true,
        shipSize: shipAtPosition.size,
        isHit: false,
        isMiss: false,
        isSunk: false,
        shipId: shipAtPosition.id,
      };
    }

    // Проверяем, находится ли ячейка под превью корабля
    if (previewShip) {
      const isUnderPreview = previewShip.positions.some(pos => pos.x === x && pos.y === y);
      if (isUnderPreview) {
        return {
          position: { x, y },
          hasShip: true,
          shipSize: draggingShip?.size || 0,
          isHit: false,
          isMiss: false,
          isSunk: false,
          isPreview: true,
          isPreviewValid: previewShip.isValid,
        };
      }
    }

    return {
      position: { x, y },
      hasShip: false,
      shipSize: 0,
      isHit: false,
      isMiss: false,
      isSunk: false,
    };
  }, [placedShips, previewShip, draggingShip]);

  return (
    <div className={`relative ${className}`}>
      {/* Верхние координаты (буквы) */}
      <div className="absolute -top-6 left-0 right-0 hidden sm:flex justify-center">
        <div 
          className="grid grid-cols-10"
          style={{ 
            width: `calc(${BOARD_SIZE} * ${cellPx}px + ${BOARD_SIZE - 1} * ${gap}px)`,
            gap: `${gap}px`
          } as React.CSSProperties}
        >
          {coordinates.letters.map((letter) => (
            <div
              key={letter}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: `${cellPx}px`, height: '24px' }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Левые координаты (цифры) */}
      <div className="absolute -left-6 top-0 bottom-0 hidden sm:flex flex-col justify-center">
        <div 
          className="grid grid-rows-10"
          style={{ 
            height: `calc(${BOARD_SIZE} * ${cellPx}px + ${BOARD_SIZE - 1} * ${gap}px)`,
            gap: `${gap}px`
          } as React.CSSProperties}
        >
          {coordinates.numbers.map((number) => (
            <div
              key={number}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: '24px', height: `${cellPx}px` }}
            >
              {number}
            </div>
          ))}
        </div>
      </div>

      {/* Основная сетка */}
      <motion.div
        ref={boardRef}
        className="relative grid grid-cols-10 gap-[var(--gap)] rounded-card bg-bg-graphite ring-1 ring-edge shadow-steel p-[var(--pad)] touch-none select-none"
        style={{ 
          '--cell': `${cellPx}px`,
          '--gap': `${gap}px`,
          '--pad': `${pad}px`
        } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          if (!draggingShip) setPreviewShip(null);
        }}
        onContextMenu={(e) => { e.preventDefault(); }}
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
                  state={cellState.hasShip ? 'ship' : 'idle'}
                  size="sm"
                  onClick={() => handleCellClick(y, x)}
                  disabled={disabled || !!draggingShip}
                  className={`${cellState.isPreview ? 'opacity-50' : ''} ${cellState.isPreviewValid === false ? 'ring-2 ring-red-500' : ''} ${draggingShip ? 'pointer-events-none transition-none' : ''}`}
                />
              );
            })}
          </React.Fragment>
        ))}

        {/* Абсолютно позиционированные корабли */}
        {placedShips.map((ship) => {
          const minX = Math.min(...ship.positions.map(p => p.x));
          const minY = Math.min(...ship.positions.map(p => p.y));
          const maxX = Math.max(...ship.positions.map(p => p.x));
          const maxY = Math.max(...ship.positions.map(p => p.y));
          
          return (
            <div
              key={ship.id}
              className={`absolute bg-sonar/10 outline outline-2 outline-sonar/50 rounded-sm cursor-grab active:cursor-grabbing z-10 touch-none ${draggingShip?.id === ship.id ? 'opacity-40 pointer-events-none' : ''}`}
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

      {/* Инструкции */}
      {draggingShip && (
        <div className="mt-4 p-3 bg-steel rounded-lg text-center">
          <p className="text-body text-foam">
            Перетащите корабль на поле
          </p>
          <p className="text-caption text-mist mt-1">
            Нажмите R для поворота • Двойной клик или долгий тап для удаления
          </p>
        </div>
      )}
    </div>
  );
});
