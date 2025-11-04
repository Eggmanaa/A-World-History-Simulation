// Game Mechanics: Utility functions for wonders, bonuses, science, and religion

import { Civilization } from './types'
import { WONDERS, CULTURE_BUILDINGS, CULTURAL_BONUSES, WRITING_SYSTEMS, SCIENCE_EFFECTS, Wonder } from './game-data'

// Apply science level effects to civilization
export function applyScienceEffects(civ: Civilization): Civilization {
  const scienceLevel = civ.science
  let bonuses = {
    martial: 0,
    industry: 0,
    population_capacity: 0,
    faith: 0
  }
  
  for (const effect of SCIENCE_EFFECTS) {
    if (scienceLevel >= effect.level) {
      if (effect.ability1?.includes('+')) {
        const match = effect.ability1.match(/\+(\d+)\s+(\w+)/)
        if (match) {
          const value = parseInt(match[1])
          const stat = match[2].toLowerCase()
          if (stat === 'martial') bonuses.martial += value
          else if (stat === 'industry') bonuses.industry += value
          else if (stat === 'faith') bonuses.faith += value
          else if (stat.includes('capacity')) bonuses.population_capacity += value
        }
      }
      
      if (effect.ability2?.includes('+')) {
        const match = effect.ability2.match(/\+(\d+)\s+(\w+)/)
        if (match) {
          const value = parseInt(match[1])
          const stat = match[2].toLowerCase()
          if (stat === 'martial') bonuses.martial += value
          else if (stat === 'industry') bonuses.industry += value
        }
      }
    }
  }
  
  return {
    ...civ,
    martial: civ.martial + bonuses.martial,
    industry: civ.industry + bonuses.industry,
    population_capacity: civ.population_capacity + bonuses.population_capacity,
    faith: civ.faith + bonuses.faith
  }
}

// Apply cultural bonuses that unlock at specific years
export function getUnlockedBonuses(year: number, regions: string[]): string[] {
  const unlocked: string[] = []
  
  for (const bonus of CULTURAL_BONUSES) {
    if (year >= bonus.year) {
      // Check if civilization's regions match bonus cultures
      for (const region of regions) {
        if (bonus.cultures.includes(region)) {
          unlocked.push(bonus.id)
          break
        }
      }
    }
  }
  
  return unlocked
}

// Apply a cultural bonus to civilization
export function applyCulturalBonus(civ: Civilization, bonusId: string): Civilization {
  const bonus = CULTURAL_BONUSES.find(b => b.id === bonusId)
  if (!bonus) return civ
  
  let updated = { ...civ }
  
  // Apply effects
  if (bonus.effects.fertility) updated.fertility += bonus.effects.fertility
  if (bonus.effects.martial) updated.martial += bonus.effects.martial
  if (bonus.effects.defense) updated.defense += bonus.effects.defense
  if (bonus.effects.culture) updated.culture += bonus.effects.culture
  if (bonus.effects.faith) updated.faith += bonus.effects.faith
  if (bonus.effects.science) updated.science += bonus.effects.science
  if (bonus.effects.population_capacity) updated.population_capacity += bonus.effects.population_capacity
  
  // Store the bonus ID
  const currentBonuses = updated.cultural_bonuses ? JSON.parse(updated.cultural_bonuses as any) : []
  if (!currentBonuses.includes(bonusId)) {
    currentBonuses.push(bonusId)
    updated.cultural_bonuses = currentBonuses as any
  }
  
  return updated
}

// Get writing system for civilization
export function getWritingSystem(regions: string[]): any {
  for (const writing of WRITING_SYSTEMS) {
    if (writing.cultures) {
      for (const region of regions) {
        if (writing.cultures.includes(region)) {
          return writing
        }
      }
    }
  }
  return null
}

// Check if civilization can build a wonder
export function canBuildWonder(civ: Civilization, wonderId: string, builtWonders: string[]): { can: boolean, reason?: string } {
  const wonder = [...WONDERS, ...CULTURE_BUILDINGS].find(w => w.id === wonderId)
  if (!wonder) return { can: false, reason: 'Wonder not found' }
  
  // Check if unique wonder already built globally
  if (wonder.unique && builtWonders.includes(wonderId)) {
    return { can: false, reason: 'This wonder has already been built by another civilization' }
  }
  
  // Check culture-specific restrictions
  if (wonder.cultureSpecific) {
    const regions = civ.regions ? (typeof civ.regions === 'string' ? JSON.parse(civ.regions) : civ.regions) : []
    const hasMatchingCulture = wonder.cultureSpecific.some(culture => regions.includes(culture))
    if (!hasMatchingCulture) {
      return { can: false, reason: `Only ${wonder.cultureSpecific.join(', ')} can build this` }
    }
  }
  
  // Check science requirements
  if (wonder.requirements?.science && civ.science < wonder.requirements.science) {
    return { can: false, reason: `Requires Science ${wonder.requirements.science}` }
  }
  
  // Calculate cost (with Egyptian bonus)
  let cost = wonder.cost
  const regions = civ.regions ? (typeof civ.regions === 'string' ? JSON.parse(civ.regions) : civ.regions) : []
  if (regions.includes('Egypt')) {
    const bonuses = civ.cultural_bonuses ? (typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : civ.cultural_bonuses) : []
    if (bonuses.includes('monument_builders')) {
      cost = Math.floor(cost * 0.7) // 30% reduction
    }
  }
  
  // Check if has enough industry
  if (civ.industry_left < cost) {
    return { can: false, reason: `Not enough industry (need ${cost}, have ${civ.industry_left})` }
  }
  
  return { can: true }
}

