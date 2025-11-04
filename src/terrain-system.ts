// Terrain System for Civilization Simulation
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

// Convert offset coordinates (row, col) to cube coordinates (q, r, s)
export function offsetToCube(row: number, col: number): HexCoordinate {
  const q = col - Math.floor(row / 2);
  const r = row;
  const s = -q - r;
  return { q, r, s };
}

// Convert cube coordinates to offset
export function cubeToOffset(coord: HexCoordinate): { row: number, col: number } {
  const row = coord.r;
  const col = coord.q + Math.floor(coord.r / 2);
  return { row, col };
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

// Region-based terrain templates
export interface RegionTemplate {
  name: string;
  waterResource: WaterResourceType;
  terrainDistribution: {
    terrain: TerrainType;
    weight: number;  // Higher weight = more common
  }[];
  guaranteedFeatures?: {
    terrain: TerrainType;
    count: number;
  }[];
  isIsland?: boolean;  // Adds +7 defense if true
}

export const REGION_TEMPLATES: Record<string, RegionTemplate> = {
  'Egypt': {
    name: 'Egyptian Desert',
    waterResource: 'river',  // Nile River
    terrainDistribution: [
      { terrain: 'desert', weight: 50 },
      { terrain: 'river', weight: 20 },
      { terrain: 'plains', weight: 20 },
      { terrain: 'grassland', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'river', count: 3 }  // Ensure Nile presence
    ]
  },
  'Mesopotamia': {
    name: 'Land Between Rivers',
    waterResource: 'river',  // Tigris & Euphrates
    terrainDistribution: [
      { terrain: 'plains', weight: 30 },
      { terrain: 'marsh', weight: 25 },
      { terrain: 'river', weight: 25 },
      { terrain: 'grassland', weight: 20 }
    ],
    guaranteedFeatures: [
      { terrain: 'river', count: 4 },
      { terrain: 'marsh', weight: 2 }
    ]
  },
  'Greece': {
    name: 'Greek Peninsula',
    waterResource: 'lake',  // Mediterranean
    terrainDistribution: [
      { terrain: 'mountains', weight: 40 },
      { terrain: 'forest', weight: 20 },
      { terrain: 'plains', weight: 20 },
      { terrain: 'ocean', weight: 20 }
    ],
    guaranteedFeatures: [
      { terrain: 'mountains', count: 3 }
    ],
    isIsland: true  // +7 defense
  },
  'Germania': {
    name: 'Germanic Forests',
    waterResource: 'river',
    terrainDistribution: [
      { terrain: 'forest', weight: 60 },
      { terrain: 'plains', weight: 20 },
      { terrain: 'river', weight: 10 },
      { terrain: 'marsh', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'forest', count: 5 }
    ]
  },
  'China': {
    name: 'Yellow River Valley',
    waterResource: 'river',  // Yellow River
    terrainDistribution: [
      { terrain: 'mountains', weight: 30 },
      { terrain: 'river', weight: 20 },
      { terrain: 'plains', weight: 25 },
      { terrain: 'grassland', weight: 15 },
      { terrain: 'forest', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'river', count: 3 },
      { terrain: 'mountains', count: 2 }
    ]
  },
  'India': {
    name: 'Indus Valley',
    waterResource: 'river',  // Indus River
    terrainDistribution: [
      { terrain: 'plains', weight: 35 },
      { terrain: 'river', weight: 25 },
      { terrain: 'grassland', weight: 20 },
      { terrain: 'mountains', weight: 20 }
    ],
    guaranteedFeatures: [
      { terrain: 'river', count: 3 }
    ]
  },
  'Persia': {
    name: 'Persian Plateau',
    waterResource: 'lake',
    terrainDistribution: [
      { terrain: 'mountains', weight: 40 },
      { terrain: 'desert', weight: 30 },
      { terrain: 'plains', weight: 20 },
      { terrain: 'grassland', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'mountains', count: 2 }
    ]
  },
  'Phoenicia': {
    name: 'Phoenician Coast',
    waterResource: 'ocean',  // Mediterranean coast
    terrainDistribution: [
      { terrain: 'ocean', weight: 30 },
      { terrain: 'mountains', weight: 30 },
      { terrain: 'plains', weight: 25 },
      { terrain: 'forest', weight: 15 }
    ]
  },
  'Gaul': {
    name: 'Gallic Countryside',
    waterResource: 'river',
    terrainDistribution: [
      { terrain: 'forest', weight: 40 },
      { terrain: 'plains', weight: 30 },
      { terrain: 'grassland', weight: 20 },
      { terrain: 'river', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'forest', count: 3 }
    ]
  },
  'Italia': {
    name: 'Italian Peninsula',
    waterResource: 'river',  // Tiber
    terrainDistribution: [
      { terrain: 'mountains', weight: 30 },
      { terrain: 'plains', weight: 30 },
      { terrain: 'grassland', weight: 20 },
      { terrain: 'forest', weight: 10 },
      { terrain: 'ocean', weight: 10 }
    ]
  },
  'Anatolia': {
    name: 'Anatolian Highlands',
    waterResource: 'lake',
    terrainDistribution: [
      { terrain: 'mountains', weight: 40 },
      { terrain: 'plains', weight: 30 },
      { terrain: 'grassland', weight: 20 },
      { terrain: 'forest', weight: 10 }
    ],
    guaranteedFeatures: [
      { terrain: 'mountains', count: 3 }
    ]
  },
  'Crete': {
    name: 'Minoan Crete',
    waterResource: 'ocean',
    terrainDistribution: [
      { terrain: 'ocean', weight: 40 },
      { terrain: 'mountains', weight: 30 },
      { terrain: 'plains', weight: 20 },
      { terrain: 'grassland', weight: 10 }
    ],
    isIsland: true  // +7 defense
  },
  // Default for regions without specific templates
  'default': {
    name: 'Varied Terrain',
    waterResource: 'lake',
    terrainDistribution: [
      { terrain: 'plains', weight: 30 },
      { terrain: 'grassland', weight: 25 },
      { terrain: 'forest', weight: 20 },
      { terrain: 'mountains', weight: 15 },
      { terrain: 'river', weight: 10 }
    ]
  }
};

// Generate hex map for a region
export function generateHexMap(regions: string[], hexRadius: number = 3): HexTile[] {
  const tiles: HexTile[] = [];
  
  // Find matching region template
  let template = REGION_TEMPLATES['default'];
  for (const region of regions) {
    if (REGION_TEMPLATES[region]) {
      template = REGION_TEMPLATES[region];
      break;
    }
  }
  
  // Generate hex grid (radius 3 = 37 hexes, similar coverage to 10x10)
  for (let q = -hexRadius; q <= hexRadius; q++) {
    const r1 = Math.max(-hexRadius, -q - hexRadius);
    const r2 = Math.min(hexRadius, -q + hexRadius);
    
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      const coord = { q, r, s };
      
      // Select terrain based on weighted distribution
      const terrain = selectWeightedTerrain(template.terrainDistribution);
      
      tiles.push({
        coord,
        terrain
      });
    }
  }
  
  // Add guaranteed features
  if (template.guaranteedFeatures) {
    for (const feature of template.guaranteedFeatures) {
      addGuaranteedTerrain(tiles, feature.terrain, feature.count);
    }
  }
  
  return tiles;
}

