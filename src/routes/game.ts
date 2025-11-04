import { Hono } from 'hono'
import type { Bindings } from '../types'
import { generateId, parseCivilization } from '../db'
import { resolveWar, canBuild, getBuildingCost } from '../game-logic'

const game = new Hono<{ Bindings: Bindings }>()

// Declare war
game.post('/war/declare', async (c) => {
  try {
    const { attackerId, defenderId } = await c.req.json()
    
    if (!attackerId || !defenderId) {
      return c.json({ error: 'Attacker and defender required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get both civilizations
    const attacker = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(attackerId).first()
    
    const defender = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(defenderId).first()
    
    if (!attacker || !defender) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    const attackerCiv = parseCivilization(attacker)
    const defenderCiv = parseCivilization(defender)
    
    // Check if they're in the same simulation
    if (attackerCiv.simulation_id !== defenderCiv.simulation_id) {
      return c.json({ error: 'Civilizations not in same simulation' }, 400)
    }
    
    // Check if they're allied
    const alliance = await db.prepare(
      'SELECT id FROM alliances WHERE simulation_id = ? AND ((civ_id_1 = ? AND civ_id_2 = ?) OR (civ_id_1 = ? AND civ_id_2 = ?))'
    ).bind(attackerCiv.simulation_id, attackerId, defenderId, defenderId, attackerId).first()
    
    if (alliance) {
      return c.json({ error: 'Cannot declare war on ally' }, 400)
    }
    
    // Check if war is unlocked (after 670 BCE)
    const sim = await db.prepare(
      'SELECT current_year FROM simulations WHERE id = ?'
    ).bind(attackerCiv.simulation_id).first()
    
    if (sim && (sim.current_year as number) < -670) {
      return c.json({ error: 'War not yet unlocked (available after 670 BCE)' }, 400)
    }
    
    // Resolve war
    const result = resolveWar(attackerCiv, defenderCiv)
    
    // Record war
    const warId = generateId()
    const now = Date.now()
    await db.prepare(
      'INSERT INTO wars (id, simulation_id, attacker_id, defender_id, attacker_martial, defender_total, winner_id, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      warId, attackerCiv.simulation_id, attackerId, defenderId,
      result.attackerTotal, result.defenderTotal, result.winner.id,
      sim?.current_year || -670, now
    ).run()
    
    // === PHASE 3: ACHIEVEMENT TRACKING ===
    
    // If attacker won, increment their conquest count
    if (result.winner.id === attackerId) {
      const newMapsConquered = (attackerCiv.maps_conquered || 0) + 1
      await db.prepare(
        'UPDATE civilizations SET maps_conquered = ?, updated_at = ? WHERE id = ?'
      ).bind(newMapsConquered, now, attackerId).run()
      
      // Check for "Glory to Rome" achievement (10 conquests)
      if (newMapsConquered >= 10) {
        const achievements = attackerCiv.achievements ? 
          (typeof attackerCiv.achievements === 'string' ? JSON.parse(attackerCiv.achievements) : attackerCiv.achievements) : []
        
        if (!achievements.includes('glory_to_rome')) {
          achievements.push('glory_to_rome')
          
          // Award achievement
          const achievementId = generateId()
          await db.prepare(
            'INSERT INTO achievements (id, civ_id, achievement_id, achievement_name, earned_at, year_earned) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(
            achievementId, attackerId, 'glory_to_rome', 'Glory to Rome',
            now, sim?.current_year || -670
          ).run()
          
          // Update civilization
          await db.prepare(
            'UPDATE civilizations SET achievements = ?, updated_at = ? WHERE id = ?'
          ).bind(JSON.stringify(achievements), now, attackerId).run()
        }
      }
    }
    
    // If defender won, increment their battles_survived count
    if (result.winner.id === defenderId) {
      const newBattlesSurvived = (defenderCiv.battles_survived || 0) + 1
      await db.prepare(
        'UPDATE civilizations SET battles_survived = ?, updated_at = ? WHERE id = ?'
      ).bind(newBattlesSurvived, now, defenderId).run()
      
      // Check for "Test of Time" achievement (20 battles survived)
      if (newBattlesSurvived >= 20) {
        const achievements = defenderCiv.achievements ? 
          (typeof defenderCiv.achievements === 'string' ? JSON.parse(defenderCiv.achievements) : defenderCiv.achievements) : []
        
        if (!achievements.includes('test_of_time')) {
          achievements.push('test_of_time')
          
          // Award achievement
          const achievementId = generateId()
          await db.prepare(
            'INSERT INTO achievements (id, civ_id, achievement_id, achievement_name, earned_at, year_earned) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(
            achievementId, defenderId, 'test_of_time', 'Test of Time',
            now, sim?.current_year || -670
          ).run()
          
          // Update civilization
          await db.prepare(
            'UPDATE civilizations SET achievements = ?, updated_at = ? WHERE id = ?'
          ).bind(JSON.stringify(achievements), now, defenderId).run()
        }
      }
    }
    
    // If there's a loser, mark as conquered and check for "Ozymandias" achievement
    if (result.loser) {
      // Check if this is the first civilization to be defeated in this simulation
      const firstDefeated = await db.prepare(
        'SELECT COUNT(*) as count FROM civilizations WHERE simulation_id = ? AND conquered = TRUE'
      ).bind(attackerCiv.simulation_id).first()
      
      const isFirst = (firstDefeated?.count as number || 0) === 0
      
      await db.prepare(
        'UPDATE civilizations SET conquered = TRUE, updated_at = ? WHERE id = ?'
      ).bind(now, result.loser.id).run()
      
      // Award "Ozymandias" to first defeated civilization
      if (isFirst) {
        const achievements = result.loser.id === attackerId ? 
          (attackerCiv.achievements ? (typeof attackerCiv.achievements === 'string' ? JSON.parse(attackerCiv.achievements) : attackerCiv.achievements) : []) :
          (defenderCiv.achievements ? (typeof defenderCiv.achievements === 'string' ? JSON.parse(defenderCiv.achievements) : defenderCiv.achievements) : [])
        
        if (!achievements.includes('ozymandias')) {
          achievements.push('ozymandias')
          
          // Award achievement
          const achievementId = generateId()
          await db.prepare(
            'INSERT INTO achievements (id, civ_id, achievement_id, achievement_name, earned_at, year_earned) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(
            achievementId, result.loser.id, 'ozymandias', 'Ozymandias',
            now, sim?.current_year || -670
          ).run()
          
          // Update civilization
          await db.prepare(
            'UPDATE civilizations SET achievements = ?, updated_at = ? WHERE id = ?'
          ).bind(JSON.stringify(achievements), now, result.loser.id).run()
        }
      }
    }
    
    // Log event
    const eventId = generateId()
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, affected_civ_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      eventId, attackerCiv.simulation_id, sim?.current_year || -670,
      'war', JSON.stringify(result), JSON.stringify([attackerId, defenderId]), now
    ).run()
    
    return c.json({
      success: true,
      result: {
        winner: result.winner.name,
        winner_id: result.winner.id,
        loser: result.loser.name,
        loser_id: result.loser.id,
        attacker_total: result.attackerTotal,
        defender_total: result.defenderTotal
      }
    })
  } catch (error) {
    console.error('Declare war error:', error)
    return c.json({ error: 'Failed to declare war' }, 500)
  }
})

// Form alliance
game.post('/alliance/create', async (c) => {
  try {
    const { civ1Id, civ2Id } = await c.req.json()
    
    if (!civ1Id || !civ2Id) {
      return c.json({ error: 'Both civilizations required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get both civilizations
    const civ1 = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civ1Id).first()
    
    const civ2 = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civ2Id).first()
    
    if (!civ1 || !civ2) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    const civ1Data = parseCivilization(civ1)
    const civ2Data = parseCivilization(civ2)
    
    // Check if they're in the same simulation
    if (civ1Data.simulation_id !== civ2Data.simulation_id) {
      return c.json({ error: 'Civilizations not in same simulation' }, 400)
    }
    
    // Check diplomacy requirements (at least 1 diplomacy for both)
    if (civ1Data.diplomacy < 1 || civ2Data.diplomacy < 1) {
      return c.json({ error: 'Both civilizations need Diplomacy >= 1 to form alliances' }, 400)
    }
    
    // Check if alliance already exists
    const existing = await db.prepare(
      'SELECT id FROM alliances WHERE simulation_id = ? AND ((civ_id_1 = ? AND civ_id_2 = ?) OR (civ_id_1 = ? AND civ_id_2 = ?))'
    ).bind(civ1Data.simulation_id, civ1Id, civ2Id, civ2Id, civ1Id).first()
    
    if (existing) {
      return c.json({ error: 'Alliance already exists' }, 400)
    }
    
    // Create alliance
    const allianceId = generateId()
    const now = Date.now()
    await db.prepare(
      'INSERT INTO alliances (id, simulation_id, civ_id_1, civ_id_2, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(allianceId, civ1Data.simulation_id, civ1Id, civ2Id, now).run()
    
    // Log event
    const eventId = generateId()
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, affected_civ_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      eventId, civ1Data.simulation_id, -1000, // Placeholder year
      'alliance', JSON.stringify({ civ1: civ1Data.name, civ2: civ2Data.name }),
      JSON.stringify([civ1Id, civ2Id]), now
    ).run()
    
    return c.json({
      success: true,
      alliance: {
        id: allianceId,
        civ1: civ1Data.name,
        civ2: civ2Data.name
      }
    })
  } catch (error) {
    console.error('Create alliance error:', error)
    return c.json({ error: 'Failed to create alliance' }, 500)
  }
})

// Build structure
game.post('/build', async (c) => {
  try {
    const { civId, building } = await c.req.json()
    
    if (!civId || !building) {
      return c.json({ error: 'Civilization ID and building type required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get civilization
    const civ = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    if (!civ) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    const civData = parseCivilization(civ)
    
    // Check if can build
    const check = canBuild(civData, building)
    if (!check.can) {
      return c.json({ error: check.reason }, 400)
    }
    
    const cost = getBuildingCost(building)
    
    // Update civilization based on building type
    const now = Date.now()
    const buildingType = building.toLowerCase()
    
    if (buildingType === 'house') {
      await db.prepare(`
        UPDATE civilizations 
        SET houses = houses + 1,
            population_capacity = population_capacity + 5,
            industry_left = industry_left - ?,
            updated_at = ?
        WHERE id = ?
      `).bind(cost, now, civId).run()
    } else if (buildingType === 'temple') {
      await db.prepare(`
        UPDATE civilizations 
        SET temples = temples + 1, 
            faith = faith + 2,
            industry_left = industry_left - ?,
            updated_at = ?
        WHERE id = ?
      `).bind(cost, now, civId).run()
    } else if (buildingType === 'amphitheater') {
      await db.prepare(`
        UPDATE civilizations 
        SET amphitheaters = amphitheaters + 1,
            temples = temples + 1,
            culture = culture + 3,
            faith = CASE WHEN faith > 0 THEN faith - 1 ELSE 0 END,
            industry_left = industry_left - ?,
            updated_at = ?
        WHERE id = ?
      `).bind(cost, now, civId).run()
    } else if (buildingType === 'wall') {
      await db.prepare(`
        UPDATE civilizations 
        SET walls = walls + 1,
            defense = defense + 1,
            industry_left = industry_left - ?,
            updated_at = ?
        WHERE id = ?
      `).bind(cost, now, civId).run()
    } else if (buildingType.includes('archimedes')) {
      await db.prepare(`
        UPDATE civilizations 
        SET archimedes_towers = archimedes_towers + 1,
            defense = defense + 20,
            industry_left = industry_left - ?,
            updated_at = ?
        WHERE id = ?
      `).bind(cost, now, civId).run()
    } else {
      return c.json({ error: 'Unknown building type' }, 400)
    }
    
    // Get updated civilization
    const updated = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: updated ? parseCivilization(updated) : null,
      building_built: building
    })
  } catch (error) {
    console.error('Build error:', error)
    return c.json({ error: 'Failed to build' }, 500)
  }
})

// Found religion
game.post('/religion/found', async (c) => {
  try {
    const { civId, religionName, tenants } = await c.req.json()
    
    if (!civId || !religionName || !tenants || !Array.isArray(tenants)) {
      return c.json({ error: 'Civilization ID, religion name, and tenants required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get civilization
    const civ = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    if (!civ) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    const civData = parseCivilization(civ)
    
    // Check if simulation has reached 1000 BCE
    const sim = await db.prepare(
      'SELECT current_year FROM simulations WHERE id = ?'
    ).bind(civData.simulation_id).first()
    
    if (sim && (sim.current_year as number) < -1000) {
      return c.json({ error: 'Religions cannot be founded yet (available after 1000 BCE)' }, 400)
    }
    
    // Check if already has religion
    if (civData.religion_name) {
      return c.json({ error: 'Already has a religion' }, 400)
    }
    
    // Limit tenants (2 normally, 3 if Israel bonus)
    const maxTenants = civData.israel_bonus ? 3 : 2
    if (tenants.length > maxTenants) {
      return c.json({ error: `Maximum ${maxTenants} tenants allowed` }, 400)
    }
    
    // Found religion
    const now = Date.now()
    await db.prepare(`
      UPDATE civilizations 
      SET religion_name = ?,
          religion_tenants = ?,
          faith = faith + 5,
          updated_at = ?
      WHERE id = ?
    `).bind(religionName, JSON.stringify(tenants), now, civId).run()
    
    // Get updated civilization
    const updated = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: updated ? parseCivilization(updated) : null
    })
  } catch (error) {
    console.error('Found religion error:', error)
    return c.json({ error: 'Failed to found religion' }, 500)
  }
})

// Get available religious tenants
game.get('/religion/tenants', async (c) => {
  // List of available religious tenants
  const tenants = [
    { id: 'monotheism', name: 'Monotheism', effect: 'Replaces all other tenants when accepted' },
    { id: 'polytheism', name: 'Polytheism', effect: '+2 Faith per turn' },
    { id: 'ancestor_worship', name: 'Ancestor Worship', effect: '+1 Culture per temple' },
    { id: 'divine_right', name: 'Divine Right', effect: '+10% Martial' },
    { id: 'holy_war', name: 'Holy War', effect: '+2 Martial in wars against non-believers' },
    { id: 'religious_tolerance', name: 'Religious Tolerance', effect: '+1 Diplomacy' },
    { id: 'monasticism', name: 'Monasticism', effect: '+1 Science per temple' },
    { id: 'pilgrimage', name: 'Pilgrimage', effect: '+1 Faith per 5 population' }
  ]
  
  return c.json({
    success: true,
    tenants
  })
})

export default game
