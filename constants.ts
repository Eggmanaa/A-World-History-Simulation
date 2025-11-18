import { TerrainType, TileData, BuildingType } from './types';

export const HEX_SIZE = 1.0;
export const BOARD_WIDTH = 7;
export const BOARD_HEIGHT = 7;

export const generateMap = (): TileData[] => {
  const tiles: TileData[] = [];
  const width = BOARD_WIDTH;
  const height = BOARD_HEIGHT;

  // Calculate offsets to center the map at 0,0
  // Width of hex grid is roughly width * sqrt(3) * size
  // Height of hex grid is roughly height * 1.5 * size
  const totalWidthX = width * Math.sqrt(3) * HEX_SIZE;
  const totalHeightZ = height * 1.5 * HEX_SIZE;
  
  const offsetX = totalWidthX / 2;
  const offsetZ = totalHeightZ / 2;

  for (let r = 0; r < height; r++) {
    const rOffset = Math.floor(r / 2);
    for (let q = -rOffset; q < width - rOffset; q++) {
        
      // Hex logic for tight spacing
      // x = size * sqrt(3) * (q + r/2)
      // z = size * 3/2 * r
      const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
      const z = HEX_SIZE * (3 / 2) * r;
      
      // Procedural terrain generation (simple noise simulation)
      const noise = Math.sin(q * 0.8) + Math.cos(r * 0.7);
      let terrain = TerrainType.Grassland;

      if (noise > 1.1) terrain = TerrainType.Mountain;
      else if (noise > 0.5) terrain = TerrainType.Forest;
      else if (noise < -1.2) terrain = TerrainType.Desert;
      else if (noise < -0.5 && noise > -0.8) terrain = TerrainType.River;
      
      // Hardcode center to be nice plains
      if (Math.abs(q + r/2) < 1.5 && Math.abs(r - height/2) < 1.5) terrain = TerrainType.Plains;

      // Edges are ocean
      if (r === 0 || r === height - 1 || q === -rOffset || q === width - rOffset - 1) {
          terrain = TerrainType.Ocean;
      }

      tiles.push({
        id: `${q},${r}`,
        q,
        r,
        x: x - offsetX + (width/2), // Center correction
        z: z - offsetZ + 1, // Center correction
        terrain,
        building: BuildingType.None
      });
    }
  }
  return tiles;
};

export const INITIAL_GAME_STATE = {
  year: -50000,
  stats: {
    houses: 2,
    population: 2,
    capacity: 15,
    fertility: 2,
    industry: 20,
    maxIndustry: 20,
    martial: 5,
    defense: 5,
    science: 3,
    culture: 0,
    faith: 24,
  },
  culturalStage: 'Barbarism',
  selectedAction: null,
  messages: ["Welcome to 50,000 BC. Select an action to begin."],
};