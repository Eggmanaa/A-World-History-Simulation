// Game Data: Wonders, Cultural Bonuses, Writing Systems, Religion

export interface Wonder {
  id: string
  name: string
  displayName: string
  cost: number
  effects: {
    population_capacity?: number
    martial?: number
    defense?: number
    culture?: number
    faith?: number
    science?: number
    industry?: number
    fertility?: number
  }
  requirements?: {
    terrain?: string
    science?: number
    culture?: string
  }
  unique?: boolean
  cultureSpecific?: string[]
  description: string
  icon: string
}

export interface CulturalBonus {
  id: string
  year: number
  cultures: string[]
  name: string
  description: string
  effects: any
  requirement?: string
}

export interface WritingSystem {
  id: string
  name: string
  scienceBonus: number
  requirement?: string
  cultures?: string[]
}

export interface ReligionTenet {
  id: string
  name: string
  effect: string
  description: string
}

// WONDERS DATA
export const WONDERS: Wonder[] = [
  // Ancient Wonders
  {
    id: 'hanging_gardens',
    name: 'hanging_gardens',
    displayName: 'Hanging Gardens',
    cost: 100,
    effects: { population_capacity: 10 },
    description: 'Increase population capacity by 10. Boosted by adjacent river.',
    icon: '🌳',
    unique: true
  },
  {
    id: 'great_wall',
    name: 'great_wall',
    displayName: 'Great Wall',
    cost: 150,
    effects: { defense: 50 },
    description: 'Massive defensive structure. This map cannot be easily attacked.',
    icon: '🧱',
    unique: true
  },
  {
    id: 'colossus',
    name: 'colossus',
    displayName: 'Colossus of Rhodes',
    cost: 80,
    effects: { diplomacy: 1 },
    requirements: { terrain: 'ocean' },
    description: 'Must be built on coast. +1 alliance capacity.',
    icon: '🗿',
    unique: true
  },
  {
    id: 'great_pyramids',
    name: 'great_pyramids',
    displayName: 'Great Pyramids',
    cost: 120,
    effects: { culture: 10, industry: 20 },
    description: '+20 industry bonus to future wonders.',
    icon: '🔺',
    unique: true
  },
  {
    id: 'gates_ishtar',
    name: 'gates_ishtar',
    displayName: 'Gates of Ishtar',
    cost: 60,
    effects: { martial: 2, defense: 5, culture: 2 },
    description: 'Must be built into existing wall.',
    icon: '🚪',
    unique: true
  },
  {
    id: 'terracotta_army',
    name: 'terracotta_army',
    displayName: 'Terracotta Army',
    cost: 90,
    effects: { martial: 10 },
    requirements: { terrain: 'desert' },
    description: 'Must be built in desert.',
    icon: '🗿',
    unique: true
  },
  
  // Classical Wonders
  {
    id: 'great_lighthouse',
    name: 'great_lighthouse',
    displayName: 'Great Lighthouse',
    cost: 80,
    effects: { science: 5 },
    requirements: { terrain: 'ocean' },
    description: 'Attack over sea without penalty.',
    icon: '🗼',
    unique: true
  },
  {
    id: 'great_library',
    name: 'great_library',
    displayName: 'Great Library',
    cost: 100,
    effects: { science: 10 },
    description: 'Massive scientific advancement.',
    icon: '📚',
    unique: true
  },
  {
    id: 'statue_zeus',
    name: 'statue_zeus',
    displayName: 'Statue of Zeus',
    cost: 70,
    effects: { martial: 10 },
    description: 'Great martial power.',
    icon: '⚡',
    unique: true
  },
  {
    id: 'oracle',
    name: 'oracle',
    displayName: 'Oracle at Delphi',
    cost: 60,
    effects: { culture: 10 },
    description: 'Divine wisdom and culture.',
    icon: '🔮',
    unique: true
  },
  {
    id: 'temple_artemis',
    name: 'temple_artemis',
    displayName: 'Temple of Artemis',
    cost: 90,
    effects: { martial: 2, defense: 1, fertility: 2, culture: 3 },
    description: 'Blessed by the goddess.',
    icon: '🏛️',
    unique: true
  },
  {
    id: 'mausoleum',
    name: 'mausoleum',
    displayName: 'Mausoleum of Halicarnassus',
    cost: 100,
    effects: { culture: 7, industry: 3 },
    description: 'Monument to greatness.',
    icon: '⚱️',
    unique: true
  },
  
  // Late Wonders
  {
    id: 'colosseum',
    name: 'colosseum',
    displayName: 'Colosseum',
    cost: 120,
    effects: { martial: 10, culture: 5 },
    description: '+10 martial per conquered map.',
    icon: '🏟️',
    unique: true
  },
  {
    id: 'hagia_sophia',
    name: 'hagia_sophia',
    displayName: 'Hagia Sophia',
    cost: 110,
    effects: { faith: 5, culture: 5 },
    description: 'Sacred wonder of faith.',
    icon: '⛪',
    unique: true
  },
  {
    id: 'hippodrome',
    name: 'hippodrome',
    displayName: 'Hippodrome',
    cost: 80,
    effects: { culture: 8 },
    description: 'Chariot racing venue.',
    icon: '🏇',
    unique: true
  }
]

