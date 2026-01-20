"use client";

import { useState, useEffect, useCallback } from "react";
import { Swords, Trophy, Users, Sparkles, Shield, Zap, Heart, Share2, Loader2 } from "lucide-react";
import { LegoCharacter } from "@/components/LegoCharacter";
import { useTelegram } from "@/contexts/TelegramContext";
import { hapticImpact, hapticNotification, hapticSelection } from "@/lib/telegram";

// Marvel Characters Data
const characters = [
  // S-Tier
  { id: "thanos", name: "Thanos", tier: "S", hp: 1200, attack: 95, defense: 85, speed: 60, ability: "Infinity Snap" },
  { id: "thor", name: "Thor", tier: "S", hp: 1000, attack: 90, defense: 70, speed: 75, ability: "Bifrost Strike" },
  { id: "scarlet", name: "Scarlet Witch", tier: "S", hp: 800, attack: 100, defense: 50, speed: 80, ability: "Reality Warp" },
  // A-Tier
  { id: "ironman", name: "Iron Man", tier: "A", hp: 900, attack: 85, defense: 75, speed: 70, ability: "Nano Repulsor" },
  { id: "cap", name: "Captain America", tier: "A", hp: 950, attack: 70, defense: 90, speed: 65, ability: "Vibranium Shield" },
  { id: "hulk", name: "Hulk", tier: "A", hp: 1500, attack: 80, defense: 60, speed: 40, ability: "Rage Mode" },
  { id: "spiderman", name: "Spider-Man", tier: "A", hp: 700, attack: 75, defense: 55, speed: 95, ability: "Web Dodge" },
  { id: "strange", name: "Doctor Strange", tier: "A", hp: 750, attack: 88, defense: 45, speed: 85, ability: "Mirror Dimension" },
  // B-Tier
  { id: "panther", name: "Black Panther", tier: "B", hp: 850, attack: 78, defense: 80, speed: 85, ability: "Kinetic Charge" },
  { id: "marvel", name: "Captain Marvel", tier: "B", hp: 900, attack: 82, defense: 65, speed: 90, ability: "Binary Form" },
  { id: "wolverine", name: "Wolverine", tier: "B", hp: 800, attack: 75, defense: 60, speed: 80, ability: "Regeneration" },
  { id: "deadpool", name: "Deadpool", tier: "B", hp: 750, attack: 70, defense: 50, speed: 75, ability: "4th Wall Break" },
  // C-Tier
  { id: "hawkeye", name: "Hawkeye", tier: "C", hp: 600, attack: 68, defense: 45, speed: 88, ability: "Precision Shot" },
  { id: "antman", name: "Ant-Man", tier: "C", hp: 550, attack: 60, defense: 40, speed: 85, ability: "Size Shift" },
  { id: "falcon", name: "Falcon", tier: "C", hp: 650, attack: 65, defense: 50, speed: 90, ability: "Redwing" },
];

type Character = typeof characters[0];

interface PlayerData {
  odingerId: number;
  name: string;
  username?: string;
  rating: number;
  coins: number;
  characters: string[];
}

interface BattleLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  ability?: string;
  critical?: boolean;
}

