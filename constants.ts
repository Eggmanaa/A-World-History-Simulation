
import { TerrainType, TileData, BuildingType, CivPreset, WonderDefinition, ReligionTenet, NeighborCiv, TimelineEvent, ScienceUnlock, ScoringTrack, VictoryCondition, RespawnCiv, RespawnBonus } from './types';

export const HEX_SIZE = 1.0;
export const MAP_RADIUS = 9;

export const CIV_PRESETS: CivPreset[] = [
    {
        id: 'egypt', name: 'Ancient Egypt', regions: ['Egypt', 'North Africa', 'Fertile Crescent'],
        traits: ['Industrious', 'Wisdom'],
        baseStats: { martial: 3, defense: 3, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 3, faithYield: 3, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#eab308', accent: '#2563eb' },
        // Authentically Egyptian: a life-giving Nile strip of river + plains
        // surrounded on every side by desert — that's what the map looked
        // like from space, and it's what it should feel like here.
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.River, TerrainType.Plains, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.Desert, TerrainType.Mountain],
        climate: 'arid'
    },
    {
        id: 'greece', name: 'Ancient Greece', regions: ['Greece', 'Aegean', 'Europe'],
        traits: ['Intelligence', 'Beauty'],
        baseStats: { martial: 3, defense: 2, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 5, cultureYield: 5, faithYield: 2, capacity: 8 },
        waterResource: 'Lake', isIsland: true,
        colors: { base: '#3b82f6', accent: '#f8fafc' },
        // Aegean island-hop: rocky mountains meeting open sea, with scrubby
        // grassland in between. Olive trees, not oaks.
        centerBiomes: [TerrainType.Plains, TerrainType.Grassland, TerrainType.Mountain, TerrainType.Mountain],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Ocean, TerrainType.Mountain, TerrainType.Forest],
        climate: 'mediterranean'
    },
    {
        id: 'rome', name: 'Roman Empire', regions: ['Italia', 'Rome', 'Europe'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 4, defense: 3, faith: 2, industry: 5, fertility: 2, productionIncome: 5, scienceYield: 3, cultureYield: 3, faithYield: 2, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#dc2626', accent: '#fcd34d' },
        // Italia: fertile river valleys, rolling grassland, spine of the
        // Apennines, Mediterranean groves at the edges.
        centerBiomes: [TerrainType.Grassland, TerrainType.Plains, TerrainType.River, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Forest, TerrainType.Plains, TerrainType.Ocean],
        climate: 'mediterranean'
    },
    {
        id: 'china', name: 'Ancient China', regions: ['China', 'Asia'],
        traits: ['Industrious', 'Intelligence'],
        baseStats: { martial: 3, defense: 4, faith: 2, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 4, cultureYield: 3, faithYield: 2, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#ca8a04', accent: '#ef4444' },
        // Huang He / Yangtze basins: two great rivers, bamboo forests,
        // Himalayan wall on one side, Gobi-style desert on the other.
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains, TerrainType.Forest],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Forest, TerrainType.Mountain],
        climate: 'temperate'
    },
    {
        id: 'germania', name: 'Germania', regions: ['Germania', 'Teutons', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 5, defense: 2, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 1, cultureYield: 1, faithYield: 2, capacity: 10 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#14532d', accent: '#a3e635' },
        // Dark European forest + Rhine/Elbe/Danube + marshland. Romans wrote
        // that you could walk for days without seeing sky.
        centerBiomes: [TerrainType.Forest, TerrainType.Forest, TerrainType.Forest, TerrainType.Grassland, TerrainType.River],
        edgeBiomes: [TerrainType.Forest, TerrainType.Mountain, TerrainType.Marsh, TerrainType.River],
        climate: 'boreal'
    },
    {
        id: 'phoenicia', name: 'Phoenicia', regions: ['Phoenicia', 'Fertile Crescent'],
        traits: ['Beauty', 'Creativity'],
        baseStats: { martial: 2, defense: 2, faith: 2, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 4, faithYield: 2, capacity: 8 },
        waterResource: 'Ocean', isIsland: false,
        colors: { base: '#7e22ce', accent: '#f0abfc' },
        // Thin Levantine coastal strip: narrow plain wedged between Lebanon
        // range and the Mediterranean.
        centerBiomes: [TerrainType.Plains, TerrainType.Grassland, TerrainType.Ocean],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Ocean, TerrainType.Mountain, TerrainType.Desert],
        climate: 'mediterranean'
    },
    {
        id: 'india', name: 'Ancient India', regions: ['India', 'Asia'],
        traits: ['Wisdom', 'Creativity'],
        baseStats: { martial: 2, defense: 3, faith: 5, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 4, cultureYield: 3, faithYield: 5, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#f97316', accent: '#10b981' },
        // Indus & Ganges: lush river valleys, monsoon forests, Himalayas to
        // the north, Indian Ocean at the edge.
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Grassland, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Ocean, TerrainType.Forest],
        climate: 'tropical'
    },
    {
        id: 'mesopotamia', name: 'Mesopotamia', regions: ['Mesopotamia', 'Fertile Crescent'],
        traits: ['Intelligence', 'Industrious'],
        baseStats: { martial: 2, defense: 2, faith: 4, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 5, cultureYield: 3, faithYield: 4, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#1e3a8a', accent: '#fbbf24' },
        // Tigris-Euphrates alluvial plain: two rivers, marshy delta to the
        // south, desert ringing everything else.
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains, TerrainType.Marsh],
        edgeBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.Marsh, TerrainType.Mountain],
        climate: 'arid'
    },
    {
        id: 'persia', name: 'Persian Empire', regions: ['Persia', 'Asia', 'Fertile Crescent'],
        traits: ['Strength', 'Beauty'],
        baseStats: { martial: 4, defense: 3, faith: 4, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 3, cultureYield: 3, faithYield: 4, capacity: 15 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#9d174d', accent: '#fbbf24' },
        // Iranian plateau: high arid plains, the Zagros and Elburz ranges,
        // scattered oases.
        centerBiomes: [TerrainType.Plains, TerrainType.Mountain, TerrainType.Desert, TerrainType.Plains],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Mountain, TerrainType.Desert],
        climate: 'arid'
    },
    {
        id: 'sparta', name: 'Sparta', regions: ['Greece', 'Laconia', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 7, defense: 4, faith: 1, industry: 2, fertility: 2, productionIncome: 2, scienceYield: 1, cultureYield: 2, faithYield: 1, capacity: 15 },
        waterResource: 'Lake', isIsland: true,
        colors: { base: '#7f1d1d', accent: '#94a3b8' },
        // Laconia: the Eurotas plain boxed in by Taygetus and Parnon — harsh,
        // mountainous, inward-facing.
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Mountain],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Ocean, TerrainType.HighMountain, TerrainType.Mountain],
        climate: 'mediterranean'
    },
    {
        id: 'anatolia', name: 'Anatolia', regions: ['Anatolia', 'Fertile Crescent'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 3, defense: 3, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 3, faithYield: 3, capacity: 10 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#92400e', accent: '#fcd34d' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Grassland, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Ocean, TerrainType.Plains],
        climate: 'alpine'
    },
    {
        id: 'crete', name: 'Minoan Crete', regions: ['Crete', 'Aegean', 'Europe'],
        traits: ['Beauty', 'Creativity'],
        baseStats: { martial: 2, defense: 3, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 4, cultureYield: 5, faithYield: 3, capacity: 8 },
        waterResource: 'Ocean', isIsland: true,
        colors: { base: '#0d9488', accent: '#ccfbf1' },
        centerBiomes: [TerrainType.Grassland, TerrainType.Plains, TerrainType.Mountain],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Ocean, TerrainType.Ocean, TerrainType.Mountain],
        climate: 'mediterranean'
    },
    {
        id: 'gaul', name: 'Gaul', regions: ['Gaul', 'Celts', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 4, defense: 2, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 2, faithYield: 3, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#166534', accent: '#a3e635' },
        // Deep forest + great rivers (Rhône, Seine, Loire).
        centerBiomes: [TerrainType.Forest, TerrainType.Forest, TerrainType.Plains, TerrainType.River],
        edgeBiomes: [TerrainType.Forest, TerrainType.Mountain, TerrainType.Ocean, TerrainType.Grassland],
        climate: 'temperate'
    },
    {
        id: 'carthage', name: 'Carthage', regions: ['Carthage', 'North Africa', 'Phoenicia'],
        traits: ['Beauty', 'Strength'],
        baseStats: { martial: 3, defense: 2, faith: 2, industry: 5, fertility: 2, productionIncome: 5, scienceYield: 2, cultureYield: 3, faithYield: 2, capacity: 8 },
        waterResource: 'Ocean', isIsland: false,
        colors: { base: '#7c3aed', accent: '#c4b5fd' },
        // Coastal North Africa: sea & scrub, Sahara behind.
        centerBiomes: [TerrainType.Plains, TerrainType.Ocean, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Desert, TerrainType.Desert, TerrainType.Mountain],
        climate: 'arid'
    },
    {
        id: 'macedon', name: 'Macedonia', regions: ['Macedon', 'Greece', 'Europe'],
        traits: ['Strength', 'Beauty'],
        baseStats: { martial: 5, defense: 3, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 2, faithYield: 2, capacity: 10 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#1e40af', accent: '#fbbf24' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Grassland, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Forest, TerrainType.Ocean],
        climate: 'alpine'
    },
    {
        id: 'assyria', name: 'Assyrian Empire', regions: ['Assyria', 'Mesopotamia', 'Fertile Crescent'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 6, defense: 3, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 1, faithYield: 2, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#450a0a', accent: '#f59e0b' },
        centerBiomes: [TerrainType.Plains, TerrainType.River, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Desert, TerrainType.Marsh, TerrainType.Desert],
        climate: 'arid'
    },
    {
        id: 'cush', name: 'Kingdom of Kush', regions: ['Cush', 'Nubia', 'Africa'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 3, defense: 3, faith: 4, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 3, cultureYield: 3, faithYield: 4, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#854d0e', accent: '#fef08a' },
        // Upper Nile + Nubian desert.
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains, TerrainType.Desert],
        edgeBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.HighMountain, TerrainType.Grassland],
        climate: 'savanna'
    },
    {
        id: 'israel', name: 'Ancient Israel', regions: ['Israel', 'Fertile Crescent'],
        traits: ['Wisdom', 'Faith'],
        baseStats: { martial: 2, defense: 4, faith: 7, industry: 2, fertility: 2, productionIncome: 2, scienceYield: 3, cultureYield: 2, faithYield: 7, capacity: 10 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#2563eb', accent: '#ffffff' },
        centerBiomes: [TerrainType.Plains, TerrainType.Mountain, TerrainType.Desert, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Desert, TerrainType.Mountain, TerrainType.Ocean, TerrainType.Desert],
        climate: 'mediterranean'
    },
    {
        id: 'troy', name: 'Troy', regions: ['Troy', 'Northwest Anatolia', 'Asia Minor'],
        traits: ['Strength', 'Beauty'],
        baseStats: { martial: 3, defense: 6, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 3, faithYield: 2, capacity: 8 },
        waterResource: 'Ocean', isIsland: false,
        colors: { base: '#92400e', accent: '#fef3c7' },
        centerBiomes: [TerrainType.Ocean, TerrainType.Plains, TerrainType.Mountain, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Ocean, TerrainType.Forest, TerrainType.Ocean],
        climate: 'mediterranean'
    },
    {
        id: 'scythia', name: 'Scythia', regions: ['Scythia', 'Central Asia', 'Steppes'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 5, defense: 1, faith: 1, industry: 2, fertility: 2, productionIncome: 2, scienceYield: 1, cultureYield: 2, faithYield: 2, capacity: 6 },
        waterResource: 'Well', isIsland: false,
        colors: { base: '#7f1d1d', accent: '#fcd34d' },
        // Pontic-Caspian steppe: endless grassland, few rivers.
        centerBiomes: [TerrainType.Grassland, TerrainType.Grassland, TerrainType.Plains],
        edgeBiomes: [TerrainType.Grassland, TerrainType.Desert, TerrainType.Mountain, TerrainType.Forest],
        climate: 'boreal'
    },
    {
        id: 'olmec', name: 'Olmec Civilization', regions: ['Mesoamerica', 'Yucatan', 'Americas'],
        traits: ['Creativity', 'Wisdom'],
        baseStats: { martial: 2, defense: 3, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 5, faithYield: 3, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#15803d', accent: '#fcd34d' },
        // Gulf Coast jungles: rainforest + wetlands.
        centerBiomes: [TerrainType.River, TerrainType.Forest, TerrainType.Forest, TerrainType.Marsh],
        edgeBiomes: [TerrainType.Forest, TerrainType.Marsh, TerrainType.Grassland, TerrainType.Ocean],
        climate: 'tropical'
    },
    {
        id: 'korea', name: 'Ancient Korea', regions: ['Korean Peninsula', 'Asia'],
        traits: ['Intelligence', 'Creativity'],
        baseStats: { martial: 2, defense: 4, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 5, cultureYield: 3, faithYield: 3, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#0ea5e9', accent: '#f8fafc' },
        centerBiomes: [TerrainType.River, TerrainType.Mountain, TerrainType.Forest, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Forest, TerrainType.Ocean, TerrainType.Ocean],
        climate: 'temperate'
    },
    {
        id: 'khmer', name: 'Khmer Empire', regions: ['Southeast Asia', 'Cambodia', 'Asia'],
        traits: ['Creativity', 'Wisdom'],
        baseStats: { martial: 3, defense: 2, faith: 2, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 2, cultureYield: 4, faithYield: 5, capacity: 15 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#6b21a8', accent: '#fcd34d' },
        // Mekong basin: jungle, rice paddies, Tonle Sap marshland.
        centerBiomes: [TerrainType.River, TerrainType.Forest, TerrainType.Marsh, TerrainType.Forest],
        edgeBiomes: [TerrainType.Forest, TerrainType.Marsh, TerrainType.Grassland, TerrainType.Forest],
        climate: 'tropical'
    },
    {
        id: 'ethiopia', name: 'Aksum (Ethiopia)', regions: ['Ethiopia', 'East Africa', 'Africa'],
        traits: ['Wisdom', 'Faith'],
        baseStats: { martial: 3, defense: 4, faith: 5, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 3, faithYield: 5, capacity: 10 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#15803d', accent: '#fef08a' },
        // Ethiopian highlands: dramatic altitude, rift-valley lakes, green
        // plateaus above the African heat.
        centerBiomes: [TerrainType.Mountain, TerrainType.Grassland, TerrainType.River, TerrainType.Plains],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Mountain, TerrainType.Grassland, TerrainType.Forest],
        climate: 'highland'
    }
];

export const generateMap = (preset: CivPreset): TileData[] => {
  const tiles: TileData[] = [];
  const radius = MAP_RADIUS;
  const getBiome = (options: TerrainType[]) => options[Math.floor(Math.random() * options.length)];
  
  // Zones relative to map size
  const centerZone = Math.floor(radius * 0.33);
  const middleZone = Math.floor(radius * 0.66);

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
        
        const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
        const z = HEX_SIZE * (3 / 2) * r;

        let terrain = TerrainType.Plains;

        if (dist <= centerZone) {
            if (preset.waterResource === 'River' && Math.random() < 0.35) {
                terrain = TerrainType.River;
            } else if (preset.waterResource === 'Ocean' && Math.random() < 0.2) {
                terrain = TerrainType.Ocean;
            } else if (preset.waterResource === 'Marsh' && Math.random() < 0.4) {
                terrain = TerrainType.Marsh;
            } else {
                terrain = getBiome(preset.centerBiomes);
            }
        } else if (dist <= middleZone) {
            if (Math.random() < 0.7) {
                terrain = getBiome(preset.centerBiomes);
            } else {
                terrain = getBiome(preset.edgeBiomes);
            }
        } else {
            terrain = getBiome(preset.edgeBiomes);
            if (preset.waterResource === 'Ocean' && Math.random() < 0.6) {
                terrain = TerrainType.Ocean;
            }
        }
        
        if (preset.isIsland && dist >= radius - 1) {
            terrain = TerrainType.Ocean;
        }

        tiles.push({
            id: `${q},${r}`,
            q, r, s,
            x, z,
            terrain,
            building: BuildingType.None
        });
    }
  }

  // POST-GENERATION FIX: ensure at least 60% of tiles are buildable
  // (not Ocean, River, HighMountain). Some civ presets — especially
  // island civs and ocean-heavy coastals — could randomize into maps
  // where the student has almost nowhere to place buildings.
  const buildable = (t: TerrainType) =>
    t !== TerrainType.Ocean && t !== TerrainType.River && t !== TerrainType.HighMountain;
  const totalTiles = tiles.length;
  const MIN_BUILDABLE_RATIO = 0.60;
  const minBuildable = Math.floor(totalTiles * MIN_BUILDABLE_RATIO);
  let buildableCount = tiles.filter(t => buildable(t.terrain)).length;

  if (buildableCount < minBuildable) {
    // Convert excess non-buildable tiles (starting from the edge, working
    // inward) to the civ's most common center biome.
    const fallback = preset.centerBiomes.find(b => buildable(b)) || TerrainType.Plains;
    const sorted = [...tiles]
      .filter(t => !buildable(t.terrain))
      .sort((a, b) => {
        const dA = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.s));
        const dB = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.s));
        return dB - dA; // outermost first
      });
    for (const candidate of sorted) {
      if (buildableCount >= minBuildable) break;
      const tile = tiles.find(t => t.id === candidate.id);
      if (tile) {
        tile.terrain = fallback;
        buildableCount++;
      }
    }
  }

  return tiles;
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
    { year: -8500, name: "Mesolithic Period", desc: "Population growth begins." },
    {
        year: -4500, name: "Agricultural Revolution", desc: "Farming allows permanent settlements.",
        actions: [
            { type: 'MODIFY_STAT', targetRegions: ['Egypt'], stat: 'industry', isPercent: true, value: 30, message: "Egypt gains 30% Industry bonus." },
            { type: 'MODIFY_STAT', targetRegions: ['Fertile Crescent', 'Mesopotamia'], stat: 'fertility', value: 2, message: "Fertile Crescent gains +2 Fertility." }
        ]
    },
    {
        year: -3500, name: "First Cities", desc: "Urban centers emerge. All civs gain starter houses.",
        actions: [
            { type: 'MODIFY_STAT', targetRegions: ['Egypt', 'Mesopotamia', 'India', 'China', 'Greece', 'Persia', 'Anatolia', 'Fertile Crescent', 'Europe', 'Asia', 'Africa'], stat: 'fertility', value: 3, message: "Urbanization: All civilizations begin with established settlements." }
        ]
    },
    { year: -2750, name: "Early Bronze Age", desc: "Trade networks develop." },
    { 
        year: -2250, name: "Great Disaster Era", desc: "Paektu Eruption and Great Floods.",
        actions: [
            { type: 'DISASTER', targetRegions: ['China'], failEffect: { houseLossPercent: 50 }, message: "Paektu Eruption! China loses 50% population." },
            { type: 'DISASTER', targetRegions: ['Mesopotamia', 'Fertile Crescent'], saveTrait: 'Industrious', saveStat: 'science', saveDC: 7, failEffect: { houseLossPercent: 50 }, message: "Great Flood! (Save: Industrious or Science > 7)" },
            { type: 'DISASTER', targetRegions: ['Egypt', 'India', 'China', 'Fertile Crescent'], saveTrait: 'Health', saveDC: 10, failEffect: { houseLossPercent: 15 }, message: "Sickness spreads through trade routes. (Save: Health)" },
            { type: 'MODIFY_STAT', targetRegions: ['Egypt', 'Fertile Crescent', 'India', 'China'], stat: 'science', value: 3, message: "Writing System Developed (+3 Science)." },
            { type: 'SET_FLAG', flagName: 'chinaWallDiscount', targetRegions: ['China'], message: "China: Great Wall cost halved." }
        ]
    },
    { 
        year: -1850, name: "Middle Bronze Age", desc: "Greek civilizations rise.",
        actions: [
             { type: 'MODIFY_STAT', targetRegions: ['Greece'], stat: 'martial', valueSource: 'houses', value: 0, message: "Greek Hoplites rise: Martial +1 per House (Total: +VAL)." }
        ]
    },
    { 
        year: -1600, name: "Thera Eruption", desc: "Volcanic winter affects the Mediterranean.",
        actions: [
            { type: 'DISASTER', targetRegions: ['Crete', 'Aegean'], failEffect: { popSetTo: 1 }, message: "Thera Eruption destroys Minoan civilization." },
            { type: 'DISASTER', targetRegions: ['Europe', 'Asia', 'Anatolia', 'Greece', 'Persia', 'Mesopotamia'], failEffect: { houseLossPercent: 50 }, message: "Volcanic winter causes famine in Eurasia." }
        ]
    },
    { 
        year: -1300, name: "Late Bronze Age", desc: "Wonders available. Collapse begins.",
        actions: [
            { type: 'SET_FLAG', flagName: 'troyWallDouble', targetRegions: ['Troy'], message: "Walls of Troy unlocked (Double strength)." },
            { type: 'MODIFY_STAT', targetRegions: ['Greece'], stat: 'culture', valueSource: 'houses', value: 0, message: "Homeric Epics: Greece gains Culture +1 per House (Total: +VAL)." },
            { type: 'MODIFY_STAT', targetRegions: ['Fertile Crescent', 'Egypt', 'Anatolia', 'Greece', 'India', 'China'], stat: 'science', value: 2, message: "New Scripts: +2 Science." }
        ]
    },
    { 
        year: -1200, name: "Bronze Age Collapse", desc: "Sea Peoples and upheavals.",
        actions: [
            { type: 'SET_FLAG', flagName: 'israelBonus', targetRegions: ['Israel'], message: "Israel: Seed of Abraham bonus active." },
            { type: 'MODIFY_STAT', targetRegions: ['Phoenicia'], stat: 'culture', value: 5, message: "Tyrian Purple: Phoenicia gains +5 Culture." },
            { type: 'MODIFY_STAT', targetRegions: ['Sparta'], stat: 'culture', value: 5, message: "Spartan bonus active." }
        ]
    },
    { 
        year: -1000, name: "Iron Age", desc: "Religion founding unlocked.",
        actions: [
            { type: 'SET_FLAG', flagName: 'religionUnlocked', message: "Religion can now be founded." },
            { type: 'MODIFY_STAT', targetRegions: ['Greece', 'Fertile Crescent', 'Persia', 'Anatolia', 'India', 'China'], stat: 'industry', value: 3, message: "Iron Age technology boosts Industry." },
            { type: 'ADD_NEIGHBOR', neighbor: { name: "Seljuk Turks", martial: 15, defense: 5, faith: 10 }, message: "The Turks have arrived on the borders!" }
        ]
    },
    { 
        year: -670, name: "Assyrian Empire", desc: "Wars unlocked.",
        actions: [
            { type: 'SET_FLAG', flagName: 'warUnlocked', message: "Warfare is now enabled between players." },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria', 'Mesopotamia'], stat: 'martial', value: 10, message: "Assyrian Siege Towers: +10 Martial." }
        ]
    },
    { 
        year: -560, name: "Babylonian Rise", desc: "Carthage enters. Assyria declines.",
        actions: [
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'martial', isPercent: true, value: -50, message: "Assyrian Decline: Stats Halved." },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'defense', isPercent: true, value: -50, message: "" },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'faith', isPercent: true, value: -50, message: "" },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'industry', isPercent: true, value: -50, message: "" },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'science', isPercent: true, value: -50, message: "" },
            { type: 'MODIFY_STAT', targetRegions: ['Assyria'], stat: 'culture', isPercent: true, value: -50, message: "" },
            { type: 'ADD_NEIGHBOR', neighbor: { name: "Carthaginian Empire", martial: 18, defense: 12, faith: 5 }, message: "Carthage has risen in the West." }
        ]
    },
    { 
        year: -480, name: "Persian Wars", desc: "Houses now support 2 Pop.",
        actions: [
             { type: 'SET_FLAG', flagName: 'housesSupportTwoPop', message: "Advanced Agriculture: Houses now support 2 Population." },
             { type: 'MODIFY_STAT', targetRegions: ['Persia'], stat: 'martial', isPercent: true, value: 100, message: "Persian Empire martial strength doubled." }
        ]
    },
    { 
        year: -336, name: "Alexander the Great", desc: "Hellenistic culture spreads.",
        actions: [
            { type: 'SET_FLAG', flagName: 'alexandrianBonus', targetRegions: ['Macedon', 'Greece'], message: "Alexandrian Conquests: Martial bonuses." },
             { type: 'MODIFY_STAT', targetRegions: ['Macedon', 'Greece'], stat: 'martial', value: 10, message: "Phalanxes: +10 Martial." }
        ]
    },
    { 
        year: -264, name: "Punic Wars", desc: "Rome vs Carthage.",
        actions: [
             { type: 'MODIFY_STAT', targetRegions: ['Carthage'], stat: 'martial', value: 20, message: "African Forest Elephants: +20 Martial." }
        ]
    },
    { year: -44, name: "Julius Caesar", desc: "Roman Republic ends." },
    { 
        year: 14, name: "Pax Romana", desc: "Peace and stability.",
        actions: [
            { type: 'MODIFY_STAT', targetRegions: ['Rome', 'Italia'], stat: 'culture', value: 5, message: "Pax Romana: +5 Culture." }
        ]
    },
    {
        year: 67, name: "Vesuvius Eruption", desc: "Disaster in Italia.",
        actions: [
            { type: 'DISASTER', targetRegions: ['Italia', 'Rome'], saveTrait: 'Wisdom', saveDC: 12, saveStat: 'faith', failEffect: { houseLossPercent: 50 }, message: "Mount Vesuvius Erupts! (Save: Wisdom or Faith > 12)" }
        ]
    },
    {
        year: 138, name: "Antonine Plague", desc: "Sickness strikes Rome.",
        actions: [
            { type: 'DISASTER', targetRegions: ['Rome', 'Italia'], saveTrait: 'Health', saveDC: 6, failEffect: { houseLossPercent: 20 }, message: "Antonine Plague. (Save: Health)" }
        ]
    },
    {
        year: 300, name: "Roman Split", desc: "Empire divides.",
        actions: [
             { type: 'SET_FLAG', flagName: 'romanSplit', targetRegions: ['Rome', 'Italia'], message: "Empire Split." }
        ]
    },
    {
        year: 375, name: "Barbarian Invasions", desc: "Huns and Goths migrate.",
        actions: [
            { type: 'ADD_NEIGHBOR', neighbor: { name: "Hunnic Horde", martial: 25, defense: 5, faith: 0 }, message: "The Huns are attacking!" }
        ]
    },
    { year: 362, name: "Julian the Apostate", desc: "End of simulation." }
];