// Apply wonder effects to civilization
export function applyWonderEffects(civ: Civilization, wonderId: string): Civilization {
  const wonder = [...WONDERS, ...CULTURE_BUILDINGS].find(w => w.id === wonderId)
  if (!wonder) return civ
  
  let updated = { ...civ }
  
  // Apply stat bonuses
  if (wonder.effects.population_capacity) updated.population_capacity += wonder.effects.population_capacity
  if (wonder.effects.martial) updated.martial += wonder.effects.martial
  if (wonder.effects.defense) updated.defense += wonder.effects.defense
  if (wonder.effects.culture) updated.culture += wonder.effects.culture
  if (wonder.effects.faith) updated.faith += wonder.effects.faith
  if (wonder.effects.science) updated.science += wonder.effects.science
  if (wonder.effects.industry) updated.industry += wonder.effects.industry
  if (wonder.effects.fertility) updated.fertility += wonder.effects.fertility
  
  // Special wonder flags
  if (wonderId === 'great_wall') updated.great_wall = true
  
  // Store wonder/building in appropriate array
  if (wonder.cultureSpecific) {
    const currentBuildings = updated.culture_buildings ? JSON.parse(updated.culture_buildings as any) : []
    currentBuildings.push(wonderId)
    updated.culture_buildings = currentBuildings as any
  } else {
    const currentWonders = updated.wonders ? JSON.parse(updated.wonders as any) : []
    currentWonders.push(wonderId)
    updated.wonders = currentWonders as any
  }
  
  return updated
}

// Calculate wonder cost with bonuses
export function getWonderCost(civ: Civilization, wonderId: string): number {
  const wonder = [...WONDERS, ...CULTURE_BUILDINGS].find(w => w.id === wonderId)
  if (!wonder) return 0
  
  let cost = wonder.cost
  
  // Egyptian monument builders bonus
  const regions = civ.regions ? (typeof civ.regions === 'string' ? JSON.parse(civ.regions) : civ.regions) : []
  if (regions.includes('Egypt')) {
    const bonuses = civ.cultural_bonuses ? (typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : civ.cultural_bonuses) : []
    if (bonuses.includes('monument_builders')) {
      cost = Math.floor(cost * 0.7)
    }
  }
  
  // Great Pyramids bonus for future wonders
  const wonders = civ.wonders ? (typeof civ.wonders === 'string' ? JSON.parse(civ.wonders) : civ.wonders) : []
  if (wonders.includes('great_pyramids') && wonderId !== 'great_pyramids') {
    cost = Math.max(1, cost - 20)
  }
  
  return cost
}

// Check if civilization can found a religion
export function canFoundReligion(civ: Civilization, allCivs: Civilization[]): { can: boolean, rank?: number, reason?: string } {
  // Sort by faith
  const sorted = [...allCivs].sort((a, b) => b.faith - a.faith)
  const rank = sorted.findIndex(c => c.id === civ.id) + 1
  
  // Top 3 can found
  if (rank > 3) {
    return { can: false, reason: 'Only the top 3 civilizations by faith can found religions' }
  }
  
  // Check if already founded
  if (civ.religion_name) {
    return { can: false, reason: 'You have already founded a religion' }
  }
  
  // Check year requirement (1000 BC)
  // This should be checked at the API level with simulation year
  
  return { can: true, rank }
}

// Get max tenets for civilization
export function getMaxTenets(civ: Civilization): number {
  const regions = civ.regions ? (typeof civ.regions === 'string' ? JSON.parse(civ.regions) : civ.regions) : []
  const bonuses = civ.cultural_bonuses ? (typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : civ.cultural_bonuses) : []
  
  // Israel can have 3 tenets
  if (regions.includes('Israel') && bonuses.includes('seed_abraham')) {
    return 3
  }
  
  return 2 // Default
}

// Apply religion tenet effects
export function applyTenetEffects(civ: Civilization, tenetIds: string[]): Civilization {
  let updated = { ...civ }
  
  for (const tenetId of tenetIds) {
    switch (tenetId) {
      case 'polytheism':
        updated.faith += civ.temples * 2
        break
      case 'holy_scriptures':
        updated.faith *= 2
        break
      case 'philosophy':
        updated.science += civ.faith
        break
      case 'pacifism':
        updated.population_capacity += 8
        break
      case 'medicine':
        updated.fertility += civ.faith
        break
      // Holy War, Monotheism, Syncretism, Astrology, Evangelism are applied during spread
    }
  }
  
  return updated
}

