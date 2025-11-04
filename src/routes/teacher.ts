import { Hono } from 'hono'
import type { Bindings, Simulation } from '../types'
import { generateId, generateInviteCode, parseCivilization } from '../db'
import { getTimelineEvent, TIMELINE } from '../timeline'
import { 
  applyScienceEffects, 
  getUnlockedBonuses, 
  applyCulturalBonus,
  getWritingSystem,
  checkAchievements
} from '../game-mechanics'

const teacher = new Hono<{ Bindings: Bindings }>()

// Create a new period
teacher.post('/periods', async (c) => {
  try {
    const { teacherId, name } = await c.req.json()
    
    if (!teacherId || !name) {
      return c.json({ error: 'Teacher ID and period name required' }, 400)
    }
    
    const db = c.env.DB
    const periodId = generateId()
    const inviteCode = generateInviteCode()
    const now = Date.now()
    
    // Create period
    await db.prepare(
      'INSERT INTO periods (id, teacher_id, name, invite_code, created_at, archived) VALUES (?, ?, ?, ?, ?, FALSE)'
    ).bind(periodId, teacherId, name, inviteCode, now).run()
    
    // Create simulation for this period
    const simulationId = generateId()
    await db.prepare(
      'INSERT INTO simulations (id, period_id, current_year, timeline_index, paused) VALUES (?, ?, -50000, 0, TRUE)'
    ).bind(simulationId, periodId).run()
    
    return c.json({
      success: true,
      period: {
        id: periodId,
        name,
        invite_code: inviteCode,
        created_at: now
      },
      simulation: {
        id: simulationId,
        period_id: periodId
      }
    })
  } catch (error) {
    console.error('Create period error:', error)
    return c.json({ error: 'Failed to create period' }, 500)
  }
})

// Get all periods for a teacher
teacher.get('/periods/:teacherId', async (c) => {
  try {
    const teacherId = c.req.param('teacherId')
    const db = c.env.DB
    
    const result = await db.prepare(`
      SELECT p.id, p.name, p.invite_code, p.created_at, p.archived,
             (SELECT COUNT(*) FROM students WHERE period_id = p.id) as student_count,
             s.id as simulation_id, s.current_year, s.timeline_index, s.paused
      FROM periods p
      LEFT JOIN simulations s ON p.id = s.period_id
      WHERE p.teacher_id = ?
      ORDER BY p.created_at DESC
    `).bind(teacherId).all()
    
    return c.json({
      success: true,
      periods: result.results || []
    })
  } catch (error) {
    console.error('Get periods error:', error)
    return c.json({ error: 'Failed to get periods' }, 500)
  }
})

// Get students in a period
teacher.get('/periods/:periodId/students', async (c) => {
  try {
    const periodId = c.req.param('periodId')
    const db = c.env.DB
    
    const result = await db.prepare(`
      SELECT s.id, s.name, s.email,
             c.id as civ_id, c.name as civ_name, c.houses, c.population, 
             c.martial, c.defense, c.culture, c.faith, c.conquered
      FROM students s
      LEFT JOIN civilizations c ON s.id = c.student_id
      WHERE s.period_id = ?
      ORDER BY s.name
    `).bind(periodId).all()
    
    return c.json({
      success: true,
      students: result.results || []
    })
  } catch (error) {
    console.error('Get students error:', error)
    return c.json({ error: 'Failed to get students' }, 500)
  }
})

// Start simulation
teacher.post('/simulation/:simulationId/start', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const db = c.env.DB
    const now = Date.now()
    
    await db.prepare(
      'UPDATE simulations SET started_at = ?, paused = FALSE WHERE id = ?'
    ).bind(now, simulationId).run()
    
    return c.json({
      success: true,
      started_at: now
    })
  } catch (error) {
    console.error('Start simulation error:', error)
    return c.json({ error: 'Failed to start simulation' }, 500)
  }
})

// Pause/Resume simulation
teacher.post('/simulation/:simulationId/pause', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const { paused } = await c.req.json()
    const db = c.env.DB
    
    await db.prepare(
      'UPDATE simulations SET paused = ? WHERE id = ?'
    ).bind(paused ? 1 : 0, simulationId).run()
    
    return c.json({
      success: true,
      paused
    })
  } catch (error) {
    console.error('Pause simulation error:', error)
    return c.json({ error: 'Failed to pause simulation' }, 500)
  }
})

