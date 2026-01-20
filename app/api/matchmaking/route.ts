import { NextRequest, NextResponse } from "next/server";
import {
  joinMatchmaking,
  leaveMatchmaking,
  findMatch,
  getPlayer,
  createBattle,
  getMatchmakingQueue,
} from "@/lib/game-store";

// POST /api/matchmaking - Join matchmaking queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, name, selectedCharId } = body;

    if (!telegramId || !name || !selectedCharId) {
      return NextResponse.json(
        { error: "telegramId, name, and selectedCharId required" },
        { status: 400 }
      );
    }

    const player = getPlayer(Number(telegramId));
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player owns the character
    if (!player.characters.includes(selectedCharId)) {
      return NextResponse.json(
        { error: "Character not owned" },
        { status: 400 }
      );
    }

    // Join queue
    joinMatchmaking({
      odinger: Number(telegramId),
      odingername: name,
      rating: player.rating,
      selectedCharId,
      joinedAt: new Date(),
    });

    // Try to find a match
    const opponent = findMatch(Number(telegramId));

    if (opponent) {
      // Match found! Create battle
      const myEntry = getMatchmakingQueue().find(e => e.odinger === Number(telegramId));
      if (myEntry) {
        const battle = createBattle(myEntry, opponent);
        return NextResponse.json({
          status: "matched",
          battleId: battle.id,
          opponent: {
            name: opponent.odingername,
            characterId: opponent.selectedCharId,
            // Rating is hidden!
          },
        });
      }
    }

    return NextResponse.json({
      status: "searching",
      queuePosition: getMatchmakingQueue().length,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/matchmaking - Leave queue
export async function DELETE(request: NextRequest) {
  const telegramId = request.nextUrl.searchParams.get("telegramId");

  if (!telegramId) {
    return NextResponse.json({ error: "telegramId required" }, { status: 400 });
  }

  leaveMatchmaking(Number(telegramId));

  return NextResponse.json({ status: "left" });
}

// GET /api/matchmaking - Check status
export async function GET(request: NextRequest) {
  const telegramId = request.nextUrl.searchParams.get("telegramId");

  if (!telegramId) {
    return NextResponse.json({ error: "telegramId required" }, { status: 400 });
  }

  const queue = getMatchmakingQueue();
  const myEntry = queue.find(e => e.odinger === Number(telegramId));

  if (!myEntry) {
    return NextResponse.json({ status: "not_in_queue" });
  }

  // Try to find match
  const opponent = findMatch(Number(telegramId));

  if (opponent) {
    const battle = createBattle(myEntry, opponent);
    return NextResponse.json({
      status: "matched",
      battleId: battle.id,
      opponent: {
        name: opponent.odingername,
        characterId: opponent.selectedCharId,
      },
    });
  }

  return NextResponse.json({
    status: "searching",
    queuePosition: queue.indexOf(myEntry) + 1,
    totalInQueue: queue.length,
  });
}
