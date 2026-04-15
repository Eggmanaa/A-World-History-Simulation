
export enum TerrainType {
  Plains = 'Plains',
  Grassland = 'Grassland',
  Forest = 'Forest',
  Mountain = 'Mountain',
  HighMountain = 'HighMountain',
  Desert = 'Desert',
  River = 'River',
  Ocean = 'Ocean',
  Marsh = 'Marsh'
}

export enum BuildingType {
  None = 'None',
  House = 'House',
  Farm = 'Farm',
  Workshop = 'Workshop',
  Library = 'Library',
  Barracks = 'Barracks',
  Wall = 'Wall',
  Temple = 'Temple',
  Amphitheatre = 'Amphitheatre',
  Wonder = 'Wonder',
  ArchimedesTower = 'ArchimedesTower'
}

export type WaterResource = 'River' | 'Lake' | 'LakeBrackish' | 'Marsh' | 'Ocean' | 'Well';

// Climate zones drive the look of trees, foliage and ground dressing. Each
// civilization maps to one of these so its map feels authentic to its real
// historical geography. Climate is cosmetic — it never changes combat math
// or yields — but it massively changes how a civ *feels* on screen.
export type ClimateZone =
  | 'temperate'   // Europe, forested Mediterranean: oak, pine
  | 'mediterranean' // olive, cypress, low scrub
  | 'arid'        // Egypt, Persia, Arabia: date palms, acacia, sparse
  | 'tropical'    // Khmer, Olmec, Nubia: jungle palms, broadleaf
  | 'boreal'      // Scythia, north: conifers, birch
  | 'savanna'     // Sub-Saharan Africa: baobab, acacia, grass
  | 'alpine'      // Anatolia/mountainous: pine, fir
  | 'highland';   // Ethiopia/Andean: acacia, conifer, meadow

export interface TileData {
  id: string;
  q: number;
  r: number;
  s: number;
  x: number;
  z: number;
  terrain: TerrainType;
  building: BuildingType;
  isHovered?: boolean;
  // Optional per-tile climate override. Normally tiles inherit the civ's
  // climate, but future map-blending could make tiles on the far edge take
  // on a neighbor's climate aesthetic.
  climate?: ClimateZone;
}

export interface Trait {
  id: string;
  name: string;
  effect: string;
}

export interface CivPreset {
  id: string;
  name: string;
  regions: string[];
  traits: string[];
  baseStats: {
    martial: number;
    defense: number;
    faith: number;
    industry: number;
    fertility: number;
    // V2 yields
    productionIncome?: number;
    scienceYield?: number;
    cultureYield?: number;
    faithYield?: number;
    capacity?: number;
  };
  waterResource: WaterResource;
  isIsland: boolean;
  colors: {
    base: string;
    accent: string;
  };
  centerBiomes: TerrainType[];
  edgeBiomes: TerrainType[];
  // Cosmetic climate hint — drives tree species and ground dressing in 3D
  // rendering. If omitted, the renderer falls back to 'temperate'.
  climate?: ClimateZone;
}

export interface RespawnCiv {
  id: string;
  name: string;
  availableTurn: number; // earliest turn this respawn civ becomes available
  region: string; // geographic region for flavor
  baseStats: {
    martial: number;
    defense: number;
    faith: number;
    industry: number;
    fertility: number;
    productionIncome: number;
    scienceYield: number;
    cultureYield: number;
    faithYield: number;
    capacity: number;
  };
  trait: string;
  traitDescription: string;
  waterResource: WaterResource;
  colors: { base: string; accent: string };
  centerBiomes: TerrainType[];
  edgeBiomes: TerrainType[];
  climate?: ClimateZone;
}

export type RespawnBonus = {
  id: string;
  name: string;
  description: string;
  effects: Partial<{
    martial: number;
    defense: number;
    productionIncome: number;
    productionPool: number;
    science: number;
    culture: number;
    faith: number;
    capacity: number;
  }>;
};

export interface WonderDefinition {
    id: string;
    name: string;
    cost: number;
    era: 'Ancient' | 'Classical' | 'Late';
    minYear: number;
    effects: string;
    bonus: Partial<{
        populationCapacity: number;
        production: number;
        martial: number;
        defense: number;
        faith: number;
        culture: number;
        science: number;
        diplomacy: number;
    }>;
}

