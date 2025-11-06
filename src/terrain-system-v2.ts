// Terrain System v2 - Fixed terrain generation with proper biomes and clean hex layout
// Implements hex-based terrain with bonuses for defense and industry

export type TerrainType = 
  | 'plains'
  | 'forest'
  | 'mountains'
  | 'high_mountains'
  | 'desert'
  | 'marsh'
  | 'river'
  | 'ocean'
  | 'grassland';

export type WaterResourceType =
  | 'river'        // Freshwater - Population capacity 15
  | 'lake'         // Freshwater - Population capacity 10
  | 'lake_brackish' // Brackish - Population capacity 6
  | 'marsh'        // Brackish - Population capacity 7
  | 'ocean'        // Saltwater - Population capacity 5
  | 'none';        // Well water - Population capacity 4

export interface TerrainBonus {
  defense: number;
  industry: number;
  description: string;
}

export interface WaterResource {
  type: WaterResourceType;
  name: string;
  populationCapacity: number;
  description: string;
}

// Terrain bonuses based on the document
export const TERRAIN_BONUSES: Record<TerrainType, TerrainBonus> = {
  plains: {
    defense: 0,
    industry: 0,
    description: 'Open terrain with no bonuses'
  },
  grassland: {
    defense: 0,
    industry: 0,
    description: 'Fertile grasslands'
  },
  forest: {
    defense: 1,
    industry: 3,
    description: 'Dense forests provide lumber and cover'
  },
  mountains: {
    defense: 10,
    industry: 4,
    description: 'Mountains provide stone and strong defenses'
  },
  high_mountains: {
    defense: 15,
    industry: 2,
    description: 'Impassable peaks with extreme defensive advantage'
  },
  desert: {
    defense: 4,
    industry: 0,
    description: 'Harsh desert terrain, difficult to attack through'
  },
  marsh: {
    defense: -2,
    industry: 0,
    description: 'Swampy ground weakens defenses'
  },
  river: {
    defense: 1,
    industry: 0,
    description: 'Rivers provide water and slight defense'
  },
  ocean: {
    defense: 0,
    industry: 0,
    description: 'Coastal waters'
  }
};

// Water resource definitions
export const WATER_RESOURCES: Record<WaterResourceType, WaterResource> = {
  river: {
    type: 'river',
    name: 'River (Freshwater)',
    populationCapacity: 15,
    description: 'Major river provides abundant fresh water - Maximum 15 houses'
  },
  lake: {
    type: 'lake',
    name: 'Lake (Freshwater)',
    populationCapacity: 10,
    description: 'Freshwater lake supports moderate population - Maximum 10 houses'
  },
  lake_brackish: {
    type: 'lake_brackish',
    name: 'Lake (Brackish)',
    populationCapacity: 6,
    description: 'Brackish water limits population growth - Maximum 6 houses'
  },
  marsh: {
    type: 'marsh',
    name: 'Marsh (Brackish)',
    populationCapacity: 7,
    description: 'Marshy terrain with limited fresh water - Maximum 7 houses'
  },
  ocean: {
    type: 'ocean',
    name: 'Ocean (Saltwater)',
    populationCapacity: 5,
    description: 'Coastal settlement relying on wells - Maximum 5 houses'
  },
  none: {
    type: 'none',
    name: 'Wells',
    populationCapacity: 4,
    description: 'No major water source, depends on wells - Maximum 4 houses'
  }
};

// Hex grid system
export interface HexCoordinate {
  q: number;  // Column (cube coordinate)
  r: number;  // Row (cube coordinate)
  s: number;  // Derived: q + r + s = 0
}

export interface HexTile {
  coord: HexCoordinate;
  terrain: TerrainType;
  building?: string;  // 'house', 'temple', 'wall', etc.
  buildingData?: any;
}

// Get neighboring hex coordinates
export function getHexNeighbors(coord: HexCoordinate): HexCoordinate[] {
  const directions = [
    { q: 1, r: 0, s: -1 },   // East
    { q: 1, r: -1, s: 0 },   // Northeast
    { q: 0, r: -1, s: 1 },   // Northwest
    { q: -1, r: 0, s: 1 },   // West
    { q: -1, r: 1, s: 0 },   // Southwest
    { q: 0, r: 1, s: -1 }    // Southeast
  ];
  
  return directions.map(d => ({
    q: coord.q + d.q,
    r: coord.r + d.r,
    s: coord.s + d.s
  }));
}

