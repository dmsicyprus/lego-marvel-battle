#!/usr/bin/env npx tsx
/**
 * Script to set up Telegram bot webhook
 *
 * Usage:
 *   npx tsx scripts/setup-telegram-webhook.ts <public-url>
 *
 * Example:
 *   npx tsx scripts/setup-telegram-webhook.ts https://your-domain.ngrok.io
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8291277949:AAEdo6Ljl0JZnl8_O44HN7m42DsIc0lhKh4";

async function setWebhook(publicUrl: string) {
  const webhookUrl = `${publicUrl}/api/telegram/webhook`;
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

  console.log(`Setting webhook to: ${webhookUrl}`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  const result = await response.json();
  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.ok) {
    console.log("\n✅ Webhook set successfully!");
    console.log(`\nBot is ready at: https://t.me/LegoMarvelBattleBot`);
  } else {
    console.error("\n❌ Failed to set webhook");
  }
}

async function getWebhookInfo() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
  const response = await fetch(apiUrl);
  const result = await response.json();
  console.log("Current webhook info:", JSON.stringify(result, null, 2));
  return result;
}

async function deleteWebhook() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  const response = await fetch(apiUrl);
  const result = await response.json();
  console.log("Delete webhook result:", JSON.stringify(result, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "info") {
    await getWebhookInfo();
  } else if (command === "delete") {
    await deleteWebhook();
  } else if (command && command.startsWith("http")) {
    await setWebhook(command);
  } else {
    console.log(`
Telegram Webhook Setup Script

Usage:
  npx tsx scripts/setup-telegram-webhook.ts <public-url>  - Set webhook URL
  npx tsx scripts/setup-telegram-webhook.ts info          - Get current webhook info
  npx tsx scripts/setup-telegram-webhook.ts delete        - Delete webhook

Examples:
  npx tsx scripts/setup-telegram-webhook.ts https://abc123.ngrok.io
  npx tsx scripts/setup-telegram-webhook.ts https://your-domain.com
`);

    // Show current info
    console.log("\nCurrent webhook status:");
    await getWebhookInfo();
  }
}

main().catch(console.error);
