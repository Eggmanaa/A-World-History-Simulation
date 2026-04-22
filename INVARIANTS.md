# INVARIANTS — Stat Derivation Rules

Load-bearing rules that must hold across the codebase. If you're about to
write code that adds, removes, or modifies a stat, read this first. Every
one of these rules was written because breaking it caused a real bug.

## The One Big Rule

**Know whether your stat is ACCUMULATING or STRUCTURAL before you touch it.**

Wrong classification = double-counting every render (the bug we keep
finding in the wild).

## ACCUMULATING stats

The stored value on `civ.stats.*` IS the truth. `calculateStats` reads
from `civData.stats.*` and adds nothing derived.

| Stat | Field | How it grows |
|------|-------|--------------|
| Culture | `stats.culture` | Develop action, one-shot +3 when Amphitheatre placed, wonder-at-build |
| Science | `stats.science` | Research action, wonder-at-build |
| Faith | `stats.faith` | Worship action, one-shot +2 when Temple placed, wonder-at-build, conversions |
| Production Pool | `stats.productionPool` | Turn income + loot + event rewards; treasury spent on buildings |

Rules for ACCUMULATING stats:

- `calculateStats` MUST NOT add building bonuses to these. Buildings add
  to the stored total ONCE at placement time (in `handleTileClick`).
  Adding them again in `calculateStats` compounds every render.
- Wonder `.bonus.faith / .culture / .science` are applied ONCE at build
  time in the action handler, not in `calculateStats`.
- Tenets MUST NOT add to ACCUMULATING stats — they modify YIELDS only.
- Events that grant Culture/Faith/Science write a stat change once to
  `civ.stats` and do not touch `calculateStats`.

## STRUCTURAL stats

Derived from current map + civ definition every render. Losing the
source (building demolished, neighbor conquered, wonder replaced) loses
the bonus. `calculateStats` rebuilds these from scratch.

| Stat | Field | Sources |
|------|-------|---------|
| Martial | derived | base + baseDefense + terrain + buildings (Barracks, ArchTower) + traits + religion tenets + cultural stage + wonders + naval |
| Industry | derived | base + terrain |
| Capacity | derived | baseStats.capacity + buildings (Farm, Wall) + wonders + Medicine tenet + Grow's `capacityBonus` |
| Fertility | derived | baseStats.fertility (+ Medicine, +event bumps) |
| Production Income | derived | base + buildings (Workshops, Farms) + wonders |
| Science Yield | derived | base + Library tile bonuses |
| Culture Yield | derived | base + Amphitheatre tile bonuses |
| Faith Yield | derived | base + Temple tile bonuses |
| Diplomacy | fully derived | 0 + traits + tenets + science + wonders + cultural prestige (never read from stored value) |

Rules for STRUCTURAL stats:

- `calculateStats` adds building, terrain, tenet, cultural stage, wonder
  contributions every render. This is correct because the stat is fully
  rebuilt; re-adding doesn't compound.
- NEVER set `civ.stats.martial = X` at action time for a PERMANENT
  boost. The next render will overwrite it. Use `capacityBonus`-style
  persistent flags instead (see Exceptions below).

## PERSISTENT STRUCTURAL BONUSES (the exception)

When an action needs to grant a permanent bonus to a STRUCTURAL stat,
store a side-channel on `civ.stats` that `calculateStats` re-applies.
Pattern:

```ts
// Grow adds +1 permanent Capacity.
// Store it here, because a raw stats.capacity bump would be wiped
// when calculateStats rebuilds from baseStats + buildings.
capacityBonus?: number;
```

Existing members of this category:

- `stats.capacityBonus` — re-added to capacity in `calculateStats`
- `stats.fortifyDice` — not derived; consumed and decayed by
  `calculateIncome`
- `stats.rallyUntilTurn` — absolute turn number; `calculateIncome` and
  attack defense check it and add rally bonuses on defensive rolls
- `civ.culturalBonuses[]` / `civ.technologies[]` / `civ.techChoices[]` —
  lists of tree-unlocked structural bonuses. `calculateStats` iterates
  each render.
- `civ.builtWonderId` — string pointer; `calculateStats` re-applies
  `wonder.bonus.*` for STRUCTURAL fields every render.

Rules for this category:

