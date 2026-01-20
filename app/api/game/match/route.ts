import { NextRequest, NextResponse } from "next/server";
import {
  joinQueue,
  leaveQueue,
  isInQueue,
  getPlayerBattle,
  getQueueStatus,
  getPlayer,
} from "@/lib/realtime-store";

// POST /api/game/match - Join matchmaking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { odingerId, name, selectedCharId } = body;

    if (!odingerId || !name || !selectedCharId) {
      return NextResponse.json(
        { error: "odingerId, name, and selectedCharId required" },
        { status: 400 }
      );
    }

    const player = getPlayer(Number(odingerId));
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player owns character
    if (!player.characters.includes(selectedCharId)) {
      return NextResponse.json({ error: "Character not owned" }, { status: 400 });
    }

    // Try to join matchmaking
    const result = joinQueue(
      Number(odingerId),
      name,
      player.rating,
      selectedCharId
    );

    if (result.status === "matched" && result.battle) {
      // Determine who is opponent
      const isPlayer1 = result.battle.player1.odingerId === Number(odingerId);
      const opponent = isPlayer1 ? result.battle.player2 : result.battle.player1;

      return NextResponse.json({
        status: "matched",
        battleId: result.battle.id,
        opponent: {
          odingerId: opponent.odingerId,
          name: opponent.name,
          charId: opponent.charId,
          // Rating hidden!
        },
        myCharId: selectedCharId,
      });
    }

    const queueStatus = getQueueStatus();
    return NextResponse.json({
      status: "searching",
      queuePosition: queueStatus.count,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/game/match?odingerId=xxx - Check match status
export async function GET(request: NextRequest) {
  const odingerId = request.nextUrl.searchParams.get("odingerId");

  if (!odingerId) {
    return NextResponse.json({ error: "odingerId required" }, { status: 400 });
  }

  const id = Number(odingerId);

  // Check if player has active battle
  const battle = getPlayerBattle(id);
  if (battle && battle.status !== "finished") {
    const isPlayer1 = battle.player1.odingerId === id;
    const me = isPlayer1 ? battle.player1 : battle.player2;
    const opponent = isPlayer1 ? battle.player2 : battle.player1;

    return NextResponse.json({
      status: "matched",
      battleId: battle.id,
      battleStatus: battle.status,
      opponent: {
        odingerId: opponent.odingerId,
        name: opponent.name,
        charId: opponent.charId,
      },
      myCharId: me.charId,
    });
  }

  // Check if in queue
  if (isInQueue(id)) {
    const queueStatus = getQueueStatus();
    return NextResponse.json({
      status: "searching",
      queuePosition: queueStatus.players.findIndex(p => p.odingerId === id) + 1,
      totalInQueue: queueStatus.count,
    });
  }

  return NextResponse.json({ status: "idle" });
}

// DELETE /api/game/match?odingerId=xxx - Leave queue
export async function DELETE(request: NextRequest) {
  const odingerId = request.nextUrl.searchParams.get("odingerId");

  if (!odingerId) {
    return NextResponse.json({ error: "odingerId required" }, { status: 400 });
  }

  leaveQueue(Number(odingerId));

  return NextResponse.json({ status: "left" });
}
