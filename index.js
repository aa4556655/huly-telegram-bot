const { Telegraf } = require('telegraf');
const { Client } = require('@notionhq/client');
const express = require('express');

// 初始化环境变量
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const PORT = process.env.PORT || 3000;

// 验证必需的环境变量
if (!TELEGRAM_BOT_TOKEN) {
  console.error('错误: 缺少 TELEGRAM_BOT_TOKEN 环境变量');
  process.exit(1);
}

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.warn('警告: Notion 配置不完整，Notion 集成将被禁用');
}

// 初始化 Telegram Bot
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// 初始化 Notion Client (如果配置可用)
let notion = null;
if (NOTION_TOKEN && NOTION_DATABASE_ID) {
  notion = new Client({ auth: NOTION_TOKEN });
  console.log('Notion 客户端已初始化');
}

// 监听所有文本消息
bot.on('text', async (ctx) => {
  try {
    const message = ctx.message;
    const text = message.text;
    const user = message.from;
    const chat = message.chat;
    
    console.log(`收到消息来自 ${user.username || user.first_name}: ${text}`);
    
    // 如果 Notion 已配置，保存消息到 Notion
    if (notion) {
      try {
        await notion.pages.create({
          parent: { database_id: NOTION_DATABASE_ID },
          properties: {
            '标题': {
              title: [
                {
                  text: {
                    content: text.substring(0, 100)
                  }
                }
              ]
            },
            '发送者': {
              rich_text: [
                {
                  text: {
                    content: user.username || user.first_name || '未知用户'
                  }
                }
              ]
            },
            '聊天ID': {
              rich_text: [
                {
                  text: {
                    content: String(chat.id)
                  }
                }
              ]
            },
            '完整消息': {
              rich_text: [
                {
                  text: {
                    content: text
                  }
                }
              ]
            }
          }
        });
        console.log('消息已保存到 Notion');
        await ctx.reply('✅ 消息已记录到 Notion');
      } catch (error) {
        console.error('保存到 Notion 失败:', error.message);
        await ctx.reply('❌ 保存失败: ' + error.message);
      }
    } else {
      await ctx.reply('🤖 已收到消息，但 Notion 未配置');
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
  }
});

// 启动命令
bot.command('start', (ctx) => {
  ctx.reply('👋 欢迎使用 Telegram-Notion-Huly 机器人！\n\n发送任何消息，我会将其保存到 Notion 数据库中。');
});

// 状态检查命令
bot.command('status', (ctx) => {
  const status = [
    '🤖 机器人状态:',
    `- Telegram: ✅ 已连接`,
    `- Notion: ${notion ? '✅ 已连接' : '❌ 未配置'}`,
  ].join('\n');
  ctx.reply(status);
});

// 启动 bot
bot.launch().then(() => {
  console.log('🚀 Telegram 机器人已启动');
  console.log('📝 监听 Telegram 消息...');
});

// 创建健康检查端点
const app = express();
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    telegram: 'connected',
    notion: notion ? 'connected' : 'disabled'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 健康检查服务器运行在端口 ${PORT}`);
});

// 优雅退出
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
