// In-memory game store (replace with database in production)

export interface Player {
  odinger: number;
  odingername: string;
  avatar?: string;
  rating: number;
  coins: number;
  characters: string[];
  createdAt: Date;
  lastBattle?: Date;
}

export interface Battle {
  id: string;
  player1Id: number;
  player2Id: number;
  player1CharId: string;
  player2CharId: string;
  winnerId?: number;
  player1RatingBefore: number;
  player2RatingBefore: number;
  ratingChange: number;
  log: BattleLogEntry[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BattleLogEntry {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  ability?: string;
  critical?: boolean;
}

export interface MatchmakingEntry {
  odinger: number;
  odingername: string;
  rating: number;
  selectedCharId: string;
  joinedAt: Date;
}

// In-memory stores
const players = new Map<number, Player>();
const battles = new Map<string, Battle>();
const matchmakingQueue: MatchmakingEntry[] = [];

// Default characters for new players
const STARTER_CHARACTERS = ["spiderman", "hawkeye", "falcon"];
const STARTER_COINS = 500;
const STARTER_RATING = 1000;

// Player functions
export function getPlayer(telegramId: number): Player | undefined {
  return players.get(telegramId);
}

export function createPlayer(telegramId: number, name: string, avatar?: string): Player {
  const player: Player = {
    odinger: telegramId,
    odingername: name,
    avatar,
    rating: STARTER_RATING,
    coins: STARTER_COINS,
    characters: [...STARTER_CHARACTERS],
    createdAt: new Date(),
  };
  players.set(telegramId, player);
  return player;
}

export function getOrCreatePlayer(telegramId: number, name: string, avatar?: string): Player {
  let player = getPlayer(telegramId);
  if (!player) {
    player = createPlayer(telegramId, name, avatar);
  }
  return player;
}

export function updatePlayerRating(telegramId: number, newRating: number): void {
  const player = players.get(telegramId);
  if (player) {
    player.rating = newRating;
    player.lastBattle = new Date();
  }
}

export function addCoins(telegramId: number, amount: number): void {
  const player = players.get(telegramId);
  if (player) {
    player.coins += amount;
  }
}

export function addCharacter(telegramId: number, characterId: string): boolean {
  const player = players.get(telegramId);
  if (player && !player.characters.includes(characterId)) {
    player.characters.push(characterId);
    return true;
  }
  return false;
}

// Matchmaking functions
export function joinMatchmaking(entry: MatchmakingEntry): void {
  // Remove if already in queue
  leaveMatchmaking(entry.odinger);
  matchmakingQueue.push(entry);
}

export function leaveMatchmaking(telegramId: number): void {
  const index = matchmakingQueue.findIndex(e => e.odinger === telegramId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
}

export function findMatch(telegramId: number, ratingRange: number = 200): MatchmakingEntry | null {
  const player = matchmakingQueue.find(e => e.odinger === telegramId);
  if (!player) return null;

  const opponent = matchmakingQueue.find(e =>
    e.odinger !== telegramId &&
    Math.abs(e.rating - player.rating) <= ratingRange
  );

  return opponent || null;
}

export function getMatchmakingQueue(): MatchmakingEntry[] {
  return [...matchmakingQueue];
}

// Battle functions
export function createBattle(
  player1: MatchmakingEntry,
  player2: MatchmakingEntry
): Battle {
  const id = `battle_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const battle: Battle = {
    id,
    player1Id: player1.odinger,
    player2Id: player2.odinger,
    player1CharId: player1.selectedCharId,
    player2CharId: player2.selectedCharId,
    player1RatingBefore: player1.rating,
    player2RatingBefore: player2.rating,
    ratingChange: 0,
    log: [],
    createdAt: new Date(),
  };

  battles.set(id, battle);

  // Remove both from matchmaking
  leaveMatchmaking(player1.odinger);
  leaveMatchmaking(player2.odinger);

  return battle;
}

export function getBattle(id: string): Battle | undefined {
  return battles.get(id);
}

export function completeBattle(
  id: string,
  winnerId: number,
  log: BattleLogEntry[],
  ratingChange: number
): void {
  const battle = battles.get(id);
  if (battle) {
    battle.winnerId = winnerId;
    battle.log = log;
    battle.ratingChange = ratingChange;
    battle.completedAt = new Date();

    // Update player ratings
    const loserId = winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
    const winnerOldRating = winnerId === battle.player1Id ? battle.player1RatingBefore : battle.player2RatingBefore;
    const loserOldRating = loserId === battle.player1Id ? battle.player1RatingBefore : battle.player2RatingBefore;

    updatePlayerRating(winnerId, winnerOldRating + ratingChange);
    updatePlayerRating(loserId, Math.max(0, loserOldRating - ratingChange));

    // Add coins
    addCoins(winnerId, 50);
    addCoins(loserId, 20);
  }
}

export function getPlayerBattles(telegramId: number): Battle[] {
  return Array.from(battles.values())
    .filter(b => b.player1Id === telegramId || b.player2Id === telegramId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Leaderboard
export function getLeaderboard(limit: number = 100): Player[] {
  return Array.from(players.values())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// ELO calculation
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  K: number = 32
): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return Math.round(K * (1 - expectedWinner));
}
