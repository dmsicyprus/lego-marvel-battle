import { NextRequest, NextResponse } from "next/server";
import {
  getBattle,
  completeBattle,
  calculateEloChange,
  getPlayerBattles,
} from "@/lib/game-store";

// GET /api/battle?id=xxx or /api/battle?telegramId=xxx (history)
export async function GET(request: NextRequest) {
  const battleId = request.nextUrl.searchParams.get("id");
  const telegramId = request.nextUrl.searchParams.get("telegramId");

  if (battleId) {
    const battle = getBattle(battleId);
    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }
    return NextResponse.json(battle);
  }

  if (telegramId) {
    const battles = getPlayerBattles(Number(telegramId));
    return NextResponse.json(battles.slice(0, 20)); // Last 20 battles
  }

  return NextResponse.json({ error: "id or telegramId required" }, { status: 400 });
}

// POST /api/battle - Complete a battle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { battleId, winnerId, log } = body;

    if (!battleId || !winnerId || !log) {
      return NextResponse.json(
        { error: "battleId, winnerId, and log required" },
        { status: 400 }
      );
    }

    const battle = getBattle(battleId);
    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    if (battle.completedAt) {
      return NextResponse.json(
        { error: "Battle already completed" },
        { status: 400 }
      );
    }

    // Calculate ELO change
    const winnerRating = winnerId === battle.player1Id
      ? battle.player1RatingBefore
      : battle.player2RatingBefore;
    const loserRating = winnerId === battle.player1Id
      ? battle.player2RatingBefore
      : battle.player1RatingBefore;

    const ratingChange = calculateEloChange(winnerRating, loserRating);

    // Complete battle
    completeBattle(battleId, winnerId, log, ratingChange);

    const updatedBattle = getBattle(battleId);

    return NextResponse.json({
      battle: updatedBattle,
      ratingChange,
      winnerCoins: 50,
      loserCoins: 20,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
