
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
  Wall = 'Wall',
  Temple = 'Temple',
  Amphitheatre = 'Amphitheatre',
  Wonder = 'Wonder',
  ArchimedesTower = 'ArchimedesTower'
}

export type WaterResource = 'River' | 'Lake' | 'LakeBrackish' | 'Marsh' | 'Ocean' | 'Well';

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
  };
  waterResource: WaterResource;
  isIsland: boolean;
  colors: {
    base: string;
    accent: string;
  };
  centerBiomes: TerrainType[];
  edgeBiomes: TerrainType[];
}

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

export type Relationship = 'Neutral' | 'Ally' | 'Enemy';

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
    };
    baseStats: { // Snapshot of base stats for recalculation
        martial: number;
        defense: number;
        faith: number;
        industry: number;
        fertility: number;
    };
    culturalStage: 'Barbarism' | 'Classical' | 'Imperial' | 'Decline';
    traits: string[];
    buildings: {
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

export const TERRAIN_BONUSES: Record<TerrainType, { defense: number, industry: number }> = {
    [TerrainType.Plains]: { defense: 0, industry: 0 },
    [TerrainType.Grassland]: { defense: 0, industry: 0 },
    [TerrainType.Forest]: { defense: 1, industry: 3 },
    [TerrainType.Mountain]: { defense: 10, industry: 4 },
    [TerrainType.HighMountain]: { defense: 15, industry: 2 },
    [TerrainType.Desert]: { defense: 4, industry: 0 },
    [TerrainType.Marsh]: { defense: -2, industry: 0 },
    [TerrainType.River]: { defense: 1, industry: 0 },
    [TerrainType.Ocean]: { defense: 0, industry: 0 },
};

export const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.None]: 0,
  [BuildingType.House]: 0,
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
