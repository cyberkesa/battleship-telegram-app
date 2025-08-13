# @battleship/game-logic

Полная игровая логика для Telegram Mini App «Морской бой» с строгой валидацией, туманом войны, идемпотентностью и сервер-авторитетом.

## 🎯 Основные возможности

- **Строгая валидация флота** (10 кораблей: 4×1, 3×2, 2×3, 1×4)
- **Туман войны** - клиенты видят только результаты своих выстрелов
- **Идемпотентность ходов** - защита от дублирования
- **Настраиваемые правила** (касания кораблей, повторный ход при попадании)
- **Таймеры** для ходов и расстановки
- **Чистые функции** - легко тестировать без БД и сети

## 📦 Установка

```bash
npm install @battleship/game-logic
```

## 🚀 Быстрый старт

```typescript
import { 
  createMatch, 
  placeFleet, 
  applyMove, 
  validateFleet,
  randomFleet,
  toHuman,
  fromHuman 
} from '@battleship/game-logic';

// Создание матча
const match = createMatch('match-123', {
  allowTouching: false,
  repeatTurnOnHit: true,
  turnSeconds: 45,
  placementSeconds: 60
});

// Размещение флотов
const fleetA = randomFleet();
const fleetB = randomFleet();

placeFleet(match, 'A', fleetA);
placeFleet(match, 'B', fleetB);
// Игра автоматически начинается

// Выполнение хода
const shipIndexA = buildShipIndex(match.boardA.ships);
const shipIndexB = buildShipIndex(match.boardB.ships);

const result = applyMove('A', { x: 5, y: 3 }, match, shipIndexA, shipIndexB);
console.log(result); // { kind: 'miss', coord: { x: 5, y: 3 } }

// Координаты
const coord = fromHuman('A1'); // { x: 0, y: 0 }
const human = toHuman({ x: 0, y: 0 }); // 'A1'
```

## 🧩 Основные типы

### Coord
```typescript
type Coord = { x: number; y: number }; // 0..9
```

### Ship
```typescript
type Ship = {
  id: string;               // Устойчивый ID корабля
  bow: Coord;               // Нос (минимум по x,y)
  length: number;           // 1..4
  horizontal: boolean;      // true=горизонталь, false=вертикаль
};
```

### Fleet
```typescript
type Fleet = Ship[]; // Ровно 10 кораблей
```

### MatchState
```typescript
type MatchState = {
  id: string;
  status: MatchStatus;      // 'placing' | 'in_progress' | 'finished'
  currentTurn: PlayerRole | null; // 'A' | 'B'
  winner?: PlayerRole;
  boardA: Board;            // Приватная доска игрока A
  boardB: Board;            // Приватная доска игрока B
  fogForA: FogOfWar;        // Что A видит на поле B
  fogForB: FogOfWar;        // Что B видит на поле A
  rules: GameRules;
  turnNo: number;
};
```

## 🔧 Основные функции

### Создание и управление матчем

#### `createMatch(id, rules?)`
Создает новый матч с настраиваемыми правилами.

```typescript
const match = createMatch('match-123', {
  allowTouching: false,     // Запрет касаний кораблей
  repeatTurnOnHit: true,    // Повторный ход при попадании
  turnSeconds: 45,          // Время на ход
  placementSeconds: 60      // Время на расстановку
});
```

#### `placeFleet(match, player, fleet)`
Размещает флот игрока и автоматически начинает игру, если оба игрока готовы.

```typescript
const fleet = randomFleet();
placeFleet(match, 'A', fleet);
```

### Валидация

#### `validateFleet(fleet, allowTouching?)`
Проверяет корректность флота:

- ✅ Ровно 10 кораблей
- ✅ Правильный состав: 4×1, 3×2, 2×3, 1×4
- ✅ В пределах поля 10×10
- ✅ Нет пересечений
- ✅ Нет касаний (если `allowTouching=false`)

```typescript
const result = validateFleet(fleet);
if (!result.ok) {
  console.log(`Ошибка: ${result.reason}`);
}
```

### Выполнение ходов

#### `applyMove(attacker, coord, match, shipIndexA, shipIndexB)`
Выполняет ход с полной валидацией:

- ✅ Проверка очередности
- ✅ Проверка статуса матча
- ✅ Проверка границ координат
- ✅ Проверка повторных выстрелов
- ✅ Обновление тумана войны
- ✅ Определение потопления
- ✅ Проверка победы

```typescript
const result = applyMove('A', { x: 5, y: 3 }, match, shipIndexA, shipIndexB);

switch (result.kind) {
  case 'miss':
    console.log('Промах!');
    break;
  case 'hit':
    console.log('Попадание!');
    break;
  case 'sunk':
    console.log(`Корабль потоплен! ID: ${result.shipId}`);
    break;
  case 'win':
    console.log('Победа!');
    break;
}
```

