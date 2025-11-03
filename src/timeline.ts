// Timeline events from 50,000 BCE to 362 CE
// Translated from Python TIMELINE array

import type { TimelineEvent } from './types'

export const TIMELINE: TimelineEvent[] = [
  {
    year: -50000,
    data: {
      growth: true,
      description: 'The Paleolithic Era - Early humans migrate across continents in small hunter-gatherer bands.'
    }
  },
  {
    year: -8500,
    data: {
      growth: true,
      description: 'Mesolithic Period - Climate warming allows population growth and sedentary settlements.'
    }
  },
  {
    year: -4500,
    data: {
      growth: true,
      egypt_industry_pct: 30,
      egypt_regions: ['egypt'],
      fertile_crescent_fertility: 2,
      fertile_crescent_regions: ['fertile crescent', 'mesopotamia'],
      cush_regions: ['cush'],
      description: 'Agricultural Revolution - The Nile provides fertile ground for Egypt. Mesopotamian civilization emerges.'
    }
  },
  {
    year: -2750,
    data: {
      growth: true,
      description: 'Early Bronze Age - Advanced tools and weapons spread across civilizations.'
    }
  },
  {
    year: -2250,
    data: {
      growth: true,
      india_capacity_plus: 5,
      china_wall_cost_halved: true,
      paektu: true,
      great_flood_regions: ['mesopotamia', 'fertile crescent'],
      barbarian_attack_regions: ['fertile crescent', 'anatolia', 'persia'],
      writing_apply: ['egypt', 'fertile crescent', 'india', 'china'],
      sickness_regions: ['egypt', 'fertile crescent', 'india', 'china'],
      description: 'Bronze Age - Writing systems emerge in Egypt, Mesopotamia. Great Flood legends. Mount Paektu erupts affecting China.'
    }
  },
  {
    year: -1850,
    data: {
      growth: true,
      greek_bonus_houses_martial: true,
      great_flood_china: true,
      great_flood_china_regions: ['china'],
      description: 'Middle Bronze Age - Greek civilization begins to flourish. China experiences devastating floods.'
    }
  },
  {
    year: -1600,
    data: {
      growth: true,
      thera_eruption_regions: ['crete', 'aegean'],
      thera_prompt_take_egypt: true,
      barbarian_attack_regions: ['india', 'persia', 'fertile crescent', 'egypt'],
      description: 'Thera Eruption - Massive volcanic eruption devastates Minoan Crete and the Aegean. Barbarian invasions.'
    }
  },
  {
    year: -1300,
    data: {
      growth: true,
      troy_wall_double: true,
      greek_culture_per_house: true,
      wonders_up: ['Great Wall', 'Colossus', 'Great Pyramids', 'Gates of Ishtar', 'Hanging Gardens'],
      trade_sickness_regions: ['egypt', 'mesopotamia', 'anatolia', 'greece', 'india', 'cush', 'germania'],
      writing_apply: ['fertile crescent', 'egypt', 'anatolia', 'greece', 'india', 'china'],
      bronze_age_regions: ['fertile crescent', 'china', 'india', 'greece', 'egypt', 'persia', 'phoenicia', 'israel', 'italia', 'gaul', 'anatolia'],
      description: 'Late Bronze Age - Great wonders constructed. Troy fortifies. Writing spreads. Trade networks flourish but bring disease.'
    }
  },
  {
    year: -1200,
    data: {
      growth: true,
      israel_bonus: true,
      phoenician_culture_plus: 5,
      spartans_bonus: true,
      barbarian_war_regions: ['greece', 'anatolia'],
      description: 'Bronze Age Collapse - Sea Peoples invade. Israel emerges. Phoenician traders dominate Mediterranean. Sparta founded.'
    }
  },
  {
    year: -1000,
    data: {
      growth: true,
      turks_entry: true,
      found_religions_allowed: true,
      iron_age_regions: ['greece', 'fertile crescent', 'persia', 'anatolia', 'india', 'china'],
      iron_age_plus: 3,
      description: 'Iron Age Begins - Iron working spreads. Religions can now be founded. Turkic peoples emerge in Central Asia.'
    }
  },
  {
    year: -825,
    data: {
      growth: true,
      assyria_bonus_regions: ['assyria', 'mesopotamia'],
      iron_age_regions: ['latins', 'china', 'india'],
      trade_sickness_regions: ['egypt', 'fertile crescent', 'teutons', 'persia', 'india', 'china', 'greece', 'celts', 'anatolia'],
      description: 'Neo-Assyrian Empire - Assyria dominates Mesopotamia with military might. Iron spreads to Latin tribes.'
    }
  },
  {
    year: -670,
    data: {
      growth: true,
      turk_prompt: true,
      huns_attack: true,
      playable_war_unlocked: true,
      description: 'Scythian Invasions - War declarations now allowed between civilizations. Steppe nomads threaten settled empires.'
    }
  },
  {
    year: -560,
    data: {
      growth: true,
      carthage_entry: true,
      assyrian_decline_trigger: true,
      description: 'Rise of Carthage - Phoenician colony becomes Mediterranean power. Assyrian Empire begins decline.'
    }
  },
  {
    year: -480,
    data: {
      growth: true,
      persian_bonus_regions: ['persia'],
      houses_support_two_population: true,
      description: 'Classical Period - Greece and Persia clash at Marathon and Thermopylae. Population centers grow (houses now support 2 population).'
    }
  },
  {
    year: -375,
    data: {
      growth: true,
      trade_sickness_regions: ['eurasia'],
      greek_latin_science_bonus: true,
      etna: true,
      meso_disaster: true,
      description: 'Philosophical Awakening - Greek philosophy flourishes. Mount Etna erupts. Mesoamerican civilizations face catastrophe.'
    }
  },
  {
    year: -325,
    data: {
      growth: true,
      alexandrian_bonuses: true,
      description: 'Alexander the Great - Macedonian conquest creates vast empire stretching from Greece to India.'
    }
  },
  {
    year: -301,
    data: {
      growth: true,
      remove_alexandrian: true,
      restore_conquered_on_325: true,
      description: 'Wars of the Diadochi - Alexander\'s empire fragments. Conquered territories regain independence.'
    }
  },
  {
    year: -270,
    data: {
      growth: true,
      roman_bonus_once: true,
      carthaginian_bonus: true,
      description: 'Rise of Rome - Roman Republic expands in Italy. Carthage controls North African trade.'
    }
  },
  {
    year: -220,
    data: {
      growth: true,
      description: 'Qin Dynasty - China unified under First Emperor. Great Wall construction accelerates.'
    }
  },
  {
    year: -192,
    data: {
      growth: true,
      barbarian_attack: true,
      description: 'Barbarian Migrations - Germanic and Celtic tribes pressure civilized borders.'
    }
  },
  {
    year: -145,
    data: {
      growth: true,
      barbarian_attack_turks: true,
      trade_sickness_regions: ['eurasia'],
      etna_again: true,
      description: 'Han Dynasty Expansion - China reaches greatest extent. Nomadic raids increase. Etna erupts again.'
    }
  },
  {
    year: -74,
    data: {
      growth: true,
      israel_independence: true,
      barbarian_attack_regions: ['china', 'rome'],
      description: 'Maccabean Revolt - Judea gains brief independence. Barbarians threaten Rome and China.'
    }
  },
  {
    year: -44,
    data: {
      growth: true,
      new_wonders: ['Colosseum', 'Walls of Justinian', 'Hagia Sophia', 'Hippodrome'],
      description: 'Julius Caesar Assassinated - Roman civil wars. New architectural wonders become possible.'
    }
  },
  {
    year: -14,
    data: {
      growth: true,
      christianity_to_israel_regions: ['israel'],
      description: 'Pax Romana - Augustus establishes Roman Empire. Christianity emerges in Judea.'
    }
  },
  {
    year: 67,
    data: {
      growth: true,
      vesuvius: true,
      description: 'Mount Vesuvius - Catastrophic eruption buries Pompeii and Herculaneum.'
    }
  },
  {
    year: 138,
    data: {
      growth: true,
      plague_roman: true,
      earthquake_regions: ['fertile crescent'],
      description: 'Antonine Plague - Devastating epidemic sweeps Roman Empire. Earthquakes strike Mesopotamia.'
    }
  },
  {
    year: 230,
    data: {
      growth: true,
      german_bonus: true,
      description: 'Crisis of Third Century - Germanic tribes raid deep into Roman territory.'
    }
  },
  {
    year: 300,
    data: {
      growth: true,
      roman_split: true,
      description: 'Diocletian Reforms - Roman Empire splits into Western and Eastern halves.'
    }
  },
  {
    year: 362,
    data: {
      growth: true,
      barbarian_attack_random_rome: true,
      description: 'End of Ancient Era - Barbarian invasions intensify. Roman Empire faces existential crisis.'
    }
  }
]

// Get event by index
export function getTimelineEvent(index: number): TimelineEvent | null {
  if (index < 0 || index >= TIMELINE.length) {
    return null
  }
  return TIMELINE[index]
}

// Get current year for display
export function formatYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`
  } else {
    return `${year} CE`
  }
}

// Calculate progress percentage
export function getTimelineProgress(index: number): number {
  return Math.round((index / (TIMELINE.length - 1)) * 100)
}
