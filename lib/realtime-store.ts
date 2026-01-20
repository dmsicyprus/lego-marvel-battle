// Real-time game store for PvP matchmaking

export interface Player {
  odingerId: number;
  name: string;
  username?: string;
  avatar?: string;
  rating: number;
  coins: number;
  characters: string[];
  createdAt: Date;
  lastSeen: Date;
}

export interface WaitingPlayer {
  odingerId: number;
  name: string;
  rating: number;
  selectedCharId: string;
  joinedAt: Date;
}

export interface ActiveBattle {
  id: string;
  player1: {
    odingerId: number;
    name: string;
    charId: string;
    rating: number;
  };
  player2: {
    odingerId: number;
    name: string;
    charId: string;
    rating: number;
  };
  status: "waiting" | "ready" | "fighting" | "finished";
  winnerId?: number;
  ratingChange?: number;
  createdAt: Date;
}

// In-memory stores (use Redis in production)
const players = new Map<number, Player>();
const waitingQueue: WaitingPlayer[] = [];
const activeBattles = new Map<string, ActiveBattle>();
const playerBattleMap = new Map<number, string>(); // odingerId -> battleId

// Default values
const STARTER_CHARACTERS = ["spiderman", "hawkeye", "falcon"];
const STARTER_COINS = 500;
const STARTER_RATING = 1000;
const MATCHMAKING_RANGE = 300;

// ============ PLAYER FUNCTIONS ============

export function getPlayer(odingerId: number): Player | undefined {
  return players.get(odingerId);
}

export function createPlayer(odingerId: number, name: string, username?: string, avatar?: string): Player {
  const existing = players.get(odingerId);
  if (existing) {
    existing.name = name;
    existing.username = username;
    existing.avatar = avatar;
    existing.lastSeen = new Date();
    return existing;
  }

  const player: Player = {
    odingerId,
    name,
    username,
    avatar,
    rating: STARTER_RATING,
    coins: STARTER_COINS,
    characters: [...STARTER_CHARACTERS],
    createdAt: new Date(),
    lastSeen: new Date(),
  };
  players.set(odingerId, player);
  return player;
}

export function updatePlayer(odingerId: number, updates: Partial<Player>): Player | undefined {
  const player = players.get(odingerId);
  if (player) {
    Object.assign(player, updates, { lastSeen: new Date() });
  }
  return player;
}

// ============ MATCHMAKING FUNCTIONS ============

export function joinQueue(odingerId: number, name: string, rating: number, selectedCharId: string): { status: "waiting" | "matched"; battle?: ActiveBattle } {
  // Remove from queue if already there
  leaveQueue(odingerId);

  // Check if already in battle
  const existingBattleId = playerBattleMap.get(odingerId);
  if (existingBattleId) {
    const battle = activeBattles.get(existingBattleId);
    if (battle && battle.status !== "finished") {
      return { status: "matched", battle };
    }
  }

  // Try to find opponent
  const opponent = findOpponent(odingerId, rating);

  if (opponent) {
    // Match found! Create battle
    const battle = createBattle(
      { odingerId, name, charId: selectedCharId, rating },
      { odingerId: opponent.odingerId, name: opponent.name, charId: opponent.selectedCharId, rating: opponent.rating }
    );

    // Remove opponent from queue
    leaveQueue(opponent.odingerId);

    return { status: "matched", battle };
  }

  // No opponent found, add to queue
  waitingQueue.push({
    odingerId,
    name,
    rating,
    selectedCharId,
    joinedAt: new Date(),
  });

  return { status: "waiting" };
}

export function leaveQueue(odingerId: number): void {
  const index = waitingQueue.findIndex(p => p.odingerId === odingerId);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
  }
}

export function findOpponent(odingerId: number, rating: number): WaitingPlayer | null {
  // Find closest rating opponent
  let bestMatch: WaitingPlayer | null = null;
  let bestDiff = Infinity;

  for (const player of waitingQueue) {
    if (player.odingerId === odingerId) continue;

    const diff = Math.abs(player.rating - rating);
    if (diff <= MATCHMAKING_RANGE && diff < bestDiff) {
      bestMatch = player;
      bestDiff = diff;
    }
  }

  return bestMatch;
}

export function getQueueStatus(): { count: number; players: WaitingPlayer[] } {
  return {
    count: waitingQueue.length,
    players: [...waitingQueue],
  };
}

export function isInQueue(odingerId: number): boolean {
  return waitingQueue.some(p => p.odingerId === odingerId);
}

// ============ BATTLE FUNCTIONS ============

export function createBattle(
  player1: { odingerId: number; name: string; charId: string; rating: number },
  player2: { odingerId: number; name: string; charId: string; rating: number }
): ActiveBattle {
  const id = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const battle: ActiveBattle = {
    id,
    player1: { ...player1 },
    player2: { ...player2 },
    status: "ready",
    createdAt: new Date(),
  };

  activeBattles.set(id, battle);
  playerBattleMap.set(player1.odingerId, id);
  playerBattleMap.set(player2.odingerId, id);

  return battle;
}

export function getBattle(battleId: string): ActiveBattle | undefined {
  return activeBattles.get(battleId);
}

export function getPlayerBattle(odingerId: number): ActiveBattle | undefined {
  const battleId = playerBattleMap.get(odingerId);
  if (battleId) {
    return activeBattles.get(battleId);
  }
  return undefined;
}

export function updateBattleStatus(battleId: string, status: ActiveBattle["status"]): void {
  const battle = activeBattles.get(battleId);
  if (battle) {
    battle.status = status;
  }
}

export function finishBattle(battleId: string, winnerId: number): { winner: Player; loser: Player; ratingChange: number } | null {
  const battle = activeBattles.get(battleId);
  if (!battle) return null;

  battle.status = "finished";
  battle.winnerId = winnerId;

  const isPlayer1Winner = winnerId === battle.player1.odingerId;
  const winnerData = isPlayer1Winner ? battle.player1 : battle.player2;
  const loserData = isPlayer1Winner ? battle.player2 : battle.player1;

  // Calculate ELO change
  const ratingChange = calculateElo(winnerData.rating, loserData.rating);
  battle.ratingChange = ratingChange;

  // Update players
  const winner = players.get(winnerData.odingerId);
  const loser = players.get(loserData.odingerId);

  if (winner) {
    winner.rating += ratingChange;
    winner.coins += 50;
  }

  if (loser) {
    loser.rating = Math.max(0, loser.rating - ratingChange);
    loser.coins += 20;
  }

  // Clean up
  playerBattleMap.delete(battle.player1.odingerId);
  playerBattleMap.delete(battle.player2.odingerId);

  // Keep battle in history for a while
  setTimeout(() => {
    activeBattles.delete(battleId);
  }, 60000); // Clean up after 1 minute

  return winner && loser ? { winner, loser, ratingChange } : null;
}

function calculateElo(winnerRating: number, loserRating: number, K: number = 32): number {
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return Math.round(K * (1 - expected));
}

// ============ LEADERBOARD ============

export function getLeaderboard(limit: number = 100): Player[] {
  return Array.from(players.values())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getPlayerRank(odingerId: number): number {
  const sorted = Array.from(players.values()).sort((a, b) => b.rating - a.rating);
  const index = sorted.findIndex(p => p.odingerId === odingerId);
  return index + 1;
}

// ============ STATS ============

export function getStats() {
  return {
    totalPlayers: players.size,
    playersInQueue: waitingQueue.length,
    activeBattles: Array.from(activeBattles.values()).filter(b => b.status !== "finished").length,
  };
}