export interface ReligionTenet {
    id: string;
    name: string;
    description: string;
}

export interface ScienceUnlock {
    level: number;
    effect: string;
    statBonus?: Partial<Record<StatKey, number>>;
    unlocks?: string; // e.g., 'attack_through_marsh', 'bronze_working'
}

export type Relationship = 'Neutral' | 'Ally' | 'Enemy';
export type TreatyType = 'peace' | 'trade' | 'military' | 'cultural';

export interface Treaty {
    neighborId: string;
    type: TreatyType;
    turnsRemaining: number;
}

export interface NeighborCiv {
    id: string;
    name: string;
    martial: number;
    defense: number;
    faith: number;
    isConquered: boolean;
    relationship: Relationship;
    religion?: string;
}

// Turn System Types
export type TurnPhase = 'setup' | 'decision' | 'resolution' | 'results';

export interface TurnState {
  number: number;
  phase: TurnPhase;
  timeRemaining: number; // seconds, -1 means no timer
  submittedCount: number;
  totalPlayers: number;
  isPaused: boolean;
  deadline?: number; // Unix timestamp when phase ends
}

export interface TurnDecision {
  culturalFocus: StatKey | null;
  buildActions: { tileIndex: number; building: BuildingType }[];
  warDeclarations: string[]; // preset IDs of civs to attack
  allianceOffers: string[]; // preset IDs of civs to ally with
  submitted: boolean;
  // V2: which player action was taken this turn and against whom (if any)
  v2Action?: PlayerActionType | null;
  v2ActionParams?: Record<string, any> | null;
  // V2: turn-end stat snapshot so the teacher can see real numbers
  finalStats?: Record<string, number>;
}

// New Event System Types
export type StatKey = 'martial' | 'defense' | 'faith' | 'industry' | 'fertility' | 'science' | 'culture' | 'diplomacy' | 'capacity';

export type EventActionType = 
  | 'MODIFY_STAT' // Permanent flat or percent bonus to a stat
  | 'DISASTER'    // Conditional loss of population/houses based on saving throw
  | 'SET_FLAG'    // Set a game state flag (e.g., war_unlocked, religion_unlocked)
  | 'ADD_NEIGHBOR' // Spawn a new neighbor civ
  | 'SPECIAL';    // Unique logic strings

export interface TimelineEventAction {
    type: EventActionType;
    targetRegions?: string[]; // If undefined, affects everyone. If present, matches civ.regions
    stat?: StatKey;
    value?: number; // Flat value or percent
    valueSource?: 'houses'; // If present, value is derived from dynamic stat
    isPercent?: boolean;
    
    // Disaster specific
    saveTrait?: string; // Trait that auto-passes (e.g. 'Industrious')
    saveStat?: StatKey; // Stat used for DC check
    saveDC?: number;
    failEffect?: {
        houseLossPercent?: number; // e.g. 50 for 50% loss
        popSetTo?: number; // Hard set population
        conquered?: boolean;
    };
    
    // Neighbor specific
    neighbor?: Partial<NeighborCiv>;

    // Flag/Special
    flagName?: string;
    message: string; // Log message
}

export interface TimelineEvent {
    year: number;
    name: string;
    desc: string;
    actions?: TimelineEventAction[];
}

export interface EventPopupData {
    year: number;
    name: string;
    description: string;
    effects: string[];
}

// ============================================================
// NEW EVENT & ACTION SYSTEM (v2 - Paper Game Adaptation)
// ============================================================

// Turn phase flow: INCOME → UNLOCKS → WORLD_EVENT → CIV_EVENT → BUILD_PHASE → ACTION → RESOLUTION
export type TurnPhaseV2 = 'income' | 'unlocks' | 'world_event' | 'civ_event' | 'build_phase' | 'action' | 'resolution' | 'idle';

