# 🚀 Настройка GitHub репозитория

## 📋 Шаги для создания репозитория:

### 1. **Создать репозиторий на GitHub**
1. Зайти на [github.com](https://github.com)
2. Нажать "New repository"
3. Название: `battleship-telegram-app`
4. Описание: `Battleship game as Telegram Mini App`
5. **НЕ** ставить галочки (Initialize with README, .gitignore, license)
6. Нажать "Create repository"

### 2. **Подключить локальный репозиторий**
```bash
# Добавить remote (замените YOUR_USERNAME на ваше имя пользователя)
git remote add origin https://github.com/YOUR_USERNAME/battleship-telegram-app.git

# Переименовать ветку в main
git branch -M main

# Запушить код
git push -u origin main
```

### 3. **Альтернативный способ (если у вас GitHub CLI)**
```bash
# Создать репозиторий через CLI
gh repo create battleship-telegram-app --public --description "Battleship game as Telegram Mini App"

# Добавить remote и запушить
git remote add origin https://github.com/YOUR_USERNAME/battleship-telegram-app.git
git branch -M main
git push -u origin main
```

## 🔗 После создания репозитория:

### **Деплой на Vercel:**
1. Зайти на [vercel.com](https://vercel.com)
2. "New Project" → Import Git Repository
3. Выбрать `battleship-telegram-app`
4. Настроить:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### **Деплой на Railway:**
1. Зайти на [railway.app](https://railway.app)
2. "New Project" → Deploy from GitHub repo
3. Выбрать `battleship-telegram-app`
4. Настроить переменные окружения

## 📱 Получение URL для Telegram Mini App:

После деплоя вы получите:
- **Frontend URL**: `https://your-app.vercel.app`
- **API URL**: `https://your-api.railway.app`

Используйте Frontend URL для настройки в @BotFather:
```
/setmenubutton - URL: https://your-app.vercel.app
```
