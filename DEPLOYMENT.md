# 🚀 Развертывание Battleship Telegram Mini App

## 📋 Быстрый деплой

### 1. **Frontend (Vercel)**

```bash
# Установить Vercel CLI
npm i -g vercel

# Войти в аккаунт
vercel login

# Деплой из папки webapp
cd apps/webapp
vercel --prod
```

### 2. **Backend (Railway)**

```bash
# Установить Railway CLI
npm i -g @railway/cli

# Войти в аккаунт
railway login

# Деплой из папки api
cd apps/api
railway init
railway up
```

### 3. **Database (Railway)**

В Railway Dashboard:
1. Создать PostgreSQL сервис
2. Создать Redis сервис
3. Добавить переменные окружения в API сервис

## 🔧 Переменные окружения для Railway

Добавить в Railway Dashboard для API сервиса:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
API_URL=https://your-api-url.railway.app
BOT_WEBHOOK_URL=https://your-api-url.railway.app/bot/webhook
TELEGRAM_BOT_TOKEN=8268205646:AAGYECEZp46KwabaAFOthwmcNoTyP0kuyeo
TELEGRAM_BOT_USERNAME=seabattlekisaBot
JWT_SECRET=8P5T+I+44h+mCguFK8/CSlTZGdb97uakUaQx/TTx1OI=
```

Railway автоматически добавит:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL` (Redis)

## 📱 Настройка Telegram Bot

После получения URL:

1. **В @BotFather:**
```
/setmenubutton - URL: https://your-frontend-url.vercel.app
/setcommands - добавить команды бота
```

2. **Команды бота:**
```
start - Начать игру
help - Помощь
stats - Статистика
```

## 🔗 Получение URL

После деплоя вы получите:
- **Frontend URL**: `https://your-app.vercel.app`
- **API URL**: `https://your-api.railway.app`

Используйте Frontend URL для настройки Mini App в Telegram!