// WONDERS — one per civ, permanent. Rebalanced so each wonder's effect is
// worth roughly its cost in Production Pool, with some flavor premium for
// being a once-per-civ "defining achievement". Baseline: buildings give
// ~0.2-0.3 stat per Prod spent (Barracks +3 Martial / 10 Prod = 0.3; Farm +1
// Cap + 1 Prod Income / 5 = 0.4). A wonder should feel meaningfully stronger
// than stacking equivalent buildings, but not game-ending. Each is also
// tuned to a distinct playstyle so no single wonder is "best".
export const WONDERS_LIST: WonderDefinition[] = [
    // ANCIENT ERA (available early)
    { id: 'pyramids', name: 'Great Pyramids', cost: 50, era: 'Ancient', minYear: -3000, effects: "+8 Faith, +5 Culture, +10 Industry", bonus: { faith: 8, culture: 5, production: 10 } },
    { id: 'gardens', name: 'Hanging Gardens', cost: 40, era: 'Ancient', minYear: -1300, effects: "+10 Capacity, +6 Culture", bonus: { culture: 6, populationCapacity: 10 } },
    { id: 'wall', name: 'Great Wall', cost: 50, era: 'Ancient', minYear: -1300, effects: "+15 Martial, +3 Culture", bonus: { defense: 15, culture: 3 } },
    { id: 'ishtar', name: 'Gates of Ishtar', cost: 45, era: 'Ancient', minYear: -1300, effects: "+12 Martial, +4 Culture", bonus: { martial: 10, defense: 2, culture: 4 } },
    { id: 'colossus', name: 'Colossus', cost: 35, era: 'Ancient', minYear: -1300, effects: "+3 Diplomacy, +4 Culture, +2 Martial", bonus: { diplomacy: 3, culture: 4, martial: 2 } },

    // CLASSICAL ERA
    { id: 'colosseum', name: 'Colosseum', cost: 40, era: 'Classical', minYear: -300, effects: "+5 Martial, +8 Culture", bonus: { martial: 5, culture: 8 } },
    { id: 'library', name: 'Great Library', cost: 45, era: 'Classical', minYear: -300, effects: "+15 Science, +5 Culture", bonus: { science: 15, culture: 5 } },
    { id: 'lighthouse', name: 'Great Lighthouse', cost: 35, era: 'Classical', minYear: -300, effects: "+3 Diplomacy, +5 Culture, +2 Industry", bonus: { culture: 5, diplomacy: 3, production: 2 } },
    { id: 'zeus', name: 'Statue of Zeus', cost: 40, era: 'Classical', minYear: -500, effects: "+10 Martial, +5 Faith", bonus: { martial: 10, faith: 5 } },
    { id: 'oracle', name: 'Oracle', cost: 35, era: 'Classical', minYear: -500, effects: "+10 Culture, +3 Faith", bonus: { culture: 10, faith: 3 } },
    { id: 'artemis', name: 'Temple of Artemis', cost: 35, era: 'Classical', minYear: -500, effects: "+6 Martial, +4 Culture, +2 Faith", bonus: { martial: 4, defense: 2, culture: 4, faith: 2 } },

    // LATE ERA (expensive but era-defining)
    { id: 'hagia', name: 'Hagia Sophia', cost: 50, era: 'Late', minYear: 44, effects: "+12 Faith, +8 Culture, +2 Diplomacy", bonus: { faith: 12, culture: 8, diplomacy: 2 } },
    { id: 'justinian', name: 'Walls of Justinian', cost: 50, era: 'Late', minYear: 44, effects: "+25 Martial, +3 Culture (impenetrable fortifications)", bonus: { defense: 25, culture: 3 } },
    { id: 'hippodrome', name: 'Hippodrome', cost: 40, era: 'Late', minYear: 44, effects: "+10 Culture, +2 Diplomacy, +3 Industry (games & trade)", bonus: { culture: 10, diplomacy: 2, production: 3 } },
];

