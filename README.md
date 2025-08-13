# 🚢 Battleship Telegram Mini App

Полноценная игра "Морской бой" как Telegram Mini App с real-time геймплеем.

## 🏗️ Архитектура

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + NestJS + Fastify
- **Bot**: Node.js + grammY
- **Database**: PostgreSQL + Prisma
- **Cache/Queue**: Redis
- **Real-time**: Server-Sent Events (SSE)

## 📁 Структура проекта

```
battleship/
├── apps/
│   ├── webapp/          # Telegram Mini App (React)
│   ├── api/             # Backend API (NestJS)
│   └── bot/             # Telegram Bot (grammY)
├── packages/
│   ├── game-logic/      # Общая игровая логика
│   ├── shared-types/    # Общие TypeScript типы
│   └── ui/              # Общие UI компоненты
└── docs/                # Документация
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 20+
- Docker (для PostgreSQL и Redis)
- Telegram Bot Token

### Установка

```bash
# Клонирование и установка зависимостей
git clone <repository>
cd battleship
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск базы данных
docker-compose up -d

# Генерация Prisma клиента
npm run db:generate

# Запуск миграций
npm run db:migrate

# Запуск в режиме разработки
npm run dev
```

### Переменные окружения

Создайте `.env` файл в корне проекта:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/battleship"
REDIS_URL="redis://localhost:6379"

# Telegram
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_BOT_USERNAME="your_bot_username"

# JWT
JWT_SECRET="your_jwt_secret"

# App URLs
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:3000"
BOT_WEBHOOK_URL="https://your-domain.com/bot/webhook"
```

## 🎮 Игровой процесс

1. **Регистрация**: Пользователь открывает Mini App через бота
2. **Матчмейкинг**: Поиск соперника через Redis очередь
3. **Расстановка**: Игроки расставляют корабли на своих полях
4. **Битва**: Поочередные ходы с real-time обновлениями
5. **Победа**: Определение победителя и статистика

## 🔒 Безопасность

- Верификация Telegram `initData` для аутентификации
- Сервер-авторитарная игровая логика
- Rate limiting и анти-чит
- Валидация всех игровых действий на сервере

## 📊 Мониторинг

- Sentry для отслеживания ошибок
- Pino для логирования
- Метрики производительности

## 🚀 Деплой

### Frontend (Vercel)
```bash
cd apps/webapp
vercel --prod
```

### Backend (Fly.io)
```bash
cd apps/api
fly deploy
```

### Bot (Fly.io)
```bash
cd apps/bot
fly deploy
```

## 📝 Лицензия

MIT