// The 10 action types (Build is a separate phase, not an action)
export type PlayerActionType =
  | 'grow'       // +2 Population (place houses)
  | 'build'      // Legacy: kept for backward compat in TurnResolution
  | 'research'   // Gain Science Yield + Library bonuses
  | 'trade'      // Partner with adjacent civ for mutual benefit
  | 'attack'     // Combat (unlocks Turn 3)
  | 'fortify'    // Defensive stance: adds stacking d6 on defense rolls
  | 'develop'    // Gain Culture Yield + Amphitheater bonuses
  | 'worship'    // Gain Faith Yield + Temple bonuses, or found religion
  | 'wonder'     // Invest production toward a Wonder
  | 'diplomacy'; // Form/maintain alliance

export interface PlayerActionDef {
  id: PlayerActionType;
  name: string;
  description: string;
  icon: string; // lucide icon name
  available: (state: GameState) => boolean;
  execute: (state: GameState, tiles: TileData[], params?: any) => ActionResult;
}

export interface ActionResult {
  statChanges: Partial<GameState['civilization']['stats']>;
  messages: string[];
  flagChanges?: Partial<GameState['civilization']['flags']>;
  gameFlagChanges?: Partial<GameState['gameFlags']>;
  enableMapPlacement?: BuildingType; // For grow/build: allow placing on map
  maxPlacements?: number; // How many tiles can be placed (e.g., 2 for grow)
  tempDefenseBonus?: number; // For fortify
  tradeTarget?: string; // For trade action
  wonderInvestment?: number; // For wonder action
}

// World Event with A/B/C choices
export interface WorldEventChoice {
  id: 'A' | 'B' | 'C';
  label: string;
  description: string;
  effects: WorldEventEffect[];
}

export interface WorldEventEffect {
  type: 'modify_stat' | 'modify_yield' | 'lose_population' | 'gain_building' | 'set_flag' | 'trade_route' | 'special';
  stat?: StatKey;
  value?: number;
  isPercent?: boolean;
  condition?: string; // e.g., 'river_civ', 'has_wall', 'has_temple'
  message?: string;
}

export interface CivSpecificEvent {
  civId: string; // matches CivPreset.id
  name: string;
  description: string;
  effects: WorldEventEffect[];
}

export interface WorldEvent {
  turn: number;
  year: number;
  yearLabel: string; // e.g., "8500 BC"
  name: string;
  era: 'Ancient' | 'Bronze' | 'Iron' | 'Classical' | 'Imperial' | 'Late';
  description: string; // flavor text
  globalEffects: WorldEventEffect[]; // applied to everyone before choices
  choices: WorldEventChoice[];
  civSpecificEvents: CivSpecificEvent[];
  unlocks?: string[]; // e.g., ['religion', 'warfare', 'wonders_ancient']
}

// Turn resolution summary
export interface TurnResolution {
  turn: number;
  incomeGained: number;
  populationChange: number;
  worldEventName: string;
  choiceMade: 'A' | 'B' | 'C';
  choiceEffects: string[];
  civEventName?: string;
  civEventEffects?: string[];
  actionTaken: PlayerActionType;
  actionEffects: string[];
  statsBefore: Record<string, number>;
  statsAfter: Record<string, number>;
}

