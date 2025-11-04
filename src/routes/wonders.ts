import { Hono } from 'hono'
import type { Bindings } from '../types'
import { generateId, parseCivilization } from '../db'
import { canBuildWonder, applyWonderEffects, getWonderCost } from '../game-mechanics'
import { WONDERS, CULTURE_BUILDINGS } from '../game-data'

const wonders = new Hono<{ Bindings: Bindings }>()

// Get all available wonders
wonders.get('/list', async (c) => {
  return c.json({
    success: true,
    wonders: WONDERS,
    cultureBuildings: CULTURE_BUILDINGS
  })
})

// Get wonders built in simulation
wonders.get('/simulation/:simId', async (c) => {
  try {
    const simId = c.req.param('simId')
    const db = c.env.DB
    
    // Get all civilizations in simulation
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ?'
    ).bind(simId).all()
    
    const builtWonders: string[] = []
    const wonderOwners: Record<string, any> = {}
    
    for (const civ of civs.results || []) {
      const parsed = parseCivilization(civ)
      const civWonders = parsed.wonders ? JSON.parse(parsed.wonders as any) : []
      const civBuildings = parsed.culture_buildings ? JSON.parse(parsed.culture_buildings as any) : []
      
      for (const wonderId of [...civWonders, ...civBuildings]) {
        builtWonders.push(wonderId)
        wonderOwners[wonderId] = {
          civId: parsed.id,
          civName: parsed.name,
          color: parsed.color
        }
      }
    }
    
    return c.json({
      success: true,
      builtWonders,
      wonderOwners
    })
  } catch (error) {
    console.error('Get wonders error:', error)
    return c.json({ error: 'Failed to get wonders' }, 500)
  }
})

// Build a wonder
wonders.post('/build', async (c) => {
  try {
    const { civId, wonderId } = await c.req.json()
    
    if (!civId || !wonderId) {
      return c.json({ error: 'Civilization ID and wonder ID required' }, 400)
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
    
    // Get all wonders built in simulation
    const allCivs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ?'
    ).bind(civData.simulation_id).all()
    
    const builtWonders: string[] = []
    for (const c of allCivs.results || []) {
      const parsed = parseCivilization(c)
      const wonders = parsed.wonders ? JSON.parse(parsed.wonders as any) : []
      const buildings = parsed.culture_buildings ? JSON.parse(parsed.culture_buildings as any) : []
      builtWonders.push(...wonders, ...buildings)
    }
    
    // Check if can build
    const check = canBuildWonder(civData, wonderId, builtWonders)
    if (!check.can) {
      return c.json({ error: check.reason }, 400)
    }
    
    // Calculate cost
    const cost = getWonderCost(civData, wonderId)
    
    // Apply wonder effects
    const updated = applyWonderEffects(civData, wonderId)
    
    // Update database
    const now = Date.now()
    await db.prepare(`
      UPDATE civilizations 
      SET wonders = ?,
          culture_buildings = ?,
          population_capacity = ?,
          martial = ?,
          defense = ?,
          culture = ?,
          faith = ?,
          science = ?,
          industry = ?,
          industry_left = industry_left - ?,
          fertility = ?,
          great_wall = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(
      JSON.stringify(updated.wonders || []),
      JSON.stringify(updated.culture_buildings || []),
      updated.population_capacity,
      updated.martial,
      updated.defense,
      updated.culture,
      updated.faith,
      updated.science,
      updated.industry,
      cost,
      updated.fertility,
      updated.great_wall ? 1 : 0,
      now,
      civId
    ).run()
    
    // Log event
    const eventId = generateId()
    const sim = await db.prepare(
      'SELECT current_year FROM simulations WHERE id = ?'
    ).bind(civData.simulation_id).first()
    
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, affected_civ_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      eventId,
      civData.simulation_id,
      sim?.current_year || 0,
      'wonder_built',
      JSON.stringify({ wonderId, civName: civData.name }),
      JSON.stringify([civId]),
      now
    ).run()
    
    // Get updated civilization
    const updatedCiv = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: updatedCiv ? parseCivilization(updatedCiv) : null,
      wonder: [...WONDERS, ...CULTURE_BUILDINGS].find(w => w.id === wonderId)
    })
  } catch (error) {
    console.error('Build wonder error:', error)
    return c.json({ error: 'Failed to build wonder' }, 500)
  }
})

export default wonders
