import { Hono } from 'hono'
import type { Bindings } from '../types'
import { generateId, parseCivilization } from '../db'
import { canFoundReligion, getMaxTenets, applyTenetEffects, canSpreadReligion } from '../game-mechanics'
import { RELIGION_TENETS } from '../game-data'

const religion = new Hono<{ Bindings: Bindings }>()

// Get all available tenets
religion.get('/tenets', async (c) => {
  return c.json({
    success: true,
    tenets: RELIGION_TENETS
  })
})

// Get faith leaderboard for simulation
religion.get('/leaderboard/:simId', async (c) => {
  try {
    const simId = c.req.param('simId')
    const db = c.env.DB
    
    // Get all civilizations in simulation
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ? ORDER BY faith DESC'
    ).bind(simId).all()
    
    const leaderboard = (civs.results || []).map((civ, index) => {
      const parsed = parseCivilization(civ)
      return {
        rank: index + 1,
        civId: parsed.id,
        civName: parsed.name,
        color: parsed.color,
        faith: parsed.faith,
        religionName: parsed.religion_name,
        canFound: index < 3 && !parsed.religion_name
      }
    })
    
    return c.json({
      success: true,
      leaderboard
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return c.json({ error: 'Failed to get leaderboard' }, 500)
  }
})

// Found a religion
religion.post('/found', async (c) => {
  try {
    const { civId, religionName, tenetIds } = await c.req.json()
    
    if (!civId || !religionName || !tenetIds || !Array.isArray(tenetIds)) {
      return c.json({ error: 'Civilization ID, religion name, and tenets required' }, 400)
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
      return c.json({ error: 'You have already founded a religion' }, 400)
    }
    
    // Get all civilizations to check rank
    const allCivs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ?'
    ).bind(civData.simulation_id).all()
    
    const parsed = (allCivs.results || []).map(c => parseCivilization(c))
    const check = canFoundReligion(civData, parsed)
    
    if (!check.can) {
      return c.json({ error: check.reason }, 400)
    }
    
    // Check tenet count
    const maxTenets = getMaxTenets(civData)
    if (tenetIds.length > maxTenets) {
      return c.json({ error: `Maximum ${maxTenets} tenets allowed` }, 400)
    }
    
    // Check for duplicate tenets in simulation
    const usedTenets: string[] = []
    for (const c of parsed) {
      if (c.religion_tenants) {
        const tenants = typeof c.religion_tenants === 'string' ? JSON.parse(c.religion_tenants) : c.religion_tenants
        usedTenets.push(...tenants)
      }
    }
    
    for (const tenetId of tenetIds) {
      if (usedTenets.includes(tenetId)) {
        const tenet = RELIGION_TENETS.find(t => t.id === tenetId)
        return c.json({ error: `Tenet "${tenet?.name}" is already taken by another religion` }, 400)
      }
    }
    
    // Apply tenet effects
    const updated = applyTenetEffects(civData, tenetIds)
    
    // Found religion
    const now = Date.now()
    await db.prepare(`
      UPDATE civilizations 
      SET religion_name = ?,
          religion_tenants = ?,
          faith = ?,
          science = ?,
          population_capacity = ?,
          fertility = ?,
          religion_followers = 1,
          updated_at = ?
      WHERE id = ?
    `).bind(
      religionName,
      JSON.stringify(tenetIds),
      updated.faith,
      updated.science,
      updated.population_capacity,
      updated.fertility,
      now,
      civId
    ).run()
    
    // Log event
    const eventId = generateId()
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, affected_civ_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      eventId,
      civData.simulation_id,
      sim?.current_year || -1000,
      'religion_founded',
      JSON.stringify({ religionName, civName: civData.name, tenetIds }),
      JSON.stringify([civId]),
      now
    ).run()
    
    // Get updated civilization
    const updatedCiv = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: updatedCiv ? parseCivilization(updatedCiv) : null
    })
  } catch (error) {
    console.error('Found religion error:', error)
    return c.json({ error: 'Failed to found religion' }, 500)
  }
})

// Spread religion to another civilization
religion.post('/spread', async (c) => {
  try {
    const { founderId, targetId } = await c.req.json()
    
    if (!founderId || !targetId) {
      return c.json({ error: 'Founder and target civilization IDs required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get both civilizations
    const founder = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(founderId).first()
    
    const target = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(targetId).first()
    
    if (!founder || !target) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    const founderData = parseCivilization(founder)
    const targetData = parseCivilization(target)
    
    // Check if can spread
    const check = canSpreadReligion(founderData, targetData)
    if (!check.can) {
      return c.json({ error: check.reason }, 400)
    }
    
    // Check if already spread to this civ
    const existing = await db.prepare(
      'SELECT id FROM religion_spread WHERE founder_civ_id = ? AND follower_civ_id = ?'
    ).bind(founderId, targetId).first()
    
    if (existing) {
      return c.json({ error: 'Religion already spread to this civilization' }, 400)
    }
    
    // Spread religion
    const spreadId = generateId()
    const now = Date.now()
    
    await db.prepare(
      'INSERT INTO religion_spread (id, simulation_id, religion_name, founder_civ_id, follower_civ_id, spread_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      spreadId,
      founderData.simulation_id,
      founderData.religion_name,
      founderId,
      targetId,
      now
    ).run()
    
    // Update follower count
    await db.prepare(
      'UPDATE civilizations SET religion_followers = religion_followers + 1 WHERE id = ?'
    ).bind(founderId).run()
    
    // Get simulation year for log
    const sim = await db.prepare(
      'SELECT current_year FROM simulations WHERE id = ?'
    ).bind(founderData.simulation_id).first()
    
    // Log event
    const eventId = generateId()
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, affected_civ_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      eventId,
      founderData.simulation_id,
      sim?.current_year || 0,
      'religion_spread',
      JSON.stringify({ 
        religionName: founderData.religion_name, 
        from: founderData.name, 
        to: targetData.name 
      }),
      JSON.stringify([founderId, targetId]),
      now
    ).run()
    
    return c.json({
      success: true,
      message: `${founderData.religion_name} has spread to ${targetData.name}`
    })
  } catch (error) {
    console.error('Spread religion error:', error)
    return c.json({ error: 'Failed to spread religion' }, 500)
  }
})

// Get religions in simulation
religion.get('/simulation/:simId', async (c) => {
  try {
    const simId = c.req.param('simId')
    const db = c.env.DB
    
    // Get all civilizations with religions
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ? AND religion_name IS NOT NULL'
    ).bind(simId).all()
    
    const religions = (civs.results || []).map(civ => {
      const parsed = parseCivilization(civ)
      return {
        founderId: parsed.id,
        founderName: parsed.name,
        religionName: parsed.religion_name,
        tenets: parsed.religion_tenants ? JSON.parse(parsed.religion_tenants as any) : [],
        followers: parsed.religion_followers || 1,
        faith: parsed.faith
      }
    })
    
    return c.json({
      success: true,
      religions
    })
  } catch (error) {
    console.error('Get religions error:', error)
    return c.json({ error: 'Failed to get religions' }, 500)
  }
})

export default religion
