# 🚀 Развертывание Battleship Telegram Mini App

## 📋 Быстрый деплой

### 1. Frontend (Vercel)

```bash
# Установить Vercel CLI
npm i -g vercel

# Войти в аккаунт
vercel login

# Деплой из папки webapp
cd apps/webapp
vercel --prod
```

В Vercel установите переменную окружения:
- `VITE_API_URL=https://<your-api>.railway.app/api`

### 2. Backend (Railway)

```bash
# Установить Railway CLI
npm i -g @railway/cli

# Войти в аккаунт
railway login

# Подключить репозиторий и выбрать корень проекта
cd /workspace/battleship-telegram-app
railway init
railway up
```

Railway возьмёт `railway.json` из корня и использует `apps/api/Dockerfile`.

### 3. Database + Redis (Railway)

В Railway Dashboard:
1. Создайте PostgreSQL сервис (получите `DATABASE_URL`)
2. Создайте Redis сервис (получите `REDIS_URL`)
3. В сервисе API задайте переменные окружения:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL=https://<your-frontend>.vercel.app`
   - `NODE_ENV=production`
   - `PORT=3000`
   - (опционально) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`

Миграции выполняются автоматически на старте (`start:prod:migrate`).

## 🔧 Полное руководство Railway

См. файл `apps/api/RAILWAY_DEPLOY.md` для подробной инструкции: healthcheck (`/health`), команды и troubleshooting.

## 📱 Telegram Bot

В `@BotFather`:
- `/setmenubutton` → `https://<your-frontend>.vercel.app`
- `/setcommands` → `start`, `help`, `stats`

(Если используете webhook) настройте URL `https://<your-api>.railway.app/bot/webhook`.