// Select terrain based on weighted random
function selectWeightedTerrain(distribution: { terrain: TerrainType, weight: number }[]): TerrainType {
  const totalWeight = distribution.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of distribution) {
    random -= item.weight;
    if (random <= 0) {
      return item.terrain;
    }
  }
  
  return distribution[0].terrain;
}

// Ensure certain terrain types appear
function addGuaranteedTerrain(tiles: HexTile[], terrain: TerrainType, count: number) {
  // Replace random tiles with guaranteed terrain
  const plainTiles = tiles.filter(t => t.terrain === 'plains' || t.terrain === 'grassland');
  
  for (let i = 0; i < Math.min(count, plainTiles.length); i++) {
    const randomIndex = Math.floor(Math.random() * plainTiles.length);
    plainTiles[randomIndex].terrain = terrain;
    plainTiles.splice(randomIndex, 1);
  }
}

// Calculate total defense from terrain
export function calculateTerrainDefense(tiles: HexTile[], isIsland: boolean = false): number {
  let totalDefense = 0;
  
  for (const tile of tiles) {
    if (tile.building) {
      // Only count terrain where buildings are placed
      totalDefense += TERRAIN_BONUSES[tile.terrain].defense;
    }
  }
  
  if (isIsland) {
    totalDefense += 7;  // Island map bonus
  }
  
  return totalDefense;
}

// Calculate total industry from terrain
export function calculateTerrainIndustry(tiles: HexTile[]): number {
  let totalIndustry = 1;  // Base industry
  
  for (const tile of tiles) {
    if (tile.building) {
      // Only count terrain where buildings are placed
      totalIndustry += TERRAIN_BONUSES[tile.terrain].industry;
    }
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
