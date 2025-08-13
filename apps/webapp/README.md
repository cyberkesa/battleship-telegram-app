# 🚢 Battleship Telegram Mini App

## 🚀 Быстрый деплой на Vercel

### 1. **Подготовка**
```bash
npm run build
```

### 2. **Деплой через Vercel Dashboard**
1. Зайти на [vercel.com](https://vercel.com)
2. Создать новый проект
3. Подключить GitHub репозиторий
4. Настроить:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. **Переменные окружения**
Добавить в Vercel:
```
VITE_API_URL=https://your-api-url.railway.app/api
```

### 4. **Получить URL**
После деплоя вы получите URL вида:
`https://your-app.vercel.app`

Используйте этот URL для настройки Telegram Mini App!

## 📱 Настройка Telegram Bot

В @BotFather:
```
/setmenubutton - URL: https://your-app.vercel.app
```

## 🔧 Локальная разработка
```bash
npm run dev
```
