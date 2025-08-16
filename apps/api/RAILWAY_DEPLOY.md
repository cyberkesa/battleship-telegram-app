# 🚀 Railway Deployment Guide

## Подготовка к деплою

### 1. Создание проекта на Railway

1. Перейдите на [Railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий

### 2. Настройка базы данных

1. В проекте Railway добавьте новый сервис "PostgreSQL"
2. Скопируйте переменную окружения `DATABASE_URL`
3. Добавьте её в переменные окружения вашего API сервиса

Добавьте сервис "Redis" и подключите переменную `REDIS_URL` — он требуется для очереди матчмейкинга.

### 3. Настройка API сервиса

1. Добавьте новый сервис "GitHub Repo"
2. Выберите репозиторий `battleship-telegram-app`
3. Укажите путь к API: `apps/api`
4. Railway автоматически определит `Dockerfile` и соберет образ

### 4. Переменные окружения (Railway → API сервис)

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (Vercel)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Telegram Bot (если используется)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username

# Redis (если используется очередь матчмейкинга)
REDIS_URL=redis://...

# Environment
NODE_ENV=production
PORT=3000
```

Важно: в нашем образе включен healthcheck `GET /health`. Стартовая команда запускает миграции автоматически перед стартом сервера.

### 5. Деплой и миграции

- При деплое Railway использует `apps/api/railway.json`:
  - `startCommand`: `npm run start:prod:migrate` — выполняет `prisma migrate deploy`, затем стартует сервер
  - `healthcheckPath`: `/api/health`
- Prisma Client генерируется на этапе `postinstall`

### 6. Проверка деплоя

После деплоя проверьте:

1. Health Check: `https://<your-api>.railway.app/health`
2. Базовые эндпойнты:
   - POST `https://<your-api>.railway.app/api/auth/telegram`
   - POST `https://<your-api>.railway.app/api/lobby/create` (требуется JWT)

### 7. Интеграция с фронтендом (Vercel)

- Установите в Vercel переменную окружения для веб-приложения:
  - `VITE_API_URL=https://<your-api>.railway.app/api`
- Пересоберите фронтенд на Vercel.

### 8. Настройка Telegram (если используется)

- В `@BotFather`:
  - `/setmenubutton` — URL: `https://<your-frontend>.vercel.app`
  - `/setcommands` — команды: `start`, `help`, `stats`
- Для вебхука бота (если нужен именно webhook):
  - Настройте публичный URL API и задайте webhook запросом `setWebhook` к Telegram API, указывая `https://<your-api>.railway.app/bot/webhook` (если эндпойнт реализован).

## Команды для локального тестирования

```bash
# Сборка
npm run build

# Запуск в production режиме
npm run start:prod

# Миграция базы данных
npm run db:migrate:prod

# Генерация Prisma клиента
npm run db:generate
```

## Мониторинг

Railway предоставляет:
- Логи в реальном времени
- Метрики производительности
- Автоматическое масштабирование
- SSL сертификаты

## Troubleshooting

### База данных
```bash
# Проверка подключения
npx prisma db pull

# Сброс базы данных (удалит данные!)
npx prisma migrate reset
```

### CORS
Убедитесь, что `FRONTEND_URL` корректно задан и совпадает с Vercel доменом.

### JWT
Проверьте, что `JWT_SECRET` установлен и достаточно сложный.
