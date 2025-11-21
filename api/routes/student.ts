import { Hono } from 'hono';
import { studentAuthMiddleware } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

export const studentRouter = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all student routes
studentRouter.use('/*', studentAuthMiddleware);

// Get dashboard data
studentRouter.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');
    console.log(`[Dashboard] Fetching data for student ${user.id} (${user.username})`);
    
    // Get student info
    const student = await c.env.DB.prepare(`
      SELECT s.id, s.name, s.username, s.period_id, p.name as period_name, 
             p.start_year, p.end_year, p.current_year
      FROM students s
      JOIN periods p ON s.period_id = p.id
      WHERE s.id = ?
    `).bind(user.id).first();
    
    if (!student) {
      console.error(`[Dashboard] Student not found or period missing for ID ${user.id}`);
      // Check if student exists but period is missing (orphan)
      const rawStudent = await c.env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(user.id).first();
      if (rawStudent) {
          console.error(`[Dashboard] ORPHAN STUDENT DETECTED: Student ${user.id} exists but JOIN failed. Period ID: ${rawStudent.period_id}`);
          return c.json({ message: 'Class period not found. Please contact your teacher.' }, 404);
      }
      return c.json({ message: 'Student account not found' }, 404);
    }
    
    // Get game session if exists
    const gameSession = await c.env.DB.prepare(`
      SELECT id, civilization_id, progress_data, last_played
      FROM game_sessions
      WHERE student_id = ?
    `).bind(user.id).first();

    console.log(`[Dashboard] Success. Session found: ${!!gameSession}`);
    
    return c.json({
      student,
      gameSession: gameSession || null
    });
    
  } catch (error) {
    console.error('[Dashboard] CRITICAL ERROR:', error);
    return c.json({ message: 'Failed to load dashboard data. Please try again.' }, 500);
  }
});

// Get available civilizations
studentRouter.get('/civilizations', async (c) => {
  // Return hardcoded civilizations list (from constants)
  // In a real app, this could be dynamic from DB
  return c.json({
    civilizations: [
      { id: 'egypt', name: 'Ancient Egypt' },
      { id: 'greece', name: 'Ancient Greece' },
      { id: 'rome', name: 'Roman Empire' },
      { id: 'china', name: 'Ancient China' },
      { id: 'germania', name: 'Germania' },
      { id: 'phoenicia', name: 'Phoenicia' },
      { id: 'india', name: 'Ancient India' },
      { id: 'mesopotamia', name: 'Mesopotamia' },
      { id: 'persia', name: 'Persian Empire' },
      { id: 'sparta', name: 'Sparta' },
      { id: 'anatolia', name: 'Anatolia' },
      { id: 'crete', name: 'Minoan Crete' },
      { id: 'gaul', name: 'Gaul' },
      { id: 'carthage', name: 'Carthage' },
      { id: 'macedon', name: 'Macedonia' },
      { id: 'assyria', name: 'Assyrian Empire' }
    ]
  });
});

// Create or update game session
studentRouter.post('/game-session', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { civilizationId, progressData } = body;
    
    console.log(`[GameSession] Update request for student ${user.id}. Civ: ${civilizationId}`);

    if (!civilizationId) {
      console.warn('[GameSession] Missing civilizationId');
      return c.json({ message: 'Civilization ID is required' }, 400);
    }
    
    // Check if session exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first();
    
    if (existing) {
      // Update existing session
      await c.env.DB.prepare(`
        UPDATE game_sessions 
        SET civilization_id = ?, progress_data = ?, last_played = datetime('now')
        WHERE student_id = ?
      `).bind(civilizationId, JSON.stringify(progressData || {}), user.id).run();
      
      console.log(`[GameSession] Updated session ${existing.id}`);
      return c.json({ message: 'Game session updated' });
    } else {
      // Create new session
      const result = await c.env.DB.prepare(`
        INSERT INTO game_sessions (student_id, civilization_id, progress_data) 
        VALUES (?, ?, ?)
      `).bind(user.id, civilizationId, JSON.stringify(progressData || {})).run();
      
      console.log(`[GameSession] Created new session ${result.meta.last_row_id}`);
      return c.json({ 
        message: 'Game session created',
        sessionId: result.meta.last_row_id
      }, 201);
    }
    
  } catch (error) {
    console.error('[GameSession] CRITICAL ERROR:', error);
    return c.json({ message: 'Failed to save game session' }, 500);
  }
});

// Save game progress
studentRouter.put('/game-session/progress', async (c) => {
  try {
    const user = c.get('user');
    const { progressData } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE game_sessions 
      SET progress_data = ?, last_played = datetime('now')
      WHERE student_id = ?
    `).bind(JSON.stringify(progressData), user.id).run();
    
    return c.json({ message: 'Progress saved successfully' });
    
  } catch (error) {
    console.error('Save progress error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});
