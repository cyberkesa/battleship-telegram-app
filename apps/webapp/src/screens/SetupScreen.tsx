// Импорт основных React хуков для управления состоянием и жизненным циклом компонента
import React, { useState, useRef, useEffect } from 'react';
// Импорт хуков для работы с роутингом - получение параметров URL и навигация
import { useParams, useNavigate } from 'react-router-dom';
// Импорт UI компонентов из пакета battleship/ui для построения интерфейса
import { Button, GameBoard, PlacedShip, Position, GameBoardHandle, Ship, RingTimer } from '@battleship/ui';
// Импорт store для управления игровым состоянием
import { useGameStore } from '../stores/gameStore';
// Импорт хука для работы с аутентификацией пользователя
import { useAuth } from '../providers/AuthProvider';
// Импорт функций игровой логики для генерации случайного флота и валидации
import { randomFleet, validateFleet } from '@battleship/game-logic';
// Импорт иконок из библиотеки lucide-react для UI элементов
import { 
  Ship as ShipIcon, // Иконка корабля для отображения в селекторе
  RotateCcw, // Иконка для кнопки случайной расстановки
  Trash2, // Иконка для кнопки очистки поля
  Play, // Иконка для кнопки начала игры
  Clock, // Иконка часов для отображения времени
  CheckCircle, // Иконка галочки для подтверждения готовности
  AlertCircle // Иконка предупреждения для ошибок
} from 'lucide-react';

// Константа времени на расстановку кораблей в секундах
const PLACEMENT_SECONDS = 60;

// Функция для генерации уникального ID с fallback на случай отсутствия crypto API
const safeUUID = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

// Локальная конфигурация состава флота (избегаем проблем с экспортом в окружении)
const FLEET_COMPOSITION_LOCAL: Readonly<Record<number, number>> = Object.freeze({ 1: 4, 2: 3, 3: 2, 4: 1 });
// Массив типов кораблей с их характеристиками: размер, название, количество и цвет
const SHIP_TYPES = [
  { size: 4, name: 'Линкор', count: FLEET_COMPOSITION_LOCAL[4], color: 'red' as const },
  { size: 3, name: 'Крейсер', count: FLEET_COMPOSITION_LOCAL[3], color: 'blue' as const },
  { size: 2, name: 'Эсминец', count: FLEET_COMPOSITION_LOCAL[2], color: 'sonar' as const },
  { size: 1, name: 'Катер', count: FLEET_COMPOSITION_LOCAL[1], color: 'cyan' as const },
] as const;

// Функция-конвертер для преобразования PlacedShip в формат Fleet для валидации
const toFleet = (ps: PlacedShip[]) => ps.map(s => {
  // Находим минимальные координаты X и Y для определения носа корабля
  const minX = Math.min(...s.positions.map(p => p.x));
  const minY = Math.min(...s.positions.map(p => p.y));
  // Возвращаем объект в формате Fleet с носом корабля, длиной и ориентацией
  return { 
    id: s.id, // Уникальный идентификатор корабля
    bow: { x: minX, y: minY }, // Координаты носа корабля (левая верхняя точка)
    length: s.size, // Длина корабля в клетках
    horizontal: s.isHorizontal // Ориентация корабля (горизонтальная/вертикальная)
  };
});