export default function Home() {
  const { user, isReady, webApp, isTelegram } = useTelegram();
  const [screen, setScreen] = useState<"loading" | "home" | "collection" | "searching" | "battle" | "result" | "leaderboard">("loading");
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [battleState, setBattleState] = useState<{
    battleId: string;
    player: { char: Character; hp: number };
    opponent: { char: Character; hp: number; name: string; odingerId?: number };
    logs: BattleLog[];
    round: number;
    winner?: "player" | "opponent";
    currentAttacker?: string;
    opponentRating?: number;
    ratingChange?: number;
  } | null>(null);
  const [searchingTime, setSearchingTime] = useState(0);

  // Initialize player
  useEffect(() => {
    if (!isReady || !user) return;

    const initPlayer = async () => {
      try {
        const response = await fetch("/api/game/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            odingerId: user.id,
            name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
            username: user.username,
            avatar: user.photo_url,
          }),
        });
        const data = await response.json();
        setPlayerData(data);
        setScreen("home");
      } catch (error) {
        console.error("Failed to init player:", error);
        setScreen("home");
      }
    };

    initPlayer();
  }, [isReady, user]);

  // Back button handler
  useEffect(() => {
    if (!webApp) return;

    const handleBack = () => {
      hapticImpact("light");
      if (screen === "collection" || screen === "leaderboard") {
        setScreen("home");
        webApp.BackButton.hide();
      } else if (screen === "searching") {
        cancelSearch();
      }
    };

    if (screen === "collection" || screen === "leaderboard" || screen === "searching") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [screen, webApp]);

  const cancelSearch = async () => {
    if (!user) return;
    await fetch(`/api/game/match?odingerId=${user.id}`, { method: "DELETE" });
    setScreen("collection");
    setSearchingTime(0);
  };

  const startSearch = async () => {
    if (!selectedChar || !user || !playerData) return;

    hapticImpact("medium");
    setScreen("searching");
    setSearchingTime(0);

    // Start searching timer
    const timer = setInterval(() => {
      setSearchingTime(t => t + 1);
    }, 1000);

    try {
      // Join matchmaking
      const response = await fetch("/api/game/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odingerId: user.id,
          name: playerData.name,
          selectedCharId: selectedChar.id,
        }),
      });
      const data = await response.json();

      if (data.status === "matched") {
        clearInterval(timer);
        hapticNotification("success");
        startBattle(data.battleId, {
          name: data.opponent.name,
          characterId: data.opponent.charId,
          odingerId: data.opponent.odingerId
        });
      } else {
        // Poll for match
        pollForMatch(timer);
      }
    } catch (error) {
      console.error("Matchmaking error:", error);
      clearInterval(timer);
      setScreen("collection");
    }
  };

  const pollForMatch = async (timer: ReturnType<typeof setInterval>) => {
    if (!user) return;

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/game/match?odingerId=${user.id}`);
        const data = await response.json();

        if (data.status === "matched") {
          clearInterval(timer);
          clearInterval(checkInterval);
          hapticNotification("success");
          startBattle(data.battleId, {
            name: data.opponent.name,
            characterId: data.opponent.charId,
            odingerId: data.opponent.odingerId
          });
        } else if (data.status === "idle") {
          clearInterval(timer);
          clearInterval(checkInterval);
          setScreen("collection");
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    }, 2000);

    // Timeout after 30 seconds - simulate AI opponent if no real opponent found
    setTimeout(() => {
      clearInterval(timer);
      clearInterval(checkInterval);
      simulateAIBattle();
    }, 30000);
  };

  const simulateAIBattle = () => {
    if (!selectedChar) return;

    // Pick random AI opponent
    const opponents = characters.filter(c => c.id !== selectedChar.id);
    const opponentChar = opponents[Math.floor(Math.random() * opponents.length)];

    hapticNotification("success");
    startLocalBattle(opponentChar, "AI Opponent");
  };

  const startBattle = (battleId: string, opponent: { name: string; characterId: string; odingerId?: number }) => {
    if (!selectedChar) return;

    const opponentChar = characters.find(c => c.id === opponent.characterId);
    if (!opponentChar) return;

    setBattleState({
      battleId,
      player: { char: selectedChar, hp: selectedChar.hp },
      opponent: { char: opponentChar, hp: opponentChar.hp, name: opponent.name, odingerId: opponent.odingerId },
      logs: [],
      round: 0,
    });
    setScreen("battle");
    setSearchingTime(0);

    // Run battle simulation
    runBattle(selectedChar, opponentChar, battleId, opponent.name, opponent.odingerId);
  };

  const startLocalBattle = (opponentChar: Character, opponentName: string) => {
    if (!selectedChar) return;

    const battleId = `local_${Date.now()}`;

    setBattleState({
      battleId,
      player: { char: selectedChar, hp: selectedChar.hp },
      opponent: { char: opponentChar, hp: opponentChar.hp, name: opponentName },
      logs: [],
      round: 0,
    });
    setScreen("battle");
    setSearchingTime(0);

    runBattle(selectedChar, opponentChar, battleId, opponentName, undefined);
  };

  const runBattle = async (playerChar: Character, opponentChar: Character, battleId: string, opponentName: string, opponentOdingerId?: number) => {
    let playerHp = playerChar.hp;
    let opponentHp = opponentChar.hp;
    const logs: BattleLog[] = [];
    let round = 0;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    while (playerHp > 0 && opponentHp > 0 && round < 30) {
      round++;
      await delay(800);

      const playerFirst = playerChar.speed >= opponentChar.speed;
      const first = playerFirst ? { char: playerChar, isPlayer: true } : { char: opponentChar, isPlayer: false };
      const second = playerFirst ? { char: opponentChar, isPlayer: false } : { char: playerChar, isPlayer: true };

      // First attack
      const damage1 = calculateDamage(first.char, second.char);
      const useAbility1 = Math.random() < 0.2;
      const critical1 = Math.random() < 0.1;

      if (first.isPlayer) {
        opponentHp -= damage1;
      } else {
        playerHp -= damage1;
      }

      hapticImpact(critical1 ? "heavy" : "light");

      logs.push({
        round,
        attacker: first.char.name,
        defender: second.char.name,
        damage: damage1,
        ability: useAbility1 ? first.char.ability : undefined,
        critical: critical1,
      });

      setBattleState({
        battleId,
        player: { char: playerChar, hp: Math.max(0, playerHp) },
        opponent: { char: opponentChar, hp: Math.max(0, opponentHp), name: opponentName },
        logs: [...logs],
        round,
        currentAttacker: first.char.id,
      });

      if ((first.isPlayer && opponentHp <= 0) || (!first.isPlayer && playerHp <= 0)) break;

      await delay(600);

      // Second attack
      const damage2 = calculateDamage(second.char, first.char);
      const useAbility2 = Math.random() < 0.2;
      const critical2 = Math.random() < 0.1;

      if (second.isPlayer) {
        opponentHp -= damage2;
      } else {
        playerHp -= damage2;
      }

      hapticImpact(critical2 ? "heavy" : "light");

      logs.push({
        round,
        attacker: second.char.name,
        defender: first.char.name,
        damage: damage2,
        ability: useAbility2 ? second.char.ability : undefined,
        critical: critical2,
      });

      setBattleState({
        battleId,
        player: { char: playerChar, hp: Math.max(0, playerHp) },
        opponent: { char: opponentChar, hp: Math.max(0, opponentHp), name: opponentName },
        logs: [...logs],
        round,
        currentAttacker: second.char.id,
      });
    }

    // Determine winner
    const won = playerHp > opponentHp;
    const winnerId = won ? user?.id : opponentOdingerId;

    hapticNotification(won ? "success" : "error");

    // Report result to backend for real PvP battles
    let opponentRating = 1000 + Math.floor(Math.random() * 500);
    let ratingChange = won ? 16 : -16;

    if (!battleId.startsWith("local_") && user && winnerId !== undefined) {
      try {
        const response = await fetch("/api/game/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            battleId,
            winnerId,
            reporterId: user.id,
          }),
        });
        const result = await response.json();
        if (result.opponentRating) {
          opponentRating = result.opponentRating;
        }
        if (result.ratingChange) {
          ratingChange = won ? result.ratingChange : -result.ratingChange;
        }
        // Update local player data from server response
        if (playerData && result.yourNewRating !== undefined) {
          setPlayerData({
            ...playerData,
            rating: result.yourNewRating,
            coins: result.yourCoins,
          });
        }
      } catch (error) {
        console.error("Failed to report battle result:", error);
        // Fallback to local update
        if (playerData) {
          setPlayerData({
            ...playerData,
            rating: playerData.rating + ratingChange,
            coins: playerData.coins + (won ? 50 : 20),
          });
        }
      }
    } else {
      // Local battle - update locally
      if (playerData) {
        setPlayerData({
          ...playerData,
          rating: playerData.rating + ratingChange,
          coins: playerData.coins + (won ? 50 : 20),
        });
      }
    }

    setBattleState(prev => prev ? {
      ...prev,
      winner: won ? "player" : "opponent",
      currentAttacker: undefined,
      opponentRating,
      ratingChange: Math.abs(ratingChange),
    } : null);

    await delay(1500);
    setScreen("result");
  };

  const calculateDamage = (attacker: Character, defender: Character) => {
    const base = attacker.attack;
    const variance = base * (Math.random() * 0.2 - 0.1);
    const reduction = defender.defense * 0.5;
    const damage = Math.max(1, Math.floor(base + variance - reduction));
    return Math.random() < 0.1 ? Math.floor(damage * 1.5) : damage;
  };

  const getRank = (rating: number) => {
    if (rating >= 2500) return { name: "Grandmaster", icon: "🏆", class: "rank-grandmaster" };
    if (rating >= 2200) return { name: "Master", icon: "👑", class: "rank-master" };
    if (rating >= 1900) return { name: "Diamond", icon: "💠", class: "rank-diamond" };
    if (rating >= 1600) return { name: "Platinum", icon: "💎", class: "rank-platinum" };
    if (rating >= 1300) return { name: "Gold", icon: "🥇", class: "rank-gold" };
    if (rating >= 1000) return { name: "Silver", icon: "🥈", class: "rank-silver" };
    return { name: "Bronze", icon: "🥉", class: "rank-bronze" };
  };

  const shareGame = () => {
    if (webApp) {
      webApp.openTelegramLink(`https://t.me/share/url?url=https://t.me/YourBotName&text=Join me in LEGO Marvel Battle! ⚔️`);
    }
  };

  const ownedIds = playerData?.characters || ["spiderman", "hawkeye", "falcon"];

  // LOADING SCREEN
  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <LegoCharacter characterId="ironman" size={60} animated />
          <LegoCharacter characterId="spiderman" size={60} animated />
          <LegoCharacter characterId="thor" size={60} animated />
        </div>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  // HOME SCREEN
  if (screen === "home") {
    const rank = getRank(playerData?.rating || 1000);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={{ fontSize: 48, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            LEGO MARVEL BATTLE
          </h1>
          {isTelegram && (
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Telegram Mini App</p>
          )}
        </div>

        {/* Hero showcase */}
        <div style={{ display: "flex", gap: 16, marginBottom: 30, flexWrap: "wrap", justifyContent: "center" }}>
          <LegoCharacter characterId="ironman" size={70} animated />
          <LegoCharacter characterId="spiderman" size={70} animated />
          <LegoCharacter characterId="thor" size={70} animated />
        </div>

        {/* Player Card */}
        <div className="card" style={{ padding: 20, marginBottom: 30, width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 50, height: 70 }}>
              <LegoCharacter characterId="cap" size={50} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {user?.first_name || "Player"}
              </div>
              <div className={`rank-badge ${rank.class}`} style={{ marginTop: 4, fontSize: 12 }}>
                {rank.icon} {rank.name}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{playerData?.rating || 1000}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>ELO</div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>Coins: <span style={{ color: "#fbbf24", fontWeight: 600 }}>{playerData?.coins || 500} 🪙</span></span>
            <span style={{ color: "var(--text-secondary)" }}>Heroes: <span style={{ fontWeight: 600 }}>{ownedIds.length}</span></span>
          </div>
        </div>

        {/* Menu Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 400 }}>
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "18px 24px", fontSize: 18 }}
            onClick={() => { hapticSelection(); setScreen("collection"); }}
          >
            <Swords size={22} /> FIND BATTLE
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={() => { hapticSelection(); setScreen("collection"); }}
          >
            <Users size={18} /> My Collection ({ownedIds.length} heroes)
          </button>
          <button className="btn btn-secondary" style={{ width: "100%" }}>
            <Sparkles size={18} /> Gacha Shop
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={() => { hapticSelection(); setScreen("leaderboard"); }}
          >
            <Trophy size={18} /> Leaderboard
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={shareGame}
          >
            <Share2 size={18} /> Invite Friends
          </button>
        </div>
      </div>
    );
  }

  // COLLECTION SCREEN
  if (screen === "collection") {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", paddingBottom: selectedChar ? 120 : 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 28 }}>SELECT HERO</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {characters.map(char => {
            const owned = ownedIds.includes(char.id);
            const selected = selectedChar?.id === char.id;

            return (
              <div
                key={char.id}
                className="card"
                onClick={() => {
                  if (owned) {
                    hapticSelection();
                    setSelectedChar(char);
                  }
                }}
                style={{
                  padding: 2,
                  background: `var(--tier-${char.tier.toLowerCase()})`,
                  cursor: owned ? "pointer" : "not-allowed",
                  opacity: owned ? 1 : 0.4,
                  filter: owned ? "none" : "grayscale(1)",
                  transform: selected ? "scale(1.03)" : "scale(1)",
                  boxShadow: selected ? "0 0 20px rgba(245, 158, 11, 0.5)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                    <LegoCharacter characterId={char.id} size={55} animated={owned} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{char.name}</div>
                    <span className={`tier-badge tier-${char.tier.toLowerCase()}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                      {char.tier}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, marginTop: 8, fontSize: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Heart size={10} color="#ef4444" /> {char.hp}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Swords size={10} color="#f59e0b" /> {char.attack}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Shield size={10} color="#3b82f6" /> {char.defense}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Zap size={10} color="#22c55e" /> {char.speed}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedChar && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: 16, background: "linear-gradient(transparent, var(--bg-primary) 30%)" }}>
            <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
              <LegoCharacter characterId={selectedChar.id} size={45} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedChar.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{selectedChar.ability}</div>
              </div>
              <button className="btn btn-primary animate-pulse-glow" onClick={startSearch}>
                <Swords size={18} /> BATTLE!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SEARCHING SCREEN
  if (screen === "searching") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ marginBottom: 30 }}>
          <LegoCharacter characterId={selectedChar?.id || "spiderman"} size={100} animated />
        </div>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>SEARCHING...</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 30 }}>Finding worthy opponent</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 30 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 30 }}>
          {Math.floor(searchingTime / 60)}:{(searchingTime % 60).toString().padStart(2, "0")}
        </div>

        <button className="btn btn-secondary" onClick={cancelSearch}>
          Cancel
        </button>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // BATTLE SCREEN
  if (screen === "battle" && battleState) {
    const playerHpPercent = (battleState.player.hp / battleState.player.char.hp) * 100;
    const opponentHpPercent = (battleState.opponent.hp / battleState.opponent.char.hp) * 100;
    const isPlayerAttacking = battleState.currentAttacker === battleState.player.char.id;
    const isOpponentAttacking = battleState.currentAttacker === battleState.opponent.char.id;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, textAlign: "center", background: "var(--bg-secondary)" }}>
          <h2 style={{ fontSize: 22 }}>ROUND {battleState.round}</h2>
        </div>

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: 20,
          background: "radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
          position: "relative",
        }}>
          {/* Player */}
          <div style={{ textAlign: "center", zIndex: 1 }}>
            <div style={{
              marginBottom: 12,
              transition: "transform 0.3s ease",
              transform: isPlayerAttacking ? "translateX(20px) scale(1.1)" : "translateX(0)",
            }}>
              <LegoCharacter characterId={battleState.player.char.id} size={90} animated={isPlayerAttacking} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{battleState.player.char.name}</div>
            <div style={{ width: 140 }}>
              <div className="hp-bar">
                <div
                  className={`hp-bar-fill ${playerHpPercent > 50 ? "hp-high" : playerHpPercent > 25 ? "hp-medium" : "hp-low"}`}
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
              <div style={{ fontSize: 11, marginTop: 3 }}>{battleState.player.hp} / {battleState.player.char.hp}</div>
            </div>
          </div>

          <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.15 }}>VS</div>

          {/* Opponent */}
          <div style={{ textAlign: "center", zIndex: 1 }}>
            <div style={{
              marginBottom: 12,
              transition: "transform 0.3s ease",
              transform: isOpponentAttacking ? "translateX(-20px) scale(1.1)" : "translateX(0) scaleX(-1)",
            }}>
              <LegoCharacter characterId={battleState.opponent.char.id} size={90} animated={isOpponentAttacking} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{battleState.opponent.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Rating: ???</div>
            <div style={{ width: 140 }}>
              <div className="hp-bar">
                <div
                  className={`hp-bar-fill ${opponentHpPercent > 50 ? "hp-high" : opponentHpPercent > 25 ? "hp-medium" : "hp-low"}`}
                  style={{ width: `${opponentHpPercent}%` }}
                />
              </div>
              <div style={{ fontSize: 11, marginTop: 3 }}>{battleState.opponent.hp} / {battleState.opponent.char.hp}</div>
            </div>
          </div>
        </div>

        <div style={{ height: 130, background: "var(--bg-secondary)", padding: 12, overflowY: "auto" }}>
          {battleState.logs.slice(-4).map((log, i) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 3, opacity: i === battleState.logs.slice(-4).length - 1 ? 1 : 0.5 }}>
              {log.ability && <span style={{ color: "#a855f7" }}>[{log.ability}] </span>}
              <span style={{ fontWeight: 600 }}>{log.attacker}</span> → {" "}
              <span style={{ color: log.critical ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>
                {log.damage}{log.critical && " CRIT!"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (screen === "result" && battleState) {
    const won = battleState.winner === "player";
    const ratingChange = battleState.ratingChange || (won ? 16 : 16);

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>{won ? "🎉" : "😢"}</div>

        <h1 style={{ fontSize: 40, marginBottom: 20, color: won ? "#22c55e" : "#ef4444" }}>
          {won ? "VICTORY!" : "DEFEAT"}
        </h1>

        <div className="card" style={{ padding: 24, marginBottom: 20, textAlign: "center", width: "100%", maxWidth: 350 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginBottom: 20 }}>
            <div>
              <LegoCharacter characterId={battleState.player.char.id} size={60} />
              <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{battleState.player.char.name}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.4 }}>VS</div>
            <div>
              <LegoCharacter characterId={battleState.opponent.char.id} size={60} />
              <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>{battleState.opponent.char.name}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Opponent Rating:</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{battleState.opponentRating} ELO</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 30, textAlign: "center", width: "100%", maxWidth: 350 }}>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Rating</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: won ? "#22c55e" : "#ef4444" }}>
                {won ? "+" : "-"}{ratingChange}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Coins</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fbbf24" }}>
                +{won ? 50 : 20} 🪙
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 14 }}>
            New Rating: <span style={{ fontWeight: 700 }}>{playerData?.rating || 1000}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => { hapticSelection(); setSelectedChar(null); setScreen("collection"); }}>
            <Swords size={18} /> Again
          </button>
          <button className="btn btn-secondary" onClick={() => { hapticSelection(); setBattleState(null); setScreen("home"); }}>
            Home
          </button>
        </div>
      </div>
    );
  }

  // LEADERBOARD
  if (screen === "leaderboard") {
    return <LeaderboardScreen user={user} playerData={playerData} getRank={getRank} />;
  }

  return null;
}

