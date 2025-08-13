# Инструкции по развертыванию

## Локальная разработка

### Предварительные требования

- Node.js 20+
- Docker и Docker Compose
- Telegram Bot Token (получить у @BotFather)

### Установка и запуск

1. **Клонирование и установка зависимостей**
```bash
git clone <repository>
cd battleship
npm install
```

2. **Настройка переменных окружения**
```bash
cp env.example .env
# Отредактируйте .env файл, добавив ваш Telegram Bot Token
```

3. **Запуск базы данных**
```bash
docker-compose up -d
```

4. **Настройка базы данных**
```bash
# Генерация Prisma клиента
npm run db:generate

# Запуск миграций
npm run db:migrate

# (Опционально) Открыть Prisma Studio
npm run db:studio
```

5. **Запуск в режиме разработки**
```bash
# Запуск всех сервисов
npm run dev

# Или запуск отдельных сервисов:
# API
cd apps/api && npm run dev

# Web App
cd apps/webapp && npm run dev

# Bot
cd apps/bot && npm run dev
```

## Продакшн развертывание

### Вариант 1: Vercel + Fly.io

#### Frontend (Vercel)

1. **Подготовка к деплою**
```bash
cd apps/webapp
npm run build
```

2. **Деплой на Vercel**
```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

3. **Настройка переменных окружения в Vercel**
- `VITE_API_URL` - URL вашего API

#### Backend (Fly.io)

1. **Установка Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Деплой API**
```bash
cd apps/api
fly launch
fly deploy
```

3. **Деплой Bot**
```bash
cd apps/bot
fly launch
fly deploy
```

4. **Настройка переменных окружения в Fly.io**
```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set REDIS_URL="redis://..."
fly secrets set TELEGRAM_BOT_TOKEN="your_bot_token"
fly secrets set JWT_SECRET="your_jwt_secret"
```

### Вариант 2: Railway

1. **Подключение к Railway**
```bash
npm install -g @railway/cli
railway login
```

2. **Деплой сервисов**
```bash
# API
cd apps/api
railway init
railway up

# Web App
cd apps/webapp
railway init
railway up

# Bot
cd apps/bot
railway init
railway up
```

3. **Настройка переменных окружения в Railway Dashboard**

### Вариант 3: DigitalOcean App Platform

1. **Создание приложений в DigitalOcean**
2. **Подключение GitHub репозитория**
3. **Настройка переменных окружения**
4. **Деплой**

## Настройка Telegram Bot

### 1. Создание бота

1. Отправьте `/newbot` @BotFather в Telegram
2. Следуйте инструкциям для создания бота
3. Сохраните полученный токен

### 2. Настройка Web App

1. Отправьте `/setmenubutton` @BotFather
2. Выберите вашего бота
3. Укажите URL вашего Mini App
4. Укажите текст кнопки (например, "🎮 Играть")

### 3. Настройка команд

Отправьте `/setcommands` @BotFather и добавьте:
```
start - Начать игру
help - Правила игры
stats - Статистика
```

### 4. Настройка Webhook (для продакшна)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/bot/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

## Настройка базы данных

### PostgreSQL

#### Локально (Docker)
```bash
docker-compose up -d postgres
```

#### Продакшн
- **Supabase**: Создайте проект и получите connection string
- **Railway**: Создайте PostgreSQL сервис
- **DigitalOcean**: Создайте managed database

### Redis

#### Локально (Docker)
```bash
docker-compose up -d redis
```

#### Продакшн
- **Upstash**: Создайте Redis database
- **Railway**: Создайте Redis сервис
- **DigitalOcean**: Создайте managed Redis

## SSL и домены

### Для продакшна обязательно:

1. **SSL сертификат** (автоматически в Vercel/Fly.io/Railway)
2. **Настройка CORS** в API
3. **Валидация Telegram Web App** (проверка initData)

### Настройка CORS в API

```typescript
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-domain.com'
  ],
  credentials: true,
});
```

## Мониторинг

### Логирование

1. **Sentry** для отслеживания ошибок
2. **Pino** для структурированных логов
3. **Logtail** для централизованного логирования

### Метрики

1. **Prometheus** + **Grafana**
2. **DataDog**
3. **New Relic**

## Безопасность

### Обязательные меры:

1. **Валидация Telegram initData** на сервере
2. **Rate limiting** для API endpoints
3. **JWT токены** с коротким временем жизни
4. **HTTPS** для всех соединений
5. **Валидация входных данных** на сервере

### Дополнительные меры:

1. **Helmet.js** для HTTP заголовков
2. **CORS** настройки
3. **Input sanitization**
4. **SQL injection protection** (Prisma автоматически)
5. **XSS protection**

## Масштабирование

### Горизонтальное масштабирование:

1. **Load balancer** для API
2. **Redis cluster** для сессий
3. **Database read replicas**
4. **CDN** для статических файлов

### Вертикальное масштабирование:

1. **Увеличение ресурсов** серверов
2. **Database optimization**
3. **Caching strategies**
4. **Connection pooling**
