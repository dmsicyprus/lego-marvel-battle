"use client";

interface LegoCharacterProps {
  characterId: string;
  size?: number;
  className?: string;
  animated?: boolean;
}

// Character color schemes
const characterStyles: Record<string, {
  body: string;
  legs: string;
  head: string;
  hair?: string;
  helmet?: string;
  mask?: string;
  cape?: string;
  accent: string;
  eyes: string;
  feature?: string;
}> = {
  thanos: {
    body: "#6B21A8",
    legs: "#4C1D95",
    head: "#A855F7",
    helmet: "#FFD700",
    accent: "#FFD700",
    eyes: "#fff",
    feature: "gauntlet",
  },
  thor: {
    body: "#1E3A8A",
    legs: "#1E40AF",
    head: "#FCD34D",
    hair: "#FCD34D",
    cape: "#DC2626",
    accent: "#60A5FA",
    eyes: "#3B82F6",
    feature: "hammer",
  },
  scarlet: {
    body: "#DC2626",
    legs: "#B91C1C",
    head: "#FBBF24",
    hair: "#7F1D1D",
    accent: "#EF4444",
    eyes: "#EF4444",
    feature: "magic",
  },
  ironman: {
    body: "#DC2626",
    legs: "#B91C1C",
    head: "#FCD34D",
    helmet: "#DC2626",
    accent: "#FFD700",
    eyes: "#38BDF8",
    feature: "arc",
  },
  cap: {
    body: "#1E40AF",
    legs: "#1E3A8A",
    head: "#FCD34D",
    helmet: "#1E40AF",
    accent: "#fff",
    eyes: "#3B82F6",
    feature: "shield",
  },
  hulk: {
    body: "#166534",
    legs: "#4B5563",
    head: "#22C55E",
    hair: "#15803D",
    accent: "#22C55E",
    eyes: "#fff",
  },
  spiderman: {
    body: "#DC2626",
    legs: "#1E40AF",
    head: "#DC2626",
    mask: "#DC2626",
    accent: "#1E3A8A",
    eyes: "#fff",
    feature: "web",
  },
  strange: {
    body: "#1E40AF",
    legs: "#1E3A8A",
    head: "#FCD34D",
    hair: "#1F2937",
    cape: "#DC2626",
    accent: "#10B981",
    eyes: "#10B981",
    feature: "eye",
  },
  panther: {
    body: "#1F2937",
    legs: "#111827",
    head: "#1F2937",
    mask: "#1F2937",
    accent: "#A855F7",
    eyes: "#fff",
    feature: "claws",
  },
  marvel: {
    body: "#DC2626",
    legs: "#1E40AF",
    head: "#FCD34D",
    hair: "#FCD34D",
    accent: "#FFD700",
    eyes: "#FFD700",
    feature: "glow",
  },
  wolverine: {
    body: "#FCD34D",
    legs: "#1E40AF",
    head: "#FCD34D",
    hair: "#1F2937",
    mask: "#FCD34D",
    accent: "#1E3A8A",
    eyes: "#fff",
    feature: "claws",
  },
  deadpool: {
    body: "#DC2626",
    legs: "#DC2626",
    head: "#DC2626",
    mask: "#DC2626",
    accent: "#1F2937",
    eyes: "#fff",
    feature: "swords",
  },
  hawkeye: {
    body: "#4B5563",
    legs: "#1F2937",
    head: "#FCD34D",
    hair: "#FCD34D",
    accent: "#7C3AED",
    eyes: "#3B82F6",
    feature: "bow",
  },
  antman: {
    body: "#DC2626",
    legs: "#1F2937",
    head: "#DC2626",
    helmet: "#DC2626",
    accent: "#6B7280",
    eyes: "#38BDF8",
  },
  falcon: {
    body: "#DC2626",
    legs: "#1F2937",
    head: "#8B5A2B",
    hair: "#1F2937",
    accent: "#6B7280",
    eyes: "#1F2937",
    feature: "wings",
  },
  vision: {
    body: "#22C55E",
    legs: "#16A34A",
    head: "#DC2626",
    accent: "#FFD700",
    eyes: "#FFD700",
    feature: "gem",
  },
};