// Calculate distance between two hexes
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

// Region-based terrain templates (simplified for clarity)
export interface RegionTemplate {
  name: string;
  waterResource: WaterResourceType;
  centerTerrain: TerrainType[];  // Terrain for center hexes
  edgeBiomes: TerrainType[];     // Terrain types for edge biomes
  isIsland?: boolean;
}

export const REGION_TEMPLATES: Record<string, RegionTemplate> = {
  'Egypt': {
    name: 'Egyptian Desert',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['desert', 'desert', 'mountains']
  },
  'Mesopotamia': {
    name: 'Land Between Rivers',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river', 'marsh'],
    edgeBiomes: ['desert', 'mountains', 'marsh']
  },
  'Greece': {
    name: 'Greek Peninsula',
    waterResource: 'lake',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['mountains', 'forest', 'ocean'],
    isIsland: true
  },
  'Germania': {
    name: 'Germanic Forests',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['forest', 'forest', 'mountains']
  },
  'China': {
    name: 'Yellow River Valley',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['mountains', 'forest', 'desert']
  },
  'India': {
    name: 'Indus Valley',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['mountains', 'forest', 'desert']
  },
  'Persia': {
    name: 'Persian Plateau',
    waterResource: 'lake',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['mountains', 'desert', 'mountains']
  },
  'Phoenicia': {
    name: 'Phoenician Coast',
    waterResource: 'ocean',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['ocean', 'mountains', 'forest']
  },
  'Gaul': {
    name: 'Gallic Countryside',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['forest', 'forest', 'mountains']
  },
  'Italia': {
    name: 'Italian Peninsula',
    waterResource: 'river',
    centerTerrain: ['plains', 'grassland', 'river'],
    edgeBiomes: ['mountains', 'forest', 'ocean']
  },
  'Anatolia': {
    name: 'Anatolian Highlands',
    waterResource: 'lake',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['mountains', 'mountains', 'forest']
  },
  'Crete': {
    name: 'Minoan Crete',
    waterResource: 'ocean',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['ocean', 'mountains', 'ocean'],
    isIsland: true
  },
  'default': {
    name: 'Varied Terrain',
    waterResource: 'lake',
    centerTerrain: ['plains', 'grassland'],
    edgeBiomes: ['mountains', 'forest', 'desert']
  }
};

// Generate hex map with proper biomes and clean layout
export function generateHexMapV2(regions: string[], hexRadius: number = 3): HexTile[] {
  const tiles: HexTile[] = [];
  
  // Find matching region template
  let template = REGION_TEMPLATES['default'];
  for (const region of regions) {
    if (REGION_TEMPLATES[region]) {
      template = REGION_TEMPLATES[region];
      break;
    }
  }
  
  // Generate all hex coordinates for the given radius
  const hexCoords: HexCoordinate[] = [];
  for (let q = -hexRadius; q <= hexRadius; q++) {
    const r1 = Math.max(-hexRadius, -q - hexRadius);
    const r2 = Math.min(hexRadius, -q + hexRadius);
    
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      hexCoords.push({ q, r, s });
    }
  }
  
  // Separate edge and center hexes
  const edgeHexes: HexCoordinate[] = [];
  const centerHexes: HexCoordinate[] = [];
  
  for (const coord of hexCoords) {
    const maxCoord = Math.max(Math.abs(coord.q), Math.abs(coord.r), Math.abs(coord.s));
    if (maxCoord === hexRadius) {
      edgeHexes.push(coord);
    } else {
      centerHexes.push(coord);
    }
  }
  
  // Sort edge hexes by angle for contiguous biome assignment
  edgeHexes.sort((a, b) => {
    const angleA = Math.atan2(a.r * Math.sqrt(3)/2, a.q * 3/2);
    const angleB = Math.atan2(b.r * Math.sqrt(3)/2, b.q * 3/2);
    return angleA - angleB;
  });
  
  // Assign biomes to edge hexes
  const edgeBiomes = template.edgeBiomes;
  const hexesPerBiome = Math.ceil(edgeHexes.length / edgeBiomes.length);
  
  // Create edge tiles with biomes
  for (let i = 0; i < edgeHexes.length; i++) {
    const biomeIndex = Math.floor(i / hexesPerBiome);
    const biomeTerrain = edgeBiomes[Math.min(biomeIndex, edgeBiomes.length - 1)];
    
    tiles.push({
      coord: edgeHexes[i],
      terrain: biomeTerrain
    });
  }
  
  // Add barbarian entrance between two different biomes
  if (edgeHexes.length > 0) {
    // Find transition between different biomes
    for (let i = 0; i < edgeHexes.length; i++) {
      const currentBiomeIndex = Math.floor(i / hexesPerBiome);
      const nextIndex = (i + 1) % edgeHexes.length;
      const nextBiomeIndex = Math.floor(nextIndex / hexesPerBiome);
      
      if (currentBiomeIndex !== nextBiomeIndex && i % hexesPerBiome === hexesPerBiome - 1) {
        // Place entrance at this transition
        const entranceIndex = tiles.findIndex(t => 
          t.coord.q === edgeHexes[i].q && 
          t.coord.r === edgeHexes[i].r && 
          t.coord.s === edgeHexes[i].s
        );
        if (entranceIndex >= 0) {
          tiles[entranceIndex].terrain = 'plains'; // Clear entrance for barbarians
        }
        break;
      }
    }
  }
  
  // Fill center with appropriate terrain
  const centerTerrainOptions = template.centerTerrain;
  for (const coord of centerHexes) {
    const randomTerrain = centerTerrainOptions[Math.floor(Math.random() * centerTerrainOptions.length)];
    tiles.push({
      coord,
      terrain: randomTerrain
    });
  }
  
  // Add at least one river hex if the template has river water resource
  if (template.waterResource === 'river' && !tiles.some(t => t.terrain === 'river')) {
    const centerIndex = Math.floor(centerHexes.length / 2);
    if (tiles[edgeHexes.length + centerIndex]) {
      tiles[edgeHexes.length + centerIndex].terrain = 'river';
    }
  }
  
  return tiles;
}

