import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getPlayer } from "@/lib/game-store";

// GET /api/leaderboard?limit=100&telegramId=xxx
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const telegramId = request.nextUrl.searchParams.get("telegramId");

  const limit = limitParam ? Number(limitParam) : 100;
  const leaderboard = getLeaderboard(limit);

  let myPosition: number | null = null;
  if (telegramId) {
    const fullLeaderboard = getLeaderboard(10000);
    const index = fullLeaderboard.findIndex(p => p.odinger === Number(telegramId));
    myPosition = index !== -1 ? index + 1 : null;
  }

  return NextResponse.json({
    players: leaderboard.map((p, i) => ({
      position: i + 1,
      name: p.odingername,
      rating: p.rating,
      avatar: p.avatar,
    })),
    myPosition,
  });
}
