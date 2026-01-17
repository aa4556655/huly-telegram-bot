# huly-telegram-bot
Telegram Bot integrated with Huly workspace for task management
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Bot 信息验证
bot.telegram.getMe().then((botInfo) => {
  console.log(`✅ Bot 启动成功: @${botInfo.username}`);
});

// /start 命令
bot.command('start', (ctx) => {
  ctx.reply(`👋 欢迎使用 ${ctx.botInfo.first_name}!\n\n` +
    `🔗 已连接到 Huly 工作区: baichuan\n\n` +
    `可用命令:\n` +
    `/ping - 测试连接\n` +
    `/help - 查看帮助`
  );
});

// /ping 命令
bot.command('ping', (ctx) => {
  ctx.reply('🏓 Pong! Bot 运行正常');
});

// /help 命令
bot.command('help', (ctx) => {
  ctx.reply(`📖 帮助信息\n\n` +
    `这个 Bot 集成了 Huly 工作区 baichuan\n` +
    `更多功能开发中...`
  );
});

// 启动 Bot
bot.launch();

// 优雅退出
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