// Calculate total defense from terrain (boolean check - applies once if present)
export function calculateTerrainDefense(tiles: HexTile[], isIsland: boolean = false): number {
  let totalDefense = 0;
  const terrainPresent = new Set<TerrainType>();
  
  // Collect unique terrain types
  for (const tile of tiles) {
    terrainPresent.add(tile.terrain);
  }
  
  // Apply bonus once for each terrain type present
  for (const terrain of terrainPresent) {
    totalDefense += TERRAIN_BONUSES[terrain].defense;
  }
  
  // Add island bonus if applicable
  if (isIsland) {
    totalDefense += 7;
  }
  
  return totalDefense;
}

// Calculate total industry from terrain (boolean check - applies once if present)
export function calculateTerrainIndustry(tiles: HexTile[]): number {
  let totalIndustry = 0;
  const terrainPresent = new Set<TerrainType>();
  
  // Collect unique terrain types
  for (const tile of tiles) {
    terrainPresent.add(tile.terrain);
  }
  
  // Apply bonus once for each terrain type present
  for (const terrain of terrainPresent) {
    totalIndustry += TERRAIN_BONUSES[terrain].industry;
  }
  
  return totalIndustry;
}

// Get water resource for region
export function getWaterResourceForRegion(regions: string[]): WaterResourceType {
  for (const region of regions) {
    const template = REGION_TEMPLATES[region];
    if (template) {
      return template.waterResource;
    }
  }
  
  return REGION_TEMPLATES['default'].waterResource;
}

// Get population capacity from water resource
export function getPopulationCapacity(waterResource: WaterResourceType): number {
  return WATER_RESOURCES[waterResource].populationCapacity;
}

// Check if region is an island (gets +7 defense bonus)
export function checkIfIslandRegion(regions: string[]): boolean {
  for (const region of regions) {
    const template = REGION_TEMPLATES[region];
    if (template && template.isIsland) {
      return true;
    }
  }
  
  return false;
}

// Check if a hex can have a house built on it
export function canBuildHouse(terrain: TerrainType): boolean {
  // Houses cannot be built on water, forests, mountains, or deserts
  // Unless civilization has special bonuses
  const restrictedTerrain: TerrainType[] = [
    'ocean', 'river', 'marsh',  // Water tiles
    'forest',                    // Forest tiles
    'mountains', 'high_mountains', // Mountain tiles
    'desert'                     // Desert tiles
  ];
  
  return !restrictedTerrain.includes(terrain);
}