// RELIGION TENETS — redesigned so every tenet has a real, sizeable effect
// that matches the weight of "founding a religion" (10 Faith, 1 Temple,
// unlocked era). Every tenet now rewards a distinct playstyle: military,
// economic, scientific, cultural, spiritual, diplomatic.
export const RELIGION_TENETS: ReligionTenet[] = [
    { id: 'holy_war',    name: 'Holy War',        description: '+2 Martial per converted neighbor. +1 Martial baseline.' },
    { id: 'polytheism',  name: 'Polytheism',      description: '+2 Faith per Temple. +1 Faith Yield.' },
    { id: 'scriptures',  name: 'Holy Scriptures', description: 'Double Faith output. +2 Science Total when chosen.' },
    { id: 'philosophy',  name: 'Philosophy',      description: '+50% Faith counts as Science. +2 Culture Yield.' },
    { id: 'asceticism',  name: 'Asceticism',      description: '-3 Pop Cap but +15 Faith and +1 Faith Yield.' },
    { id: 'monotheism',  name: 'Monotheism',      description: '+5 Faith, +2 Faith Yield, religion spreads to weaker neighbors automatically each turn.' },
    { id: 'medicine',    name: 'Medicine',        description: '+5 Capacity, +1 Fertility (healthier cities).' },
    { id: 'evangelism',  name: 'Evangelism',      description: '+1 Faith Yield. Religion spreads even against neighbors with equal Faith.' },
    { id: 'christianity', name: 'Universal Faith', description: '+3 Faith, +2 Culture, +1 Diplomacy. Fellow-faith allies give +1 Martial each.' },
];