- Field is optional (`?:`) for save-compat.
- Action writes once, never reads.
- `calculateStats` is the ONLY consumer that re-applies it to the
  derived stat. If you read it elsewhere (e.g., `calculateIncome`), you
  use the raw stored value, not the derived stat.
- Absolute values beat countdowns for turn-windowed buffs (see
  `rallyUntilTurn`). A countdown `turnsRemaining` field requires an
  atomic decrement step somewhere in the turn pipeline; miss or
  double-apply that step and the buff drifts. `turnNumber + 1` as a
  stored expiration survives any ordering.

## Turn Pipeline Ordering

One pass per turn, right-to-left on the timeline:

1. `initiateAdvance` — user clicks "Next Turn"
2. `turnPhase: income` — `calculateIncome` runs:
   - Fertility + industry-to-pool conversion
   - Religion spread, tenet per-turn effects
   - Raid roll (may set `rallyUntilTurn`)
   - NPC retaliation (may set `rallyUntilTurn`, flip relationships)
   - Decay fortifyDice by 1
3. `turnPhase: unlocks` — tech/cultural thresholds checked
4. `turnPhase: world_event` — random world event, player picks a choice
5. `turnPhase: action` — player picks one of 10 actions
6. `turnPhase: build_phase` — player places buildings until Turn button
7. `turnPhase: resolution` — summary modal shown; dismiss returns to `idle`

Gotchas:

- `housesBuiltThisTurn` resets in step 2 (income). Grow placements
  intentionally bypass this cap by flag-checking `selectedPlayerAction
  === 'grow'` during placement.
- Starter houses (`isPlacingStarterHouses`) also bypass
  `housesBuiltThisTurn` and Grow's cap. They are a pre-turn-1 freebie.
- `turnNumber` increments at the END of the turn, not the start, so
  `rallyUntilTurn = currentTurn + 1` is valid for "next turn's
  defense."
- Starter placements happen at `turnNumber: 0`. Turn 1 is the first
  real turn.

## Attack Action Outcomes

Four branches, ALL must include:

- `combatResult: { target, won, margin, effects, rolls }`
- `attackedNeighborId: targetId` — plumbs Victim's Rally to the
  neighbor
- `relationshipErosions: erosions.length > 0 ? erosions : undefined` —
  plumbs diplomatic blowback

Loot only enters `statChanges` for Victory and Decisive. Culture is
NEVER paid by attack — all Culture comes from Develop or one-shot
Amphitheatre placement.

## Multiplayer Sync Boundaries

Server is authoritative for:

- `turnNumber`, turn-phase advancement
- Player-vs-player attack resolution
- Shared game state (all civs' public stats, map state)

Client is authoritative for:

- Building placements (sent as `buildActions` in decision payload)
- Action selection and local stat changes until `submitDecision`
- UI state (selected tabs, popups, etc.)

Any field stored on `civ.stats` must be safe to serialize through the
`turnDecision` sync. Optional fields (`?:`) survive missing-key deserialization.

## When You Change a Stat

Checklist:

1. Which category is this stat? ACCUMULATING, STRUCTURAL, or
   PERSISTENT STRUCTURAL BONUS?
2. Where does it grow? (action, tile placement, income, event)
3. Where is it CONSUMED? (combat, capacity check, display)
4. Does `calculateStats` touch it? If so, does that re-application
   match the category?
5. Will it survive a save-file round-trip? (optional field, default
   falsy)
6. Does it need to be in the multiplayer decision payload?
7. If it's a turn-windowed buff, is it an absolute expiration or a
   countdown? (Prefer absolute.)

## Known Hotspots

- `GameApp.tsx` `calculateStats` (~290-600) — the single source of
  truth for STRUCTURAL stat derivation. Any new building, tenet, tech,
  cultural bonus, wonder, or trait effect on a STRUCTURAL stat goes
  here.
- `actionSystem.ts` `calculateIncome` (~806-1040) — the single source
  of truth for per-turn automatic effects (raids, retaliation, fortify
  decay, rally set).
- `actionSystem.ts` `executeAction` — switch statement per action.
  Actions write to `statChanges`; never mutate derived stats.
- `handleTileClick` in `GameApp.tsx` — applies ONE-SHOT stat bumps for
  Temple / Amphitheatre placement (faith/culture).
- `handleActionSelect` in `GameApp.tsx` — applies ONE-SHOT wonder
  ACCUMULATING bonuses when a wonder is built.