// CULTURE-SPECIFIC BUILDINGS
export const CULTURE_BUILDINGS: Wonder[] = [
  {
    id: 'ziggurat',
    name: 'ziggurat',
    displayName: 'Ziggurat',
    cost: 20,
    effects: { science: 1, faith: 1 },
    cultureSpecific: ['Mesopotamia', 'Fertile Crescent'],
    description: 'Mesopotamian temple tower.',
    icon: '🏛️',
    unique: false
  },
  {
    id: 'temple_solomon',
    name: 'temple_solomon',
    displayName: 'Temple of Solomon',
    cost: 70,
    effects: { faith: 10 },
    cultureSpecific: ['Israel'],
    description: 'Sacred temple. Can be rebuilt if destroyed.',
    icon: '✡️',
    unique: true
  },
  {
    id: 'university',
    name: 'university',
    displayName: 'University',
    cost: 30,
    effects: { science: 2 },
    cultureSpecific: ['India', 'Khmer'],
    description: 'Center of learning.',
    icon: '🎓',
    unique: false
  },
  {
    id: 'troy_walls',
    name: 'troy_walls',
    displayName: 'Walls of Troy',
    cost: 20,
    effects: { defense: 10 },
    cultureSpecific: ['Troy'],
    description: 'Double thick walls. Can build up to 5.',
    icon: '🧱',
    unique: false
  },
  {
    id: 'cothon',
    name: 'cothon',
    displayName: 'Cothon',
    cost: 20,
    effects: { defense: 15 },
    cultureSpecific: ['Phoenicia', 'Carthage'],
    requirements: { terrain: 'ocean' },
    description: 'Naval harbor. Cannot be attacked over water.',
    icon: '⚓',
    unique: false
  },
  {
    id: 'roman_fort',
    name: 'roman_fort',
    displayName: 'Roman Fort',
    cost: 15,
    effects: { defense: 10 },
    cultureSpecific: ['Rome'],
    description: 'Fortified position.',
    icon: '🏰',
    unique: false
  },
  {
    id: 'wat',
    name: 'wat',
    displayName: 'Wat',
    cost: 40,
    effects: { population_capacity: 2, science: 2, faith: 1 },
    cultureSpecific: ['Khmer'],
    description: 'Buddhist temple complex.',
    icon: '🛕',
    unique: false
  },
  {
    id: 'obelisk',
    name: 'obelisk',
    displayName: 'Obelisk',
    cost: 20,
    effects: { culture: 2 },
    cultureSpecific: ['Ethiopia', 'Cush'],
    description: 'Stone monument.',
    icon: '🗿',
    unique: false
  }
]

// WRITING SYSTEMS
export const WRITING_SYSTEMS: WritingSystem[] = [
  {
    id: 'cuneiform',
    name: 'Cuneiform',
    scienceBonus: 2,
    cultures: ['Mesopotamia', 'Fertile Crescent', 'Assyria', 'Babylon']
  },
  {
    id: 'indus_script',
    name: 'Indus Valley Script',
    scienceBonus: 2,
    cultures: ['India']
  },
  {
    id: 'hieroglyphs',
    name: 'Egyptian Hieroglyphs',
    scienceBonus: 3,
    cultures: ['Egypt', 'Cush']
  },
  {
    id: 'chinese_chars',
    name: 'Chinese Characters',
    scienceBonus: 3,
    cultures: ['China', 'Korea']
  },
  {
    id: 'phoenician_alphabet',
    name: 'Phoenician Alphabet',
    scienceBonus: 5,
    cultures: ['Phoenicia', 'Carthage']
  },
  {
    id: 'greek_alphabet',
    name: 'Greek Alphabet',
    scienceBonus: 6,
    cultures: ['Greece', 'Macedon', 'Sparta', 'Troy', 'Crete']
  },
  {
    id: 'latin_alphabet',
    name: 'Latin Alphabet',
    scienceBonus: 6,
    cultures: ['Rome', 'Italia', 'Gaul', 'Germania', 'Iberia']
  }
]