// ============================================================
// RESPAWN CIVILIZATIONS (12 total)
// Players who are conquered respawn as one of these, based on current turn.
// Stats are boosted relative to starting civs to keep them competitive.
// ============================================================
export const RESPAWN_CIVS: RespawnCiv[] = [
    {
        id: 'ptolemaic_egypt', name: 'Ptolemaic Egypt', availableTurn: 15, region: 'Egypt',
        baseStats: { martial: 3, defense: 3, faith: 2, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 4, cultureYield: 4, faithYield: 2, capacity: 12 },
        trait: 'Hellenistic Hybrid', traitDescription: 'Blend of Greek and Egyptian culture. +2 Science Total and +2 Culture Total on Research or Develop actions.',
        waterResource: 'River', colors: { base: '#d4a017', accent: '#1e40af' },
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains],
        edgeBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.Ocean],
        climate: 'arid'
    },
    {
        id: 'seleucid', name: 'Seleucid Empire', availableTurn: 15, region: 'Persia/Mesopotamia',
        baseStats: { martial: 4, defense: 3, faith: 2, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 3, cultureYield: 3, faithYield: 2, capacity: 12 },
        trait: 'Successor State', traitDescription: 'Inheritor of Alexander\'s eastern empire. Start with +5 Martial on first attack. +1 to all yields for 3 turns.',
        waterResource: 'River', colors: { base: '#4338ca', accent: '#fbbf24' },
        centerBiomes: [TerrainType.Plains, TerrainType.River, TerrainType.Desert],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Desert, TerrainType.HighMountain],
        climate: 'arid'
    },
    {
        id: 'parthia', name: 'Parthian Empire', availableTurn: 16, region: 'Persia',
        baseStats: { martial: 4, defense: 4, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 2, faithYield: 3, capacity: 12 },
        trait: 'Parthian Shot', traitDescription: 'Master horse archers. +3 Martial when defending. After losing a battle, gain +2 Martial temporarily.',
        waterResource: 'River', colors: { base: '#7f1d1d', accent: '#d4a017' },
        centerBiomes: [TerrainType.Plains, TerrainType.Desert, TerrainType.Mountain],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Plains],
        climate: 'arid'
    },
    {
        id: 'numidia', name: 'Numidia', availableTurn: 16, region: 'North Africa',
        baseStats: { martial: 4, defense: 2, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 2, faithYield: 3, capacity: 10 },
        trait: 'Desert Cavalry', traitDescription: 'Elite Numidian cavalry. +3 Martial when attacking. Can raid: gain +1 Prod Pool per attack regardless of outcome.',
        waterResource: 'Lake', colors: { base: '#a16207', accent: '#fef3c7' },
        centerBiomes: [TerrainType.Desert, TerrainType.Plains, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Desert, TerrainType.Mountain, TerrainType.Ocean],
        climate: 'savanna'
    },
    {
        id: 'nabataea', name: 'Nabataea', availableTurn: 17, region: 'Arabia',
        baseStats: { martial: 2, defense: 4, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 2, cultureYield: 3, faithYield: 3, capacity: 10 },
        trait: 'Caravan Masters', traitDescription: 'Masters of desert trade. Trade routes give +3 instead of +2. +1 Production Pool per active trade route.',
        waterResource: 'Well', colors: { base: '#b45309', accent: '#fef08a' },
        centerBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.Plains],
        edgeBiomes: [TerrainType.Desert, TerrainType.Mountain, TerrainType.HighMountain],
        climate: 'arid'
    },
    {
        id: 'maurya', name: 'Maurya Empire', availableTurn: 17, region: 'India',
        baseStats: { martial: 4, defense: 3, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 3, faithYield: 3, capacity: 14 },
        trait: 'War Elephants', traitDescription: 'Devastating elephant corps. +4 Martial on first attack each game. +2 Martial permanently from organized empire.',
        waterResource: 'River', colors: { base: '#c2410c', accent: '#fcd34d' },
        centerBiomes: [TerrainType.River, TerrainType.Grassland, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Forest],
        climate: 'tropical'
    },
    {
        id: 'dacia', name: 'Dacia', availableTurn: 19, region: 'Eastern Europe',
        baseStats: { martial: 4, defense: 4, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 2, faithYield: 3, capacity: 12 },
        trait: 'Mountain Fortress', traitDescription: 'Impregnable mountain strongholds. +4 starting defense bakes straight into Martial, and mountain/high-mountain terrain stacks on top. Built to turtle.',
        waterResource: 'River', colors: { base: '#4a5568', accent: '#a3bffa' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Forest, TerrainType.Plains],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Mountain, TerrainType.Forest],
        climate: 'alpine'
    },
    {
        id: 'iberia', name: 'Iberia', availableTurn: 19, region: 'Iberian Peninsula',
        baseStats: { martial: 3, defense: 3, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 2, cultureYield: 3, faithYield: 3, capacity: 12 },
        trait: 'Hill Forts', traitDescription: 'Guerrilla resistance. +2 Martial permanently. When attacked by a stronger civ, gain +3 Martial for that battle.',
        waterResource: 'River', colors: { base: '#9f1239', accent: '#fda4af' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Forest],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Mountain, TerrainType.Desert],
        climate: 'mediterranean'
    },
    {
        id: 'aksumite', name: 'Aksumite Empire', availableTurn: 22, region: 'East Africa',
        baseStats: { martial: 3, defense: 3, faith: 4, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 3, cultureYield: 3, faithYield: 4, capacity: 12 },
        trait: 'Trade Crossroads', traitDescription: 'Gateway between Africa and Arabia. +2 to all trade bonuses. Temples grant +3 Faith on Worship instead of +2.',
        waterResource: 'Lake', colors: { base: '#065f46', accent: '#fcd34d' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Grassland, TerrainType.Plains],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Forest],
        climate: 'highland'
    },
    {
        id: 'sassanid', name: 'Sassanid Persia', availableTurn: 22, region: 'Persia',
        baseStats: { martial: 5, defense: 4, faith: 3, industry: 4, fertility: 2, productionIncome: 4, scienceYield: 3, cultureYield: 3, faithYield: 3, capacity: 14 },
        trait: 'Immortals Reborn', traitDescription: 'Resurrected Persian military elite. +3 Martial permanently. Cannot lose more than 2 Martial from any single event.',
        waterResource: 'River', colors: { base: '#701a75', accent: '#fbbf24' },
        centerBiomes: [TerrainType.Plains, TerrainType.Desert, TerrainType.Mountain],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Mountain],
        climate: 'arid'
    },
    {
        id: 'gothic', name: 'Gothic Kingdoms', availableTurn: 23, region: 'Northern Europe',
        baseStats: { martial: 5, defense: 2, faith: 3, industry: 3, fertility: 2, productionIncome: 3, scienceYield: 1, cultureYield: 2, faithYield: 3, capacity: 12 },
        trait: 'Migration', traitDescription: 'Mobile warrior culture. Can relocate territory once. +2 Martial when attacking civs with higher Culture Total.',
        waterResource: 'River', colors: { base: '#1c1917', accent: '#dc2626' },
        centerBiomes: [TerrainType.Forest, TerrainType.Forest, TerrainType.Plains],
        edgeBiomes: [TerrainType.Mountain, TerrainType.River, TerrainType.Grassland],
        climate: 'boreal'
    },
    {
        id: 'hunnic', name: 'Hunnic Empire', availableTurn: 24, region: 'Central Asia/Europe',
        baseStats: { martial: 7, defense: 1, faith: 2, industry: 2, fertility: 2, productionIncome: 2, scienceYield: 1, cultureYield: 1, faithYield: 2, capacity: 10 },
        trait: 'Terror of Nations', traitDescription: 'Pure military devastation. +5 Martial on first attack. Adjacent civs suffer -1 Martial while you exist. Cannot build Wonders.',
        waterResource: 'Lake', colors: { base: '#292524', accent: '#b91c1c' },
        centerBiomes: [TerrainType.Plains, TerrainType.Grassland, TerrainType.Plains],
        edgeBiomes: [TerrainType.Desert, TerrainType.Mountain, TerrainType.Forest],
        climate: 'boreal'
    },
];