export interface GameState {
  simulationId: string;
  year: number;
  timelineIndex: number;
  civilization: {
    presetId: string;
    name: string;
    regions: string[];
    stats: {
      houses: number;
      housesBuiltThisTurn: number;
      population: number;
      capacity: number;
      fertility: number;
      industry: number;
      industryLeft: number;
      martial: number;
      defense: number;
      science: number;
      culture: number;
      faith: number;
      diplomacy: number;
      // V2: Yield rates (only grow via actions) and Production Pool (treasury)
      productionPool: number;
      productionIncome: number;
      scienceYield: number;
      cultureYield: number;
      faithYield: number;
      tempDefenseBonus: number; // legacy: flat defense buff, clears each turn
      // FORTIFY DICE: persistent counter of extra d6 dice the civ rolls on
      // every DEFENSIVE event (raids and incoming attacks). Each use of the
      // Fortify action adds +1, capped at FORTIFY_MAX. Decays by 1 at the
      // start of each income phase so standing armies eventually relax. This
      // stat intentionally does NOT help the civ attack — its purpose is
      // pure defense, preventing a runaway offensive snowball.
      fortifyDice: number;
    };
    baseStats: { // Snapshot of base stats for recalculation
        martial: number;
        defense: number;
        faith: number;
        industry: number;
        fertility: number;
    };
    culturalStage: 'Barbarism' | 'Classical' | 'Imperial' | 'Enlightenment' | 'Modern' | 'Decline';
    traits: string[];
    technologies: string[];
    // Cultural Tree bonuses the player has claimed. Source of truth —
    // calculateStats() re-applies the STRUCTURAL portions of each bonus
    // every render, so they survive recomputes (bonuses stored directly
    // in civ.stats would be wiped when the stat is re-derived from
    // baseStats + buildings + traits).
    culturalBonuses: string[];
    // Tech Tree branch picks. Players choose ONE branch per tier at the
    // Bronze/Classical/Renaissance science thresholds. Same pattern as
    // culturalBonuses — stored here, re-applied every render.
    techChoices: string[];
    buildings: {
      farms: number;
      workshops: number;
      libraries: number;
      barracks: number;
      temples: number;
      amphitheatres: number;
      walls: number;
      archimedes_towers: number;
    };
    builtWonderId: string | null;
    religion: {
        name: string | null;
        tenets: string[];
    };
    flags: {
        conquered: boolean;
        religionFound: boolean;
        housesSupportTwoPop: boolean;
        israelBonus: boolean;
        troyWallDouble: boolean;
        romanSplit: boolean;
        alexandrianBonus: boolean;
        chinaWallDiscount: boolean;
    }
  };
  gameFlags: {
      warUnlocked: boolean;
      religionUnlocked: boolean;
  };
  neighbors: NeighborCiv[];
  selectedAction: BuildingType | null;
  placingWonder: boolean;
  messages: string[];
  hasStarted: boolean;
  pendingTurnChoice: boolean;
  currentEventPopup: EventPopupData | null;
  warsWon: number;
  religionSpread: number;
  wondersBuilt: WonderDefinition[];
  // Combat log: append-only record of every attack this civ has launched.
  // Used by the War tab to show history, outcomes, and conquest progress.
  combatLog?: CombatLogEntry[];
  gameEnded: boolean;
  treaties: Treaty[];
  tradedThisTurn: string[];
  fogOfWar: boolean;
  pendingTreaty: string | null;
  // V2: New turn flow state
  turnPhase: TurnPhaseV2;
  currentWorldEvent: WorldEvent | null;
  currentCivEvent: CivSpecificEvent | null;
  selectedWorldChoice: 'A' | 'B' | 'C' | null;
  selectedAction: BuildingType | null; // kept for backward compat
  selectedPlayerAction: PlayerActionType | null;
  turnResolution: TurnResolution | null;
  actionPlacements: number; // remaining placements for grow/build actions
  turnNumber: number; // 1-24
  // Conquest & Respawn
  conqueredTerritories: number; // number of civs conquered
  pendingRespawn: boolean; // if this player needs to pick a respawn civ
  respawnOptions: string[]; // available respawn civ IDs based on current turn
  conquestReward: { // pending reward from conquering someone
    buildingsGained: Partial<GameState['civilization']['buildings']>;
    tilesGained: number;
  } | null;
  // Prominent attack outcome modal (replaces having to hunt the lower-right
  // tab). Cleared when the student acknowledges the result.
  attackOutcome?: AttackOutcomePopup | null;
  // Queue of threshold popups — shown one-by-one. IDs already awarded are
  // tracked separately so we never re-show the same milestone.
  pendingThresholds?: ThresholdPopup[];
  thresholdsAwarded?: string[];
}

// Maximum fortify dice a civ can stack. Above this, further Fortify
// actions just refresh existing dice (no decay that round) rather than
// pile on more — keeps the mechanic defensive, not game-breaking.
export const FORTIFY_MAX = 3;

export interface CombatLogEntry {
  turn: number;
  target: string;
  attackTotal: number;
  defendTotal: number;
  margin: number;
  outcome: 'decisive_victory' | 'victory' | 'stalemate' | 'defeat';
  conquered?: boolean;
  popLost?: number;
  martialLost?: number;
  loot?: { culture?: number; production?: number };
  // Full dice breakdown so the Attack Outcome Popup can show the student
  // exactly where every number came from — this is a teaching moment.
  rolls?: {
    attackerMartial: number;
    attackerBaseRoll: number;     // attacker's d6
    defenderMartial: number;
    defenderBaseRoll: number;     // defender's d6
    wallDice: number[];           // each wall tile contributes 1d6
    fortifyDice: number[];        // each fortify stack contributes 1d6
    bypassedWalls: boolean;       // Siege Engineering cancels wall dice
  };
}