// RELIGION TENETS
export const RELIGION_TENETS: ReligionTenet[] = [
  {
    id: 'holy_war',
    name: 'Holy War',
    effect: '+2 martial per map converted',
    description: 'Gain martial strength from spreading your faith.'
  },
  {
    id: 'monotheism',
    name: 'Monotheism',
    effect: 'Removes other faiths',
    description: 'Only one true faith can exist on your maps.'
  },
  {
    id: 'polytheism',
    name: 'Polytheism',
    effect: '+2 faith per temple',
    description: 'Many gods bring more faith.'
  },
  {
    id: 'syncretism',
    name: 'Syncretism',
    effect: '+1 culture and faith per religion',
    description: 'Blend different faiths together.'
  },
  {
    id: 'medicine',
    name: 'Medicine',
    effect: '+1 fertility per faith point',
    description: 'Healing arts help population grow.'
  },
  {
    id: 'astrology',
    name: 'Astrology',
    effect: '+1 science per map following religion',
    description: 'Study the stars for knowledge.'
  },
  {
    id: 'holy_scriptures',
    name: 'Holy Scriptures',
    effect: 'Doubles faith output',
    description: 'Sacred texts strengthen belief.'
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    effect: 'Faith adds to science',
    description: 'Contemplation brings wisdom.'
  },
  {
    id: 'pacifism',
    name: 'Pacifism',
    effect: 'Cannot wage war, +8 population capacity',
    description: 'Peace brings prosperity.'
  },
  {
    id: 'evangelism',
    name: 'Evangelism',
    effect: 'Spread religion twice per turn',
    description: 'Convert the world to your faith.'
  }
]

// SCIENCE EFFECTS
export const SCIENCE_EFFECTS = [
  { level: 1, ability1: 'Can attack through marsh', ability2: null },
  { level: 2, ability1: 'Can attack through forests', ability2: null },
  { level: 3, ability1: null, ability2: null },
  { level: 4, ability1: '+2 martial', ability2: null },
  { level: 5, ability1: '+2 industry', ability2: 'Can attack over rivers' },
  { level: 6, ability1: 'Can attack through Level 1 walls', ability2: null },
  { level: 7, ability1: '+2 population capacity', ability2: null },
  { level: 8, ability1: null, ability2: null },
  { level: 9, ability1: '+5 martial', ability2: '+5 industry' },
  { level: 10, ability1: '+5 faith', ability2: 'Can attack over ocean' },
  { level: 11, ability1: 'Can attack through Level 2 walls', ability2: null },
  { level: 12, ability1: '+10 martial', ability2: null },
  { level: 15, ability1: '+10 industry', ability2: 'Can attack over mountains' },
  { level: 16, ability1: '+5 population capacity', ability2: null },
  { level: 30, ability1: 'Can build Archimedes Tower', ability2: null }
]