// ============================================================
// RESPAWN BONUS OPTIONS
// Conquered player picks ONE when respawning
// ============================================================
export const RESPAWN_BONUSES: RespawnBonus[] = [
    { id: 'martial_boost', name: 'Military Legacy', description: '+2 Martial', effects: { martial: 2 } },
    { id: 'defense_boost', name: 'Fortified Start', description: '+2 Martial (from prepared defenses)', effects: { defense: 2 } },
    { id: 'production_boost', name: 'Economic Foundation', description: '+1 Production Income, +3 Prod Pool', effects: { productionIncome: 1, productionPool: 3 } },
    { id: 'science_boost', name: 'Inherited Knowledge', description: '+3 Science Total', effects: { science: 3 } },
    { id: 'culture_boost', name: 'Cultural Heritage', description: '+3 Culture Total', effects: { culture: 3 } },
    { id: 'faith_boost', name: 'Religious Tradition', description: '+3 Faith Total', effects: { faith: 3 } },
    { id: 'capacity_boost', name: 'Population Surge', description: '+2 Capacity', effects: { capacity: 2 } },
];

// SCIENCE UNLOCKS — redesigned so every level is a meaningful, balanced
// bonus. The old unlocks ("attack through forest/river/ocean/mountains") were
// dead mechanics because combat is adjacency-based, not terrain-blocked. The
// wall-bypass unlock at L30 is retained because it IS wired into combat math
// (attackNeighbor in GameApp.tsx uses it). Everything else now grants
// persistent stat bonuses that compound across levels, so science-focused
// civs see continuous return on investment instead of cosmetic milestones.
export const SCIENCE_UNLOCKS: ScienceUnlock[] = [
    { level: 5,  effect: 'Pottery: +1 Capacity, +1 Fertility',          statBonus: { capacity: 1, fertility: 1 } },
    { level: 10, effect: 'Bronze Working: +3 Martial',                  statBonus: { martial: 2, defense: 1 } },
    { level: 15, effect: 'Writing: +2 Culture, +1 Diplomacy',           statBonus: { culture: 2, diplomacy: 1 } },
    { level: 20, effect: 'Irrigation: +2 Industry, +1 Capacity',        statBonus: { industry: 2, capacity: 1 } },
    { level: 25, effect: 'Masonry: +2 Martial, +2 Capacity',            statBonus: { defense: 2, capacity: 2 } },
    { level: 30, effect: 'Siege Engineering: Bypass walls, +2 Martial', unlocks: 'bypass_walls', statBonus: { martial: 2 } },
    { level: 40, effect: 'Steel: +5 Martial',                           statBonus: { martial: 3, defense: 2 } },
    { level: 50, effect: 'Currency: +2 Industry, +2 Diplomacy',         statBonus: { industry: 2, diplomacy: 2 } },
    { level: 60, effect: 'Philosophy: +3 Culture, +2 Faith',            statBonus: { culture: 3, faith: 2 } },
    { level: 75, effect: 'Engineering: +3 Industry, +3 Capacity',       statBonus: { industry: 3, capacity: 3 } },
    { level: 80, effect: 'Printing Press: +3 Culture, +3 Faith, +2 Diplomacy', statBonus: { culture: 3, faith: 3, diplomacy: 2 } },
];