// Основной компонент SetupScreen для расстановки кораблей
export const SetupScreen: React.FC = () => {
  // Получаем matchId из параметров URL (ID матча или 'computer' для игры с ИИ)
  const { matchId } = useParams<{ matchId: string }>();
  // Хук для программной навигации между страницами
  const navigate = useNavigate();
  // Получаем функцию setupBoard из игрового store для настройки доски
  const { setupBoard } = useGameStore();
  // Инициализируем аутентификацию (необходимо для быстрой игры)
  useAuth(); // Для быстрой игры
  
  // Состояние для хранения размещенных кораблей
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  // Состояние для отслеживания оставшегося времени расстановки
  const [timeLeft, setTimeLeft] = useState(PLACEMENT_SECONDS);
  // Флаг для предотвращения повторного запуска игры
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Responsive cell size for board and ship previews
  const [cellSize, setCellSize] = useState<number>(34);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 360) setCellSize(26);
      else if (w < 420) setCellSize(28);
      else if (w < 520) setCellSize(30);
      else setCellSize(34);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Определяем, является ли это быстрой игрой (против компьютера)
  const isQuickGame = matchId === 'computer';
  // Используем matchId или fallback на 'computer' для корректного роутинга
  const gameId = matchId ?? 'computer'; // Исправляем роутинг

  // Мемоизированный расчет доступных кораблей для размещения
  const availableShips = React.useMemo(() => {
    const available = [];
    // Проходим по всем типам кораблей
    for (let i = 0; i < SHIP_TYPES.length; i++) {
      const shipType = SHIP_TYPES[i];
      // Подсчитываем количество уже размещенных кораблей данного типа
      const placedCount = placedShips.filter(ship => ship.size === shipType.size).length;
      // Вычисляем количество оставшихся кораблей для размещения
      const remaining = shipType.count - placedCount;
      
      // Добавляем оставшиеся корабли в список доступных
      for (let j = 0; j < remaining; j++) {
        available.push({
          ...shipType, // Копируем все свойства типа корабля
          id: `${shipType.size}_${j}`, // Генерируем уникальный ID
          index: i // Сохраняем индекс типа для сортировки
        });
      }
    }
    return available;
  }, [placedShips]); // Пересчитываем при изменении размещенных кораблей

  // Ссылка на компонент GameBoard для программного управления
  const boardRef = useRef<GameBoardHandle | null>(null);
  // Ссылка на обертку игрового поля для управления фокусом
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);

  // Мемоизированный обработчик размещения корабля на поле
  const handleShipPlace = React.useCallback((ship: PlacedShip) => {
    setPlacedShips(prev => [...prev, ship]); // Добавляем новый корабль к существующим
  }, []);

  // Мемоизированный обработчик удаления корабля с поля
  const handleShipRemove = React.useCallback((shipId: string) => {
    setPlacedShips(prev => prev.filter(ship => ship.id !== shipId)); // Удаляем корабль по ID
  }, []);

  // Мемоизированный обработчик перемещения корабля на поле
  const handleShipMove = React.useCallback((oldShipId: string, newShip: PlacedShip) => {
    setPlacedShips(prev => prev.map(ship => 
      ship.id === oldShipId ? newShip : ship // Заменяем старый корабль новым
    ));
  }, []);

  // Обработчик случайной расстановки всех кораблей
  const handleRandomPlacement = () => {
    try {
      // Генерируем случайный флот с помощью игровой логики
      const fleetShips = randomFleet();
      
      // Вспомогательная функция для преобразования корабля в массив позиций
      const shipToPositions = (ship: { bow: Position; length: number; horizontal: boolean }): Position[] => {
        const positions: Position[] = [];
        // Генерируем позиции для каждой клетки корабля
        for (let i = 0; i < ship.length; i++) {
          if (ship.horizontal) {
            // Для горизонтального корабля увеличиваем X координату
            positions.push({ x: ship.bow.x + i, y: ship.bow.y });
          } else {
            // Для вертикального корабля увеличиваем Y координату
            positions.push({ x: ship.bow.x, y: ship.bow.y + i });
          }
        }
        return positions;
      };
      
      // Преобразуем сгенерированный флот в формат PlacedShip
      const ships: PlacedShip[] = fleetShips.map((ship) => ({
        id: safeUUID(), // Генерируем уникальный ID
        size: ship.length, // Размер корабля
        positions: shipToPositions(ship as any), // Массив позиций корабля
        isHorizontal: (ship as any).horizontal, // Ориентация корабля
      }));
      
      // Устанавливаем сгенерированные корабли в состояние
      setPlacedShips(ships);
    } catch (error) {
      console.error('Error generating random fleet:', error);
    }
  };

  // Обработчик очистки игрового поля
  const handleClearBoard = () => {
    setPlacedShips([]); // Очищаем массив размещенных кораблей
  };

  // Асинхронная функция для запуска игры
  const startGame = async (overridePlaced?: PlacedShip[]) => {
    // Предотвращаем повторный запуск игры
    if (isGameStarted) return;

    // Валидация флота перед стартом игры
    const source = overridePlaced ?? placedShips; // Используем переданные корабли или текущие
    const fleet = toFleet(source); // Конвертируем в формат для валидации
    const v = validateFleet(fleet, false); // Проверяем корректность расстановки
    if (!(v as any).ok) {
      console.error('Invalid fleet:', v);
      return; // Прерываем запуск при некорректной расстановке
    }

    // Устанавливаем флаг запуска игры
    setIsGameStarted(true);
    try {
      // Настраиваем игровую доску через API и получаем фактический matchId
      const actualMatchId = await setupBoard(gameId, fleet);
      // Переходим на игру только если сервер вернул фактический matchId
      if (!actualMatchId) {
        setIsGameStarted(false);
        return;
      }
      navigate(`/game/${actualMatchId}`);
    } catch (e) {
      console.error('Failed to setup board:', e);
      // Сбрасываем флаг при ошибке
      setIsGameStarted(false);
    }
  };

  // Обработчик кнопки начала игры
  const handleStartGame = () => {
    startGame(); // Запускаем игру с текущими кораблями
  };

  // Мемоизированная валидация флота для UX - кнопка активна только при валидной расстановке
  const fleetValidation = React.useMemo(() => validateFleet(toFleet(placedShips), false), [placedShips]);
  // Флаг готовности доски к игре
  const isBoardComplete = (fleetValidation as any).ok === true;
  // Подсчет оставшихся кораблей для размещения
  const remainingShips = SHIP_TYPES.reduce((acc, t) => acc + t.count, 0) - placedShips.length;

  // Эффект для таймера быстрой игры: авто-старт с автосборкой, если пользователь не успел
  useEffect(() => {
    // Работаем только для быстрой игры и если игра еще не запущена
    if (!isQuickGame || isGameStarted) return;

    // Устанавливаем интервал для обновления таймера каждую секунду
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Время истекло
          if (!isBoardComplete) {
            // Автосборка: генерируем случайный флот и сразу запускаем игру
            try {
              const fleetShips = randomFleet();
              const ships: PlacedShip[] = fleetShips.map((ship: any) => {
                // Генерируем позиции для каждого корабля
                const positions: Position[] = Array.from({ length: ship.length }, (_, i) => (
                  ship.horizontal 
                    ? { x: ship.bow.x + i, y: ship.bow.y } // Горизонтальный корабль
                    : { x: ship.bow.x, y: ship.bow.y + i } // Вертикальный корабль
                ));
                return {
                  id: safeUUID(), // Уникальный ID
                  size: ship.length, // Размер корабля
                  positions, // Массив позиций
                  isHorizontal: ship.horizontal, // Ориентация
                } as PlacedShip;
              });
              setPlacedShips(ships); // Устанавливаем сгенерированные корабли
              startGame(ships); // Запускаем игру с новыми кораблями
            } catch (e) {
              console.error('Failed to autogenerate fleet:', e);
            }
          } else {
            // Доска готова - запускаем игру с текущими кораблями
            startGame();
          }
          return 0; // Сбрасываем таймер
        }
        return prev - 1; // Уменьшаем время на 1 секунду
      });
    }, 1000); // Обновляем каждую секунду

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(timer);
  }, [isQuickGame, isGameStarted, isBoardComplete]); // Зависимости эффекта

  // Рендер компонента
  return (
    // Основной контейнер с минимальной высотой экрана и темным фоном
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Заголовок страницы */}
      <div className="bg-steel border-b border-edge/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Динамический заголовок в зависимости от типа игры */}
            <h1 className="font-heading font-semibold text-h2 text-foam truncate">
              {isQuickGame ? 'Быстрая игра' : 'Расстановка флота'}
            </h1>
            {/* Динамическое описание состояния расстановки */}
            <p className="text-secondary text-mist truncate">
              {isBoardComplete ? 'Флот готов' : remainingShips > 0 ? `Разместите ${remainingShips} кораблей` : 'Проверьте корректность расположения'}
            </p>
          </div>
          {/* Блок с таймером или статичным временем */}
          <div className="flex items-center gap-2 ml-4">
            {isQuickGame ? (
              // Таймер обратного отсчета для быстрой игры
              <RingTimer
                duration={PLACEMENT_SECONDS}
                currentTime={timeLeft}
                size="sm"
                className="text-sonar"
              />
            ) : (
              // Статичный блок времени для обычной игры
              <>
                <Clock className="w-4 h-4 text-mist" />
                <div className="text-right">
                  <div className="text-caption text-mist">Время</div>
                  <div className="font-mono font-semibold text-h3 text-sonar">
                    —
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Основной контент страницы */}
      <div className="p-6 space-y-6 sm:space-y-8 max-w-[760px] mx-auto">
        {/* Секция выбора кораблей */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-6">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Корабли
          </h3>
          
          {/* Сетка доступных кораблей для размещения */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableShips.map((ship) => (
              // Карточка корабля для перетаскивания
              <div
                key={ship.id}
                className="p-3 rounded-lg border border-edge/60 hover:border-sonar/60 transition-all cursor-grab active:cursor-grabbing touch-none bg-bg-graphite/70 shadow-sm"
                style={{ 
                  ['--cell' as any]: `${cellSize}px`, // CSS переменная для размера клетки
                  ['--gap' as any]: '2px' // CSS переменная для отступа между клетками
                } as React.CSSProperties}
                role="button"
                tabIndex={0}
                // Обработчик начала перетаскивания корабля
                onPointerDown={(e) => {
                  e.preventDefault();
                  // Исключаем pointer capture — перетаскивание ведёт сам GameBoard
                  if (boardRef.current) {
                    boardRef.current.beginNewShipDrag(ship.size, e.nativeEvent as PointerEvent);
                  }
                }}
                // Обработчик нажатия клавиш для доступности
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Вместо фиктивного перетаскивания с клавиатуры — фокус на поле и подсказка про R для поворота
                    (boardWrapperRef.current as HTMLDivElement | null)?.focus?.();
                  }
                }}
                // Предотвращаем контекстное меню
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Заголовок карточки корабля */}
                <div className="flex items-center gap-2 mb-3">
                  {/* Цветной индикатор типа корабля */}
                  <div className={`w-4 h-4 ${ship.color === 'sonar' ? 'bg-game-ship' : ship.color === 'red' ? 'bg-accent-red' : ship.color === 'blue' ? 'bg-accent-blue' : 'bg-accent-cyan'} rounded-sm flex items-center justify-center`}>
                    <ShipIcon className="w-3 h-3 text-white" />
                  </div>
                  {/* Информация о корабле */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-heading font-semibold text-body text-foam truncate">
                      {ship.name}
                    </div>
                    <div className="text-caption text-mist">
                      {ship.size} клетки
                    </div>
                  </div>
                </div>
                {/* Визуальное представление корабля */}
                <div className="flex justify-center">
                  <Ship
                    size={ship.size as 1 | 2 | 3 | 4}
                    isHorizontal={true}
                    color={ship.color}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Сообщение о готовности флота */}
          {availableShips.length === 0 && isBoardComplete && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sonar mb-2">
                <CheckCircle className="w-5 h-5" />
                <p className="font-heading font-semibold text-body">
                  Флот готов!
                </p>
              </div>
              <p className="text-caption text-mist">
                Все корабли размещены правильно
              </p>
            </div>
          )}
        </div>

        {/* Секция игрового поля */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-6">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Поле
          </h3>
          
          {/* Контейнер для игрового поля */}
          <div className="flex justify-center">
            <div
              ref={boardWrapperRef}
              tabIndex={-1}
              style={{ ['--cell' as any]: `${cellSize}px`, ['--gap' as any]: '2px' } as React.CSSProperties}
              aria-label="Игровое поле для расстановки"
            >
              {/* Компонент игрового поля для расстановки кораблей */}
              <GameBoard
              ref={boardRef}
              mode="placement"
              placedShips={placedShips}
              onShipPlace={handleShipPlace}
              onShipRemove={handleShipRemove}
              onShipMove={handleShipMove}
            />
            </div>
          </div>
        </div>

        {/* Секция действий */}
        <div className="space-y-4">
          {/* Сетка кнопок управления */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Кнопка случайной расстановки */}
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRandomPlacement}
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Случайная расстановка
            </Button>
            
            {/* Кнопка очистки поля */}
            <Button
              variant="ghost"
              size="lg"
              onClick={handleClearBoard}
              className="w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Очистить поле
            </Button>
          </div>

          {/* Основная кнопка начала игры */}
          <Button
            variant={isBoardComplete ? 'primary' : 'secondary'}
            size="lg"
            onClick={handleStartGame}
            disabled={!isBoardComplete}
            className="w-full flex items-center justify-center gap-2"
            aria-disabled={!isBoardComplete}
          >
            {isBoardComplete ? (
              // Если доска готова - показываем кнопку начала игры
              <>
                <Play className="w-4 h-4" />
                Начать игру
              </>
            ) : (
              // Если доска не готова - показываем предупреждение
              <>
                <AlertCircle className="w-4 h-4" />
                {remainingShips > 0 ? `Разместите еще ${remainingShips} кораблей` : 'Исправьте расположение кораблей'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
