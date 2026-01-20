import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getPlayerRank, getStats } from "@/lib/realtime-store";

// GET /api/game/leaderboard?limit=100&odingerId=xxx
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const odingerId = request.nextUrl.searchParams.get("odingerId");

  const limit = limitParam ? Number(limitParam) : 100;
  const leaderboard = getLeaderboard(limit);

  let myRank: number | null = null;
  if (odingerId) {
    myRank = getPlayerRank(Number(odingerId));
  }

  const stats = getStats();

  return NextResponse.json({
    players: leaderboard.map((p, i) => ({
      rank: i + 1,
      odingerId: p.odingerId,
      name: p.name,
      username: p.username,
      rating: p.rating,
    })),
    myRank,
    stats,
  });
}