// LEGACY: kept only so old saves that hold generic neighbor IDs don't break.
// New games use buildCivNeighbors() which returns real adjacent civs.
export const GENERATE_NEIGHBORS = (year: number): NeighborCiv[] => {
    const baseStrength = Math.abs(year) > 2000 ? 3 : Math.abs(year) > 500 ? 8 : 15;
    return [
        { id: 'n1', name: 'Barbarian Tribe', martial: Math.floor(baseStrength * 0.8), defense: 2, faith: 1, isConquered: false, relationship: 'Neutral' },
        { id: 'n2', name: 'Rival City-State', martial: baseStrength, defense: 5, faith: 3, isConquered: false, relationship: 'Neutral' },
        { id: 'n3', name: 'Foreign Empire', martial: Math.floor(baseStrength * 1.5), defense: 10, faith: 5, isConquered: false, relationship: 'Neutral' },
    ];
};

// Build neighbors from actual adjacent civilizations. Every NPC neighbor is
// a real preset civ with its authentic stats, so attacking "Carthage" means
// you're fighting the actual Carthage preset — and conquest removes them as
// a future threat. Neighbor Martial includes their Defense (folded), an
// Island bonus, AND their trait multipliers so they're a real opponent and
// not a punching bag.
export const buildCivNeighbors = (
    playerPresetId: string,
    adjacencyMap: Record<string, string[]>,
    civPresets: CivPreset[],
): NeighborCiv[] => {
    const neighborIds = adjacencyMap[playerPresetId] || [];
    return neighborIds
        .map((id): NeighborCiv | null => {
            const preset = civPresets.find((p) => p.id === id);
            if (!preset) return null;
            const b = preset.baseStats;
            // Apply trait multipliers so a Strength civ next door is actually
            // strong. Without this, Sparta vs Greek = 58 vs 5 (trivial).
            // Match the player-side rules in calculateStats: Strength × 2.
            let m = b.martial + b.defense;
            if (preset.traits.includes('Strength')) m *= 2;
            if (preset.isIsland) m += 3; // mirror player-side island terrain bonus
            // Cultural-stage Barbarism multiplier (* 1.5) — neighbors start
            // at Barbarism so they get the same 50% Martial uplift the player
            // does until they're displaced.
            m = Math.floor(m * 1.5);
            return {
                id,
                name: preset.name,
                martial: m,
                defense: 0,
                faith: b.faith + (preset.traits.includes('Wisdom') ? b.faith : 0),
                isConquered: false,
                relationship: 'Neutral',
            };
        })
        .filter((n): n is NeighborCiv => n !== null);
};

