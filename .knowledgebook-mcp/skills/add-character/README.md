# Add Character Skill

Add a new Marvel character to the game.

## Usage

When adding a new character, follow these rules:

### 1. Character Structure

```typescript
{
  id: "character-id",      // lowercase, kebab-case
  name: "Character Name",  // Display name
  tier: "S" | "A" | "B" | "C",
  hp: number,              // 500-1500
  attack: number,          // 50-100
  defense: number,         // 40-90
  speed: number,           // 40-95
  ability: "Ability Name",
  emoji: "🦸"              // Single emoji for display
}
```

### 2. Tier Guidelines

| Tier | HP Range | Attack | Defense | Speed |
|------|----------|--------|---------|-------|
| S | 800-1200 | 85-100 | 70-90 | 60-80 |
| A | 700-1000 | 75-90 | 55-80 | 60-90 |
| B | 650-900 | 65-82 | 50-80 | 70-90 |
| C | 500-700 | 55-70 | 40-55 | 80-95 |

### 3. Balance Rules

- S-tier: OP abilities, high stats overall
- A-tier: Strong ability OR high stats, not both
- B-tier: Balanced, situational abilities
- C-tier: Weak but fast, or slow but tanky

### 4. Add to characters array

Edit `app/page.tsx` and add to the `characters` array.

### 5. Update owned characters

If character should be available to player by default, add ID to `ownedIds` array.

## Example

```typescript
{
  id: "loki",
  name: "Loki",
  tier: "A",
  hp: 750,
  attack: 80,
  defense: 55,
  speed: 88,
  ability: "Illusion Clone",
  emoji: "🦹"
},
```