// CULTURAL BONUSES (Year-based unlocks)
export const CULTURAL_BONUSES: CulturalBonus[] = [
  // 4500 BC
  {
    id: 'nilotic_floods',
    year: -4500,
    cultures: ['Egypt', 'Cush'],
    name: 'Gifts of the Nile',
    description: '+2 Fertility from floods, no population loss from flooding',
    effects: { fertility: 2 }
  },
  {
    id: 'monument_builders',
    year: -4500,
    cultures: ['Egypt'],
    name: 'Monument Builders',
    description: 'Wonder construction increased by 30%',
    effects: { wonder_bonus: 0.3 }
  },
  {
    id: 'two_rivers',
    year: -4500,
    cultures: ['Mesopotamia', 'Fertile Crescent'],
    name: 'Garden Between Two Rivers',
    description: '+2 Fertility',
    effects: { fertility: 2 }
  },
  {
    id: 'tower_babel',
    year: -4500,
    cultures: ['Mesopotamia', 'Fertile Crescent'],
    name: 'Tower of Babel',
    description: 'Can build ziggurats',
    effects: { unlock_building: 'ziggurat' }
  },
  
  // 2250 BC
  {
    id: 'great_wall_bonus',
    year: -2250,
    cultures: ['China'],
    name: 'Great Wall',
    description: 'Number of walls you can place doubled',
    effects: { wall_multiplier: 2 }
  },
  {
    id: 'mohenjo_daro',
    year: -2250,
    cultures: ['India'],
    name: 'Mohenjo Daro',
    description: 'Population capacity increased by 5',
    effects: { population_capacity: 5 }
  },
  {
    id: 'rigveda',
    year: -2250,
    cultures: ['India'],
    name: 'Rigveda',
    description: 'May found up to two different religions',
    effects: { max_religions: 2 }
  },
  {
    id: 'african_highlanders',
    year: -2250,
    cultures: ['Ethiopia', 'Cush'],
    name: 'African Highlanders',
    description: 'May build in mountains',
    effects: { build_mountains: true }
  },
  {
    id: 'land_bow',
    year: -2250,
    cultures: ['Ethiopia', 'Cush'],
    name: 'Land of the Bow',
    description: '+5 martial',
    effects: { martial: 5 }
  },
  
  // 1850 BC
  {
    id: 'hoplites',
    year: -1850,
    cultures: ['Greece', 'Sparta'],
    name: 'Hoplites',
    description: 'Each house adds +1 martial',
    effects: { martial_per_house: 1 }
  },
  
  // 1300 BC
  {
    id: 'troy_walls_bonus',
    year: -1300,
    cultures: ['Troy'],
    name: 'Walls of Troy',
    description: 'Can build unique double thick walls',
    effects: { unlock_building: 'troy_walls' }
  },
  {
    id: 'homeric_epics',
    year: -1300,
    cultures: ['Greece'],
    name: 'Homeric Epics',
    description: 'Add +1 culture per house',
    effects: { culture_per_house: 1 }
  },
  {
    id: 'angkor_wat',
    year: -1300,
    cultures: ['Khmer'],
    name: 'Angkor Wat',
    description: 'Can build Wats',
    effects: { unlock_building: 'wat' }
  },
  {
    id: 'elephantry',
    year: -1300,
    cultures: ['India', 'Khmer'],
    name: 'Elephantry',
    description: 'Sacrifice population for +10 defense per house destroyed',
    effects: { sacrifice_defense: 10 }
  },
  
  // 1200 BC
  {
    id: 'seed_abraham',
    year: -1200,
    cultures: ['Israel'],
    name: 'Seed of Abraham',
    description: 'Can adopt extra faith tenant when establishing religion',
    effects: { extra_tenet: true }
  },
  {
    id: 'judges',
    year: -1200,
    cultures: ['Israel'],
    name: 'Judges',
    description: '(Martial × Faith) + Defense = Total Defensive Score',
    effects: { defense_formula: 'martial_faith' }
  },
  {
    id: 'tyre_purple',
    year: -1200,
    cultures: ['Phoenicia'],
    name: 'Tyre Purple',
    description: '+5 culture',
    effects: { culture: 5 }
  },
  {
    id: 'king_tyre',
    year: -1200,
    cultures: ['Phoenicia'],
    name: 'King of Tyre',
    description: '+10 defense',
    effects: { defense: 10 }
  },
  {
    id: 'acropolis',
    year: -1200,
    cultures: ['Greece'],
    name: 'Acropolis',
    description: '+5 defense',
    effects: { defense: 5 }
  },
  {
    id: 'spartiates',
    year: -1200,
    cultures: ['Sparta'],
    name: 'Spartiates',
    description: 'Martial is multiplied by culture',
    effects: { martial_culture_mult: true }
  },
  {
    id: 'spartan_survivor',
    year: -1200,
    cultures: ['Sparta'],
    name: 'Spartan Survivor',
    description: '+5 culture for every battle you survive',
    effects: { culture_per_battle: 5 }
  },
  {
    id: 'celts_headhunters',
    year: -1200,
    cultures: ['Gaul', 'Celts'],
    name: 'Headhunters',
    description: '+5 martial, can raid neighbors',
    effects: { martial: 5, can_raid: true }
  },
  {
    id: 'druidic_lore',
    year: -1200,
    cultures: ['Gaul', 'Celts'],
    name: 'Druidic Lore',
    description: '+1 faith from forests',
    effects: { faith_per_forest: 1 }
  }
]