export interface Technology {
    id: string;
    name: string;
    year: number;
    effect: string;
    description: string;
    requires?: string;
}

export const TECHNOLOGIES: Technology[] = [
    { id: 'writing', name: 'Writing', year: -3000, effect: 'science_bonus_3', description: '+3 Science' },
    { id: 'bronze_working', name: 'Bronze Working', year: -1300, effect: 'martial_2x', description: 'Doubles martial strength' },
    { id: 'iron_working', name: 'Iron Working', year: -1000, effect: 'martial_3x', description: 'Triples martial strength', requires: 'bronze_working' },
    { id: 'mathematics', name: 'Mathematics', year: -600, effect: 'science_bonus_5', description: '+5 Science', requires: 'writing' },
    { id: 'philosophy', name: 'Philosophy', year: -500, effect: 'faith_to_science', description: 'Convert 25% faith to science', requires: 'writing' },
    { id: 'engineering', name: 'Engineering', year: -300, effect: 'industry_bonus_5', description: '+5 Industry', requires: 'mathematics' },
];

// CULTURAL STAGE MULTIPLIERS — applied in calculateStats.
// Each stage reflects a distinct era of civ development. Progressing through
// stages (driven by total Culture) is the main payoff for investing in the
// Develop action, Amphitheatres, Wonders, and cultural tenets. Thresholds:
//   Barbarism (start) -> Classical (20) -> Imperial (50)
//   -> Enlightenment (100) -> Modern (200)
// Decline is special: it's entered only via penalty events, not by threshold.
export const CULTURAL_STAGE_MULTIPLIERS = {
    barbarism:     { martial: 1.5, fertility: 1.3, science: 0.5, faith: 0.5, industry: 0.8 },
    classical:     { martial: 1.0, fertility: 1.0, science: 1.5, faith: 1.3, industry: 1.2 },
    imperial:      { martial: 1.3, fertility: 0.8, science: 1.2, faith: 1.0, industry: 1.5 },
    enlightenment: { martial: 1.1, fertility: 1.0, science: 2.0, faith: 1.2, industry: 1.5 },
    modern:        { martial: 1.2, fertility: 1.2, science: 2.0, faith: 1.2, industry: 2.0 },
    decline:       { martial: 0.7, fertility: 0.5, science: 0.8, faith: 1.2, industry: 0.6 },
};

// CULTURAL STAGE THRESHOLDS — culture totals required to enter each stage.
// Kept here (not inlined) so gameplay, UI, and documentation share one source
// of truth. Edit this table to retune pacing without hunting through JSX.
export const CULTURAL_STAGE_THRESHOLDS: { stage: 'Classical' | 'Imperial' | 'Enlightenment' | 'Modern'; minCulture: number; flavor: string }[] = [
    { stage: 'Classical',     minCulture: 20,  flavor: 'Formal arts, written language, civic identity.' },
    { stage: 'Imperial',      minCulture: 50,  flavor: 'Cultural reach extends beyond borders. Diplomacy matters.' },
    { stage: 'Enlightenment', minCulture: 100, flavor: 'Science and philosophy flourish. Research pays double.' },
    { stage: 'Modern',        minCulture: 200, flavor: 'A civilization at its zenith. Every yield amplified.' },
];

