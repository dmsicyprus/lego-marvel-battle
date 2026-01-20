import { NextRequest, NextResponse } from "next/server";
import {
  createRoom,
  getRoom,
  getPlayerRoom,
  joinRoom,
  leaveRoom,
  setRoomCharacter,
  startRoomBattle,
  getPlayer,
} from "@/lib/realtime-store";

// POST /api/game/room - Create or join room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, odingerId, name, code, charId } = body;

    if (!odingerId || !name) {
      return NextResponse.json({ error: "odingerId and name required" }, { status: 400 });
    }

    if (action === "create") {
      const room = createRoom(Number(odingerId), name);
      return NextResponse.json({
        status: "created",
        code: room.code,
        room: {
          code: room.code,
          hostId: room.hostId,
          hostName: room.hostName,
          status: room.status,
        },
      });
    }

    if (action === "join") {
      if (!code) {
        return NextResponse.json({ error: "code required" }, { status: 400 });
      }

      const result = joinRoom(code, Number(odingerId), name);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        status: "joined",
        room: {
          code: result.room!.code,
          hostId: result.room!.hostId,
          hostName: result.room!.hostName,
          guestId: result.room!.guestId,
          guestName: result.room!.guestName,
          status: result.room!.status,
        },
      });
    }

    if (action === "select_character") {
      if (!charId) {
        return NextResponse.json({ error: "charId required" }, { status: 400 });
      }

      const player = getPlayer(Number(odingerId));
      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 });
      }

      if (!player.characters.includes(charId)) {
        return NextResponse.json({ error: "Character not owned" }, { status: 400 });
      }

      const room = setRoomCharacter(Number(odingerId), charId);
      if (!room) {
        return NextResponse.json({ error: "Not in a room" }, { status: 400 });
      }

      return NextResponse.json({
        status: "character_selected",
        room: {
          code: room.code,
          hostId: room.hostId,
          hostName: room.hostName,
          hostCharId: room.hostCharId,
          guestId: room.guestId,
          guestName: room.guestName,
          guestCharId: room.guestCharId,
          roomStatus: room.status,
        },
      });
    }

    if (action === "start") {
      const playerRoom = getPlayerRoom(Number(odingerId));
      if (!playerRoom) {
        return NextResponse.json({ error: "Not in a room" }, { status: 400 });
      }

      if (playerRoom.hostId !== Number(odingerId)) {
        return NextResponse.json({ error: "Only host can start" }, { status: 403 });
      }

      const result = startRoomBattle(playerRoom.code);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        status: "started",
        battleId: result.battle!.id,
        battle: {
          player1: {
            odingerId: result.battle!.player1.odingerId,
            name: result.battle!.player1.name,
            charId: result.battle!.player1.charId,
          },
          player2: {
            odingerId: result.battle!.player2.odingerId,
            name: result.battle!.player2.name,
            charId: result.battle!.player2.charId,
          },
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/game/room?odingerId=xxx or ?code=xxx
export async function GET(request: NextRequest) {
  const odingerId = request.nextUrl.searchParams.get("odingerId");
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      code: room.code,
      hostId: room.hostId,
      hostName: room.hostName,
      hostCharId: room.hostCharId,
      guestId: room.guestId,
      guestName: room.guestName,
      guestCharId: room.guestCharId,
      status: room.status,
      battleId: room.battleId,
    });
  }

  if (odingerId) {
    const room = getPlayerRoom(Number(odingerId));
    if (!room) {
      return NextResponse.json({ status: "no_room" });
    }

    return NextResponse.json({
      code: room.code,
      hostId: room.hostId,
      hostName: room.hostName,
      hostCharId: room.hostCharId,
      guestId: room.guestId,
      guestName: room.guestName,
      guestCharId: room.guestCharId,
      status: room.status,
      battleId: room.battleId,
    });
  }

  return NextResponse.json({ error: "odingerId or code required" }, { status: 400 });
}

// DELETE /api/game/room?odingerId=xxx
export async function DELETE(request: NextRequest) {
  const odingerId = request.nextUrl.searchParams.get("odingerId");

  if (!odingerId) {
    return NextResponse.json({ error: "odingerId required" }, { status: 400 });
  }

  leaveRoom(Number(odingerId));

  return NextResponse.json({ status: "left" });
}