// One-shot modal that surfaces the outcome of an attack action in a clear,
// prominent way — not just the lower-right tab. Kept on GameState so a page
// reload mid-modal still shows the result.
export interface AttackOutcomePopup {
  turn: number;
  targetName: string;
  attackerName: string;
  attackTotal: number;
  defendTotal: number;
  margin: number;
  outcome: 'decisive_victory' | 'victory' | 'stalemate' | 'defeat';
  rolls: CombatLogEntry['rolls'];
  effects: string[];
}

// Queued milestone popups. When a student crosses a threshold (Science 10,
// Culture 20, Faith 10 for religion, etc.) we enqueue one of these and the
// renderer pops them in sequence so the student acknowledges each before
// continuing. This hugely expands decision space — students actually SEE the
// milestones they earned instead of having them quietly accrue.
export interface ThresholdPopup {
  id: string;                     // unique key for dedupe (e.g., 'sci-30')
  kind: 'science' | 'culture' | 'faith' | 'population' | 'martial' | 'wonder';
  title: string;
  subtitle: string;               // short hook, e.g. "You unlocked Bronze Working"
  description: string;            // longer historical flavor
  bonuses: string[];              // readable bullet list of what they get
  cta?: string;                   // call-to-action button label
}

export interface VictoryCondition {
    name: string;
    description: string;
    icon: string;
    target: number; // Score needed to win this path.
    calculate: (state: any) => number;
    // Breakdown of line items feeding the score, for UI display.
    recipe: (state: any) => { label: string; value: number; points: number; formula: string }[];
}

export interface Broadcast {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'pause';
    timestamp: number;
    teacherName?: string;
}

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.Plains]: '#eecfa1',
  [TerrainType.Grassland]: '#86efac',
  [TerrainType.Forest]: '#166534',
  [TerrainType.Mountain]: '#78716c',
  [TerrainType.HighMountain]: '#475569',
  [TerrainType.Desert]: '#fde047',
  [TerrainType.River]: '#3b82f6',
  [TerrainType.Ocean]: '#1e3a8a',
  [TerrainType.Marsh]: '#064e3b',
};

// Terrain bonuses are summed once per UNIQUE terrain type on the player's
// map (not per tile). Values were originally tuned for a separate Defense
// stat but Defense is now folded into Martial — and Martial is then
// multiplied by Strength trait and cultural stage. So we kept the bonuses
// modest to avoid triple-scaled blowups (e.g., Sparta at 100+ Martial).
// Industry is the per-turn Production Income contribution.
export const TERRAIN_BONUSES: Record<TerrainType, { defense: number, industry: number }> = {
    [TerrainType.Plains]: { defense: 0, industry: 0 },
    [TerrainType.Grassland]: { defense: 0, industry: 1 },
    [TerrainType.Forest]: { defense: 1, industry: 2 },
    [TerrainType.Mountain]: { defense: 3, industry: 1 },
    [TerrainType.HighMountain]: { defense: 5, industry: 1 },
    [TerrainType.Desert]: { defense: 1, industry: 0 },
    [TerrainType.Marsh]: { defense: -1, industry: 0 },
    [TerrainType.River]: { defense: 1, industry: 1 },
    [TerrainType.Ocean]: { defense: 0, industry: 0 },
};

export const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.None]: 0,
  [BuildingType.House]: 0,
  [BuildingType.Farm]: 5,
  [BuildingType.Workshop]: 8,
  [BuildingType.Library]: 10,
  [BuildingType.Barracks]: 10,
  [BuildingType.Wall]: 10,
  [BuildingType.Temple]: 10,
  [BuildingType.Amphitheatre]: 10,
  [BuildingType.Wonder]: 30,
  [BuildingType.ArchimedesTower]: 20
};

export const WATER_CAPACITIES: Record<WaterResource, number> = {
    'River': 15,
    'Lake': 10,
    'LakeBrackish': 6,
    'Marsh': 7,
    'Ocean': 5,
    'Well': 4
};
