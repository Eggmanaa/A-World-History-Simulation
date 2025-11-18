
import { TerrainType, TileData, BuildingType, CivPreset, WonderDefinition, ReligionTenet, NeighborCiv, TimelineEvent } from './types';

export const HEX_SIZE = 1.0;
export const MAP_RADIUS = 9;

export const CIV_PRESETS: CivPreset[] = [
    {
        id: 'egypt', name: 'Ancient Egypt', regions: ['Egypt', 'North Africa', 'Fertile Crescent'],
        traits: ['Industrious', 'Wisdom'],
        baseStats: { martial: 5, defense: 5, faith: 10, industry: 10, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#eab308', accent: '#2563eb' },
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Desert, TerrainType.Desert, TerrainType.Mountain]
    },
    {
        id: 'greece', name: 'Ancient Greece', regions: ['Greece', 'Aegean', 'Europe'],
        traits: ['Intelligence', 'Beauty'],
        baseStats: { martial: 7, defense: 5, faith: 5, industry: 5, fertility: 2 },
        waterResource: 'Lake', isIsland: true,
        colors: { base: '#3b82f6', accent: '#f8fafc' },
        centerBiomes: [TerrainType.Plains, TerrainType.Grassland, TerrainType.Mountain],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Mountain, TerrainType.Forest]
    },
    {
        id: 'rome', name: 'Roman Empire', regions: ['Italia', 'Rome', 'Europe'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 10, defense: 8, faith: 5, industry: 8, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#dc2626', accent: '#fcd34d' },
        centerBiomes: [TerrainType.Grassland, TerrainType.Plains, TerrainType.River],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Forest, TerrainType.Plains]
    },
    {
        id: 'china', name: 'Ancient China', regions: ['China', 'Asia'],
        traits: ['Industrious', 'Intelligence'],
        baseStats: { martial: 8, defense: 6, faith: 5, industry: 10, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#ca8a04', accent: '#ef4444' },
        centerBiomes: [TerrainType.River, TerrainType.Plains, TerrainType.Forest],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Forest]
    },
    {
        id: 'germania', name: 'Germania', regions: ['Germania', 'Teutons', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 10, defense: 6, faith: 4, industry: 4, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#14532d', accent: '#a3e635' },
        centerBiomes: [TerrainType.Forest, TerrainType.Forest, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Forest, TerrainType.Mountain, TerrainType.River]
    },
    {
        id: 'phoenicia', name: 'Phoenicia', regions: ['Phoenicia', 'Fertile Crescent'],
        traits: ['Beauty', 'Creativity'],
        baseStats: { martial: 5, defense: 5, faith: 5, industry: 7, fertility: 2 },
        waterResource: 'Ocean', isIsland: false,
        colors: { base: '#7e22ce', accent: '#f0abfc' },
        centerBiomes: [TerrainType.Plains, TerrainType.Desert],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Ocean, TerrainType.Mountain]
    },
    {
        id: 'india', name: 'Ancient India', regions: ['India', 'Asia'],
        traits: ['Wisdom', 'Creativity'],
        baseStats: { martial: 6, defense: 5, faith: 10, industry: 6, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#f97316', accent: '#10b981' },
        centerBiomes: [TerrainType.River, TerrainType.Grassland, TerrainType.Forest],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Ocean]
    },
    {
        id: 'mesopotamia', name: 'Mesopotamia', regions: ['Mesopotamia', 'Fertile Crescent'],
        traits: ['Intelligence', 'Industrious'],
        baseStats: { martial: 6, defense: 5, faith: 8, industry: 8, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#1e3a8a', accent: '#fbbf24' },
        centerBiomes: [TerrainType.River, TerrainType.River, TerrainType.Plains],
        edgeBiomes: [TerrainType.Desert, TerrainType.Marsh, TerrainType.Mountain]
    },
    {
        id: 'persia', name: 'Persian Empire', regions: ['Persia', 'Asia', 'Fertile Crescent'],
        traits: ['Strength', 'Beauty'],
        baseStats: { martial: 12, defense: 6, faith: 6, industry: 6, fertility: 2 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#9d174d', accent: '#fbbf24' },
        centerBiomes: [TerrainType.Plains, TerrainType.Mountain, TerrainType.Desert],
        edgeBiomes: [TerrainType.HighMountain, TerrainType.Desert, TerrainType.Mountain]
    },
    {
        id: 'sparta', name: 'Sparta', regions: ['Greece', 'Laconia', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 15, defense: 10, faith: 3, industry: 4, fertility: 2 },
        waterResource: 'Lake', isIsland: true,
        colors: { base: '#7f1d1d', accent: '#94a3b8' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Ocean, TerrainType.HighMountain]
    },
    {
        id: 'anatolia', name: 'Anatolia', regions: ['Anatolia', 'Fertile Crescent'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 8, defense: 6, faith: 5, industry: 7, fertility: 2 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#92400e', accent: '#fcd34d' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Ocean]
    },
    {
        id: 'crete', name: 'Minoan Crete', regions: ['Crete', 'Aegean', 'Europe'],
        traits: ['Beauty', 'Creativity'],
        baseStats: { martial: 4, defense: 4, faith: 5, industry: 6, fertility: 2 },
        waterResource: 'Ocean', isIsland: true,
        colors: { base: '#0d9488', accent: '#ccfbf1' },
        centerBiomes: [TerrainType.Grassland, TerrainType.Plains],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Ocean, TerrainType.Mountain]
    },
    {
        id: 'gaul', name: 'Gaul', regions: ['Gaul', 'Celts', 'Europe'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 8, defense: 5, faith: 4, industry: 5, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#166534', accent: '#a3e635' },
        centerBiomes: [TerrainType.Forest, TerrainType.Forest, TerrainType.Plains],
        edgeBiomes: [TerrainType.Forest, TerrainType.Mountain, TerrainType.Ocean]
    },
    {
        id: 'carthage', name: 'Carthage', regions: ['Carthage', 'North Africa', 'Phoenicia'],
        traits: ['Beauty', 'Strength'],
        baseStats: { martial: 9, defense: 7, faith: 5, industry: 7, fertility: 2 },
        waterResource: 'Ocean', isIsland: false,
        colors: { base: '#7c3aed', accent: '#c4b5fd' },
        centerBiomes: [TerrainType.Plains, TerrainType.Desert, TerrainType.Ocean],
        edgeBiomes: [TerrainType.Ocean, TerrainType.Desert, TerrainType.Mountain]
    },
    {
        id: 'macedon', name: 'Macedonia', regions: ['Macedon', 'Greece', 'Europe'],
        traits: ['Strength', 'Beauty'],
        baseStats: { martial: 12, defense: 6, faith: 5, industry: 6, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#1e40af', accent: '#fbbf24' },
        centerBiomes: [TerrainType.Mountain, TerrainType.Plains, TerrainType.Grassland],
        edgeBiomes: [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Forest]
    },
    {
        id: 'assyria', name: 'Assyrian Empire', regions: ['Assyria', 'Mesopotamia', 'Fertile Crescent'],
        traits: ['Strength', 'Industrious'],
        baseStats: { martial: 12, defense: 7, faith: 5, industry: 7, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#450a0a', accent: '#f59e0b' },
        centerBiomes: [TerrainType.Plains, TerrainType.River, TerrainType.Desert],
        edgeBiomes: [TerrainType.Mountain, TerrainType.Desert, TerrainType.Marsh]
    },
    {
        id: 'cush', name: 'Kingdom of Kush', regions: ['Cush', 'Nubia', 'Africa'],
        traits: ['Strength', 'Health'],
        baseStats: { martial: 7, defense: 6, faith: 6, industry: 6, fertility: 2 },
        waterResource: 'River', isIsland: false,
        colors: { base: '#854d0e', accent: '#fef08a' },
        centerBiomes: [TerrainType.River, TerrainType.Desert, TerrainType.Plains],
        edgeBiomes: [TerrainType.Desert, TerrainType.HighMountain, TerrainType.Desert]
    },
    {
        id: 'israel', name: 'Ancient Israel', regions: ['Israel', 'Fertile Crescent'],
        traits: ['Wisdom', 'Faith'],
        baseStats: { martial: 5, defense: 5, faith: 12, industry: 5, fertility: 2 },
        waterResource: 'Lake', isIsland: false,
        colors: { base: '#2563eb', accent: '#ffffff' },
        centerBiomes: [TerrainType.Plains, TerrainType.Mountain, TerrainType.Desert],
        edgeBiomes: [TerrainType.Desert, TerrainType.Mountain, TerrainType.Ocean]
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
  return tiles;
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
    { year: -50000, name: "Paleolithic Era", desc: "Early human migration and tool use." },
    { year: -8500, name: "Mesolithic Period", desc: "Population growth begins." },
    { 
        year: -4500, name: "Agricultural Revolution", desc: "Farming allows permanent settlements.",
        actions: [
            { type: 'MODIFY_STAT', targetRegions: ['Egypt'], stat: 'industry', isPercent: true, value: 30, message: "Egypt gains 30% Industry bonus." },
            { type: 'MODIFY_STAT', targetRegions: ['Fertile Crescent', 'Mesopotamia'], stat: 'fertility', value: 2, message: "Fertile Crescent gains +2 Fertility." }
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
            { type: 'DISASTER', targetRegions: ['Italia', 'Rome'], saveTrait: 'Wisdom', saveDC: 40, saveStat: 'faith', failEffect: { houseLossPercent: 50 }, message: "Mount Vesuvius Erupts! (Save: Wisdom or Faith > 40)" }
        ]
    },
    { 
        year: 138, name: "Antonine Plague", desc: "Sickness strikes Rome.",
        actions: [
            { type: 'DISASTER', targetRegions: ['Rome', 'Italia'], saveTrait: 'Health', saveDC: 6, failEffect: { houseLossPercent: 20 }, message: "Antonine Plague. (Save: Health)" }
        ]
    },
    {
        year: 375, name: "Barbarian Invasions", desc: "Huns and Goths migrate.",
        actions: [
            { type: 'ADD_NEIGHBOR', neighbor: { name: "Hunnic Horde", martial: 25, defense: 5, faith: 0 }, message: "The Huns are attacking!" }
        ]
    },
    { 
        year: 300, name: "Roman Split", desc: "Empire divides.",
        actions: [
             { type: 'SET_FLAG', flagName: 'romanSplit', targetRegions: ['Rome', 'Italia'], message: "Empire Split." }
        ]
    },
    { year: 362, name: "Julian the Apostate", desc: "End of simulation." }
];

export const WONDERS_LIST: WonderDefinition[] = [
    { id: 'pyramids', name: 'Great Pyramids', cost: 50, era: 'Ancient', minYear: -3000, effects: "+10 Faith, +5 Culture, +20 Industry", bonus: { faith: 10, culture: 5, production: 20 } },
    { id: 'gardens', name: 'Hanging Gardens', cost: 40, era: 'Ancient', minYear: -1300, effects: "+10 Capacity, +5 Culture", bonus: { culture: 5, populationCapacity: 10 } },
    { id: 'wall', name: 'Great Wall', cost: 50, era: 'Ancient', minYear: -1300, effects: "+15 Defense", bonus: { defense: 15 } },
    { id: 'ishtar', name: 'Gates of Ishtar', cost: 40, era: 'Ancient', minYear: -1300, effects: "+2 Martial, +15 Defense, +2 Culture", bonus: { martial: 2, defense: 15, culture: 2 } },
    { id: 'colossus', name: 'Colossus', cost: 35, era: 'Ancient', minYear: -1300, effects: "+1 Diplomacy (Alliance)", bonus: { diplomacy: 1 } },
    
    { id: 'colosseum', name: 'Colosseum', cost: 40, era: 'Classical', minYear: -300, effects: "+2 Martial, +5 Culture", bonus: { martial: 2, culture: 5 } },
    { id: 'library', name: 'Great Library', cost: 45, era: 'Classical', minYear: -300, effects: "+15 Science, +5 Culture", bonus: { science: 15, culture: 5 } },
    { id: 'lighthouse', name: 'Great Lighthouse', cost: 35, era: 'Classical', minYear: -300, effects: "+3 Diplomacy, +5 Culture", bonus: { culture: 5, diplomacy: 3 } },
    { id: 'zeus', name: 'Statue of Zeus', cost: 40, era: 'Classical', minYear: -500, effects: "+10 Martial, +5 Faith", bonus: { martial: 10, faith: 5 } },
    { id: 'oracle', name: 'Oracle', cost: 35, era: 'Classical', minYear: -500, effects: "+10 Culture", bonus: { culture: 10 } },
    { id: 'artemis', name: 'Temple of Artemis', cost: 35, era: 'Classical', minYear: -500, effects: "+2 Martial, +1 Defense, +3 Culture", bonus: { martial: 2, defense: 1, culture: 3 } },
    
    { id: 'hagia', name: 'Hagia Sophia', cost: 50, era: 'Late', minYear: 44, effects: "+12 Faith, +8 Culture", bonus: { faith: 12, culture: 8 } },
    { id: 'justinian', name: 'Walls of Justinian', cost: 50, era: 'Late', minYear: 44, effects: "Impenetrable Defense (+20)", bonus: { defense: 20 } },
    { id: 'hippodrome', name: 'Hippodrome', cost: 40, era: 'Late', minYear: 44, effects: "+8 Culture", bonus: { culture: 8 } }
];

export const RELIGION_TENETS: ReligionTenet[] = [
    { id: 'holy_war', name: 'Holy War', description: '+2 Martial per converted neighbor.' },
    { id: 'polytheism', name: 'Polytheism', description: '+2 Faith per Temple.' },
    { id: 'scriptures', name: 'Holy Scriptures', description: 'Double Faith output.' },
    { id: 'philosophy', name: 'Philosophy', description: 'Convert 50% Faith to Science.' },
    { id: 'asceticism', name: 'Asceticism', description: '-5 Pop Cap, +10 Faith.' },
    { id: 'monotheism', name: 'Monotheism', description: '+5 Faith, removes other faiths.' },
    { id: 'medicine', name: 'Medicine', description: '+5 Population Capacity.' },
    { id: 'evangelism', name: 'Evangelism', description: 'Spreads 2x faster.' },
    { id: 'christianity', name: 'Christianity', description: '+1 Faith, +1 Culture.' }
];

export const GENERATE_NEIGHBORS = (year: number): NeighborCiv[] => {
    const baseStrength = Math.abs(year) > 2000 ? 3 : Math.abs(year) > 500 ? 8 : 15;
    return [
        { id: 'n1', name: 'Barbarian Tribe', martial: Math.floor(baseStrength * 0.8), defense: 2, faith: 1, isConquered: false, relationship: 'Neutral' },
        { id: 'n2', name: 'Rival City-State', martial: baseStrength, defense: 5, faith: 3, isConquered: false, relationship: 'Neutral' },
        { id: 'n3', name: 'Foreign Empire', martial: Math.floor(baseStrength * 1.5), defense: 10, faith: 5, isConquered: false, relationship: 'Neutral' },
    ];
};
