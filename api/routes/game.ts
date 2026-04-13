import { Hono } from 'hono';
import { teacherAuthMiddleware, studentAuthMiddleware } from '../middleware/auth';
import { TIMELINE_EVENTS, CIV_PRESETS } from '../../constants';
import type { GameState, StatKey } from '../../types';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  user: any;
};

export const gameRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// TEACHER ENDPOINTS
// ============================================================================

gameRouter.use('/teacher/*', teacherAuthMiddleware());

// POST /game/:periodId/start - Initialize game for a period
gameRouter.post('/teacher/:periodId/start', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Check if game state already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (existing) {
      return c.json({ message: 'Game already started for this period' }, 400);
    }

    // Get all students in period with their game sessions
    const students = await c.env.DB.prepare(`
      SELECT s.id, s.name, gs.civilization_id
      FROM students s
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.period_id = ?
    `).bind(periodId).all();

    // Initialize game state
    const initialGameData = {
      civStates: students.results.map((student: any) => ({
        studentId: student.id,
        studentName: student.name,
        civilizationId: student.civilization_id || 'egypt',
        wars: [],
        alliances: [],
        wondersBuilt: [],
        flags: {}
      }))
    };

    // Create game state record
    const result = await c.env.DB.prepare(`
      INSERT INTO game_states (period_id, current_year, timeline_index, game_data, event_log)
      VALUES (?, ?, ?, ?, ?)
    `).bind(periodId, -50000, 0, JSON.stringify(initialGameData), JSON.stringify([])).run();

    // Update period current_year
    await c.env.DB.prepare(
      'UPDATE periods SET current_year = ? WHERE id = ?'
    ).bind(-50000, periodId).run();

    return c.json(
      {
        message: 'Game started successfully',
        gameState: {
          id: result.meta.last_row_id,
          periodId,
          currentYear: -50000,
          timelineIndex: 0,
          civStates: initialGameData.civStates
        }
      },
      201
    );
  } catch (error) {
    console.error('Start game error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/:periodId/advance - Advance to next timeline event
gameRouter.post('/teacher/:periodId/advance', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    const gameData = JSON.parse(gameState.game_data || '{}');
    let timelineIndex = gameState.timeline_index;
    let currentYear = gameState.current_year;

    // Get next timeline event
    if (timelineIndex < TIMELINE_EVENTS.length - 1) {
      timelineIndex++;
      const event = TIMELINE_EVENTS[timelineIndex];
      currentYear = event.year;

      // Update game state
      const eventLog = JSON.parse(gameState.event_log || '[]');
      eventLog.push({
        timelineIndex,
        eventName: event.name,
        year: currentYear,
        timestamp: new Date().toISOString()
      });

      await c.env.DB.prepare(`
        UPDATE game_states
        SET timeline_index = ?, current_year = ?, event_log = ?, updated_at = datetime('now')
        WHERE period_id = ?
      `).bind(timelineIndex, currentYear, JSON.stringify(eventLog), periodId).run();

      // Update period current_year
      await c.env.DB.prepare(
        'UPDATE periods SET current_year = ? WHERE id = ?'
      ).bind(currentYear, periodId).run();

      return c.json({
        message: 'Timeline advanced',
        event: {
          year: event.year,
          name: event.name,
          desc: event.desc,
          actions: event.actions || []
        },
        newYear: currentYear,
        timelineIndex
      });
    } else {
      return c.json({ message: 'Already at end of timeline' }, 400);
    }
  } catch (error) {
    console.error('Advance timeline error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// GET /game/:periodId/overview - Get full game overview for teacher dashboard
gameRouter.get('/teacher/:periodId/overview', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT current_year FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    const gameData = JSON.parse(gameState.game_data || '{}');

    // Get all student sessions with civ data
    const sessions = await c.env.DB.prepare(`
      SELECT s.id, s.name, gs.civilization_id, gs.progress_data
      FROM students s
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.period_id = ?
    `).bind(periodId).all();

    // Get pending actions
    const pendingActions = await c.env.DB.prepare(`
      SELECT * FROM pending_actions
      WHERE period_id = ? AND status = 'pending'
      ORDER BY created_at DESC
    `).bind(periodId).all();

    const civStates = sessions.results.map((session: any) => {
      const progressData = session.progress_data ? JSON.parse(session.progress_data) : {};
      return {
        studentId: session.id,
        studentName: session.name,
        civilizationId: session.civilization_id || 'egypt',
        wars: progressData.wars || [],
        alliances: progressData.alliances || [],
        wondersBuilt: progressData.wondersBuilt || [],
        population: progressData.population || 0,
        stats: progressData.stats || {}
      };
    });

    return c.json({
      periodId,
      currentYear: gameState.current_year,
      timelineIndex: gameState.timeline_index,
      civilizations: civStates,
      pendingActions: pendingActions.results,
      eventLog: JSON.parse(gameState.event_log || '[]')
    });
  } catch (error) {
    console.error('Get overview error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/:periodId/resolve-war - Teacher resolves a war between two civs
gameRouter.post('/teacher/:periodId/resolve-war', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { actionId, result } = await c.req.json();

    if (!actionId || !result || !['attacker_wins', 'defender_wins', 'stalemate'].includes(result)) {
      return c.json({ message: 'Invalid action or result' }, 400);
    }

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get pending action
    const action = await c.env.DB.prepare(
      'SELECT * FROM pending_actions WHERE id = ? AND period_id = ?'
    ).bind(actionId, periodId).first();

    if (!action) {
      return c.json({ message: 'Action not found' }, 404);
    }

    const actionData = JSON.parse(action.action_data || '{}');

    // Update action status
    await c.env.DB.prepare(`
      UPDATE pending_actions
      SET status = 'resolved', resolved_at = datetime('now')
      WHERE id = ?
    `).bind(actionId).run();

    // Update student sessions based on war result
    if (actionData.attackerId && actionData.defenderId) {
      const attacker = await c.env.DB.prepare(
        'SELECT progress_data FROM game_sessions WHERE student_id = ?'
      ).bind(actionData.attackerId).first();

      const defender = await c.env.DB.prepare(
        'SELECT progress_data FROM game_sessions WHERE student_id = ?'
      ).bind(actionData.defenderId).first();

      if (attacker && defender) {
        const attackerData = JSON.parse(attacker.progress_data || '{}');
        const defenderData = JSON.parse(defender.progress_data || '{}');

        // Update war record based on result
        if (result === 'attacker_wins') {
          attackerData.warWins = (attackerData.warWins || 0) + 1;
          defenderData.warLosses = (defenderData.warLosses || 0) + 1;
        } else if (result === 'defender_wins') {
          defenderData.warWins = (defenderData.warWins || 0) + 1;
          attackerData.warLosses = (attackerData.warLosses || 0) + 1;
        }

        await c.env.DB.prepare(
          'UPDATE game_sessions SET progress_data = ? WHERE student_id = ?'
        ).bind(JSON.stringify(attackerData), actionData.attackerId).run();

        await c.env.DB.prepare(
          'UPDATE game_sessions SET progress_data = ? WHERE student_id = ?'
        ).bind(JSON.stringify(defenderData), actionData.defenderId).run();
      }
    }

    return c.json({
      message: 'War resolved',
      actionId,
      result
    });
  } catch (error) {
    console.error('Resolve war error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/:periodId/custom-event - Teacher creates ad-hoc event
gameRouter.post('/teacher/:periodId/custom-event', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { name, description, affectedCivIds, statModifications } = await c.req.json();

    if (!name || !description) {
      return c.json({ message: 'Name and description are required' }, 400);
    }

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    // Log custom event
    const eventLog = JSON.parse(gameState.event_log || '[]');
    eventLog.push({
      type: 'custom',
      name,
      description,
      affectedCivIds,
      statModifications,
      timestamp: new Date().toISOString()
    });

    await c.env.DB.prepare(`
      UPDATE game_states
      SET event_log = ?, updated_at = datetime('now')
      WHERE period_id = ?
    `).bind(JSON.stringify(eventLog), periodId).run();

    // Apply stat modifications if provided
    if (affectedCivIds && affectedCivIds.length > 0 && statModifications) {
      for (const civId of affectedCivIds) {
        const student = await c.env.DB.prepare(
          'SELECT id FROM students WHERE period_id = ? AND id = ?'
        ).bind(periodId, civId).first();

        if (student) {
          const session = await c.env.DB.prepare(
            'SELECT progress_data FROM game_sessions WHERE student_id = ?'
          ).bind(civId).first();

          if (session) {
            const data = JSON.parse(session.progress_data || '{}');
            const stats = data.stats || {};

            // Apply modifications
            for (const [stat, value] of Object.entries(statModifications)) {
              stats[stat] = (stats[stat] || 0) + (value as number);
            }

            data.stats = stats;
            await c.env.DB.prepare(
              'UPDATE game_sessions SET progress_data = ? WHERE student_id = ?'
            ).bind(JSON.stringify(data), civId).run();
          }
        }
      }
    }

    return c.json(
      {
        message: 'Custom event created',
        event: {
          name,
          description,
          affectedCivIds,
          statModifications
        }
      },
      201
    );
  } catch (error) {
    console.error('Create custom event error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/teacher/:periodId/broadcast - Broadcast message to all students
gameRouter.post('/teacher/:periodId/broadcast', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { message, type } = await c.req.json();
    if (!message || !['info', 'warning', 'pause'].includes(type)) {
      return c.json({ message: 'Message and valid type required' }, 400);
    }
    const period = await c.env.DB.prepare('SELECT id FROM periods WHERE id = ? AND teacher_id = ?').bind(periodId, user.id).first();
    if (!period) return c.json({ message: 'Period not found' }, 404);
    const gameState = await c.env.DB.prepare('SELECT * FROM game_states WHERE period_id = ?').bind(periodId).first();
    if (!gameState) return c.json({ message: 'Game not started' }, 400);
    const eventLog = JSON.parse(gameState.event_log || '[]');
    const broadcast = { type: 'broadcast', broadcastType: type, message, teacherName: user.name || 'Teacher', timestamp: new Date().toISOString() };
    eventLog.push(broadcast);
    if (type === 'pause') {
      const gameData = JSON.parse(gameState.game_data || '{}');
      gameData.gamePaused = true;
      await c.env.DB.prepare('UPDATE game_states SET event_log = ?, game_data = ?, updated_at = datetime(\'now\') WHERE period_id = ?').bind(JSON.stringify(eventLog), JSON.stringify(gameData), periodId).run();
    } else {
      await c.env.DB.prepare('UPDATE game_states SET event_log = ?, updated_at = datetime(\'now\') WHERE period_id = ?').bind(JSON.stringify(eventLog), periodId).run();
    }
    return c.json({ message: 'Broadcast sent', broadcast }, 201);
  } catch (error) {
    console.error('Broadcast error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/teacher/:periodId/end - End game and calculate final scores
gameRouter.post('/teacher/:periodId/end', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const period = await c.env.DB.prepare('SELECT id FROM periods WHERE id = ? AND teacher_id = ?').bind(periodId, user.id).first();
    if (!period) return c.json({ message: 'Period not found' }, 404);
    const gameState = await c.env.DB.prepare('SELECT * FROM game_states WHERE period_id = ?').bind(periodId).first();
    if (!gameState) return c.json({ message: 'Game not started' }, 400);
    const gameData = JSON.parse(gameState.game_data || '{}');
    gameData.gameEnded = true;
    gameData.endedAt = new Date().toISOString();
    const eventLog = JSON.parse(gameState.event_log || '[]');
    eventLog.push({ type: 'game_ended', timestamp: new Date().toISOString(), endedBy: user.name || 'Teacher' });
    await c.env.DB.prepare('UPDATE game_states SET game_data = ?, event_log = ?, updated_at = datetime(\'now\') WHERE period_id = ?').bind(JSON.stringify(gameData), JSON.stringify(eventLog), periodId).run();
    return c.json({ message: 'Game ended' }, 200);
  } catch (error) {
    console.error('End game error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// GET /game/student/:periodId/broadcasts - Get recent broadcasts
gameRouter.get('/student/:periodId/broadcasts', async (c) => {
  try {
    const periodId = c.req.param('periodId');
    const gameState = await c.env.DB.prepare('SELECT event_log, game_data FROM game_states WHERE period_id = ?').bind(periodId).first();
    if (!gameState) return c.json({ broadcasts: [], gamePaused: false });
    const eventLog = JSON.parse(gameState.event_log || '[]');
    const broadcasts = eventLog.filter((e: any) => e.type === 'broadcast').slice(-10);
    const gameData = JSON.parse(gameState.game_data || '{}');
    return c.json({ broadcasts, gamePaused: !!gameData.gamePaused, gameEnded: !!gameData.gameEnded });
  } catch (error) {
    return c.json({ broadcasts: [], gamePaused: false });
  }
});

// ============================================================================
// STUDENT ENDPOINTS
// ============================================================================

gameRouter.use('/student/*', studentAuthMiddleware());

// GET /game/:periodId/state - Student polls for current game state
gameRouter.get('/student/:periodId/state', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Get student info
    const student = await c.env.DB.prepare(
      'SELECT id, period_id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    // Get student's game session
    const session = await c.env.DB.prepare(
      'SELECT * FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first();

    const progressData = session ? JSON.parse(session.progress_data || '{}') : {};

    // Get current timeline event
    const currentEvent = TIMELINE_EVENTS[gameState.timeline_index] || null;

    // Get adjacent civilizations (other students)
    const otherStudents = await c.env.DB.prepare(`
      SELECT s.id, s.name, gs.civilization_id
      FROM students s
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.period_id = ? AND s.id != ?
      LIMIT 3
    `).bind(periodId, user.id).all();

    const adjacentCivs = otherStudents.results.map((student: any) => ({
      studentId: student.id,
      name: student.name,
      civilizationId: student.civilization_id || 'egypt',
      relationship: progressData.relationships ? progressData.relationships[student.id] || 'Neutral' : 'Neutral'
    }));

    // Get game flags
    const gameData = JSON.parse(gameState.game_data || '{}');
    const gameFlags = {
      warUnlocked: gameState.timeline_index >= 7, // Around year -670
      religionUnlocked: gameState.timeline_index >= 5 // Around year -1000
    };

    return c.json({
      currentYear: gameState.current_year,
      timelineIndex: gameState.timeline_index,
      event: currentEvent,
      studentId: user.id,
      civilizationId: session?.civilization_id || 'egypt',
      civState: progressData,
      adjacentCivs,
      gameFlags
    });
  } catch (error) {
    console.error('Get state error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /game/:periodId/action - Student submits an action
gameRouter.post('/student/:periodId/action', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { actionType, actionData } = await c.req.json();

    if (!actionType) {
      return c.json({ message: 'Action type is required' }, 400);
    }

    const validActions = ['build', 'declare_war', 'found_religion', 'spread_religion', 'trade'];
    if (!validActions.includes(actionType)) {
      return c.json({ message: 'Invalid action type' }, 400);
    }

    // Verify student and period
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get game state for validation
    const gameState = await c.env.DB.prepare(
      'SELECT timeline_index FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    // Validate specific actions
    if (actionType === 'declare_war') {
      if (gameState.timeline_index < 7) {
        return c.json({ message: 'Warfare not unlocked yet' }, 400);
      }
      if (!actionData.targetStudentId) {
        return c.json({ message: 'Target student ID required for war declaration' }, 400);
      }
    }

    if (actionType === 'found_religion') {
      if (gameState.timeline_index < 5) {
        return c.json({ message: 'Religion not unlocked yet' }, 400);
      }
    }

    // Create pending action record
    const result = await c.env.DB.prepare(`
      INSERT INTO pending_actions (period_id, student_id, action_type, action_data, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(periodId, user.id, actionType, JSON.stringify(actionData || {})).run();

    // For build actions, apply immediately
    if (actionType === 'build') {
      const session = await c.env.DB.prepare(
        'SELECT progress_data FROM game_sessions WHERE student_id = ?'
      ).bind(user.id).first();

      if (session) {
        const data = JSON.parse(session.progress_data || '{}');
        const buildings = data.buildings || {};
        buildings[actionData.buildingType] = (buildings[actionData.buildingType] || 0) + 1;
        data.buildings = buildings;

        await c.env.DB.prepare(
          'UPDATE game_sessions SET progress_data = ? WHERE student_id = ?'
        ).bind(JSON.stringify(data), user.id).run();
      }

      return c.json({
        message: 'Building constructed',
        actionId: result.meta.last_row_id,
        buildingType: actionData.buildingType
      }, 201);
    }

    // For declare_war, create pending action that teacher must resolve
    if (actionType === 'declare_war') {
      return c.json({
        message: 'War declaration submitted for teacher approval',
        actionId: result.meta.last_row_id,
        status: 'pending'
      }, 201);
    }

    return c.json({
      message: 'Action recorded',
      actionId: result.meta.last_row_id,
      actionType
    }, 201);
  } catch (error) {
    console.error('Submit action error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /student/:periodId/save - Student saves their game state
gameRouter.post('/student/:periodId/save', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { progressData } = await c.req.json();

    if (!progressData) {
      return c.json({ message: 'Progress data is required' }, 400);
    }

    // Verify student and period
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get or create game session
    const session = await c.env.DB.prepare(
      'SELECT id FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first();

    if (session) {
      // Update existing session
      await c.env.DB.prepare(
        'UPDATE game_sessions SET progress_data = ?, updated_at = datetime("now") WHERE student_id = ?'
      ).bind(JSON.stringify(progressData), user.id).run();
    } else {
      // Create new session
      await c.env.DB.prepare(
        'INSERT INTO game_sessions (student_id, progress_data) VALUES (?, ?)'
      ).bind(user.id, JSON.stringify(progressData)).run();
    }

    return c.json({
      message: 'Game state saved successfully',
      studentId: user.id
    }, 200);
  } catch (error) {
    console.error('Save game state error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// ============================================================================
// TURN SYSTEM ENDPOINTS
// ============================================================================

// POST /teacher/:periodId/start-turn - Start a new decision phase
gameRouter.post('/teacher/:periodId/start-turn', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { timerMinutes } = await c.req.json();

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get all students in period
    const students = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM students WHERE period_id = ?'
    ).bind(periodId).first();

    const totalPlayers = (students as any).count || 1;
    const deadline = Date.now() + (timerMinutes || 5) * 60 * 1000;

    // Create turn state
    const turnState = {
      number: 1,
      phase: 'decision',
      timeRemaining: (timerMinutes || 5) * 60,
      submittedCount: 0,
      totalPlayers,
      isPaused: false,
      deadline
    };

    // Store turn state in game_states
    await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, updated_at = datetime('now')
      WHERE period_id = ?
    `).bind(JSON.stringify(turnState), periodId).run();

    return c.json({
      message: 'Turn started',
      turnState
    }, 201);
  } catch (error) {
    console.error('Start turn error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /teacher/:periodId/end-phase - Force end current phase
gameRouter.post('/teacher/:periodId/end-phase', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current turn state
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');

    if (turnState.phase === 'decision') {
      turnState.phase = 'resolution';
      turnState.timeRemaining = -1;
    }

    // Update turn state
    await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, updated_at = datetime('now')
      WHERE period_id = ?
    `).bind(JSON.stringify(turnState), periodId).run();

    return c.json({
      message: 'Phase ended',
      turnState
    }, 200);
  } catch (error) {
    console.error('End phase error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /teacher/:periodId/pause - Toggle pause
gameRouter.post('/teacher/:periodId/pause', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current turn state
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');
    turnState.isPaused = !turnState.isPaused;

    // Update turn state
    await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, updated_at = datetime('now')
      WHERE period_id = ?
    `).bind(JSON.stringify(turnState), periodId).run();

    return c.json({
      message: `Turn ${turnState.isPaused ? 'paused' : 'resumed'}`,
      turnState
    }, 200);
  } catch (error) {
    console.error('Pause error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /student/:periodId/submit-turn - Submit turn decisions
gameRouter.post('/student/:periodId/submit-turn', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { decision } = await c.req.json();

    // Verify student and period
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Store turn decision
    await c.env.DB.prepare(`
      INSERT INTO turn_decisions (period_id, student_id, decision_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(periodId, user.id, JSON.stringify(decision)).run();

    // Update submission count in turn state
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');

    // Count submissions
    const submissions = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM turn_decisions WHERE period_id = ? AND created_at > datetime("now", "-1 minute")'
    ).bind(periodId).first();

    turnState.submittedCount = (submissions as any)?.count || 1;

    // Update turn state
    await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, updated_at = datetime('now')
      WHERE period_id = ?
    `).bind(JSON.stringify(turnState), periodId).run();

    return c.json({
      message: 'Turn submitted',
      result: { submitted: true, submittedCount: turnState.submittedCount }
    }, 201);
  } catch (error) {
    console.error('Submit turn error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// GET /student/:periodId/turn-state - Get current turn phase, timer, submission count
gameRouter.get('/student/:periodId/turn-state', async (c) => {
  try {
    const periodId = c.req.param('periodId');

    // Get current turn state
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state FROM game_states WHERE period_id = ?'
    ).bind(periodId).first();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');

    // If there's a deadline, calculate remaining time
    if (turnState.deadline) {
      const remaining = Math.max(0, Math.floor((turnState.deadline - Date.now()) / 1000));
      turnState.timeRemaining = remaining;

      // If time expired and phase is still decision, auto-transition to resolution
      if (remaining === 0 && turnState.phase === 'decision') {
        turnState.phase = 'resolution';
        await c.env.DB.prepare(`
          UPDATE game_states
          SET turn_state = ?, updated_at = datetime('now')
          WHERE period_id = ?
        `).bind(JSON.stringify(turnState), periodId).run();
      }
    }

    return c.json(turnState, 200);
  } catch (error) {
    console.error('Get turn state error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});
