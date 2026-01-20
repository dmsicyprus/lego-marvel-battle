# Battle Mechanics Skill

Understanding and modifying the auto-battle system.

## Battle Flow

```
1. Player selects character
2. System picks random opponent
3. Battle starts:
   - Determine turn order (by Speed)
   - Execute attacks alternately
   - Check abilities (15-30% trigger)
   - Apply damage
   - Update HP
   - Repeat until winner
4. Show result + rating change
```

## Key Files

- `app/page.tsx` - Main game logic
  - `simulateBattle()` - Battle simulation
  - `calculateDamage()` - Damage formula
  - Battle state management

## Damage Calculation

```typescript
function calculateDamage(attacker: Character, defender: Character) {
  const base = attacker.attack;
  const variance = base * (Math.random() * 0.2 - 0.1); // ±10%
  const reduction = defender.defense * 0.5;
  const damage = Math.max(1, Math.floor(base + variance - reduction));

  // 10% critical hit chance
  return Math.random() < 0.1 ? Math.floor(damage * 1.5) : damage;
}
```

## Ability System

Currently abilities are cosmetic. To make them functional:

```typescript
interface Ability {
  name: string;
  triggerChance: number;
  effect: (attacker, defender, state) => void;
}

// Example implementations:
const abilities = {
  "Infinity Snap": {
    triggerChance: 0.15,
    effect: (a, d, state) => {
      if (Math.random() < 0.5) {
        d.hp = 0; // Instant kill
      }
    }
  },
  "Regeneration": {
    triggerChance: 0.25,
    effect: (a, d, state) => {
      a.hp = Math.min(a.maxHp, a.hp + 50);
    }
  }
};
```

## Modifying Battle Speed

In `simulateBattle()`:
- `delay(800)` - Time between rounds
- `delay(600)` - Time between attacks

## ELO Calculation

```typescript
function calculateEloChange(playerRating: number, opponentRating: number, won: boolean) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = won ? 1 : 0;
  return Math.round(K * (actual - expected));
}
```
