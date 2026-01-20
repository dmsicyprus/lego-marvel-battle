#!/usr/bin/env npx tsx
/**
 * Setup Telegram bot webhook
 *
 * Usage:
 *   npx tsx scripts/setup-telegram-webhook.ts <public-url>
 *   npx tsx scripts/setup-telegram-webhook.ts info
 *   npx tsx scripts/setup-telegram-webhook.ts delete
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8291277949:AAEdo6Ljl0JZnl8_O44HN7m42DsIc0lhKh4";

async function setWebhook(publicUrl: string) {
  // Remove trailing slash
  const baseUrl = publicUrl.replace(/\/$/, "");
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

  console.log(`\n🔗 Setting webhook to: ${webhookUrl}\n`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const result = await response.json();

  if (result.ok) {
    console.log("✅ Webhook set successfully!");
    console.log(`\n🤖 Bot is ready at: https://t.me/LegoMarvelBattleBot\n`);

    // Verify
    await getWebhookInfo();
  } else {
    console.error("❌ Failed to set webhook:", result.description);
  }
}

async function getWebhookInfo() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
  const response = await fetch(apiUrl);
  const result = await response.json();

  console.log("\n📋 Webhook Info:");
  console.log(`   URL: ${result.result?.url || "(not set)"}`);
  console.log(`   Pending updates: ${result.result?.pending_update_count || 0}`);
  console.log(`   Last error: ${result.result?.last_error_message || "(none)"}`);
  console.log("");
}

async function deleteWebhook() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drop_pending_updates: true }),
  });
  const result = await response.json();

  if (result.ok) {
    console.log("✅ Webhook deleted");
  } else {
    console.error("❌ Failed:", result.description);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🎮 LEGO Marvel Battle - Telegram Webhook Setup\n");

  if (!command) {
    console.log(`Usage:
  npx tsx scripts/setup-telegram-webhook.ts <url>     Set webhook
  npx tsx scripts/setup-telegram-webhook.ts info      Show current webhook
  npx tsx scripts/setup-telegram-webhook.ts delete    Delete webhook

Examples:
  npx tsx scripts/setup-telegram-webhook.ts https://myapp.up.railway.app
  npx tsx scripts/setup-telegram-webhook.ts https://myapp.vercel.app
`);
    await getWebhookInfo();
    return;
  }

  if (command === "info") {
    await getWebhookInfo();
  } else if (command === "delete") {
    await deleteWebhook();
  } else if (command.startsWith("http")) {
    await setWebhook(command);
  } else {
    console.error("❌ Invalid command. Use a URL, 'info', or 'delete'");
  }
}

main().catch(console.error);