// Advance timeline
teacher.post('/simulation/:simulationId/advance', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const db = c.env.DB
    
    // Get current simulation state
    const sim = await db.prepare(
      'SELECT * FROM simulations WHERE id = ?'
    ).bind(simulationId).first() as Simulation
    
    if (!sim) {
      return c.json({ error: 'Simulation not found' }, 404)
    }
    
    // Check if at end of timeline
    if (sim.timeline_index >= TIMELINE.length - 1) {
      return c.json({ error: 'Timeline complete' }, 400)
    }
    
    // Get next event
    const nextIndex = sim.timeline_index + 1
    const nextEvent = getTimelineEvent(nextIndex)
    
    if (!nextEvent) {
      return c.json({ error: 'No more events' }, 400)
    }
    
    // Update simulation
    await db.prepare(
      'UPDATE simulations SET current_year = ?, timeline_index = ? WHERE id = ?'
    ).bind(nextEvent.year, nextIndex, simulationId).run()
    
    // Log event
    const eventId = generateId()
    const now = Date.now()
    await db.prepare(
      'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(eventId, simulationId, nextEvent.year, 'timeline_advance', JSON.stringify(nextEvent.data), now).run()
    
    // If event has growth flag, trigger growth phase for all civilizations
    if (nextEvent.data.growth) {
      // Get all civilizations in this simulation
      const civs = await db.prepare(
        'SELECT * FROM civilizations WHERE simulation_id = ? AND conquered = FALSE'
      ).bind(simulationId).all()
      
      // Apply growth to each
      for (const civRow of civs.results || []) {
        let civ = parseCivilization(civRow)
        
        // === PHASE 3: AUTO-APPLY SYSTEMS ===
        
        // 1. Apply Science Effects (bonuses based on science level)
        civ = applyScienceEffects(civ)
        
        // 2. Check and Unlock Cultural Bonuses
        const regions = typeof civ.regions === 'string' ? JSON.parse(civ.regions) : (civ.regions || [])
        const currentBonuses = typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : (civ.cultural_bonuses || [])
        const unlockedBonuses = getUnlockedBonuses(nextEvent.year, regions)
        
        for (const bonusId of unlockedBonuses) {
          if (!currentBonuses.includes(bonusId)) {
            civ = applyCulturalBonus(civ, bonusId)
            
            // Log cultural bonus unlock event
            const bonusEventId = generateId()
            await db.prepare(
              'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(bonusEventId, simulationId, nextEvent.year, 'cultural_bonus_unlocked', JSON.stringify({ 
              civilization: civ.name,
              bonus: bonusId
            }), now).run()
          }
        }
        
        // 3. Auto-Adopt Writing System (if not already adopted)
        if (!civ.writing) {
          const writingSystem = getWritingSystem(regions)
          if (writingSystem) {
            civ.writing = writingSystem.id
            civ.science += writingSystem.scienceBonus
            
            // Log writing adoption event
            const writingEventId = generateId()
            await db.prepare(
              'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(writingEventId, simulationId, nextEvent.year, 'writing_adopted', JSON.stringify({
              civilization: civ.name,
              writing: writingSystem.name,
              scienceBonus: writingSystem.scienceBonus
            }), now).run()
          }
        }
        
        // === STANDARD GROWTH CALCULATIONS ===
        
        // Basic growth: add fertility to houses (capped at capacity)
        const newHouses = Math.min(
          civ.houses + civ.fertility,
          civ.population_capacity
        )
        
        // Update population based on year (after 480 BCE, houses support 2 population)
        const housesDoublePopulation = nextEvent.year >= -480
        const newPopulation = housesDoublePopulation ? newHouses * 2 : newHouses
        
        // === CHECK FOR AUTOMATIC ACHIEVEMENTS ===
        const newAchievements = checkAchievements(civ)
        const currentAchievements = typeof civ.achievements === 'string' ? JSON.parse(civ.achievements) : (civ.achievements || [])
        
        for (const achievementId of newAchievements) {
          if (!currentAchievements.includes(achievementId)) {
            currentAchievements.push(achievementId)
            
            // Award achievement in database
            const achievementId_db = generateId()
            const achievementNames: Record<string, string> = {
              'scientific_achievement': 'Scientific Achievement',
              'economic_powerhouse': 'Economic Powerhouse',
              'military_supremacy': 'Military Supremacy',
              'religious_dominance': 'Religious Dominance'
            }
            
            await db.prepare(
              'INSERT INTO achievements (id, civ_id, achievement_id, achievement_name, earned_at, year_earned) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
              achievementId_db, civ.id, achievementId, achievementNames[achievementId] || achievementId,
              now, nextEvent.year
            ).run()
            
            // Log achievement event
            const achievementEventId = generateId()
            await db.prepare(
              'INSERT INTO event_log (id, simulation_id, year, event_type, event_data, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(achievementEventId, simulationId, nextEvent.year, 'achievement_earned', JSON.stringify({
              civilization: civ.name,
              achievement: achievementId
            }), now).run()
          }
        }
        
        civ.achievements = currentAchievements as any
        
        // Update civilization with all changes
        await db.prepare(`
          UPDATE civilizations 
          SET houses = ?, 
              population = ?, 
              martial = ?,
              defense = ?,
              culture = ?,
              faith = ?,
              science = ?,
              industry = ?,
              fertility = ?,
              population_capacity = ?,
              cultural_bonuses = ?,
              achievements = ?,
              writing = ?,
              advance_count = advance_count + 1, 
              updated_at = ?
          WHERE id = ?
        `).bind(
          newHouses, 
          newPopulation,
          civ.martial,
          civ.defense,
          civ.culture,
          civ.faith,
          civ.science,
          civ.industry,
          civ.fertility,
          civ.population_capacity,
          JSON.stringify(typeof civ.cultural_bonuses === 'string' ? JSON.parse(civ.cultural_bonuses) : (civ.cultural_bonuses || [])),
          JSON.stringify(typeof civ.achievements === 'string' ? JSON.parse(civ.achievements) : (civ.achievements || [])),
          civ.writing || null,
          now, 
          civ.id
        ).run()
      }
    }
    
    return c.json({
      success: true,
      event: nextEvent,
      new_index: nextIndex,
      new_year: nextEvent.year
    })
  } catch (error) {
    console.error('Advance timeline error:', error)
    return c.json({ error: 'Failed to advance timeline' }, 500)
  }
})

