
export enum TerrainType {
  Plains = 'Plains',
  Grassland = 'Grassland',
  Forest = 'Forest',
  Mountain = 'Mountain',
  Desert = 'Desert',
  River = 'River',
  Ocean = 'Ocean'
}

export enum BuildingType {
  None = 'None',
  House = 'House',
  Wall = 'Wall',
  Temple = 'Temple',
  Amphitheatre = 'Amphitheatre'
}

export interface TileData {
  id: string;
  q: number; // Axial coordinates
  r: number;
  x: number; // World coordinates for 3D placement
  z: number;
  terrain: TerrainType;
  building: BuildingType;
  isHovered?: boolean;
}

export interface GameState {
  year: number;
  stats: {
    houses: number;
    population: number;
    capacity: number;
    fertility: number;
    industry: number;
    maxIndustry: number;
    martial: number;
    defense: number;
    science: number;
    culture: number;
    faith: number;
  };
  culturalStage: string;
  selectedAction: BuildingType | null;
  messages: string[];
}

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.Plains]: '#eecfa1', // Wheat/Tan
  [TerrainType.Grassland]: '#86efac', // Light Green
  [TerrainType.Forest]: '#166534', // Dark Green
  [TerrainType.Mountain]: '#64748b', // Slate Grey
  [TerrainType.Desert]: '#fde047', // Yellow
  [TerrainType.River]: '#3b82f6', // Blue
  [TerrainType.Ocean]: '#1e3a8a', // Dark Blue
};

export const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.None]: 0,
  [BuildingType.House]: 0, // Uses fertility logic normally, simplified here
  [BuildingType.Wall]: 10,
  [BuildingType.Temple]: 30,
  [BuildingType.Amphitheatre]: 100
};