// SCORING TRACKS — four thematic categories that each contribute points to a
// civilization's Final Score. There is NO threshold victory; the game runs
// all 24 turns and the highest Final Score wins overall, with a "Track
// Champion" awarded for the highest score in each individual category.
//
// DESIGN RATIONALE:
//   • No premature victory — every civ plays the full campaign.
//   • Hybrid builds are rewarded — a Rome that goes half-Conquest / half-Legacy
//     is no longer punished by missing both thresholds.
//   • Track Champion awards keep specialists honored even if they lose overall.
//   • Weights are tuned so a focused civ lands ~150-220 points in its primary
//     track by turn 24, a generalist ~80-130 per track. Total score for a
//     strong civ lands in the 350-500 range.
//   • `benchmark` is an advisory pacing goal for the UI progress bar —
//     reaching it signals "on pace for Track Champion" but is NOT a win.
export const SCORING_TRACKS: Record<string, ScoringTrack> = {
    conquest: {
        key: 'conquest',
        name: 'Conquest',
        description: 'Military dominance through decisive battles and territorial expansion.',
        icon: 'Sword',
        color: 'red',
        benchmark: 60,
        calculate: (state) => {
            const conquered = state.conqueredTerritories || 0;
            const warsWon = state.warsWon || 0;
            const martial = state.civilization?.stats?.martial || 0;
            return conquered * 8 + warsWon * 2 + Math.floor(martial / 2);
        },
        recipe: (state) => {
            const conquered = state.conqueredTerritories || 0;
            const warsWon = state.warsWon || 0;
            const martial = state.civilization?.stats?.martial || 0;
            const territory = state.tiles?.filter((t: any) => t.building && t.building !== 'None').length || 0;
            return [
                { label: 'Civilizations conquered', value: conquered, points: conquered * 8, formula: '8 pts per decisive conquest' },
                { label: 'Battles won',            value: warsWon,   points: warsWon * 2,  formula: '2 pts per combat victory' },
                { label: 'Martial strength',       value: martial,   points: Math.floor(martial / 2), formula: '1 pt per 2 Martial (endgame snapshot)' },
                { label: 'Developed tiles',        value: territory, points: 0,            formula: 'Informational — shows civ footprint' },
            ];
        }
    },
    innovation: {
        key: 'innovation',
        name: 'Innovation',
        description: 'Scientific progress, technological mastery, and accumulated knowledge.',
        icon: 'FlaskConical',
        color: 'cyan',
        benchmark: 100,
        calculate: (state) => {
            const science = state.civilization?.stats?.science || 0;
            const techs = state.civilization?.technologies?.length || 0;
            const libraries = state.civilization?.buildings?.libraries || 0;
            return science + techs * 5 + libraries * 2;
        },
        recipe: (state) => {
            const science = state.civilization?.stats?.science || 0;
            const techs = state.civilization?.technologies?.length || 0;
            const libraries = state.civilization?.buildings?.libraries || 0;
            return [
                { label: 'Science Total',    value: science,   points: science,       formula: '1 pt per Science' },
                { label: 'Technologies',     value: techs,     points: techs * 5,     formula: '5 pts per tech unlocked' },
                { label: 'Libraries',        value: libraries, points: libraries * 2, formula: '2 pts each' },
            ];
        }
    },
    legacy: {
        key: 'legacy',
        name: 'Legacy',
        description: 'Cultural achievement, wonders, and civilizational maturity.',
        icon: 'Landmark',
        color: 'pink',
        benchmark: 140,
        calculate: (state) => {
            const culture = state.civilization?.stats?.culture || 0;
            const wonders = (state.wondersBuilt?.length || 0) * 8;
            const stage = state.civilization?.culturalStage;
            const stageBonus = stage === 'Modern' ? 50
                : stage === 'Enlightenment' ? 35
                : stage === 'Imperial' ? 20
                : stage === 'Classical' ? 10
                : 0;
            const amphitheatres = (state.civilization?.buildings?.amphitheatres || 0) * 2;
            return culture + wonders + stageBonus + amphitheatres;
        },
        recipe: (state) => {
            const culture = state.civilization?.stats?.culture || 0;
            const wonders = state.wondersBuilt?.length || 0;
            const stage = state.civilization?.culturalStage;
            const stageBonus = stage === 'Modern' ? 50
                : stage === 'Enlightenment' ? 35
                : stage === 'Imperial' ? 20
                : stage === 'Classical' ? 10
                : 0;
            const amphitheatres = state.civilization?.buildings?.amphitheatres || 0;
            return [
                { label: 'Culture Total',          value: culture,       points: culture,           formula: '1 pt per Culture' },
                { label: 'Wonders built',          value: wonders,       points: wonders * 8,       formula: '8 pts per Wonder' },
                { label: `Stage: ${stage || 'Barbarism'}`, value: stageBonus > 0 ? 1 : 0, points: stageBonus, formula: 'Classical 10 · Imperial 20 · Enlightenment 35 · Modern 50' },
                { label: 'Amphitheatres',          value: amphitheatres, points: amphitheatres * 2, formula: '2 pts each' },
            ];
        }
    },
    faith: {
        key: 'faith',
        name: 'Faith',
        description: 'Spiritual power, religious depth, and missionary reach.',
        icon: 'Scroll',
        color: 'amber',
        benchmark: 60,
        calculate: (state) => {
            const faith = state.civilization?.stats?.faith || 0;
            const spread = state.religionSpread || 0;
            const temples = state.civilization?.buildings?.temples || 0;
            return faith + spread * 4 + temples * 2;
        },
        recipe: (state) => {
            const faith = state.civilization?.stats?.faith || 0;
            const spread = state.religionSpread || 0;
            const temples = state.civilization?.buildings?.temples || 0;
            return [
                { label: 'Faith Total',            value: faith,   points: faith,       formula: '1 pt per Faith' },
                { label: 'Neighbors converted',    value: spread,  points: spread * 4,  formula: '4 pts per conversion' },
                { label: 'Temples',                value: temples, points: temples * 2, formula: '2 pts each' },
            ];
        }
    }
};

// Compute a civilization's total Final Score across all tracks plus any
// milestone bonuses. Returns both the aggregate and the per-track breakdown
// so the UI can show a leaderboard and highlight Track Champions.
export function calculateFinalScore(state: any): {
    total: number;
    breakdown: { key: string; name: string; score: number; benchmark: number }[];
    milestones: number;
} {
    const breakdown = Object.values(SCORING_TRACKS).map(t => ({
        key: t.key,
        name: t.name,
        score: t.calculate(state),
        benchmark: t.benchmark,
    }));
    // Cross-track milestone bonuses — rewards for crossing meaningful
    // historical thresholds. Kept small (max ~50 pts) so tracks remain the
    // main scoring driver.
    const wonders = state.wondersBuilt?.length || 0;
    const techs = state.civilization?.technologies?.length || 0;
    const stage = state.civilization?.culturalStage;
    let milestones = 0;
    if (wonders >= 1) milestones += 5;       // First wonder
    if (wonders >= 3) milestones += 10;      // Three wonders
    if (techs >= 4) milestones += 10;        // Deep research
    if (techs >= 6) milestones += 15;        // All core techs
    if (stage === 'Modern') milestones += 20; // Peak civilization
    if ((state.conqueredTerritories || 0) >= 3) milestones += 10; // Hegemon
    const trackTotal = breakdown.reduce((sum, b) => sum + b.score, 0);
    return { total: trackTotal + milestones, breakdown, milestones };
}

// LEGACY ALIAS — older code may still import VICTORY_CONDITIONS. We alias
// the new SCORING_TRACKS to the old name and synthesize a `target` field
// (using benchmark) so any lingering UI that reads `target` still works.
export const VICTORY_CONDITIONS: Record<string, VictoryCondition> = {
    military: { ...SCORING_TRACKS.conquest, target: SCORING_TRACKS.conquest.benchmark },
    scientific: { ...SCORING_TRACKS.innovation, target: SCORING_TRACKS.innovation.benchmark },
    cultural: { ...SCORING_TRACKS.legacy, target: SCORING_TRACKS.legacy.benchmark },
    religious: { ...SCORING_TRACKS.faith, target: SCORING_TRACKS.faith.benchmark },
};
