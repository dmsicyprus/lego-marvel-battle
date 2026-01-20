import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePlayer, getPlayer } from "@/lib/game-store";

// GET /api/player?telegramId=123
export async function GET(request: NextRequest) {
  const telegramId = request.nextUrl.searchParams.get("telegramId");

  if (!telegramId) {
    return NextResponse.json({ error: "telegramId required" }, { status: 400 });
  }

  const player = getPlayer(Number(telegramId));

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}

// POST /api/player - Create or get player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, name, avatar } = body;

    if (!telegramId || !name) {
      return NextResponse.json(
        { error: "telegramId and name required" },
        { status: 400 }
      );
    }

    const player = getOrCreatePlayer(Number(telegramId), name, avatar);

    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
