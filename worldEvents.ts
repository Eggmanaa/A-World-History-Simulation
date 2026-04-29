/**
 * WORLD EVENTS - Ancient World Simulation v2
 * 24 turns of historical events, each with:
 * - Global effects applied to all players
 * - A/B/C choices with distinct strategic trade-offs
 * - Civilization-specific events for personalized history
 *
 * Adapted from the paper game's event timeline for digital play.
 */

import type { WorldEvent } from './types';

export const WORLD_EVENTS: WorldEvent[] = [
  // ===== SESSION 1: ANCIENT ERA (Turns 1-4) =====
  {
    turn: 1,
    year: -8500,
    yearLabel: '8500 BC',
    name: 'First Settlements',
    era: 'Ancient',
    description: 'Humanity takes its first steps toward civilization. Small bands of hunter-gatherers begin to settle near water sources, planting the seeds of empires yet to come.',
    globalEffects: [
      { type: 'modify_stat', stat: 'population', value: 3, message: 'Starting population established (3).' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Settle the Riverbank',
        description: 'Focus on fertile river lands for agriculture.',
        effects: [
          { type: 'modify_yield', stat: 'industry', value: 1, condition: 'river_civ', message: '+1 Production Income (river bonus).' },
          { type: 'modify_stat', stat: 'capacity', value: 1, message: '+1 Capacity from fertile land.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (flat riverbanks are hard to defend).' },
        ],
      },
      {
        id: 'B',
        label: 'Fortify the Hilltop',
        description: 'Choose defensible high ground for your settlement.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from high ground.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial from strategic position.' },
          { type: 'modify_stat', stat: 'capacity', value: -1, message: '-1 Capacity (rocky hilltops have poor farmland).' },
        ],
      },
      {
        id: 'C',
        label: 'Follow the Herds',
        description: 'Remain semi-nomadic, following animal migrations.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from hunting tradition.' },
          { type: 'modify_stat', stat: 'capacity', value: -1, message: '-1 Capacity (nomadic lifestyle).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'egypt', name: 'Gifts of the Nile', description: 'The Nile floods bring rich silt to your fields.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Egypt: +1 Production Income from Nile flooding.' }] },
      { civId: 'mesopotamia', name: 'Garden Between Two Rivers', description: 'The Tigris and Euphrates provide abundant resources.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Mesopotamia: +1 Production Income from twin rivers.' }] },
      { civId: 'china', name: 'Yellow River Basin', description: 'Rich loess soil along the Yellow River supports early farming.', effects: [{ type: 'modify_yield', stat: 'science', value: 1, message: 'China: +1 Science Yield from early innovations.' }] },
      { civId: 'ethiopia', name: 'Highland Terrace Farming', description: 'Ethiopia develops unique highland terracing for agriculture.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Ethiopia: +1 Production Income from terrace farming.' }] },
      { civId: 'korea', name: 'Peninsular Resources', description: 'The Korean peninsula offers rich coastal and mountain resources.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Korea: +2 Martial from peninsular geography.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 2,
    year: -4500,
    yearLabel: '4500 BC',
    name: 'Agricultural Revolution',
    era: 'Ancient',
    description: 'The discovery of farming transforms human society. Permanent settlements grow as people learn to cultivate crops and domesticate animals.',
    globalEffects: [
      { type: 'modify_yield', stat: 'industry', value: 1, message: 'All civilizations gain +1 Production Income from farming.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Focus on Farming',
        description: 'Invest heavily in agricultural techniques.',
        effects: [
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income.' },
          { type: 'modify_stat', stat: 'capacity', value: 1, message: '+1 Capacity from food surplus.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (farmers, not fighters).' },
        ],
      },
      {
        id: 'B',
        label: 'Focus on Herding',
        description: 'Domesticate animals for food and labor.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from mounted warriors.' },
          { type: 'modify_stat', stat: 'population', value: 1, message: '+1 Population growth.' },
          { type: 'modify_yield', stat: 'science', value: -1, message: '-1 Science Yield (nomadic life limits scholarship).' },
        ],
      },
      {
        id: 'C',
        label: 'Develop Pottery & Storage',
        description: 'Create vessels to store surplus grain.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from stored surplus.' },
          { type: 'modify_yield', stat: 'culture', value: 1, message: '+1 Culture Yield from craft traditions.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (resources spent on crafts, not walls).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'india', name: 'Mohenjo-Daro Foundations', description: 'Early urban planning along the Indus River.', effects: [{ type: 'modify_stat', stat: 'capacity', value: 2, message: 'India: +2 Capacity from urban planning.' }] },
      { civId: 'cush', name: 'Highland Farming', description: 'Kush develops unique highland agriculture.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Kush: +1 Production Income from highland farming.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 3,
    year: -2750,
    yearLabel: '2750 BC',
    name: 'Age of Walls',
    era: 'Ancient',
    description: 'As settlements grow wealthy, so does the need to protect them. Fortification techniques spread across the ancient world.',
    globalEffects: [
      { type: 'modify_stat', stat: 'martial', value: 1, message: 'All civilizations gain +1 Martial from basic fortifications.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Fortify Military',
        description: 'Invest in walls and watchtowers.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial this turn.' },
          { type: 'modify_stat', stat: 'productionPool', value: -2, message: '-2 Production Pool (wall construction is expensive).' },
        ],
      },
      {
        id: 'B',
        label: 'Expand Territory',
        description: 'Use the peace to grow your population.',
        effects: [
          { type: 'modify_stat', stat: 'population', value: 2, message: '+2 Population from expansion.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (spread too thin to defend).' },
        ],
      },
      {
        id: 'C',
        label: 'Develop Writing',
        description: 'Record-keeping advances government.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 3, message: '+3 Science Total from early writing.' },
          { type: 'modify_yield', stat: 'science', value: 1, message: '+1 Science Yield from literacy.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (scribes, not soldiers).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'china', name: 'Great Wall Tradition', description: 'China begins its legendary wall-building tradition.', effects: [{ type: 'set_flag', message: 'China: Walls cost 2 less Production.' }] },
      { civId: 'mesopotamia', name: 'Ziggurats Rise', description: 'Massive temple-towers dominate Mesopotamian cities.', effects: [{ type: 'modify_stat', stat: 'faith', value: 2, message: 'Mesopotamia: +2 Faith from Ziggurats.' }] },
      { civId: 'crete', name: 'Minoan Palaces', description: 'Crete begins constructing elaborate multi-story palaces at Knossos and Phaistos.', effects: [{ type: 'modify_stat', stat: 'culture', value: 2, message: 'Crete: +2 Culture Total from Minoan palace construction.' }, { type: 'modify_yield', stat: 'industry', value: 1, message: 'Crete: +1 Production Income from trade network.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 4,
    year: -2250,
    yearLabel: '2250 BC',
    name: 'The Great Flood',
    era: 'Ancient',
    description: 'Catastrophic flooding strikes river civilizations. Ancient texts across cultures record a devastating deluge that reshapes the world.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Rebuild Stronger',
        description: 'Focus resources on recovery and infrastructure.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool for rebuilding.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income from better construction.' },
        ],
      },
      {
        id: 'B',
        label: 'Raid the Weak',
        description: 'Exploit your neighbors flood-devastated stockpiles. Loot is easy when defenders are starving.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 4, message: '+4 Production Pool from raiding flood victims.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial (your warriors are battle-tested).' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture (your reputation suffers).' },
        ],
      },
      {
        id: 'C',
        label: 'Send Aid',
        description: 'Help neighboring civilizations recover. Build cultural prestige and lasting goodwill.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total from compassion and renown.' },
          { type: 'modify_stat', stat: 'faith', value: 2, message: '+2 Faith Total from righteous action.' },
          { type: 'modify_stat', stat: 'diplomacy', value: 1, message: '+1 Diplomacy (neighbors remember kindness).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'egypt', name: 'Nile Protection', description: 'Egypt\'s flood control systems limit damage.', effects: [{ type: 'lose_population', value: 1, message: 'Egypt: Lose only 1 Population (protected by flood control).' }] },
      { civId: 'mesopotamia', name: 'Severe Flooding', description: 'Without walls, the twin rivers devastate settlements.', effects: [{ type: 'lose_population', value: 3, condition: '!has_wall', message: 'Mesopotamia: -3 Population from severe flooding (walls protect).' }] },
      { civId: 'china', name: 'Yellow River Flooding', description: 'The Yellow River earns its reputation as "China\'s Sorrow."', effects: [{ type: 'lose_population', value: 2, condition: '!has_wall', message: 'China: -2 Population from Yellow River flooding.' }] },
    ],
    unlocks: [],
  },

  // ===== SESSION 2: BRONZE AGE (Turns 5-8) =====
  {
    turn: 5,
    year: -1850,
    yearLabel: '1850 BC',
    name: 'Bronze Age Dawns',
    era: 'Bronze',
    description: 'The mastery of bronze transforms warfare and trade. New weapons and tools reshape the balance of power across the ancient world.',
    globalEffects: [
      { type: 'set_flag', message: 'Bronze Age technologies now available.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Rush Bronze Weapons',
        description: 'Forge swords and spears from the new alloy.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from bronze weapons.' },
          { type: 'modify_stat', stat: 'productionPool', value: -2, message: '-2 Production Pool (weapons are costly to forge).' },
        ],
      },
      {
        id: 'B',
        label: 'Rush Bronze Tools',
        description: 'Create plows and chisels for construction.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from better tools.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (rivals arm while you plow).' },
        ],
      },
      {
        id: 'C',
        label: 'Trade Bronze Freely',
        description: 'Share the technology to build diplomatic ties.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from trade connections.' },
          { type: 'modify_stat', stat: 'productionPool', value: 2, message: '+2 Production Pool from trade profits.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (your neighbors now have bronze too).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'greece', name: 'Hoplite Tradition', description: 'Greek city-states develop citizen-soldier armies.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Greece: +2 Martial from hoplite tradition.' }] },
      { civId: 'anatolia', name: 'Iron-Rich Mountains', description: 'Anatolia\'s mountains hold precious metal deposits.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Anatolia: +1 Production Income from mountain mines.' }] },
      { civId: 'troy', name: 'Walls of Ilium', description: 'Troy builds legendary fortifications controlling the Hellespont.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Troy: +4 Martial from legendary walls.' }] },
      { civId: 'scythia', name: 'Horse Lords of the Steppe', description: 'Scythian riders master mounted archery on the open plains.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Scythia: +3 Martial from mounted archery.' }] },
      { civId: 'olmec', name: 'Colossal Heads', description: 'The Olmec create massive stone heads honoring their rulers.', effects: [{ type: 'modify_stat', stat: 'culture', value: 3, message: 'Olmec: +3 Culture Total from monumental art.' }] },
      { civId: 'crete', name: 'Minoan Thalassocracy', description: 'Crete dominates Aegean trade with painted pottery, bronze goods, and saffron.', effects: [{ type: 'modify_yield', stat: 'industry', value: 2, message: 'Crete: +2 Production Income from Aegean trade dominance.' }] },
    ],
    unlocks: ['bronze_age'],
  },
  {
    turn: 6,
    year: -1600,
    yearLabel: '1600 BC',
    name: 'Eruption of Thera',
    era: 'Bronze',
    description: 'The volcanic island of Thera erupts with catastrophic force, sending tsunamis across the Mediterranean and plunging the region into volcanic winter.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Pray to the Gods',
        description: 'Build a temple to appease divine wrath.',
        effects: [
          { type: 'gain_building', message: 'Gain one free Temple.' },
          { type: 'modify_stat', stat: 'faith', value: 2, message: '+2 Faith Total from devotion.' },
        ],
      },
      {
        id: 'B',
        label: 'Focus on Survival',
        description: 'Stockpile resources and prepare for hard times.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 4, message: '+4 Production Pool from emergency stockpiling.' },
        ],
      },
      {
        id: 'C',
        label: 'Exploit the Chaos',
        description: 'While others suffer, expand your influence.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from opportunistic expansion.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total from ruthlessness.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'crete', name: 'Minoan Catastrophe', description: 'Thera\'s eruption devastates Minoan civilization.', effects: [{ type: 'lose_population', value: 4, message: 'Crete: Catastrophic population loss from tsunami and ashfall.' }] },
      { civId: 'phoenicia', name: 'Tidal Waves', description: 'Tsunamis damage coastal Phoenician ports.', effects: [{ type: 'modify_yield', stat: 'industry', value: -1, message: 'Phoenicia: -1 Production Income for 2 turns from port damage.' }] },
      { civId: 'egypt', name: 'Sea Peoples Raid', description: 'Displaced peoples attack Egypt\'s coast.', effects: [{ type: 'modify_stat', stat: 'martial', value: -1, message: 'Egypt: -1 Martial from Sea Peoples raids.' }] },
    ],
    unlocks: ['temples'],
  },
  {
    turn: 7,
    year: -1300,
    yearLabel: '1300 BC',
    name: 'Age of Wonders',
    era: 'Bronze',
    description: 'Ancient civilizations reach new heights of ambition. Monumental construction projects begin across the known world, each a testament to human ingenuity.',
    globalEffects: [
      { type: 'set_flag', message: 'Ancient World Wonders now available for construction.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Begin Wonder Construction',
        description: 'Invest resources toward building a World Wonder.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 5, message: '+5 Production Pool for wonder investment.' },
          { type: 'modify_stat', stat: 'martial', value: -2, message: '-2 Martial (workers pulled from border patrol).' },
        ],
      },
      {
        id: 'B',
        label: 'Expand Trade Networks',
        description: 'Build roads and ports to connect with neighbors.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from trade.' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from cultural exchange.' },
          { type: 'modify_stat', stat: 'faith', value: -1, message: '-1 Faith Total (foreign ideas challenge traditions).' },
        ],
      },
      {
        id: 'C',
        label: 'Military Buildup',
        description: 'Prepare your armies while others build monuments.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from military preparations.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total (feared, not admired).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'egypt', name: 'Monument Builders', description: 'Egypt\'s wonder-building tradition activates.', effects: [{ type: 'modify_stat', stat: 'productionPool', value: 3, message: 'Egypt: +3 Production Pool (Monument Builders trait).' }] },
      { civId: 'troy', name: 'Walls of Ilium Completed', description: 'King Priam\'s Troy commands the Hellespont; its walls will stand against Achaean siege.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Troy: +2 Martial from legendary fortifications.' }, { type: 'modify_yield', stat: 'industry', value: 1, message: 'Troy: +1 Production Income from Hellespont tolls.' }] },
      { civId: 'olmec', name: 'San Lorenzo Flourishes', description: 'The Olmec carve colossal basalt heads portraying their rulers; writing and calendar systems emerge.', effects: [{ type: 'modify_stat', stat: 'culture', value: 3, message: 'Olmec: +3 Culture Total from monumental art.' }, { type: 'modify_yield', stat: 'science', value: 1, message: 'Olmec: +1 Science Yield from early calendar.' }] },
    ],
    unlocks: ['wonders_ancient'],
  },
  {
    turn: 8,
    year: -1200,
    yearLabel: '1200 BC',
    name: 'Bronze Age Collapse',
    era: 'Bronze',
    description: 'A cascade of disasters strikes: drought, famine, and invasions by "Sea Peoples." Trade networks shatter. Great empires fall. The ancient world enters a dark age.',
    globalEffects: [
      { type: 'special', message: 'All active trade routes destroyed. Instability spreads.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Fortify Against Raiders',
        description: 'Build walls and train militia to defend your people.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 4, message: '+4 Martial from fortifications.' },
        ],
      },
      {
        id: 'B',
        label: 'Become Raiders',
        description: 'If the world burns, take what you can from the ashes.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from raiding.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total from barbarism.' },
        ],
      },
      {
        id: 'C',
        label: 'Rebuild and Adapt',
        description: 'Focus on recovery and innovation during the crisis.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from rebuilding.' },
          { type: 'modify_stat', stat: 'science', value: 2, message: '+2 Science Total from crisis-driven innovation.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'israel', name: 'Seed of Abraham', description: 'In the chaos, a new faith tradition takes root.', effects: [{ type: 'modify_yield', stat: 'faith', value: 2, message: 'Israel: +2 Faith Yield from covenant tradition.' }] },
      { civId: 'phoenicia', name: 'Tyrian Purple', description: 'Phoenicia discovers the secret of purple dye.', effects: [{ type: 'modify_yield', stat: 'culture', value: 2, message: 'Phoenicia: +2 Culture Yield from purple dye trade.' }] },
      { civId: 'sparta', name: 'Spartan Discipline', description: 'Sparta\'s warrior traditions harden.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Sparta: +3 Martial from Agoge training.' }] },
      { civId: 'troy', name: 'Fall of Troy', description: 'After a long siege, Troy falls to Greek forces but its legacy endures.', effects: [{ type: 'modify_stat', stat: 'culture', value: 5, message: 'Troy: +5 Culture Total (legendary legacy).' }, { type: 'modify_stat', stat: 'martial', value: -2, message: 'Troy: -2 Martial from siege losses.' }] },
      { civId: 'gaul', name: 'Celtic Ironwork', description: 'Gallic smiths develop distinctive iron weapons and art.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Gaul: +2 Martial from superior ironwork.' }, { type: 'modify_stat', stat: 'culture', value: 1, message: 'Gaul: +1 Culture from La Tene art.' }] },
      { civId: 'khmer', name: 'Mekong Basin Settlement', description: 'Khmer settlements flourish along the Mekong River delta.', effects: [{ type: 'modify_stat', stat: 'capacity', value: 2, message: 'Khmer: +2 Capacity from rice paddy agriculture.' }] },
      { civId: 'anatolia', name: 'Hittite Empire Falls', description: 'The great Hittite capital Hattusa is destroyed; their iron-working knowledge scatters.', effects: [{ type: 'lose_population', value: 3, message: 'Anatolia: -3 Population from Hittite collapse.' }, { type: 'modify_yield', stat: 'science', value: 1, message: 'Anatolia: +1 Science Yield as iron-working spreads.' }] },
    ],
    unlocks: [],
  },

  // ===== SESSION 3: IRON AGE (Turns 9-12) =====
  {
    turn: 9,
    year: -1000,
    yearLabel: '1000 BC',
    name: 'Iron Age & Religions',
    era: 'Iron',
    description: 'Iron replaces bronze, democratizing warfare. Meanwhile, new religious traditions emerge that will shape human civilization for millennia.',
    globalEffects: [
      { type: 'set_flag', message: 'Religion founding now available (requires Faith Total >= 10 and a Temple).' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Forge Iron Weapons',
        description: 'Arm your people with the strongest metal known.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from iron weapons.' },
          { type: 'modify_stat', stat: 'faith', value: -1, message: '-1 Faith Total (war culture erodes spiritual life).' },
        ],
      },
      {
        id: 'B',
        label: 'Forge Iron Tools',
        description: 'Iron plows and hammers boost production.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from iron tools.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (neighbors forge weapons while you forge plows).' },
        ],
      },
      {
        id: 'C',
        label: 'Found a Religion',
        description: 'Channel the spiritual awakening of the age.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 3, message: '+3 Faith Total from spiritual awakening.' },
          { type: 'modify_yield', stat: 'faith', value: 1, message: '+1 Faith Yield.' },
          { type: 'modify_stat', stat: 'science', value: -2, message: '-2 Science Total (dogma resists new ideas).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'assyria', name: 'Elite Soldiers', description: 'Assyria fields the ancient world\'s most feared army.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Assyria: +4 Martial from elite soldiers.' }] },
      { civId: 'israel', name: 'Temple of Solomon', description: 'A magnificent temple rises in Jerusalem.', effects: [{ type: 'modify_stat', stat: 'faith', value: 5, message: 'Israel: +5 Faith Total from the Temple.' }] },
      { civId: 'india', name: 'Vedic Age Hymns', description: 'The Rig Veda is compiled; sacred hymns shape the Hindu tradition for millennia.', effects: [{ type: 'modify_yield', stat: 'faith', value: 3, message: 'India: +3 Faith Yield from Vedic tradition.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'India: +2 Culture Total from scripture.' }] },
    ],
    unlocks: ['religion', 'iron_age'],
  },
  {
    turn: 10,
    year: -825,
    yearLabel: '825 BC',
    name: 'Empires Rise',
    era: 'Iron',
    description: 'Great empires consolidate power across the known world. Borders harden, armies grow, and diplomacy becomes a tool of survival.',
    globalEffects: [
      { type: 'modify_stat', stat: 'productionPool', value: 2, message: 'All civilizations gain +2 Production Pool from expanding economies.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Imperial Expansion',
        description: 'Build up military strength and alliances.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total (empire building crushes local traditions).' },
        ],
      },
      {
        id: 'B',
        label: 'Cultural Golden Age',
        description: 'Invest in art, music, and religious traditions.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total.' },
          { type: 'modify_stat', stat: 'faith', value: 2, message: '+2 Faith Total.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (artists make poor soldiers).' },
        ],
      },
      {
        id: 'C',
        label: 'Scientific Academy',
        description: 'Found centers of learning and research.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 4, message: '+4 Science Total from academy.' },
          { type: 'modify_stat', stat: 'productionPool', value: -3, message: '-3 Production Pool (academies are expensive to build).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'phoenicia', name: 'The Alphabet Spreads', description: 'Phoenician writing revolutionizes communication.', effects: [{ type: 'modify_yield', stat: 'science', value: 2, message: 'Phoenicia: +2 Science Yield from alphabet invention.' }] },
      { civId: 'persia', name: 'Medes Unite', description: 'The Median confederation grows in power.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Persia: +2 Martial from Median alliance.' }] },
      { civId: 'assyria', name: 'Black Obelisk Campaigns', description: 'Shalmaneser III carves his victories in stone; tribute pours in from Israel, Tyre, and Damascus.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Assyria: +3 Martial from continuous campaigning.' }, { type: 'modify_yield', stat: 'industry', value: 1, message: 'Assyria: +1 Production Income from tribute.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 11,
    year: -670,
    yearLabel: '670 BC',
    name: 'Age of Conquest',
    era: 'Iron',
    description: 'The era of peaceful coexistence ends. Warfare between civilizations becomes a grim reality. Armies march, and borders are drawn in blood.',
    globalEffects: [
      { type: 'set_flag', message: 'WARFARE UNLOCKED: All civilizations may now use the Attack action.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'War Footing',
        description: 'Prepare your armies for the coming conflicts.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from military preparations.' },
          { type: 'modify_stat', stat: 'productionPool', value: -2, message: '-2 Production Pool (war mobilization is costly).' },
        ],
      },
      {
        id: 'B',
        label: 'Defensive Pact',
        description: 'Strengthen defenses and seek allies.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from fortifications.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total (fear replaces creativity).' },
        ],
      },
      {
        id: 'C',
        label: 'Refuse to Militarize',
        description: 'Continue peaceful development while others arm.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 3, message: '+3 Science Total from undisturbed research.' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from peaceful growth.' },
          { type: 'modify_stat', stat: 'martial', value: -2, message: '-2 Martial (dangerously undefended).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'germania', name: 'Contact with the South', description: 'Germanic tribes begin interacting with Mediterranean civilizations.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Germania: +2 Martial from new weapons.' }] },
      { civId: 'cush', name: 'Twenty-Fifth Dynasty', description: 'Cushite pharaoh Taharqa rules both Nubia and Egypt; the Kingdom of Kush reaches its zenith.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Cush: +3 Martial from double kingdom.' }, { type: 'modify_stat', stat: 'culture', value: 3, message: 'Cush: +3 Culture Total (rules two civilizations).' }] },
      { civId: 'scythia', name: 'Scythian Incursion', description: 'Scythian cavalry sweep into the Near East; Herodotus records 28 years of Scythian dominion.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Scythia: +3 Martial from Near-East raids.' }, { type: 'modify_yield', stat: 'industry', value: 1, message: 'Scythia: +1 Production Income from plunder.' }] },
    ],
    unlocks: ['warfare'],
  },
  {
    turn: 12,
    year: -560,
    yearLabel: '560 BC',
    name: 'Power Shifts',
    era: 'Iron',
    description: 'Ancient empires crumble as new powers rise. The wheel of history turns, and those who cannot adapt are swept aside.',
    globalEffects: [
      { type: 'modify_yield', stat: 'culture', value: 1, message: 'All civilizations gain +1 Culture Yield from the age of philosophy.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Seize the Moment',
        description: 'Attack a weakened neighbor while they decline.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial for aggressive expansion.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total (seen as a vulture by other civilizations).' },
        ],
      },
      {
        id: 'B',
        label: 'Show Compassion',
        description: 'Aid declining civilizations and gain cultural prestige.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total from compassion.' },
          { type: 'modify_stat', stat: 'productionPool', value: -3, message: '-3 Production Pool (aid is expensive).' },
        ],
      },
      {
        id: 'C',
        label: 'Focus Inward',
        description: 'Strengthen your own civilization while others struggle.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 4, message: '+4 Production Pool from internal development.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (isolationism weakens military readiness).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'assyria', name: 'Assyrian Decline', description: 'The once-mighty Assyrian Empire begins to crumble.', effects: [{ type: 'special', message: 'Assyria: All stats halved for 2 turns (Decline).' }] },
      { civId: 'mesopotamia', name: 'Nebuchadnezzar\'s Glory', description: 'Babylon reaches its cultural zenith.', effects: [{ type: 'modify_stat', stat: 'science', value: 3, message: 'Mesopotamia: +3 Science Total.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'Mesopotamia: +2 Culture Total.' }] },
    ],
    unlocks: [],
  },

  // ===== SESSION 4: CLASSICAL ERA (Turns 13-16) =====
  {
    turn: 13,
    year: -480,
    yearLabel: '480 BC',
    name: 'The Persian Wars',
    era: 'Classical',
    description: 'The Persian Empire launches a massive invasion of Greece. The fate of Western civilization hangs in the balance as outnumbered Greeks make their stand.',
    globalEffects: [
      { type: 'set_flag', message: 'Classical Wonders now available for construction.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Join Persia\'s Coalition',
        description: 'Ally with the world\'s mightiest empire.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from Persian alliance.' },
          { type: 'modify_stat', stat: 'productionPool', value: 2, message: '+2 Production Pool from Persian trade.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total (seen as a Persian puppet).' },
        ],
      },
      {
        id: 'B',
        label: 'Join the Greek Coalition',
        description: 'Stand with the defenders of freedom.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total from defending freedom.' },
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from Greek tactics.' },
          { type: 'lose_population', value: 1, message: '-1 Population (war casualties).' },
        ],
      },
      {
        id: 'C',
        label: 'Stay Neutral',
        description: 'Profit from the conflict without taking sides.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 4, message: '+4 Production Pool from war profiteering.' },
          { type: 'modify_stat', stat: 'faith', value: -1, message: '-1 Faith Total (cowardice demoralizes your people).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'sparta', name: 'Thermopylae', description: '300 Spartans hold the pass against the Persian horde.', effects: [{ type: 'modify_stat', stat: 'martial', value: 8, message: 'Sparta: +8 Martial this turn (Thermopylae).' }, { type: 'modify_stat', stat: 'culture', value: 5, message: 'Sparta: +5 Culture Total from legendary last stand.' }] },
      { civId: 'greece', name: 'Fleet of Salamis', description: 'Athens builds the fleet that will save Greece.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Greece: +4 Martial from naval superiority.' }] },
      { civId: 'persia', name: 'March of the Immortals', description: 'Persia\'s elite soldiers lead the invasion.', effects: [{ type: 'modify_stat', stat: 'martial', value: 5, message: 'Persia: +5 Martial for the invasion.' }] },
      { civId: 'anatolia', name: 'Ionian Revolt Aftermath', description: 'The Ionian Greek cities of Anatolia are recovering from their failed revolt against Persia.', effects: [{ type: 'lose_population', value: 1, message: 'Anatolia: -1 Population from Persian reprisals.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'Anatolia: +2 Culture Total as Ionian philosophy spreads.' }] },
    ],
    unlocks: ['wonders_classical'],
  },
  {
    turn: 14,
    year: -375,
    yearLabel: '375 BC',
    name: 'Hellenism Spreads',
    era: 'Classical',
    description: 'Greek culture radiates outward, transforming art, philosophy, and governance across the ancient world. To adopt or resist becomes each civilization\'s choice.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Adopt Hellenism',
        description: 'Embrace Greek philosophy, art, and democracy.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 3, message: '+3 Science Total from Greek learning.' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from Hellenistic art.' },
          { type: 'modify_stat', stat: 'faith', value: -1, message: '-1 Faith Total from secularism.' },
        ],
      },
      {
        id: 'B',
        label: 'Resist Foreign Influence',
        description: 'Preserve your own cultural identity.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 3, message: '+3 Faith Total from cultural preservation.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial from nationalist fervor.' },
        ],
      },
      {
        id: 'C',
        label: 'Selective Adoption',
        description: 'Take the best of Greek culture while keeping your traditions.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 2, message: '+2 Science Total.' },
          { type: 'modify_stat', stat: 'culture', value: 1, message: '+1 Culture Total.' },
          { type: 'modify_stat', stat: 'faith', value: 1, message: '+1 Faith Total.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'greece', name: 'Golden Age of Athens', description: 'Athens enters its most glorious period.', effects: [{ type: 'modify_stat', stat: 'culture', value: 4, message: 'Greece: +4 Culture Total (Golden Age).' }, { type: 'modify_stat', stat: 'science', value: 3, message: 'Greece: +3 Science Total.' }] },
      { civId: 'rome', name: 'Latin Culture Emerges', description: 'Rome begins to develop its own cultural identity.', effects: [{ type: 'modify_yield', stat: 'culture', value: 1, message: 'Rome: +1 Culture Yield.' }] },
      { civId: 'carthage', name: 'Western Mediterranean Power', description: 'Carthage dominates western Mediterranean trade.', effects: [{ type: 'modify_stat', stat: 'productionPool', value: 3, message: 'Carthage: +3 Production Pool from trade dominance.' }] },
      { civId: 'sparta', name: 'Spartan Hegemony', description: 'After victory in the Peloponnesian War, Sparta dominates Greece — briefly.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Sparta: +3 Martial from hegemony.' }, { type: 'modify_stat', stat: 'culture', value: -1, message: 'Sparta: -1 Culture (austerity remains unchanged).' }] },
    ],
    unlocks: [],
  },
  {
    turn: 15,
    year: -325,
    yearLabel: '325 BC',
    name: 'Alexander the Great',
    era: 'Classical',
    description: 'A young Macedonian king leads the largest military campaign the world has ever seen, shattering the Persian Empire and spreading Greek culture to India.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Submit Peacefully',
        description: 'Accept the conqueror and gain knowledge.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total from submission.' },
          { type: 'modify_stat', stat: 'science', value: 3, message: '+3 Science Total from Hellenistic learning.' },
        ],
      },
      {
        id: 'B',
        label: 'Resist the Conqueror',
        description: 'Fight to maintain independence.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from war mobilization.' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from national pride.' },
        ],
      },
      {
        id: 'C',
        label: 'Prepare While Others Fight',
        description: 'Use the distraction to strengthen your position.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial.' },
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'macedon', name: 'Alexander\'s Conquest', description: 'Alexander leads Macedonia to unprecedented glory.', effects: [{ type: 'modify_stat', stat: 'martial', value: 10, message: 'Macedonia: +10 Martial (Alexander\'s Conquest).' }, { type: 'modify_stat', stat: 'culture', value: 5, message: 'Macedonia: +5 Culture Total.' }] },
      { civId: 'persia', name: 'Fall of Persepolis', description: 'The Persian capital falls to Alexander.', effects: [{ type: 'modify_stat', stat: 'martial', value: -3, message: 'Persia: -3 Martial from defeat.' }, { type: 'modify_stat', stat: 'martial', value: -2, message: 'Persia: -2 Martial.' }] },
      { civId: 'india', name: 'Mauryan Foundation', description: 'Chandragupta Maurya unites India, halts Alexander\'s heirs, and begins the subcontinent\'s first empire.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'India: +3 Martial from unified empire.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'India: +2 Culture Total from Mauryan rise.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 16,
    year: -301,
    yearLabel: '301 BC',
    name: 'Successor Wars',
    era: 'Classical',
    description: 'Alexander dies without an heir. His generals tear the empire apart, each claiming a piece. The Hellenistic world fractures into warring successor states.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Claim Independence',
        description: 'Break free from Hellenistic control.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from liberation armies.' },
          { type: 'modify_stat', stat: 'culture', value: 1, message: '+1 Culture Total from national identity.' },
          { type: 'modify_stat', stat: 'science', value: -2, message: '-2 Science Total (cut off from Greek academies).' },
        ],
      },
      {
        id: 'B',
        label: 'Maintain Hellenistic Ties',
        description: 'Keep the benefits of Greek learning.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 3, message: '+3 Science Total from continued learning.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income from trade networks.' },
          { type: 'modify_stat', stat: 'faith', value: -2, message: '-2 Faith Total (your traditions fade under Greek influence).' },
        ],
      },
      {
        id: 'C',
        label: 'Religious Revival',
        description: 'Turn to traditional faiths for strength.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 4, message: '+4 Faith Total from spiritual renewal.' },
          { type: 'modify_stat', stat: 'science', value: -2, message: '-2 Science Total (zealotry resists philosophical inquiry).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'macedon', name: 'Death of Alexander', description: 'Macedonia loses its greatest leader and all conquest bonuses.', effects: [{ type: 'modify_stat', stat: 'martial', value: -8, message: 'Macedonia: -8 Martial (Alexander\'s bonuses lost).' }] },
      { civId: 'scythia', name: 'Scythian Gold', description: 'Scythian artisans craft legendary gold artifacts for their warrior kings.', effects: [{ type: 'modify_stat', stat: 'culture', value: 3, message: 'Scythia: +3 Culture Total from golden artwork.' }, { type: 'modify_stat', stat: 'productionPool', value: 2, message: 'Scythia: +2 Production Pool from gold trade.' }] },
      { civId: 'olmec', name: 'Jaguar Priests', description: 'Olmec religious practices deepen with jaguar worship rituals.', effects: [{ type: 'modify_stat', stat: 'faith', value: 4, message: 'Olmec: +4 Faith Total from jaguar cult.' }] },
      { civId: 'korea', name: 'Gojoseon Kingdom', description: 'The legendary Gojoseon kingdom unifies the Korean peninsula.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Korea: +2 Martial from unification.' }, { type: 'modify_yield', stat: 'science', value: 1, message: 'Korea: +1 Science Yield from early scholarship.' }] },
      { civId: 'khmer', name: 'Water Engineering', description: 'Khmer engineers develop advanced irrigation systems and water management.', effects: [{ type: 'modify_yield', stat: 'industry', value: 1, message: 'Khmer: +1 Production Income from irrigation.' }, { type: 'modify_stat', stat: 'capacity', value: 1, message: 'Khmer: +1 Capacity from water engineering.' }] },
      { civId: 'ethiopia', name: 'Kingdom of D\'mt', description: 'An early Ethiopian kingdom develops trade links with South Arabia.', effects: [{ type: 'modify_stat', stat: 'faith', value: 2, message: 'Ethiopia: +2 Faith Total from early temple traditions.' }, { type: 'modify_yield', stat: 'culture', value: 1, message: 'Ethiopia: +1 Culture Yield from cross-cultural exchange.' }] },
      { civId: 'gaul', name: 'Gallic Expansion', description: 'Celtic tribes push into Italia and the Balkans.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Gaul: +3 Martial from tribal confederation.' }] },
    ],
    unlocks: [],
  },

  // ===== SESSION 5: IMPERIAL ERA (Turns 17-20) =====
  {
    turn: 17,
    year: -270,
    yearLabel: '270 BC',
    name: 'Punic Wars Begin',
    era: 'Imperial',
    description: 'Rome and Carthage, the two greatest powers of the western Mediterranean, clash in a series of devastating wars that will determine the fate of an empire.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Support Rome',
        description: 'Back the disciplined Roman legions.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from Roman military doctrine.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total (Roman allies lose cultural autonomy).' },
        ],
      },
      {
        id: 'B',
        label: 'Support Carthage',
        description: 'Back Carthage\'s commercial empire.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from Carthaginian trade.' },
          { type: 'modify_stat', stat: 'culture', value: 1, message: '+1 Culture Total.' },
          { type: 'modify_stat', stat: 'martial', value: -1, message: '-1 Martial (Carthage demands troops for its war).' },
        ],
      },
      {
        id: 'C',
        label: 'Profit from War',
        description: 'Sell weapons and supplies to both sides.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 4, message: '+4 Production Pool from arms dealing.' },
          { type: 'modify_stat', stat: 'faith', value: -2, message: '-2 Faith Total (profiting from bloodshed shames your people).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'rome', name: 'Roman Legions March', description: 'Rome mobilizes its legendary legions.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Rome: +4 Martial from legion mobilization.' }] },
      { civId: 'carthage', name: 'War Elephants', description: 'Hannibal prepares his elephant army.', effects: [{ type: 'modify_stat', stat: 'martial', value: 5, message: 'Carthage: +5 Martial from war elephants.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 18,
    year: -220,
    yearLabel: '220 BC',
    name: 'Roman Expansion',
    era: 'Imperial',
    description: 'Rome\'s power grows relentlessly. Roman roads, law, and military engineering spread across the Mediterranean, transforming every land they touch.',
    globalEffects: [
      { type: 'modify_yield', stat: 'industry', value: 1, message: 'All civilizations gain +1 Production Income from Roman engineering spreading.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Ally with Rome',
        description: 'Gain protection, but at the cost of independence.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from Roman protection.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total from Romanization.' },
        ],
      },
      {
        id: 'B',
        label: 'Resist Rome',
        description: 'Fight for your independence.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from war mobilization.' },
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial from fortifications.' },
        ],
      },
      {
        id: 'C',
        label: 'Bribe for Peace',
        description: 'Pay Rome to leave you alone.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: -3, message: '-3 Production Pool (tribute paid).' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from peaceful development.' },
          { type: 'modify_stat', stat: 'science', value: 2, message: '+2 Science Total.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'carthage', name: 'Carthage\'s Last Stand', description: 'Carthage makes a desperate final defense.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Carthage: +3 Martial (last stand).' }, { type: 'modify_stat', stat: 'martial', value: 3, message: 'Carthage: +3 Martial.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 19,
    year: -145,
    yearLabel: '145 BC',
    name: 'Imperial Consolidation',
    era: 'Imperial',
    description: 'The great empires solidify their control. The strong grow stronger while the weak struggle to survive in an increasingly dangerous world.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Imperial Ambition',
        description: 'Expand your territory by force.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial for conquest.' },
          { type: 'lose_population', value: 1, message: '-1 Population (soldiers die on campaign).' },
        ],
      },
      {
        id: 'B',
        label: 'Consolidate Power',
        description: 'Strengthen what you already have.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 2, message: '+2 Martial.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total (authoritarian rule stifles creativity).' },
        ],
      },
      {
        id: 'C',
        label: 'Cultural Flowering',
        description: 'Invest in art, literature, and philosophy.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 4, message: '+4 Culture Total from cultural investment.' },
          { type: 'modify_stat', stat: 'martial', value: -2, message: '-2 Martial (decadence weakens military discipline).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'china', name: 'Silk Road Opens', description: 'China connects to the West via overland trade.', effects: [{ type: 'modify_stat', stat: 'productionPool', value: 4, message: 'China: +4 Production Pool from Silk Road.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'China: +2 Culture Total from cultural exchange.' }] },
      { civId: 'korea', name: 'Three Kingdoms of Korea', description: 'Goguryeo, Baekje, and Silla compete for dominance.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Korea: +2 Martial from military competition.' }, { type: 'modify_stat', stat: 'science', value: 2, message: 'Korea: +2 Science Total from scholarly tradition.' }] },
      { civId: 'khmer', name: 'Funan Kingdom', description: 'The Khmer-influenced Funan kingdom controls vital trade routes.', effects: [{ type: 'modify_stat', stat: 'productionPool', value: 3, message: 'Khmer: +3 Production Pool from maritime trade.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'Khmer: +2 Culture Total from Indianized culture.' }] },
      { civId: 'ethiopia', name: 'Rise of Aksum', description: 'The Kingdom of Aksum becomes a major trading power.', effects: [{ type: 'modify_stat', stat: 'productionPool', value: 3, message: 'Ethiopia: +3 Production Pool from Red Sea trade.' }, { type: 'modify_stat', stat: 'faith', value: 2, message: 'Ethiopia: +2 Faith Total from early Christianity.' }] },
      { civId: 'gaul', name: 'Vercingetorix\'s Stand', description: 'Gaul unites under a single chieftain against Roman invasion.', effects: [{ type: 'modify_stat', stat: 'martial', value: 2, message: 'Gaul: +2 Martial from tribal unity.' }, { type: 'modify_stat', stat: 'martial', value: 3, message: 'Gaul: +3 Martial from fortified positions.' }] },
      { civId: 'macedon', name: 'Fourth Macedonian War', description: 'Rome crushes the final Macedonian revolt and annexes Alexander\'s homeland as a Roman province.', effects: [{ type: 'lose_population', value: 3, message: 'Macedon: -3 Population from Roman conquest.' }, { type: 'modify_stat', stat: 'martial', value: -3, message: 'Macedon: -3 Martial (absorbed into Rome).' }] },
    ],
    unlocks: [],
  },
  {
    turn: 20,
    year: -74,
    yearLabel: '74 BC',
    name: 'Age of Heroes',
    era: 'Imperial',
    description: 'Great leaders emerge across the world. Name a historical leader for your civilization and receive their blessing as late-era Wonders become available.',
    globalEffects: [
      { type: 'set_flag', message: 'Late Wonders now available for construction.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Military Leader',
        description: 'A great general inspires your armies.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from military leadership.' },
          { type: 'modify_stat', stat: 'faith', value: -1, message: '-1 Faith Total (the general demands loyalty above piety).' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total (military culture consumes civic life).' },
        ],
      },
      {
        id: 'B',
        label: 'Cultural Patron',
        description: 'A visionary ruler invests in art and science.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total.' },
          { type: 'modify_stat', stat: 'science', value: 2, message: '+2 Science Total.' },
          { type: 'modify_stat', stat: 'martial', value: -2, message: '-2 Martial (the army grows soft without wars to fight).' },
        ],
      },
      {
        id: 'C',
        label: 'Religious Prophet',
        description: 'A holy figure inspires your people.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 3, message: '+3 Faith Total.' },
          { type: 'modify_stat', stat: 'culture', value: 1, message: '+1 Culture Total.' },
          { type: 'modify_stat', stat: 'science', value: -2, message: '-2 Science Total (the prophet condemns secular knowledge).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'israel', name: 'Maccabean Revolt', description: 'Israel fights for religious freedom.', effects: [{ type: 'modify_stat', stat: 'faith', value: 3, message: 'Israel: +3 Faith Total.' }, { type: 'modify_stat', stat: 'martial', value: 2, message: 'Israel: +2 Martial.' }] },
      { civId: 'germania', name: 'Warriors of the Rhine', description: 'Ariovistus and his Suebi harden their warrior culture as Roman legions approach Gaul.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Germania: +3 Martial from warrior tradition.' }, { type: 'modify_yield', stat: 'industry', value: 1, message: 'Germania: +1 Production Income from trade with Rome.' }] },
    ],
    unlocks: ['wonders_late'],
  },

  // ===== SESSION 6: LATE ERA (Turns 21-24) =====
  {
    turn: 21,
    year: -44,
    yearLabel: '44 BC',
    name: 'Civil War',
    era: 'Late',
    description: 'Internal strife tears empires apart. The most powerful civilization faces a devastating civil war as ambition clashes with tradition.',
    globalEffects: [],
    choices: [
      {
        id: 'A',
        label: 'Seize Power',
        description: 'Use the chaos to strengthen your own position.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial from power grab.' },
          { type: 'modify_stat', stat: 'culture', value: -1, message: '-1 Culture Total from tyranny.' },
        ],
      },
      {
        id: 'B',
        label: 'Preserve Institutions',
        description: 'Protect the rule of law and tradition.',
        effects: [
          { type: 'modify_stat', stat: 'culture', value: 3, message: '+3 Culture Total from institutional preservation.' },
          { type: 'modify_stat', stat: 'science', value: 2, message: '+2 Science Total.' },
        ],
      },
      {
        id: 'C',
        label: 'Reform Religion',
        description: 'Turn to faith to heal division.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 4, message: '+4 Faith Total from religious reform.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'egypt', name: 'Cleopatra\'s Reign', description: 'Egypt\'s last pharaoh uses diplomacy and charm.', effects: [{ type: 'modify_yield', stat: 'culture', value: 2, message: 'Egypt: +2 Culture Yield from Cleopatra.' }] },
      { civId: 'rome', name: 'Assassination of Caesar', description: 'Rome plunges into civil war.', effects: [{ type: 'modify_stat', stat: 'culture', value: -3, message: 'Rome: -3 Culture Total from civil war.' }, { type: 'modify_stat', stat: 'martial', value: 3, message: 'Rome: +3 Martial from militarization.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 22,
    year: 14,
    yearLabel: '14 AD',
    name: 'Imperial Zenith & Christianity',
    era: 'Late',
    description: 'Empires reach their greatest extent. Meanwhile, a new faith emerges from the Levant that will transform the world: Christianity spreads rapidly across trade routes.',
    globalEffects: [
      { type: 'special', message: 'Christianity emerges as a global religion option.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Adopt Christianity',
        description: 'Embrace the new faith and its message of hope.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 4, message: '+4 Faith Total from Christianity.' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from new traditions.' },
          { type: 'modify_stat', stat: 'science', value: -2, message: '-2 Science Total (pagan philosophers expelled).' },
        ],
      },
      {
        id: 'B',
        label: 'Strengthen Existing Religion',
        description: 'Double down on your traditional faith.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 4, message: '+4 Faith Total from religious fervor.' },
          { type: 'modify_stat', stat: 'martial', value: 1, message: '+1 Martial from zealotry.' },
          { type: 'modify_stat', stat: 'culture', value: -2, message: '-2 Culture Total (persecution of rival beliefs).' },
        ],
      },
      {
        id: 'C',
        label: 'Secular Focus',
        description: 'Invest in science and governance instead.',
        effects: [
          { type: 'modify_stat', stat: 'science', value: 4, message: '+4 Science Total.' },
          { type: 'modify_yield', stat: 'industry', value: 1, message: '+1 Production Income.' },
          { type: 'modify_stat', stat: 'faith', value: -3, message: '-3 Faith Total (the people feel spiritually abandoned).' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'rome', name: 'Pax Romana', description: 'The Roman Empire reaches its peak of power and stability.', effects: [{ type: 'modify_stat', stat: 'martial', value: 3, message: 'Rome: +3 Martial from Pax Romana stability.' }] },
      { civId: 'israel', name: 'Birth of Christianity', description: 'A new faith emerges from the land of Israel.', effects: [{ type: 'modify_stat', stat: 'faith', value: 5, message: 'Israel: +5 Faith Total (birthplace of Christianity).' }] },
      { civId: 'cush', name: 'Meroitic Kingdom', description: 'Kush\'s southern capital Meroe becomes an iron-smelting powerhouse trading with Rome and India.', effects: [{ type: 'modify_yield', stat: 'industry', value: 2, message: 'Cush: +2 Production Income from iron and ivory trade.' }, { type: 'modify_yield', stat: 'science', value: 1, message: 'Cush: +1 Science Yield from Meroitic script.' }] },
    ],
    unlocks: ['christianity'],
  },
  {
    turn: 23,
    year: 138,
    yearLabel: '138 AD',
    name: 'Plague and Crisis',
    era: 'Late',
    description: 'A devastating plague spreads along trade routes, killing millions. The more connected a civilization, the more it suffers. The ancient world begins to unravel.',
    globalEffects: [
      { type: 'lose_population', value: 1, message: 'All civilizations lose 1 Population from plague.' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Quarantine',
        description: 'Close borders and cut trade routes to stop the spread.',
        effects: [
          { type: 'special', message: 'All trade routes removed. Immune to further plague losses.' },
          { type: 'modify_yield', stat: 'industry', value: -1, message: '-1 Production Income from isolation.' },
        ],
      },
      {
        id: 'B',
        label: 'Keep Routes Open',
        description: 'Accept the risk to maintain economic connections.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: 3, message: '+3 Production Pool from continued trade.' },
          { type: 'lose_population', value: 1, message: '-1 additional Population from plague spread.' },
        ],
      },
      {
        id: 'C',
        label: 'Pray for Salvation',
        description: 'Turn to faith to survive the plague.',
        effects: [
          { type: 'modify_stat', stat: 'faith', value: 3, message: '+3 Faith Total from prayer.' },
          { type: 'lose_population', value: 1, message: '-1 additional Population.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'rome', name: 'Antonine Plague', description: 'Rome suffers catastrophic plague losses.', effects: [{ type: 'lose_population', value: 2, message: 'Rome: -2 additional Population from Antonine Plague.' }] },
      { civId: 'mesopotamia', name: 'Earthquake', description: 'A massive earthquake devastates Mesopotamia.', effects: [{ type: 'modify_stat', stat: 'martial', value: -2, message: 'Mesopotamia: -2 Martial from earthquake devastation.' }] },
    ],
    unlocks: [],
  },
  {
    turn: 24,
    year: 362,
    yearLabel: '362 AD',
    name: 'The Fall',
    era: 'Late',
    description: 'Barbarian hordes sweep across the known world. Every civilization faces an existential threat. How you respond to this final crisis determines your legacy.',
    globalEffects: [
      { type: 'special', message: 'ENDGAME: All civilizations face a Barbarian attack (Martial 15).' },
    ],
    choices: [
      {
        id: 'A',
        label: 'Fight the Barbarians',
        description: 'Stand your ground and defend your civilization.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 3, message: '+3 Martial for the final battle.' },
        ],
      },
      {
        id: 'B',
        label: 'Pay Tribute',
        description: 'Buy peace with your treasury.',
        effects: [
          { type: 'modify_stat', stat: 'productionPool', value: -5, message: '-5 Production Pool (tribute paid).' },
          { type: 'modify_stat', stat: 'culture', value: 2, message: '+2 Culture Total from preserved heritage.' },
        ],
      },
      {
        id: 'C',
        label: 'Adapt and Survive',
        description: 'Incorporate barbarian warriors into your army.',
        effects: [
          { type: 'modify_stat', stat: 'martial', value: 5, message: '+5 Martial from barbarian recruits.' },
          { type: 'modify_stat', stat: 'culture', value: -3, message: '-3 Culture Total from cultural dilution.' },
        ],
      },
    ],
    civSpecificEvents: [
      { civId: 'rome', name: 'Fall of Rome', description: 'The Eternal City faces its darkest hour. Barbarians batter the gates.', effects: [{ type: 'special', message: 'Rome: Must defend against TWO barbarian attacks.' }] },
      { civId: 'persia', name: 'Sassanid Revival', description: 'A new Persian dynasty rises to face the barbarian threat.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Persia: +4 Martial from Sassanid revival.' }] },
      { civId: 'germania', name: 'Great Migrations', description: 'Germanic tribes cross the frozen Rhine; Vandals, Goths, and Franks carve kingdoms from Rome\'s corpse.', effects: [{ type: 'modify_stat', stat: 'martial', value: 4, message: 'Germania: +4 Martial from migration-era warriors.' }, { type: 'modify_stat', stat: 'culture', value: 2, message: 'Germania: +2 Culture Total (successor kingdoms found a new age).' }] },
    ],
    unlocks: [],
  },
];
