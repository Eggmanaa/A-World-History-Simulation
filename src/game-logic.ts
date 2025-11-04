// Game Logic Functions
// Translated from Python simulation code

import type { Civilization, Trait } from './types'
import { calculateTerrainDefense, calculateTerrainIndustry } from './terrain-system'

// Apply trait modifiers to civilization stats
export function applyTraitModifiers(civ: Partial<Civilization>): Partial<Civilization> {
  const traits = (civ.traits || []).map(t => t.toLowerCase())
  
  if (traits.includes('industrious')) {
    civ.industry = (civ.industry || 0) * 2
    civ.industry_left = civ.industry
  }
  
  if (traits.includes('intelligence')) {
    civ.science = (civ.science || 0) * 2
  }
  
  if (traits.includes('beauty')) {
    civ.diplomacy = (civ.diplomacy || 0) + 1
  }
  
  if (traits.includes('strength')) {
    civ.martial = (civ.martial || 0) * 2
  }
  
  if (traits.includes('health')) {
    civ.fertility = (civ.fertility || 0) + 2
  }
  
  if (traits.includes('creativity')) {
    civ.culture = (civ.culture || 0) * 2
  }
  
  if (traits.includes('wisdom')) {
    civ.faith = (civ.faith || 0) * 2
  }
  
  return civ
}

// Saving throw system
export function savingThrow(dc: number, trait: string, civ: Civilization): boolean {
  const traitNorm = trait.toLowerCase()
  
  // Check if civ has the trait explicitly - auto-pass
  const hasExplicitTrait = (civ.traits || []).some(t => t.toLowerCase() === traitNorm)
  if (hasExplicitTrait) {
    return true
  }
  
  // Check bonus features
  const hasBonusFeature = (civ.bonus_features || []).some(
    bf => bf.toLowerCase().includes(traitNorm)
  )
  if (hasBonusFeature) {
    return true
  }
  
  // Map trait to stat and compare
  let stat = 0
  switch (traitNorm) {
    case 'health':
      stat = civ.fertility
      break
    case 'beauty':
      stat = civ.martial + civ.defense
      break
    case 'creativity':
      stat = civ.culture
      break
    case 'intelligence':
      stat = civ.science
      break
    case 'wisdom':
      stat = civ.faith
      break
    case 'strength':
      stat = civ.martial
      break
    case 'industrious':
      stat = civ.industry
      break
    default:
      stat = 0
  }
  
  return stat >= dc
}

// Check if civilization matches region
export function regionMatch(civ: Civilization, regionList?: string[]): boolean {
  if (!regionList || regionList.length === 0) {
    return true
  }
  
  const civRegions = (civ.regions || []).map(r => r.toLowerCase())
  return regionList.some(r => civRegions.includes(r.toLowerCase()))
}

// Apply cultural stage effects (growth phase bonus)
export function applyCulturalStageEffects(civ: Civilization, choice?: 'first' | 'second'): Civilization {
  const stage = civ.cultural_stage
  
  // If no choice provided, randomly select
  const useFirst = choice === 'first' || (choice === undefined && Math.random() < 0.5)
  
  switch (stage) {
    case 'barbarism':
      if (useFirst) {
        // +50% martial
        const add = Math.max(1, Math.floor(civ.martial / 2))
        civ.martial += add
      } else {
        // +50% fertility
        const add = Math.max(1, Math.floor(civ.fertility / 2))
        civ.fertility += add
      }
      break
      
    case 'classical':
      if (useFirst) {
        // +50% science
        const add = Math.max(1, Math.floor(civ.science / 2))
        civ.science += add
      } else {
        // +50% faith
        const add = Math.max(1, Math.floor(civ.faith / 2))
        civ.faith += add
      }
      break
      
    case 'imperial':
      if (useFirst) {
        // +50% industry
        const add = Math.max(1, Math.floor(civ.industry / 2))
        civ.industry += add
        civ.industry_left = civ.industry
      } else {
        // +50% martial
        const add = Math.max(1, Math.floor(civ.martial / 2))
        civ.martial += add
      }
      break
      
    case 'decline':
      // Halve all stats
      civ.fertility = Math.max(0, Math.floor(civ.fertility / 2))
      civ.martial = Math.max(0, Math.floor(civ.martial / 2))
      civ.defense = Math.max(0, Math.floor(civ.defense / 2))
      civ.faith = Math.max(0, Math.floor(civ.faith / 2))
      civ.industry = Math.max(0, Math.floor(civ.industry / 2))
      civ.science = Math.max(0, Math.floor(civ.science / 2))
      civ.culture = Math.max(0, Math.floor(civ.culture / 2))
      civ.population_capacity = Math.max(0, Math.floor(civ.population_capacity / 2))
      civ.diplomacy = Math.max(0, Math.floor(civ.diplomacy / 2))
      civ.locked_decline = true
      break
  }
  
  return civ
}

