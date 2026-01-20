# LEGO Marvel Battle

Auto-battle game with Marvel LEGO characters and ELO rating system.

## Project Overview

| Aspect | Description |
|--------|-------------|
| Type | Next.js 15 game application |
| Port | 3200 |
| Auth | Google OAuth (NextAuth.js) |
| Rating | ELO system (hidden until battle end) |

## Key Features

1. **Character Collection** - 15 Marvel heroes (S/A/B/C tiers)
2. **Auto-Battle** - Battles run automatically based on stats
3. **Hidden Rating** - Opponent's ELO revealed only after match
4. **Gacha System** - Obtain new characters

## Tech Stack

- Next.js 15 + React 19
- TypeScript
- NextAuth.js (Google Provider)
- CSS (no external UI library)

## Commands

```bash
pnpm dev      # Start dev server on port 3200
pnpm build    # Build for production
pnpm start    # Start production server
```

## Game Mechanics

### Character Stats
- **HP** - Health points
- **Attack** - Base damage
- **Defense** - Damage reduction (50% of value)
- **Speed** - Turn order priority
- **Ability** - Special skill (15-30% trigger chance)

### Damage Formula
```
damage = attack * (1 ± 10%) - defense * 0.5
critical = 10% chance for 1.5x damage
```

### ELO Rating
```
K-factor = 32
Win vs equal = +16 / -16
Win vs higher = more points
Win vs lower = fewer points
```

## Project Structure

```
app/
├── layout.tsx      # Root layout
├── page.tsx        # Main game UI
└── globals.css     # Styles

.knowledgebook-mcp/
└── skills/         # Development skills
```
