# UI Design System - Морской бой

Строгий, тёмный, «брутальный морской» дизайн для Telegram Mini App «Морской бой».

## 🎨 Цветовая палитра

### Основные цвета
- **bg-deep** `#0B1214` - Фон глубокого моря (primary bg)
- **bg-graphite** `#111820` - Графит (card/bg-elevated)
- **steel** `#1A232C` - Сталь (panels/toolbar)
- **edge** `#273140` - Стальная кромка (бордюры/разделители)

### Акценты
- **sonar** `#00E08C` - Акцент «сонар» (успех/онлайн/активное)
- **torpedo** `#FF3B3B` - Акцент «торпеда» (ошибка/попадание/потопление)
- **radio** `#FFC857` - Акцент «радио-янтарь» (таймер/предупреждения)

### Текст
- **foam** `#E6EEF7` - Пена/текст основной
- **mist** `#93A3B3` - Туман/текст вторичный
- **mute** `#5A728A` - Немой синий (disabled/метки)

### Дополнительные
- **success** `#2ECC71` - Успех спокойный
- **info** `#3BA3FF` - Инфо холодный

## 📝 Типографика

### Шрифты
- **Заголовки**: Inter SemiBold
- **Текст/числа**: IBM Plex Mono (цифры, сетка, таймер)

### Размеры
- **H1**: 22px (SemiBold)
- **H2**: 18px (SemiBold)
- **H3**: 16px (SemiBold)
- **Body**: 14px
- **Secondary**: 13px
- **Caption**: 12px

## 🧩 Компоненты

### Button
```tsx
import { Button } from '@battleship/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  НАЧАТЬ
</Button>
```

**Варианты**: `primary`, `secondary`, `danger`, `ghost`
**Размеры**: `sm`, `md`, `lg`

### Cell
```tsx
import { Cell } from '@battleship/ui';

<Cell state="idle" size="md" onClick={handleClick} />
```

**Состояния**: `idle`, `hover`, `selected`, `miss`, `hit`, `sunk`, `disabled`, `ship`, `ship-hit`, `ship-sunk`
**Размеры**: `sm`, `md`, `lg`, `mini`

### Board
```tsx
import { Board } from '@battleship/ui';

<Board 
  cells={gameBoard} 
  onCellClick={handleCellClick}
  showCoordinates={true}
  isOpponent={false}
/>
```

### RingTimer
```tsx
import { RingTimer } from '@battleship/ui';

<RingTimer 
  duration={60} 
  currentTime={45} 
  size="md" 
  showText={true} 
/>
```

### TurnBadge
```tsx
import { TurnBadge } from '@battleship/ui';

<TurnBadge 
  isMyTurn={true} 
  timeLeft={30} 
/>
```

### Toast
```tsx
import { Toast } from '@battleship/ui';

<Toast 
  type="success" 
  title="Попадание!" 
  message="Корабль повреждён"
  onClose={handleClose}
/>
```

**Типы**: `success`, `error`, `info`, `warning`

### Modal
```tsx
import { Modal } from '@battleship/ui';

<Modal 
  isOpen={isOpen}
  onClose={handleClose}
  title="Подтверждение"
  actions={{
    primary: { label: 'Подтвердить', onClick: handleConfirm },
    secondary: { label: 'Отмена', onClick: handleClose }
  }}
>
  Вы уверены, что хотите сдаться?
</Modal>
```

### LoadingScreen
```tsx
import { LoadingScreen } from '@battleship/ui';

<LoadingScreen 
  status="connecting" 
  message="Идёт инициализация..."
  onRetry={handleRetry}
/>
```

**Статусы**: `connecting`, `restoring`, `failed`

## 🎭 Анимации

### Framer Motion Variants
```tsx
const variants = {
  'torpedo-hit': {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 45],
    transition: { duration: 0.3, ease: "easeOut" }
  },
  'miss-splash': {
    scale: [0, 1],
    opacity: [0, 1],
    transition: { duration: 0.2, ease: "easeOut" }
  }
};
```

### CSS Анимации
- `sonar-ping` - Пульсация сонара
- `torpedo-hit` - Анимация попадания
- `miss-splash` - Анимация промаха
- `steel-shimmer` - Блики стали

## 📱 Адаптивность

### Размеры клеток
- **XS**: 28px (мобильные)
- **SM**: 32px (планшеты)
- **MD**: 36px (десктоп)
- **LG**: 40px (большие экраны)
- **Mini**: 22px (миниатюры)

### Отступы
- **4px** - Минимальные отступы
- **8px** - Базовые отступы
- **12px** - Средние отступы
- **16px** - Большие отступы
- **20px** - Очень большие отступы
- **24px** - Максимальные отступы

## 🎨 Градиенты и эффекты

### Градиенты
- `steel-depth` - Линейный градиент фона
- `sonar-sweep` - Радиальный градиент подсветки

### Тени
- `shadow-steel` - Основная тень карточек
- `shadow-sonar` - Тень сонара
- `shadow-torpedo` - Тень торпеды

### Скругления
- `rounded-cell` - 6px (клетки)
- `rounded-card` - 10px (карточки)
- `rounded-modal` - 14px (модалки)

## 🚀 Использование

### Установка
```bash
npm install @battleship/ui
```

### Импорт
```tsx
import { Button, Board, Cell, RingTimer, TurnBadge, Toast, Modal, LoadingScreen } from '@battleship/ui';
```

### Tailwind CSS
Убедитесь, что в вашем `tailwind.config.js` подключена тема:

```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Тема автоматически подключается из @battleship/ui
    }
  }
}
```

## 🎯 Принципы дизайна

1. **Контрастность** - Все цвета соответствуют стандартам AA/AAA
2. **Читаемость** - Чёткая иерархия текста
3. **Отзывчивость** - Плавные анимации и переходы
4. **Доступность** - Поддержка клавиатуры и скринридеров
5. **Консистентность** - Единообразие во всех компонентах

## 🔧 Кастомизация

### Переопределение цветов
```css
:root {
  --bg-deep: #0B1214;
  --sonar: #00E08C;
  --torpedo: #FF3B3B;
}
```

### Кастомные анимации
```tsx
<motion.div
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="bg-sonar rounded-full"
/>
```
