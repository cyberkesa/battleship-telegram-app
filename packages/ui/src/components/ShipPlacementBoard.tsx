import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Cell } from './Cell';

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
  grabOffset: number; // смещение точки хвата относительно начала корабля (в клетках)
}

interface PreviewShip {
  positions: Position[];
  isValid: boolean;
}

const coordinates = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

// Функция для получения размеров из CSS переменных
function getBoardDimensions(boardEl: HTMLDivElement) {
  const cs = getComputedStyle(boardEl);
  const cell = parseFloat(cs.getPropertyValue('--cell') || '34');
  const gap = parseFloat(cs.getPropertyValue('--gap') || '2');
  const pad = parseFloat(cs.getPropertyValue('--pad') || '12');
  return { cell, gap, pad };
}

// Функция для вычисления координат клетки под курсором
function getCellFromPointer(e: PointerEvent, boardEl: HTMLDivElement): Position | null {
  const rect = boardEl.getBoundingClientRect();
  const { cell, gap, pad } = getBoardDimensions(boardEl);
  
  const cx = e.clientX - rect.left - pad;
  const cy = e.clientY - rect.top - pad;
  const step = cell + gap;
  
  const x = Math.floor(cx / step);
  const y = Math.floor(cy / step);
  
  if (x >= 0 && x < 10 && y >= 0 && y < 10) {
    return { x, y };
  }
  
  return null;
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
  // Проверяем границы
  const isValidBounds = positions.every(pos => 
    pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10
  );
  
  if (!isValidBounds) return false;
  
  // Проверяем пересечения с другими кораблями
  const hasOverlap = placedShips.some(ship => 
    ship.id !== excludeShipId && ship.positions.some(pos =>
      positions.some(newPos => pos.x === newPos.x && pos.y === newPos.y)
    )
  );
  
  if (hasOverlap) return false;
  
  // Проверяем касания (8 направлений) с учётом уже размещённых
  const occupied = new Set<string>();
  for (const ship of placedShips) {
    if (ship.id === excludeShipId) continue;
    for (const p of ship.positions) occupied.add(`${p.x},${p.y}`);
  }
  const dirs = [-1, 0, 1];
  for (const p of positions) {
    for (const dy of dirs) for (const dx of dirs) {
      const nx = p.x + dx, ny = p.y + dy;
      const key = `${nx},${ny}`;
      if (occupied.has(key)) {
        // Разрешаем соприкасаться клетке самого же корабля при перемещении (но мы исключили его из occupied)
        return false;
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

  // Вспомогательная функция: ограничение значения по диапазону
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  // Обработчик начала перемещения существующего корабля
  const handleShipPointerDown = useCallback((ship: PlacedShip) => (e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Вычисляем смещение точки хвата относительно начала корабля
    let grabOffset = 0;
    if (boardRef.current) {
      const cellPos = getCellFromPointer(e.nativeEvent, boardRef.current);
      if (cellPos) {
        const minX = Math.min(...ship.positions.map(p => p.x));
        const minY = Math.min(...ship.positions.map(p => p.y));
        grabOffset = ship.isHorizontal ? clamp(cellPos.x - minX, 0, ship.size - 1) : clamp(cellPos.y - minY, 0, ship.size - 1);
      }
    }

    setDraggingShip({
      id: ship.id,
      size: ship.size,
      isHorizontal: ship.isHorizontal,
      isMoving: true,
      grabOffset,
    });
    setPointerId(e.pointerId);
  }, [disabled]);

  // Обработчик движения указателя
  // Вычисляем стартовую позицию с учетом смещения хвата и границ
  const getStartFromCell = useCallback((cellPos: Position, ship: DraggingShip): Position => {
    if (ship.isHorizontal) {
      const startX = clamp(cellPos.x - ship.grabOffset, 0, 10 - ship.size);
      return { x: startX, y: clamp(cellPos.y, 0, 9) };
    } else {
      const startY = clamp(cellPos.y - ship.grabOffset, 0, 10 - ship.size);
      return { x: clamp(cellPos.x, 0, 9), y: startY };
    }
  }, [clamp]);

  const updatePreviewFromNativeEvent = useCallback((nativeEvent: PointerEvent) => {
    if (!draggingShip || !boardRef.current || nativeEvent.pointerId !== pointerId) return;
    const cellPos = getCellFromPointer(nativeEvent, boardRef.current);
    if (!cellPos) {
      setPreviewShip(null);
      return;
    }
    const start = getStartFromCell(cellPos, draggingShip);
    const positions = generateShipPositions(start, draggingShip.size, draggingShip.isHorizontal);
    const isValid = validateShipPlacement(positions, placedShips, draggingShip.isMoving ? draggingShip.id : undefined);
    setPreviewShip({ positions, isValid });
  }, [draggingShip, placedShips, pointerId, getStartFromCell]);

  const finalizeFromNativeEvent = useCallback((nativeEvent: PointerEvent) => {
    if (!draggingShip || nativeEvent.pointerId !== pointerId) {
      setDraggingShip(null);
      setPreviewShip(null);
      setPointerId(null);
      return;
    }
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
    setDraggingShip(null);
    setPreviewShip(null);
    setPointerId(null);
  }, [draggingShip, previewShip, pointerId, onShipMove, onShipPlace]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    lastPointerRef.current = e.nativeEvent;
    updatePreviewFromNativeEvent(e.nativeEvent);
  }, [updatePreviewFromNativeEvent]);

  // Обработчик отпускания указателя
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    finalizeFromNativeEvent(e.nativeEvent);
  }, [finalizeFromNativeEvent]);

  // Обработчик поворота корабля
  const handleRotate = useCallback(() => {
    if (!draggingShip) return;
    const nextHorizontal = !draggingShip.isHorizontal;
    // Пересчёт grabOffset по текущей позиции указателя
    let grabOffset = draggingShip.grabOffset;
    if (boardRef.current && lastPointerRef.current) {
      const cellPos = getCellFromPointer(lastPointerRef.current, boardRef.current);
      if (cellPos) {
        const start = getStartFromCell(cellPos, { ...draggingShip, isHorizontal: nextHorizontal });
        grabOffset = nextHorizontal ? cellPos.x - start.x : cellPos.y - start.y;
        grabOffset = clamp(grabOffset, 0, draggingShip.size - 1);
      }
    }
    setDraggingShip(prev => prev ? { ...prev, isHorizontal: nextHorizontal, grabOffset } : null);
    // Обновить превью
    if (lastPointerRef.current) {
      updatePreviewFromNativeEvent(lastPointerRef.current);
    }
  }, [draggingShip, getStartFromCell, clamp, updatePreviewFromNativeEvent]);

  // Публичный API: начать перетаскивание нового корабля из палитры
  useImperativeHandle(ref, () => ({
    beginNewShipDrag: (size: number, nativeEvent: PointerEvent) => {
      if (disabled) return;
      const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
      const newDragging: DraggingShip = {
        id,
        size,
        isHorizontal: true,
        isMoving: false,
        grabOffset: 0,
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
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
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
    }
  }, [handleRotate]);

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
          className="grid grid-cols-10 gap-[var(--gap)]"
          style={{ 
            width: 'calc(10 * var(--cell) + 9 * var(--gap))',
            '--cell': 'min(32px, calc((100vw - 32px - 24px) / 10))',
            '--gap': '2px'
          } as React.CSSProperties}
        >
          {coordinates.letters.map((letter) => (
            <div
              key={letter}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: 'var(--cell)', height: '24px' }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Левые координаты (цифры) */}
      <div className="absolute -left-6 top-0 bottom-0 hidden sm:flex flex-col justify-center">
        <div 
          className="grid grid-rows-10 gap-[var(--gap)]"
          style={{ 
            height: 'calc(10 * var(--cell) + 9 * var(--gap))',
            '--cell': 'min(32px, calc((100vw - 32px - 24px) / 10))',
            '--gap': '2px'
          } as React.CSSProperties}
        >
          {coordinates.numbers.map((number) => (
            <div
              key={number}
              className="flex items-center justify-center text-caption font-mono text-mist"
              style={{ width: '24px', height: 'var(--cell)' }}
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
          '--cell': 'min(32px, calc((100vw - 32px - 24px) / 10))',
          '--gap': '2px',
          '--pad': '12px'
        } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Ячейки сетки */}
        {Array.from({ length: 10 }, (_, y) =>
          Array.from({ length: 10 }, (_, x) => {
            const cellState = getCellState(x, y);
            return (
              <Cell
                key={`${x}-${y}`}
                state={cellState.hasShip ? 'ship' : 'idle'}
                size="sm"
                onClick={() => handleCellClick(y, x)}
                disabled={disabled || !!draggingShip}
                className={`
                  ${cellState.isPreview ? 'opacity-50' : ''}
                  ${cellState.isPreviewValid === false ? 'ring-2 ring-red-500' : ''}
                  ${draggingShip ? 'pointer-events-none transition-none' : ''}
                `}
              />
            );
          })
        )}

        {/* Абсолютно позиционированные корабли */}
        {placedShips.map((ship) => {
          const minX = Math.min(...ship.positions.map(p => p.x));
          const minY = Math.min(...ship.positions.map(p => p.y));
          const maxX = Math.max(...ship.positions.map(p => p.x));
          const maxY = Math.max(...ship.positions.map(p => p.y));
          
          return (
            <div
              key={ship.id}
              className={`absolute bg-sonar/20 border-2 border-sonar/50 rounded-sm cursor-grab active:cursor-grabbing z-10 touch-none ${draggingShip?.id === ship.id ? 'opacity-40 pointer-events-none' : ''}`}
              style={{
                left: `calc(var(--pad) + ${minX} * (var(--cell) + var(--gap)))`,
                top: `calc(var(--pad) + ${minY} * (var(--cell) + var(--gap)))`,
                width: ship.isHorizontal
                  ? `calc(${maxX - minX + 1} * var(--cell) + ${maxX - minX} * var(--gap))`
                  : 'var(--cell)',
                height: ship.isHorizontal
                  ? 'var(--cell)'
                  : `calc(${maxY - minY + 1} * var(--cell) + ${maxY - minY} * var(--gap))`,
              }}
              onPointerDown={handleShipPointerDown(ship)}
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
            Нажмите R для поворота • Кликните для удаления
          </p>
        </div>
      )}
    </div>
  );
});
