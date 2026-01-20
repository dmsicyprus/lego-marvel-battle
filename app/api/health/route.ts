import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "not set",
    },
  });
}