### Утилиты

#### `randomFleet(seed?, allowTouching?)`
Генерирует случайный валидный флот.

```typescript
const fleet = randomFleet('seed-123', false);
```

#### `toHuman(coord)` / `fromHuman(str)`
Преобразование координат в человекочитаемый формат.

```typescript
toHuman({ x: 0, y: 0 });    // 'A1'
fromHuman('A1');            // { x: 0, y: 0 }
fromHuman('J10');           // { x: 9, y: 9 }
```

#### `shipCells(ship)`
Получает все клетки корабля.

```typescript
const ship = { id: 's1', bow: { x: 0, y: 0 }, length: 3, horizontal: true };
const cells = shipCells(ship);
// [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
```

## 🎮 Состояния игры

### MatchStatus
- `placing` - Игроки размещают флоты
- `in_progress` - Игра идет
- `finished` - Игра завершена

### CellMark (Туман войны)
- `Unknown` - Неизвестно
- `Miss` - Промах
- `Hit` - Попадание
- `Sunk` - Потоплен

### MoveResultKind
- `miss` - Промах
- `hit` - Попадание
- `sunk` - Корабль потоплен
- `win` - Победа

## 🔒 Безопасность

### Сервер-авторитет
- Истинные раскладки кораблей хранятся только на сервере
- Клиенты получают только туман войны
- Все валидации выполняются на сервере

### Идемпотентность
```typescript
// Клиент отправляет Idempotency-Key с каждым ходом
const result = applyMove('A', coord, match, shipIndexA, shipIndexB);
// Сервер возвращает тот же результат для одинаковых ключей
```

### Валидация
- Строгая проверка очередности ходов
- Запрет повторных выстрелов
- Проверка границ поля
- Валидация флота по всем правилам

## 🧪 Тестирование

```typescript
import { validateFleet, createMatch, applyMove } from '@battleship/game-logic';

// Тест валидации флота
const fleet = createDefaultFleet();
const result = validateFleet(fleet);
expect(result.ok).toBe(true);

// Тест хода
const match = createMatch('test');
// ... размещение флотов
const result = applyMove('A', { x: 0, y: 0 }, match, shipIndexA, shipIndexB);
expect(result.kind).toBe('miss');
```

## 📋 Правила игры

### Стандартные правила
- **Поле**: 10×10 клеток
- **Флот**: 1×4, 2×3, 3×2, 4×1 палуб
- **Контакт**: Запрещен (включая диагонали)
- **Повторный ход**: При попадании
- **Победа**: Потопить все корабли соперника

### Настраиваемые параметры
- `allowTouching` - Разрешить касания кораблей
- `repeatTurnOnHit` - Повторный ход при попадании
- `turnSeconds` - Время на ход (45 сек)
- `placementSeconds` - Время на расстановку (60 сек)

## 🔧 Интеграция с сервером

### Обработка хода
```typescript
// 1. Транзакция + Redis-лок
// 2. Проверки статуса/очереди/уникальности
const result = applyMove(attacker, coord, match, shipIndexA, shipIndexB);
// 3. Запись в БД
// 4. SSE уведомление
```

### Таймеры
```typescript
// Сервер хранит дедлайны
const turnDeadline = Date.now() + match.rules.turnSeconds * 1000;
// Воркер проверяет просрочки каждые 1-2 сек
```

## 📚 Примеры использования

### Полный цикл игры
```typescript
// 1. Создание матча
const match = createMatch('match-123');

// 2. Размещение флотов
const fleetA = randomFleet();
const fleetB = randomFleet();
placeFleet(match, 'A', fleetA);
placeFleet(match, 'B', fleetB);

// 3. Игра
const shipIndexA = buildShipIndex(match.boardA.ships);
const shipIndexB = buildShipIndex(match.boardB.ships);

while (match.status === 'in_progress') {
  const result = applyMove(match.currentTurn, coord, match, shipIndexA, shipIndexB);
  console.log(`Ход ${match.turnNo}: ${result.kind}`);
}

// 4. Результат
console.log(`Победитель: ${match.winner}`);
```

### Валидация пользовательского флота
```typescript
const userFleet = [
  { id: 's1', bow: { x: 0, y: 0 }, length: 4, horizontal: true },
  // ... остальные корабли
];

const validation = validateFleet(userFleet);
if (!validation.ok) {
  throw new Error(`Некорректный флот: ${validation.reason}`);
}
```

## 🤝 Совместимость

- **TypeScript**: Полная поддержка типов
- **Node.js**: 16+
- **Браузер**: ES2020+
- **Тестирование**: Jest/Vitest

## 📄 Лицензия

MIT
