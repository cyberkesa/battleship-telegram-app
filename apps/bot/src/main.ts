import { Bot, webhookCallback } from 'grammy';
import { run } from '@grammyjs/runner';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Handle /start command
bot.command('start', async (ctx) => {
  const args = ctx.match as string | undefined;
  // Support deep-links like /start join_<lobbyId> and legacy /start join:<lobbyId>
  let lobbyId: string | null = null;
  if (args?.startsWith('join_')) {
    lobbyId = args.slice('join_'.length);
  } else if (args?.startsWith('join:')) {
    lobbyId = args.slice('join:'.length);
  }
  if (lobbyId) {
    const url = process.env.FRONTEND_URL || 'https://battleship-telegram-app-webapp.vercel.app';
    await ctx.reply('Открываю лобби...', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Перейти в лобби', web_app: { url } }]]
      }
    });
    return;
  }
  const welcomeMessage = `
🚢 Добро пожаловать в игру "Морской бой"!

Это классическая игра, где вы сражаетесь с противником, пытаясь потопить все его корабли.

🎮 Как играть:
1. Расставьте свои корабли на поле
2. По очереди стреляйте по полю противника
3. Первый, кто потопит все корабли противника, побеждает!

Нажмите кнопку ниже, чтобы начать игру:
  `;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Начать игру',
            web_app: { url: process.env.FRONTEND_URL! }
          }
        ]
      ]
    }
  });
});

// Handle /help command
bot.command('help', async (ctx) => {
  const helpMessage = `
📖 Правила игры "Морской бой":

🎯 Цель: Первым потопить все корабли противника

🚢 Корабли:
• Авианосец (5 клеток) - 1 штука
• Линкор (4 клетки) - 1 штука  
• Крейсер (3 клетки) - 1 штука
• Подлодка (3 клетки) - 1 штука
• Эсминец (2 клетки) - 1 штука

📋 Правила:
• Корабли можно размещать только горизонтально или вертикально
• Корабли не могут касаться друг друга
• Игроки ходят по очереди
• При попадании ход повторяется
• При промахе ход переходит к противнику

🎮 Команды:
/start - Начать игру
/help - Показать правила
/stats - Ваша статистика
  `;

  await ctx.reply(helpMessage);
});

// Handle /stats command
bot.command('stats', async (ctx) => {
  // TODO: Implement stats from API
  const statsMessage = `
📊 Ваша статистика:

🎮 Игр сыграно: 0
🏆 Побед: 0
💀 Поражений: 0
📈 Процент побед: 0%

Начните игру, чтобы увидеть свою статистику!
  `;

  await ctx.reply(statsMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: { url: process.env.FRONTEND_URL! }
          }
        ]
      ]
    }
  });
});

// Handle web app data
bot.on('message:web_app_data', async (ctx) => {
  const webAppData = ctx.message.web_app_data;
  
  if (webAppData) {
    // Handle web app data if needed
    await ctx.reply('Данные получены! Переходим в игру...');
  }
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  if (ctx.callbackQuery.data === 'play_game') {
    await ctx.editMessageText('Открываем игру...', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 Открыть игру',
              web_app: { url: process.env.FRONTEND_URL! }
            }
          ]
        ]
      }
    });
  }
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start the bot
async function startBot() {
  console.log('🤖 Starting Telegram bot...');
  
  if (process.env.NODE_ENV === 'production') {
    // Use webhook in production
    const handler = webhookCallback(bot, 'express', {
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
    const express = await import('express');
    const srv = express.default();
    srv.post('/bot/webhook', handler);
    const port = process.env.PORT || 3001;
    srv.listen(port, () => console.log(`🤖 Bot webhook listening on ${port}`));
  } else {
    // Use polling in development
    await run(bot);
    console.log('✅ Bot is running in development mode');
  }
}

startBot().catch(console.error);