// Growth phase - calculate new population and stats
export function applyGrowthPhase(civ: Civilization, housesDoublePopulation: boolean = false): Civilization {
  // 1. Add fertility to houses (capped at capacity)
  const newHouses = Math.min(
    civ.houses + civ.fertility,
    civ.population_capacity
  )
  civ.houses = newHouses
  
  // 2. Update population based on year
  if (housesDoublePopulation) {
    civ.population = civ.houses * 2
  } else {
    civ.population = civ.houses
  }
  
  // 3. Calculate base stats from population
  // Industry = Population ÷ 5
  let baseIndustry = Math.floor(civ.population / 5)
  
  // Add terrain industry bonuses
  if (civ.terrain_data) {
    const terrainData = typeof civ.terrain_data === 'string' 
      ? JSON.parse(civ.terrain_data) 
      : civ.terrain_data
    const terrainIndustry = calculateTerrainIndustry(terrainData)
    baseIndustry += terrainIndustry
  }
  
  // Other base stats = Population ÷ 10
  const baseStats = Math.floor(civ.population / 10)
  
  // Apply base calculations (these are added to existing stats from traits/buildings)
  // Note: This preserves trait multipliers applied during setup
  civ.industry = Math.max(civ.industry, baseIndustry)
  civ.industry_left = civ.industry
  
  // Base stats for martial, defense, etc. are supplementary
  // The trait multipliers were already applied during civ creation
  
  // 4. Add building bonuses
  civ.faith += civ.temples * 2
  civ.culture += civ.amphitheaters * 3
  civ.defense += civ.walls * 1
  civ.defense += civ.archimedes_towers * 20
  
  return civ
}

// Calculate cost for building
export function getBuildingCost(building: string): number {
  switch (building.toLowerCase()) {
    case 'temple':
    case 'amphitheater':
    case 'wall':
      return 10
    case 'archimedes':
    case 'archimedes_tower':
      return 20
    default:
      return 0
  }
}

// Check if building can be built
export function canBuild(civ: Civilization, building: string): { can: boolean; reason?: string } {
  const cost = getBuildingCost(building)
  
  if (civ.industry_left < cost) {
    return { can: false, reason: `Not enough industry points. Need ${cost}, have ${civ.industry_left}` }
  }
  
  if (building.toLowerCase().includes('archimedes')) {
    if (civ.science < 30) {
      return { can: false, reason: 'Archimedes Tower requires Science >= 30' }
    }
  }
  
  return { can: true }
}

// War resolution
export function resolveWar(attacker: Civilization, defender: Civilization): {
  winner: Civilization
  loser: Civilization
  attackerTotal: number
  defenderTotal: number
} {
  const attackerTotal = attacker.martial
  
  // Calculate defender's terrain defense bonus
  let terrainDefense = 0
  if (defender.terrain_data) {
    const terrainData = typeof defender.terrain_data === 'string' 
      ? JSON.parse(defender.terrain_data) 
      : defender.terrain_data
    terrainDefense = calculateTerrainDefense(terrainData, defender.is_island || false)
  }
  
  const defenderTotal = defender.martial + defender.defense + terrainDefense
  
  if (attackerTotal > defenderTotal) {
    return {
      winner: attacker,
      loser: defender,
      attackerTotal,
      defenderTotal
    }
  } else {
    return {
      winner: defender,
      loser: attacker,
      attackerTotal,
      defenderTotal
    }
  }
}

// Get cultural stage progression
export function shouldAdvanceCulturalStage(civ: Civilization): boolean {
  // Advance based on culture stat thresholds
  switch (civ.cultural_stage) {
    case 'barbarism':
      return civ.culture >= 10
    case 'classical':
      return civ.culture >= 25
    case 'imperial':
      return civ.culture >= 50
    default:
      return false
  }
}

export function advanceCulturalStage(civ: Civilization): Civilization {
  switch (civ.cultural_stage) {
    case 'barbarism':
      civ.cultural_stage = 'classical'
      break
    case 'classical':
      civ.cultural_stage = 'imperial'
      break
    case 'imperial':
      // Stay at imperial unless forced to decline
      break
  }
  return civ
}
