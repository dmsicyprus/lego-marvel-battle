import { NextRequest, NextResponse } from "next/server";
import {
  getBattle,
  finishBattle,
  updateBattleStatus,
  getPlayer,
} from "@/lib/realtime-store";

// GET /api/game/battle?id=xxx - Get battle info
export async function GET(request: NextRequest) {
  const battleId = request.nextUrl.searchParams.get("id");

  if (!battleId) {
    return NextResponse.json({ error: "Battle id required" }, { status: 400 });
  }

  const battle = getBattle(battleId);
  if (!battle) {
    return NextResponse.json({ error: "Battle not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: battle.id,
    player1: {
      odingerId: battle.player1.odingerId,
      name: battle.player1.name,
      charId: battle.player1.charId,
    },
    player2: {
      odingerId: battle.player2.odingerId,
      name: battle.player2.name,
      charId: battle.player2.charId,
    },
    status: battle.status,
    winnerId: battle.winnerId,
    ratingChange: battle.ratingChange,
  });
}

// POST /api/game/battle - Report battle result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { battleId, winnerId, reporterId } = body;

    if (!battleId || !winnerId || !reporterId) {
      return NextResponse.json(
        { error: "battleId, winnerId, and reporterId required" },
        { status: 400 }
      );
    }

    const battle = getBattle(battleId);
    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    if (battle.status === "finished") {
      // Already finished, return existing result
      const winner = getPlayer(battle.winnerId!);
      const loserId = battle.winnerId === battle.player1.odingerId
        ? battle.player2.odingerId
        : battle.player1.odingerId;
      const loser = getPlayer(loserId);

      return NextResponse.json({
        status: "already_finished",
        winnerId: battle.winnerId,
        ratingChange: battle.ratingChange,
        winner: winner ? { rating: winner.rating, coins: winner.coins } : null,
        loser: loser ? { rating: loser.rating, coins: loser.coins } : null,
      });
    }

    // Verify reporter is in this battle
    if (reporterId !== battle.player1.odingerId && reporterId !== battle.player2.odingerId) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Verify winner is in this battle
    if (winnerId !== battle.player1.odingerId && winnerId !== battle.player2.odingerId) {
      return NextResponse.json({ error: "Invalid winner" }, { status: 400 });
    }

    // Finish battle
    const result = finishBattle(battleId, winnerId);

    if (!result) {
      return NextResponse.json({ error: "Failed to finish battle" }, { status: 500 });
    }

    // Reveal opponent rating
    const isReporterWinner = reporterId === winnerId;
    const opponentRating = isReporterWinner
      ? result.loser.rating + result.ratingChange // Loser's old rating
      : result.winner.rating - result.ratingChange; // Winner's old rating

    return NextResponse.json({
      status: "finished",
      winnerId,
      ratingChange: result.ratingChange,
      opponentRating,
      yourNewRating: isReporterWinner ? result.winner.rating : result.loser.rating,
      yourCoins: isReporterWinner ? result.winner.coins : result.loser.coins,
      coinsEarned: isReporterWinner ? 50 : 20,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// PATCH /api/game/battle - Update battle status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { battleId, status } = body;

    if (!battleId || !status) {
      return NextResponse.json(
        { error: "battleId and status required" },
        { status: 400 }
      );
    }

    updateBattleStatus(battleId, status);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
