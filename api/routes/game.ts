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
