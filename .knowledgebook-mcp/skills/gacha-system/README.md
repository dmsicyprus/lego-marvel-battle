# Gacha System Skill

Implementing the character acquisition system.

## Pull Types

| Type | Cost | C% | B% | A% | S% |
|------|------|-----|-----|-----|-----|
| Common | 100 | 70 | 25 | 5 | 0 |
| Epic | 500 | 0 | 50 | 40 | 10 |
| Legendary | 2000 | 0 | 0 | 30 | 70 |

## Implementation

### 1. Add Gacha State

```typescript
const [coins, setCoins] = useState(500);
const [ownedCharacters, setOwnedCharacters] = useState<string[]>([
  "spiderman", "hawkeye", "falcon"
]);
```

### 2. Pull Function

```typescript
function pullGacha(type: "common" | "epic" | "legendary") {
  const costs = { common: 100, epic: 500, legendary: 2000 };
  const rates = {
    common: { C: 0.70, B: 0.95, A: 1.0, S: 1.0 },
    epic: { C: 0, B: 0.50, A: 0.90, S: 1.0 },
    legendary: { C: 0, B: 0, A: 0.30, S: 1.0 },
  };

  if (coins < costs[type]) return null;

  setCoins(prev => prev - costs[type]);

  const roll = Math.random();
  const rate = rates[type];

  let tier: "C" | "B" | "A" | "S";
  if (roll < rate.C) tier = "C";
  else if (roll < rate.B) tier = "B";
  else if (roll < rate.A) tier = "A";
  else tier = "S";

  const tierChars = characters.filter(c => c.tier === tier);
  const char = tierChars[Math.floor(Math.random() * tierChars.length)];

  const isNew = !ownedCharacters.includes(char.id);
  if (isNew) {
    setOwnedCharacters(prev => [...prev, char.id]);
  }

  return { character: char, isNew, duplicate: !isNew };
}
```

### 3. Duplicate Handling

When pulling a duplicate:
- Convert to shards (10 shards)
- 100 shards = character upgrade (stats +5%)

### 4. Pity System

Track pulls without S-tier:
- After 90 pulls, guarantee S-tier
- After 10 pulls, guarantee A-tier minimum

```typescript
const [pityCounter, setPityCounter] = useState({ s: 0, a: 0 });

function pullWithPity(type: string) {
  setPityCounter(prev => ({ s: prev.s + 1, a: prev.a + 1 }));

  if (pityCounter.s >= 90) {
    // Force S-tier
    setPityCounter(prev => ({ ...prev, s: 0 }));
    return getRandomCharacter("S");
  }

  if (pityCounter.a >= 10) {
    // Force A-tier minimum
    setPityCounter(prev => ({ ...prev, a: 0 }));
    const roll = Math.random();
    return roll < 0.3 ? getRandomCharacter("S") : getRandomCharacter("A");
  }

  return normalPull(type);
}
```

## Currency Acquisition

- Win battle: +50 coins
- Lose battle: +20 coins
- Daily login: +100 coins
- Achievement: varies