// Leaderboard component with data fetching
function LeaderboardScreen({
  user,
  playerData,
  getRank,
}: {
  user: { id: number; first_name: string } | null;
  playerData: PlayerData | null;
  getRank: (rating: number) => { name: string; icon: string; class: string };
}) {
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number;
    odingerId: number;
    name: string;
    rating: number;
  }>>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [stats, setStats] = useState<{ totalPlayers: number; playersInQueue: number; activeBattles: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const url = user
          ? `/api/game/leaderboard?limit=50&odingerId=${user.id}`
          : "/api/game/leaderboard?limit=50";
        const response = await fetch(url);
        const data = await response.json();
        setLeaderboard(data.players || []);
        setMyRank(data.myRank);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
      </div>
    );
  }

  // Add current player if not in top 50
  const displayLeaderboard = [...leaderboard];
  const userInList = leaderboard.some(p => p.odingerId === user?.id);
  if (!userInList && user && playerData) {
    displayLeaderboard.push({
      rank: myRank || leaderboard.length + 1,
      odingerId: user.id,
      name: playerData.name,
      rating: playerData.rating,
    });
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20 }}>
      <h2 style={{ fontSize: 28, marginBottom: 12, textAlign: "center" }}>LEADERBOARD</h2>

      {stats && (
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20, fontSize: 12 }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Players: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{stats.totalPlayers}</span>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            In Queue: <span style={{ color: "#22c55e", fontWeight: 600 }}>{stats.playersInQueue}</span>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            Battles: <span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.activeBattles}</span>
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayLeaderboard.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>No players yet. Be the first!</p>
          </div>
        ) : (
          displayLeaderboard.map((player) => {
            const isYou = player.odingerId === user?.id;
            return (
              <div
                key={player.odingerId}
                className="card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: isYou ? "rgba(245, 158, 11, 0.1)" : undefined,
                  border: isYou ? "1px solid rgba(245, 158, 11, 0.3)" : undefined,
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: player.rank <= 3
                    ? ["#ffd700", "#c0c0c0", "#cd7f32"][player.rank - 1]
                    : "var(--bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  color: player.rank <= 3 ? "#000" : "var(--text-secondary)",
                }}>
                  {player.rank}
                </div>
                <div style={{ flex: 1, fontWeight: isYou ? 700 : 500 }}>
                  {player.name} {isYou && "(You)"}
                </div>
                <div style={{ fontWeight: 700 }}>{player.rating}</div>
                <div className={`rank-badge ${getRank(player.rating).class}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                  {getRank(player.rating).icon}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
