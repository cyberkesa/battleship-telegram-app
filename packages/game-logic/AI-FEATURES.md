# ИИ Противник - Новые Возможности

## Автоматическое открытие соседних клеток ✅

При потоплении корабля автоматически открываются все соседние клетки как промахи, поскольку корабли не могут касаться друг друга по правилам морского боя.

**Что добавлено:**
- Функция `getShipAdjacentCells()` - получение соседних клеток корабля
- Функция `revealAdjacentCells()` - автоматическое открытие соседних клеток
- Обновленный `MoveResult` включает поле `revealedCells` с информацией об открытых клетках
- Интеграция в функцию `applyMove()` для автоматического срабатывания

**Использование:**
```typescript
const result = applyMove(attacker, coord, state, shipIndexA, shipIndexB);
if (result.kind === MoveResultKind.Sunk && result.revealedCells) {
  // result.revealedCells содержит координаты автоматически открытых клеток
  console.log(`Автоматически открыто клеток: ${result.revealedCells.length}`);
}
```

## ИИ Противник с тремя уровнями сложности ✅

### Уровни сложности

#### 🟢 **Легкий (Easy)**
- Делает полностью случайные выстрелы
- Не запоминает предыдущие попадания
- Идеален для новичков

#### 🟡 **Средний (Medium)** 
- Входит в "режим охоты" после попадания
- Методично обстреливает соседние клетки после попадания
- Выходит из режима охоты после потопления корабля
- Хороший баланс между вызовом и справедливостью

#### 🔴 **Сложный (Hard)**
- Использует карту вероятностей для оптимальной стрельбы
- Предпочитает центральные области доски (где чаще размещают корабли)
- Обновляет вероятности на основе промахов и потоплений
- Использует линейные стратегии при обнаружении последовательности попаданий
- Максимальный вызов для опытных игроков

### Использование ИИ

```typescript
import { AILevel, createAIState, getAIMove, updateAIState } from '@battleship/game-logic';

// Создание ИИ состояния
const aiState = createAIState(AILevel.Medium);

// Получение хода ИИ
const fogOfWar = getPublicState(match, 'A').fog; // туман войны для ИИ
const aiMove = getAIMove(fogOfWar, aiState);

// Применение хода и обновление состояния ИИ
const result = applyMove('B', aiMove, match, shipIndexA, shipIndexB);
updateAIState(aiState, aiMove, result.kind, result.sunkCoords);

// Отладочная информация
console.log(getAIStateDebugInfo(aiState));
```

### Интеллектуальное поведение

**Средний уровень:**
- После попадания ИИ добавляет все соседние клетки в очередь целей
- Методично проверяет каждую соседнюю клетку
- При потоплении сбрасывает режим охоты

**Сложный уровень:**
- Ведет карту вероятностей 10x10 для всей доски
- Повышает приоритет центральных клеток
- При промахе обнуляет вероятность в данной клетке
- При потоплении снижает вероятности вокруг потопленного корабля
- Использует линейные стратегии для добивания частично подбитых кораблей

### Особенности реализации

- **Модульность**: ИИ полностью отделен от основной игровой логики
- **Расширяемость**: Легко добавить новые уровни сложности
- **Производительность**: Все операции выполняются за O(1) или O(n) где n - размер доски
- **Тестирование**: 100% покрытие тестами всех сценариев и граничных случаев

### Примеры интеграции

**Игра против ИИ:**
```typescript
// Инициализация
const match = createMatch('ai-game');
const aiState = createAIState(AILevel.Hard);

// Ход игрока
const playerMove = { x: 5, y: 5 };
const playerResult = applyMove('A', playerMove, match, shipIndexA, shipIndexB);

// Ход ИИ  
if (match.currentTurn === 'B') {
  const aiMove = getAIMove(match.fogForB, aiState);
  const aiResult = applyMove('B', aiMove, match, shipIndexA, shipIndexB);
  updateAIState(aiState, aiMove, aiResult.kind, aiResult.sunkCoords);
}
```

**Статистика ИИ:**
```typescript
// Можно отслеживать эффективность ИИ
let totalShots = 0;
let successfulHits = 0;

function trackAIPerformance(result: MoveResult) {
  totalShots++;
  if (result.kind === MoveResultKind.Hit || result.kind === MoveResultKind.Sunk) {
    successfulHits++;
  }
  
  const accuracy = (successfulHits / totalShots) * 100;
  console.log(`ИИ точность: ${accuracy.toFixed(1)}%`);
}
```

Эти новые возможности значительно улучшают игровой опыт, предоставляя реалистичного и настраиваемого противника для одиночной игры!