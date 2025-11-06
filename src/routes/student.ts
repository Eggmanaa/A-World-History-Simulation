import { Hono } from 'hono'
import type { Bindings, Civilization } from '../types'
import { generateId, getDefaultCivStats, parseCivilization, parseCivPreset } from '../db'
import { applyTraitModifiers } from '../game-logic'
import { 
  generateHexMapV2, 
  getWaterResourceForRegion, 
  getPopulationCapacity,
  checkIfIslandRegion
} from '../terrain-system-v2'

const student = new Hono<{ Bindings: Bindings }>()

// Get civilization presets
student.get('/presets', async (c) => {
  try {
    const db = c.env.DB
    
    const result = await db.prepare(
      'SELECT * FROM civ_presets ORDER BY display_name'
    ).all()
    
    return c.json({
      success: true,
      presets: result.results?.map(parseCivPreset) || []
    })
  } catch (error) {
    console.error('Get presets error:', error)
    return c.json({ error: 'Failed to get presets' }, 500)
  }
})

// Create civilization
student.post('/civilization', async (c) => {
  try {
    const { studentId, name, presetId, customTraits, customRegions, color } = await c.req.json()
    
    if (!studentId || !name) {
      return c.json({ error: 'Student ID and civilization name required' }, 400)
    }
    
    const db = c.env.DB
    
    // Check if student already has a civilization
    const existing = await db.prepare(
      'SELECT id FROM civilizations WHERE student_id = ?'
    ).bind(studentId).first()
    
    if (existing) {
      return c.json({ error: 'Student already has a civilization' }, 400)
    }
    
    // Get student's simulation ID
    const student = await db.prepare(`
      SELECT s.period_id, sim.id as simulation_id
      FROM students s
      JOIN simulations sim ON s.period_id = sim.period_id
      WHERE s.id = ?
    `).bind(studentId).first()
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Start with default stats
    let civStats = getDefaultCivStats()
    
    // If using preset, load preset stats
    if (presetId) {
      const preset = await db.prepare(
        'SELECT * FROM civ_presets WHERE id = ?'
      ).bind(presetId).first()
      
      if (preset) {
        const parsedPreset = parseCivPreset(preset)
        civStats = {
          ...civStats,
          fertility: parsedPreset.fertility,
          population_capacity: parsedPreset.population_capacity,
          martial: parsedPreset.martial,
          defense: parsedPreset.defense,
          faith: parsedPreset.faith,
          industry: parsedPreset.industry,
          houses: parsedPreset.houses,
          traits: parsedPreset.starting_traits,
          regions: parsedPreset.regions
        }
      }
    } else if (customTraits || customRegions) {
      // Custom civilization
      civStats.traits = customTraits || []
      civStats.regions = customRegions || []
    }
    
    // Apply trait modifiers
    civStats = applyTraitModifiers(civStats)
    
    // Generate terrain system data
    const regions = civStats.regions || []
    const waterResource = getWaterResourceForRegion(regions)
    const populationCapacity = getPopulationCapacity(waterResource)
    const hexMap = generateHexMapV2(regions, 3) // radius 3 = ~37 hexes with clean biomes
    const isIsland = checkIfIslandRegion(regions)
    
    // Override population capacity with water resource value
    civStats.population_capacity = populationCapacity
    
    // Create civilization
    const civId = generateId()
    const now = Date.now()
    
    await db.prepare(`
      INSERT INTO civilizations (
        id, simulation_id, student_id, name, color,
        houses, population, population_capacity, fertility,
        industry, industry_left, martial, defense, science, culture, faith, diplomacy,
        temples, amphitheaters, walls, archimedes_towers,
        cultural_stage, traits, regions,
        water_resource, terrain_data, is_island,
        conquered, locked_decline, advance_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      civId, student.simulation_id, studentId, name, color || '#3B82F6',
      civStats.houses || 0, civStats.population || 0, populationCapacity,
      civStats.fertility || 2, civStats.industry || 5, civStats.industry_left || 5,
      civStats.martial || 5, civStats.defense || 5, civStats.science || 0,
      civStats.culture || 0, civStats.faith || 5, civStats.diplomacy || 0,
      civStats.temples || 0, civStats.amphitheaters || 0, civStats.walls || 0,
      civStats.archimedes_towers || 0, civStats.cultural_stage || 'barbarism',
      JSON.stringify(civStats.traits || []), JSON.stringify(civStats.regions || []),
      waterResource, JSON.stringify(hexMap), isIsland ? 1 : 0,
      0, 0, 0, now, now
    ).run()
    
    // Get the created civilization
    const civ = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: civ ? parseCivilization(civ) : null
    })
  } catch (error) {
    console.error('Create civilization error:', error)
    return c.json({ error: 'Failed to create civilization' }, 500)
  }
})

// Get student's civilization
student.get('/civilization/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const db = c.env.DB
    
    const civ = await db.prepare(
      'SELECT * FROM civilizations WHERE student_id = ?'
    ).bind(studentId).first()
    
    if (!civ) {
      return c.json({ error: 'Civilization not found' }, 404)
    }
    
    return c.json({
      success: true,
      civilization: parseCivilization(civ)
    })
  } catch (error) {
    console.error('Get civilization error:', error)
    return c.json({ error: 'Failed to get civilization' }, 500)
  }
})

// Get simulation state for student
student.get('/simulation/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const db = c.env.DB
    
    // Get student's period and simulation
    const result = await db.prepare(`
      SELECT sim.*, p.name as period_name
      FROM students s
      JOIN periods p ON s.period_id = p.id
      JOIN simulations sim ON p.id = sim.period_id
      WHERE s.id = ?
    `).bind(studentId).first()
    
    if (!result) {
      return c.json({ error: 'Simulation not found' }, 404)
    }
    
    return c.json({
      success: true,
      simulation: result
    })
  } catch (error) {
    console.error('Get simulation error:', error)
    return c.json({ error: 'Failed to get simulation' }, 500)
  }
})

// Get all civilizations in student's simulation
student.get('/simulation/:studentId/civilizations', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const db = c.env.DB
    
    // Get simulation ID for this student
    const studentInfo = await db.prepare(`
      SELECT sim.id as simulation_id
      FROM students s
      JOIN simulations sim ON s.period_id = sim.period_id
      WHERE s.id = ?
    `).bind(studentId).first()
    
    if (!studentInfo) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Get all civilizations
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ? ORDER BY population DESC'
    ).bind(studentInfo.simulation_id).all()
    
    return c.json({
      success: true,
      civilizations: civs.results?.map(parseCivilization) || []
    })
  } catch (error) {
    console.error('Get civilizations error:', error)
    return c.json({ error: 'Failed to get civilizations' }, 500)
  }
})

// Update civilization stats (for building, etc.)
// Update civilization map data
student.post('/civilization/:civId/map', async (c) => {
  try {
    const civId = c.req.param('civId')
    const { map_data } = await c.req.json()
    const db = c.env.DB
    const now = Date.now()
    
    await db.prepare(
      'UPDATE civilizations SET map_data = ?, updated_at = ? WHERE id = ?'
    ).bind(map_data, now, civId).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update map error:', error)
    return c.json({ error: 'Failed to update map' }, 500)
  }
})

student.post('/civilization/:civId/update', async (c) => {
  try {
    const civId = c.req.param('civId')
    const updates = await c.req.json()
    const db = c.env.DB
    const now = Date.now()
    
    // Build update query dynamically
    const allowedFields = [
      'houses', 'population', 'population_capacity', 'fertility',
      'industry', 'industry_left', 'martial', 'defense', 'science',
      'culture', 'faith', 'diplomacy', 'temples', 'amphitheaters',
      'walls', 'archimedes_towers', 'cultural_stage', 'wonder',
      'religion_name', 'religion_tenants', 'map_data'
    ]
    
    const updatePairs: string[] = []
    const values: any[] = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updatePairs.push(`${key} = ?`)
        if (key === 'religion_tenants') {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    }
    
    if (updatePairs.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400)
    }
    
    updatePairs.push('updated_at = ?')
    values.push(now)
    values.push(civId)
    
    await db.prepare(
      `UPDATE civilizations SET ${updatePairs.join(', ')} WHERE id = ?`
    ).bind(...values).run()
    
    // Get updated civilization
    const civ = await db.prepare(
      'SELECT * FROM civilizations WHERE id = ?'
    ).bind(civId).first()
    
    return c.json({
      success: true,
      civilization: civ ? parseCivilization(civ) : null
    })
  } catch (error) {
    console.error('Update civilization error:', error)
    return c.json({ error: 'Failed to update civilization' }, 500)
  }
})

export default student