// Check if can spread religion
export function canSpreadReligion(founder: Civilization, target: Civilization): { can: boolean, reason?: string } {
  if (!founder.religion_name) {
    return { can: false, reason: 'You have not founded a religion' }
  }
  
  if (founder.faith <= target.faith) {
    return { can: false, reason: 'Target has higher or equal faith' }
  }
  
  // Check if target already has this religion
  // This would need religion_spread table check
  
  return { can: true }
}

// Calculate defensive score (for Israel Judges bonus)
export function calculateDefense(civ: Civilization): number {
  const bonuses = civ.cultural_bonuses ? (typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : civ.cultural_bonuses) : []
  
  // Israel Judges: (Martial × Faith) + Defense
  if (bonuses.includes('judges')) {
    return (civ.martial * civ.faith) + civ.defense
  }
  
  return civ.defense
}

// Calculate martial with bonuses
export function calculateMartial(civ: Civilization): number {
  let martial = civ.martial
  const bonuses = civ.cultural_bonuses ? (typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : civ.cultural_bonuses) : []
  
  // Spartan Spartiates: Martial × Culture
  if (bonuses.includes('spartiates')) {
    martial = civ.martial * civ.culture
  }
  
  // Greek Hoplites: +1 per house
  if (bonuses.includes('hoplites')) {
    martial += civ.houses
  }
  
  // Homeric Epics: +1 culture per house (affects Spartan multiplier)
  if (bonuses.includes('homeric_epics')) {
    const extraCulture = civ.houses
    if (bonuses.includes('spartiates')) {
      martial = civ.martial * (civ.culture + extraCulture)
    }
  }
  
  return martial
}

// Check achievements
export function checkAchievements(civ: Civilization): string[] {
  const earned: string[] = []
  const current = civ.achievements ? (typeof civ.achievements === 'string' ? JSON.parse(civ.achievements) : civ.achievements) : []
  
  // Glory to Rome: 10 conquests
  if (civ.maps_conquered >= 10 && !current.includes('glory_to_rome')) {
    earned.push('glory_to_rome')
  }
  
  // Scientific Achievement: Science level 30+
  if (civ.science >= 30 && !current.includes('scientific_achievement')) {
    earned.push('scientific_achievement')
  }
  
  // Economic Powerhouse: Industry 200+
  if (civ.industry >= 200 && !current.includes('economic_powerhouse')) {
    earned.push('economic_powerhouse')
  }
  
  // Military Supremacy: Martial 100+
  if (civ.martial >= 100 && !current.includes('military_supremacy')) {
    earned.push('military_supremacy')
  }
  
  // Religious Dominance: 5+ followers
  if (civ.religion_followers >= 5 && !current.includes('religious_dominance')) {
    earned.push('religious_dominance')
  }
  
  // Test of Time: Survived from start (checked at game end)
  // Cultural Victory: Highest culture (checked at game end)
  // Evangelist: Most followers (checked at game end)
  // Ozymandias: First defeated (set when conquered)
  
  return earned
}

// Check end-game achievements for all civilizations
export function checkEndGameAchievements(allCivs: Civilization[]): Map<string, string[]> {
  const achievementsMap = new Map<string, string[]>()
  
  // Cultural Victory: Highest culture
  const highestCulture = Math.max(...allCivs.map(c => c.culture))
  const culturalVictors = allCivs.filter(c => c.culture === highestCulture && !c.conquered)
  culturalVictors.forEach(civ => {
    const current = civ.achievements ? (typeof civ.achievements === 'string' ? JSON.parse(civ.achievements) : civ.achievements) : []
    if (!current.includes('cultural_victory')) {
      const earned = achievementsMap.get(civ.id) || []
      earned.push('cultural_victory')
      achievementsMap.set(civ.id, earned)
    }
  })
  
  // Evangelist: Most religious followers
  const religionFounded = allCivs.filter(c => c.religion_name && !c.conquered)
  if (religionFounded.length > 0) {
    const maxFollowers = Math.max(...religionFounded.map(c => c.religion_followers || 0))
    const evangelists = religionFounded.filter(c => (c.religion_followers || 0) === maxFollowers)
    evangelists.forEach(civ => {
      const current = civ.achievements ? (typeof civ.achievements === 'string' ? JSON.parse(civ.achievements) : civ.achievements) : []
      if (!current.includes('evangelist')) {
        const earned = achievementsMap.get(civ.id) || []
        earned.push('evangelist')
        achievementsMap.set(civ.id, earned)
      }
    })
  }
  
  return achievementsMap
}

// Get cultural stage multipliers
export function getCulturalStageMultiplier(stage: string): { stat: string, multiplier: number } | null {
  switch (stage) {
    case 'barbarism':
      return { stat: 'martial', multiplier: 1.5 } // or fertility
    case 'classical':
      return { stat: 'science', multiplier: 1.5 } // or faith
    case 'imperial':
      return { stat: 'industry', multiplier: 1.5 } // or martial
    case 'decline':
      return { stat: 'all', multiplier: 0.5 }
    default:
      return null
  }
}
