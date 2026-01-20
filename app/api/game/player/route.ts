import { NextRequest, NextResponse } from "next/server";
import { createPlayer, getPlayer } from "@/lib/realtime-store";

// POST /api/game/player - Create or get player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { odingerId, name, username, avatar } = body;

    if (!odingerId || !name) {
      return NextResponse.json(
        { error: "odingerId and name required" },
        { status: 400 }
      );
    }

    const player = createPlayer(Number(odingerId), name, username, avatar);

    return NextResponse.json({
      odingerId: player.odingerId,
      name: player.name,
      username: player.username,
      rating: player.rating,
      coins: player.coins,
      characters: player.characters,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/game/player?odingerId=xxx
export async function GET(request: NextRequest) {
  const odingerId = request.nextUrl.searchParams.get("odingerId");

  if (!odingerId) {
    return NextResponse.json({ error: "odingerId required" }, { status: 400 });
  }

  const player = getPlayer(Number(odingerId));

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({
    odingerId: player.odingerId,
    name: player.name,
    username: player.username,
    rating: player.rating,
    coins: player.coins,
    characters: player.characters,
  });
}