export function LegoCharacter({ characterId, size = 100, className = "", animated = false }: LegoCharacterProps) {
  const style = characterStyles[characterId] || {
    body: "#6B7280",
    legs: "#4B5563",
    head: "#FCD34D",
    accent: "#fff",
    eyes: "#1F2937",
  };

  const scale = size / 100;

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      className={`${className} ${animated ? "lego-animate" : ""}`}
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
    >
      <defs>
        {/* Gradients for 3D effect */}
        <linearGradient id={`body-grad-${characterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={style.body} />
          <stop offset="100%" stopColor={adjustColor(style.body, -30)} />
        </linearGradient>
        <linearGradient id={`head-grad-${characterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={style.head} />
          <stop offset="100%" stopColor={adjustColor(style.head, -20)} />
        </linearGradient>
        <linearGradient id={`legs-grad-${characterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={style.legs} />
          <stop offset="100%" stopColor={adjustColor(style.legs, -30)} />
        </linearGradient>
      </defs>

      {/* Cape (if exists) */}
      {style.cape && (
        <path
          d="M25 50 L20 95 L50 100 L80 95 L75 50 Z"
          fill={style.cape}
          opacity="0.9"
        />
      )}

      {/* Wings for Falcon */}
      {style.feature === "wings" && (
        <>
          <path d="M15 55 L-10 70 L-5 85 L25 70 Z" fill="#6B7280" />
          <path d="M85 55 L110 70 L105 85 L75 70 Z" fill="#6B7280" />
        </>
      )}

      {/* Legs */}
      <g>
        {/* Left leg */}
        <rect x="28" y="95" width="18" height="30" rx="3" fill={`url(#legs-grad-${characterId})`} />
        {/* Right leg */}
        <rect x="54" y="95" width="18" height="30" rx="3" fill={`url(#legs-grad-${characterId})`} />
        {/* Hip connector */}
        <rect x="28" y="90" width="44" height="10" rx="2" fill={style.legs} />
        {/* Feet */}
        <rect x="25" y="122" width="22" height="8" rx="2" fill={adjustColor(style.legs, -20)} />
        <rect x="53" y="122" width="22" height="8" rx="2" fill={adjustColor(style.legs, -20)} />
      </g>

      {/* Body/Torso */}
      <g>
        <rect x="22" y="45" width="56" height="50" rx="4" fill={`url(#body-grad-${characterId})`} />
        {/* Shoulders */}
        <rect x="15" y="45" width="70" height="12" rx="4" fill={style.body} />
        {/* Arms */}
        <rect x="8" y="50" width="14" height="35" rx="4" fill={style.body} />
        <rect x="78" y="50" width="14" height="35" rx="4" fill={style.body} />
        {/* Hands (yellow LEGO hands) */}
        <circle cx="15" cy="88" r="7" fill="#FCD34D" />
        <circle cx="85" cy="88" r="7" fill="#FCD34D" />

        {/* Body details based on character */}
        {style.feature === "arc" && (
          <circle cx="50" cy="65" r="10" fill="#38BDF8" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {style.feature === "shield" && (
          <g transform="translate(75, 60)">
            <circle r="18" fill="#DC2626" stroke="#fff" strokeWidth="2" />
            <circle r="12" fill="#fff" />
            <circle r="6" fill="#DC2626" />
            <polygon points="0,-6 6,6 -6,6" fill="#1E40AF" />
          </g>
        )}
        {characterId === "spiderman" && (
          <>
            <line x1="30" y1="55" x2="70" y2="85" stroke={style.accent} strokeWidth="2" />
            <line x1="70" y1="55" x2="30" y2="85" stroke={style.accent} strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="90" stroke={style.accent} strokeWidth="2" />
          </>
        )}
        {style.accent && characterId !== "spiderman" && !style.feature && (
          <rect x="35" y="55" width="30" height="25" rx="3" fill={style.accent} opacity="0.6" />
        )}
      </g>

      {/* Head */}
      <g>
        {/* Head stud (LEGO connector) */}
        <ellipse cx="50" cy="18" rx="12" ry="6" fill={style.helmet || style.mask || style.head} />

        {/* Head cylinder */}
        <rect x="30" y="18" width="40" height="30" rx="6" fill={`url(#head-grad-${characterId})`} />

        {/* Face area */}
        {!style.mask && !style.helmet && (
          <>
            {/* Eyes */}
            <ellipse cx="40" cy="32" rx="5" ry="6" fill="#fff" />
            <ellipse cx="60" cy="32" rx="5" ry="6" fill="#fff" />
            <circle cx="41" cy="33" r="2.5" fill="#1F2937" />
            <circle cx="61" cy="33" r="2.5" fill="#1F2937" />
            {/* Smile */}
            <path d="M40 40 Q50 46 60 40" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Mask (Spider-Man, Deadpool, Black Panther) */}
        {style.mask && (
          <>
            {characterId === "spiderman" && (
              <>
                <ellipse cx="38" cy="30" rx="8" ry="10" fill="#fff" />
                <ellipse cx="62" cy="30" rx="8" ry="10" fill="#fff" />
                {/* Web pattern */}
                <line x1="30" y1="25" x2="50" y2="45" stroke={style.accent} strokeWidth="1" opacity="0.5" />
                <line x1="70" y1="25" x2="50" y2="45" stroke={style.accent} strokeWidth="1" opacity="0.5" />
              </>
            )}
            {characterId === "deadpool" && (
              <>
                <ellipse cx="38" cy="30" rx="7" ry="8" fill="#fff" />
                <ellipse cx="62" cy="30" rx="7" ry="8" fill="#fff" />
                <circle cx="38" cy="30" r="3" fill="#1F2937" />
                <circle cx="62" cy="30" r="3" fill="#1F2937" />
              </>
            )}
            {characterId === "panther" && (
              <>
                <path d="M35 28 L40 22 L45 28" fill="none" stroke={style.accent} strokeWidth="2" />
                <path d="M55 28 L60 22 L65 28" fill="none" stroke={style.accent} strokeWidth="2" />
                <ellipse cx="40" cy="32" rx="4" ry="5" fill="#fff" />
                <ellipse cx="60" cy="32" rx="4" ry="5" fill="#fff" />
              </>
            )}
            {characterId === "wolverine" && (
              <>
                <path d="M30 22 L35 28 L30 35" fill="none" stroke="#1F2937" strokeWidth="3" />
                <path d="M70 22 L65 28 L70 35" fill="none" stroke="#1F2937" strokeWidth="3" />
                <ellipse cx="40" cy="32" rx="5" ry="6" fill="#fff" />
                <ellipse cx="60" cy="32" rx="5" ry="6" fill="#fff" />
                <circle cx="41" cy="33" r="2.5" fill="#1F2937" />
                <circle cx="61" cy="33" r="2.5" fill="#1F2937" />
              </>
            )}
          </>
        )}

        {/* Helmet (Iron Man, Cap, Ant-Man, Thanos) */}
        {style.helmet && (
          <>
            {characterId === "ironman" && (
              <>
                <rect x="30" y="18" width="40" height="30" rx="6" fill={style.helmet} />
                <rect x="35" y="26" width="30" height="12" rx="2" fill="#FFD700" />
                <rect x="38" cy="30" width="24" height="6" fill="#38BDF8">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />
                </rect>
              </>
            )}
            {characterId === "cap" && (
              <>
                <path d="M30 30 L50 15 L70 30 L70 35 L30 35 Z" fill={style.helmet} />
                <text x="50" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">A</text>
                <ellipse cx="40" cy="38" rx="5" ry="6" fill="#fff" />
                <ellipse cx="60" cy="38" rx="5" ry="6" fill="#fff" />
                <circle cx="41" cy="39" r="2.5" fill="#3B82F6" />
                <circle cx="61" cy="39" r="2.5" fill="#3B82F6" />
              </>
            )}
            {characterId === "antman" && (
              <>
                <rect x="30" y="18" width="40" height="30" rx="6" fill={style.helmet} />
                <rect x="35" y="28" width="30" height="10" rx="2" fill="#6B7280" />
                <ellipse cx="42" cy="33" rx="6" ry="4" fill="#38BDF8" />
                <ellipse cx="58" cy="33" rx="6" ry="4" fill="#38BDF8" />
              </>
            )}
            {characterId === "thanos" && (
              <>
                <rect x="28" y="12" width="44" height="8" rx="2" fill={style.helmet} />
                <ellipse cx="40" cy="32" rx="5" ry="6" fill="#fff" />
                <ellipse cx="60" cy="32" rx="5" ry="6" fill="#fff" />
                <circle cx="41" cy="33" r="2.5" fill="#6B21A8" />
                <circle cx="61" cy="33" r="2.5" fill="#6B21A8" />
                <rect x="35" y="40" width="30" height="6" rx="1" fill="#A855F7" />
              </>
            )}
          </>
        )}

        {/* Hair */}
        {style.hair && !style.mask && !style.helmet && (
          <>
            {characterId === "thor" && (
              <path d="M28 25 Q35 10 50 12 Q65 10 72 25 L70 18 L65 20 L60 15 L55 18 L50 12 L45 18 L40 15 L35 20 L30 18 Z" fill={style.hair} />
            )}
            {characterId === "hulk" && (
              <path d="M30 22 Q40 12 50 15 Q60 12 70 22 L68 18 L62 20 L55 16 L50 18 L45 16 L38 20 L32 18 Z" fill={style.hair} />
            )}
            {characterId === "strange" && (
              <path d="M30 25 Q40 15 50 18 Q60 15 70 25 L70 22 L30 22 Z" fill={style.hair} />
            )}
            {characterId === "scarlet" && (
              <path d="M25 25 Q35 10 50 12 Q65 10 75 25 L75 45 Q65 50 50 48 Q35 50 25 45 Z" fill={style.hair} />
            )}
            {(characterId === "hawkeye" || characterId === "marvel" || characterId === "falcon") && (
              <path d="M32 22 Q42 15 50 16 Q58 15 68 22 L66 20 L50 18 L34 20 Z" fill={style.hair || "#1F2937"} />
            )}
          </>
        )}

        {/* Special head features */}
        {style.feature === "gem" && characterId === "vision" && (
          <polygon points="50,12 55,20 45,20" fill="#FFD700">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
          </polygon>
        )}
      </g>

      {/* Special accessories */}
      {style.feature === "hammer" && (
        <g transform="translate(88, 75) rotate(30)">
          <rect x="-5" y="0" width="10" height="30" fill="#8B4513" rx="2" />
          <rect x="-12" y="-15" width="24" height="18" fill="#6B7280" rx="2" />
        </g>
      )}

      {style.feature === "gauntlet" && (
        <g>
          <rect x="78" y="80" width="16" height="18" rx="3" fill="#FFD700" />
          {["#EF4444", "#22C55E", "#3B82F6", "#A855F7", "#F59E0B", "#EC4899"].map((color, i) => (
            <circle key={i} cx={82 + (i % 2) * 8} cy={84 + Math.floor(i / 2) * 5} r="2.5" fill={color}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {style.feature === "magic" && (
        <>
          <circle cx="15" cy="88" r="12" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.6">
            <animate attributeName="r" values="10;15;10" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="85" cy="88" r="12" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.6">
            <animate attributeName="r" values="10;15;10" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {style.feature === "claws" && characterId === "wolverine" && (
        <>
          <g transform="translate(8, 85)">
            <rect x="-2" y="0" width="3" height="20" fill="#C0C0C0" rx="1" />
            <rect x="3" y="0" width="3" height="22" fill="#C0C0C0" rx="1" />
            <rect x="8" y="0" width="3" height="20" fill="#C0C0C0" rx="1" />
          </g>
          <g transform="translate(80, 85)">
            <rect x="-2" y="0" width="3" height="20" fill="#C0C0C0" rx="1" />
            <rect x="3" y="0" width="3" height="22" fill="#C0C0C0" rx="1" />
            <rect x="8" y="0" width="3" height="20" fill="#C0C0C0" rx="1" />
          </g>
        </>
      )}

      {style.feature === "bow" && (
        <g transform="translate(-5, 50)">
          <path d="M0 0 Q-15 20 0 40" fill="none" stroke="#7C3AED" strokeWidth="3" />
          <line x1="0" y1="0" x2="0" y2="40" stroke="#FCD34D" strokeWidth="1" />
        </g>
      )}

      {style.feature === "swords" && (
        <>
          <rect x="-5" y="55" width="4" height="35" fill="#6B7280" transform="rotate(-20, 0, 70)" />
          <rect x="95" y="55" width="4" height="35" fill="#6B7280" transform="rotate(20, 100, 70)" />
        </>
      )}

      {style.feature === "eye" && (
        <g transform="translate(50, 70)">
          <circle r="8" fill="none" stroke="#10B981" strokeWidth="2">
            <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#10B981">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {style.feature === "glow" && (
        <circle cx="50" cy="70" r="30" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.4">
          <animate attributeName="r" values="25;35;25" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// Helper function to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
