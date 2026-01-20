import { NextRequest, NextResponse } from "next/server";
import { Bot, webhookCallback } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;

// Ensure URL has https://
function normalizeUrl(url: string): string {
  if (!url) return "https://lego-marvel-battle-production.up.railway.app";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

const appUrl = normalizeUrl(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "");

if (!token) {
  console.warn("TELEGRAM_BOT_TOKEN not set");
}

const bot = token ? new Bot(token) : null;

if (bot) {
  // /start command
  bot.command("start", async (ctx) => {
    const webAppUrl = appUrl;
    const payload = ctx.match; // Get start parameter (e.g., "join_ABCD")

    // Check if joining a room
    if (payload && payload.startsWith("join_")) {
      const roomCode = payload.replace("join_", "");
      await ctx.reply(
        `⚔️ *Приглашение в бой!*\n\n` +
        `Тебя пригласили в комнату: *${roomCode}*\n\n` +
        `Нажми кнопку ниже чтобы присоединиться!`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⚔️ Присоединиться к бою",
                  web_app: { url: `${webAppUrl}?room=${roomCode}` },
                },
              ],
            ],
          },
        }
      );
      return;
    }

    await ctx.reply(
      `⚔️ *LEGO Marvel Battle*\n\n` +
      `Добро пожаловать в игру! Выбирай героя Marvel и сражайся с другими игроками!\n\n` +
      `🎮 *Как играть:*\n` +
      `1. Нажми кнопку ниже чтобы открыть игру\n` +
      `2. Выбери персонажа\n` +
      `3. Найди соперника\n` +
      `4. Смотри автоматический бой!\n\n` +
      `🏆 Побеждай и поднимайся в рейтинге!`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎮 Играть",
                web_app: { url: webAppUrl },
              },
            ],
            [
              {
                text: "📊 Статистика",
                callback_data: "stats",
              },
              {
                text: "🏆 Топ игроков",
                callback_data: "leaderboard",
              },
            ],
          ],
        },
      }
    );
  });

  // /play command - quick play button
  bot.command("play", async (ctx) => {
    await ctx.reply("🎮 Нажми чтобы начать игру!", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⚔️ Начать бой",
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    });
  });

  // /help command
  bot.command("help", async (ctx) => {
    await ctx.reply(
      `📖 *Справка по LEGO Marvel Battle*\n\n` +
      `*Команды:*\n` +
      `/start - Начать игру\n` +
      `/play - Быстрый вход в игру\n` +
      `/stats - Ваша статистика\n` +
      `/top - Топ-10 игроков\n` +
      `/help - Эта справка\n\n` +
      `*Персонажи:*\n` +
      `🟡 S-Tier: Thanos, Thor, Scarlet Witch\n` +
      `🟣 A-Tier: Iron Man, Cap, Hulk, Spider-Man\n` +
      `🔵 B-Tier: Black Panther, Wolverine, Deadpool\n` +
      `⚪ C-Tier: Hawkeye, Ant-Man, Falcon\n\n` +
      `*Рейтинг:*\n` +
      `🥉 Bronze: 0-999\n` +
      `🥈 Silver: 1000-1299\n` +
      `🥇 Gold: 1300-1599\n` +
      `💎 Platinum: 1600-1899\n` +
      `💠 Diamond: 1900-2199\n` +
      `👑 Master: 2200-2499\n` +
      `🏆 Grandmaster: 2500+`,
      { parse_mode: "Markdown" }
    );
  });

  // Callback queries
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data === "stats") {
      await ctx.answerCallbackQuery({
        text: "Статистика доступна в игре!",
        show_alert: false,
      });
    } else if (data === "leaderboard") {
      await ctx.answerCallbackQuery({
        text: "Топ игроков доступен в игре!",
        show_alert: false,
      });
    }
  });
}

// Webhook handler
export async function POST(request: NextRequest) {
  if (!bot) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  try {
    const handler = webhookCallback(bot, "std/http");
    return handler(request);
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

// Verify webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    bot: !!bot,
    appUrl: appUrl,
  });
}
