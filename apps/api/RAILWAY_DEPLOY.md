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

### 3. Настройка API сервиса

1. Добавьте новый сервис "GitHub Repo"
2. Выберите репозиторий `battleship-telegram-app`
3. Укажите путь к API: `apps/api`
4. Настройте переменные окружения

### 4. Переменные окружения

Добавьте следующие переменные в Railway:

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Telegram Bot (если используется)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username

# Redis (опционально)
REDIS_URL=redis://...

# Environment
NODE_ENV=production
PORT=3000
```

### 5. Настройка деплоя

Railway автоматически:
- Обнаружит Dockerfile
- Установит зависимости
- Соберет приложение
- Запустит миграции базы данных
- Запустит сервер

### 6. Проверка деплоя

После деплоя проверьте:

1. **Health Check**: `https://your-api.railway.app/api/health`
2. **API Endpoints**: `https://your-api.railway.app/api/lobby/create`

### 7. Обновление фронтенда

Обновите URL API в веб-приложении:

```typescript
// apps/webapp/src/services/api.ts
const API_BASE_URL = 'https://your-api.railway.app/api';
```

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

### Проблемы с базой данных
```bash
# Проверка подключения
npx prisma db pull

# Сброс базы данных
npx prisma migrate reset
```

### Проблемы с CORS
Убедитесь, что `FRONTEND_URL` правильно настроен в переменных окружения.

### Проблемы с JWT
Проверьте, что `JWT_SECRET` установлен и достаточно сложный.