// Go back one event
teacher.post('/simulation/:simulationId/back', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const db = c.env.DB
    
    // Get current simulation state
    const sim = await db.prepare(
      'SELECT * FROM simulations WHERE id = ?'
    ).bind(simulationId).first() as Simulation
    
    if (!sim) {
      return c.json({ error: 'Simulation not found' }, 404)
    }
    
    // Check if at beginning
    if (sim.timeline_index <= 0) {
      return c.json({ error: 'Already at start of timeline' }, 400)
    }
    
    // Get previous event
    const prevIndex = sim.timeline_index - 1
    const prevEvent = getTimelineEvent(prevIndex)
    
    if (!prevEvent) {
      return c.json({ error: 'Cannot go back' }, 400)
    }
    
    // Update simulation
    await db.prepare(
      'UPDATE simulations SET current_year = ?, timeline_index = ? WHERE id = ?'
    ).bind(prevEvent.year, prevIndex, simulationId).run()
    
    return c.json({
      success: true,
      event: prevEvent,
      new_index: prevIndex,
      new_year: prevEvent.year
    })
  } catch (error) {
    console.error('Go back error:', error)
    return c.json({ error: 'Failed to go back' }, 500)
  }
})

// Get all civilizations in simulation (for students and teacher dashboard)
teacher.get('/simulation/:simulationId/civilizations', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const db = c.env.DB
    
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ? ORDER BY population DESC'
    ).bind(simulationId).all()
    
    return c.json({
      success: true,
      civilizations: civs.results?.map(parseCivilization) || []
    })
  } catch (error) {
    console.error('Get civilizations error:', error)
    return c.json({ error: 'Failed to get civilizations' }, 500)
  }
})

// Get simulation overview
teacher.get('/simulation/:simulationId/overview', async (c) => {
  try {
    const simulationId = c.req.param('simulationId')
    const db = c.env.DB
    
    // Get simulation info
    const sim = await db.prepare(
      'SELECT * FROM simulations WHERE id = ?'
    ).bind(simulationId).first()
    
    if (!sim) {
      return c.json({ error: 'Simulation not found' }, 404)
    }
    
    // Get all civilizations
    const civs = await db.prepare(
      'SELECT * FROM civilizations WHERE simulation_id = ? ORDER BY population DESC'
    ).bind(simulationId).all()
    
    // Get alliances
    const alliances = await db.prepare(
      'SELECT * FROM alliances WHERE simulation_id = ?'
    ).bind(simulationId).all()
    
    // Get recent events
    const events = await db.prepare(
      'SELECT * FROM event_log WHERE simulation_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(simulationId).all()
    
    return c.json({
      success: true,
      simulation: sim,
      civilizations: civs.results?.map(parseCivilization) || [],
      alliances: alliances.results || [],
      recent_events: events.results || []
    })
  } catch (error) {
    console.error('Get overview error:', error)
    return c.json({ error: 'Failed to get overview' }, 500)
  }
})

export default teacher
