import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { teacherAuthMiddleware, studentAuthMiddleware } from '../middleware/auth';
import { TIMELINE_EVENTS, CIV_PRESETS, SCORING_TRACKS, calculateFinalScore } from '../../constants';
import type { GameState, StatKey } from '../../types';

export const gameRouter = new Hono<AppEnv>();

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
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Check if game state already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    if (existing) {
      return c.json({ message: 'Game already started for this period' }, 400);
    }

    // Get all students in period with their game sessions
    const students = await c.env.DB.prepare(`
      SELECT s.id, s.name, gs.civilization_id
      FROM students s
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.period_id = ?
    `).bind(periodId).all<any>();

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
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

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

      // Conditional update: only succeed if timeline_index is still what we
      // read. Prevents two teacher tabs from both clicking "Advance" and
      // double-skipping an event.
      const advanceRes = await c.env.DB.prepare(`
        UPDATE game_states
        SET timeline_index = ?, current_year = ?, event_log = ?, updated_at = datetime('now')
        WHERE period_id = ? AND timeline_index = ?
      `).bind(timelineIndex, currentYear, JSON.stringify(eventLog), periodId, gameState.timeline_index).run();

      if (((advanceRes.meta as any) || {}).changes === 0) {
        return c.json({ message: 'Timeline already advanced in another tab. Please refresh.' }, 409);
      }

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
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

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
    `).bind(periodId).all<any>();

    // Get pending actions
    const pendingActions = await c.env.DB.prepare(`
      SELECT * FROM pending_actions
      WHERE period_id = ? AND status = 'pending'
      ORDER BY created_at DESC
    `).bind(periodId).all<any>();

    // Missed-turn counts per student. Try/catch for pre-migration DBs
    // that don't have the status column yet.
    const missedByStudent: Record<string, number> = {};
    try {
      const missedRows = await c.env.DB.prepare(`
        SELECT student_id AS studentId, COUNT(*) AS c
        FROM turn_decisions
        WHERE period_id = ? AND status = 'missed'
        GROUP BY student_id
      `).bind(periodId).all<any>();
      for (const r of (missedRows?.results || []) as any[]) {
        missedByStudent[String(r.studentId)] = r.c as number;
      }
    } catch {
      // migration 0006 not yet applied — everyone gets 0.
    }

    const civStates = sessions.results.map((session: any) => {
      const progressData = session.progress_data ? JSON.parse(session.progress_data) : {};
      // Compute live Final Score so the teacher dashboard can show rankings
      // without any extra round-trip. calculateFinalScore is defensive —
      // missing fields fall back to 0, so newly-created civs return a zero
      // score cleanly.
      let finalScore = { total: 0, breakdown: [], milestones: 0 };
      try {
        finalScore = calculateFinalScore(progressData);
      } catch (e) {
        // swallow — prefer to return the rest of the overview than 500 the
        // whole dashboard over a malformed progress_data blob.
      }
      return {
        studentId: session.id,
        studentName: session.name,
        civilizationId: session.civilization_id || 'egypt',
        wars: progressData.wars || [],
        alliances: progressData.alliances || [],
        wondersBuilt: progressData.wondersBuilt || [],
        population: progressData.population || 0,
        stats: progressData.stats || {},
        finalScore,
        missedTurns: missedByStudent[String(session.id)] || 0,
        // MP-readiness: surface wonder progress so the dashboard can
        // show 'X/Y on the Pyramids' badges even when the wonder isn't
        // yet built. builtWonderId is the completed wonder id (or null).
        wonderInProgress: progressData.wonderInProgress || null,
        builtWonderId: progressData.builtWonderId || null,
        totalAttacksInitiated: progressData.totalAttacksInitiated || 0,
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
    const { actionId, result } = await c.req.json() as any;

    if (!actionId || !result || !['attacker_wins', 'defender_wins', 'stalemate'].includes(result)) {
      return c.json({ message: 'Invalid action or result' }, 400);
    }

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get pending action
    const action = await c.env.DB.prepare(
      'SELECT * FROM pending_actions WHERE id = ? AND period_id = ?'
    ).bind(actionId, periodId).first<any>();

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
      ).bind(actionData.attackerId).first<any>();

      const defender = await c.env.DB.prepare(
        'SELECT progress_data FROM game_sessions WHERE student_id = ?'
      ).bind(actionData.defenderId).first<any>();

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
    const { name, description, affectedCivIds, statModifications } = await c.req.json() as any;

    if (!name || !description) {
      return c.json({ message: 'Name and description are required' }, 400);
    }

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

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
        ).bind(periodId, civId).first<any>();

        if (student) {
          const session = await c.env.DB.prepare(
            'SELECT progress_data FROM game_sessions WHERE student_id = ?'
          ).bind(civId).first<any>();

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
    const { message, type } = await c.req.json() as any;
    if (!message || !['info', 'warning', 'pause'].includes(type)) {
      return c.json({ message: 'Message and valid type required' }, 400);
    }
    const period = await c.env.DB.prepare('SELECT id FROM periods WHERE id = ? AND teacher_id = ?').bind(periodId, user.id).first<any>();
    if (!period) return c.json({ message: 'Period not found' }, 404);
    const gameState = await c.env.DB.prepare('SELECT * FROM game_states WHERE period_id = ?').bind(periodId).first<any>();
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
    const period = await c.env.DB.prepare('SELECT id FROM periods WHERE id = ? AND teacher_id = ?').bind(periodId, user.id).first<any>();
    if (!period) return c.json({ message: 'Period not found' }, 404);
    const gameState = await c.env.DB.prepare('SELECT * FROM game_states WHERE period_id = ?').bind(periodId).first<any>();
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
    const gameState = await c.env.DB.prepare('SELECT event_log, game_data FROM game_states WHERE period_id = ?').bind(periodId).first<any>();
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

// GET /student/me/session - returns the logged-in student's session record.
// The client uses this right after login to discover the student's periodId
// and civilization without having to be handed a periodId through some
// external channel. (Was a missing primitive called out in the multiplayer
// sync audit — every other student poll assumed periodId was already known.)
gameRouter.get('/student/me/session', async (c) => {
  try {
    const user = c.get('user');
    const row = await c.env.DB.prepare(`
      SELECT s.id AS studentId, s.name AS studentName, s.period_id AS periodId,
             p.name AS periodName, p.current_year AS currentYear,
             gs.civilization_id AS civilizationId, gs.progress_data AS progressData
      FROM students s
      JOIN periods p ON s.period_id = p.id
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.id = ?
    `).bind(user.id).first<any>();

    if (!row) {
      return c.json({ message: 'Student not found' }, 404);
    }

    return c.json({
      studentId: (row as any).studentId,
      studentName: (row as any).studentName,
      periodId: (row as any).periodId,
      periodName: (row as any).periodName,
      currentYear: (row as any).currentYear,
      civilizationId: (row as any).civilizationId || null,
      progressData: (row as any).progressData ? JSON.parse((row as any).progressData) : null,
    }, 200);
  } catch (error) {
    console.error('Get student session error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// GET /game/:periodId/state - Student polls for current game state
gameRouter.get('/student/:periodId/state', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Get student info
    const student = await c.env.DB.prepare(
      'SELECT id, period_id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    // Get student's game session
    const session = await c.env.DB.prepare(
      'SELECT * FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first<any>();

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
    `).bind(periodId, user.id).all<any>();

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
    const { actionType, actionData } = await c.req.json() as any;

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
    ).bind(user.id, periodId).first<any>();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get game state for validation
    const gameState = await c.env.DB.prepare(
      'SELECT timeline_index FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

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
      ).bind(user.id).first<any>();

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
    const { progressData } = await c.req.json() as any;

    if (!progressData) {
      return c.json({ message: 'Progress data is required' }, 400);
    }

    // Verify student and period
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Get or create game session
    const session = await c.env.DB.prepare(
      'SELECT id FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first<any>();

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
    const { timerMinutes } = await c.req.json() as any;

    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get all students in period
    const students = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM students WHERE period_id = ?'
    ).bind(periodId).first<any>();

    const totalPlayers = (students as any).count || 1;
    const deadline = Date.now() + (timerMinutes || 5) * 60 * 1000;

    // Read current turn_number so we can stamp this turn correctly and so
    // turn_decisions rows key against the right turn.
    const current = await c.env.DB.prepare(
      'SELECT turn_number, turn_state_version FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();
    if (!current) {
      return c.json({ message: 'Game not started' }, 400);
    }
    const nextTurnNumber = ((current as any).turn_number || 0) + 1;
    const expectedVersion = (current as any).turn_state_version || 0;

    // Create turn state
    const turnState = {
      number: nextTurnNumber,
      phase: 'decision',
      timeRemaining: (timerMinutes || 5) * 60,
      submittedCount: 0,
      totalPlayers,
      isPaused: false,
      deadline
    };

    // Atomic: only advance the turn if version still matches what we read.
    // If a second tab raced us, we bail with 409 rather than silently
    // clobbering their newer state.
    const startRes = await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, turn_number = ?,
          turn_state_version = turn_state_version + 1,
          updated_at = datetime('now')
      WHERE period_id = ? AND turn_state_version = ?
    `).bind(JSON.stringify(turnState), nextTurnNumber, periodId, expectedVersion).run();

    if (((startRes.meta as any) || {}).changes === 0) {
      return c.json({ message: 'Turn state changed in another tab. Please refresh.' }, 409);
    }

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
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current turn state + version for optimistic concurrency.
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state, turn_state_version FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');
    const expectedVersion = ((gameState as any)?.turn_state_version) || 0;

    // Capture turn number BEFORE we flip state, so we know which turn
    // to record misses against.
    const currentTurnForMisses = await c.env.DB.prepare(
      'SELECT turn_number FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();
    const missTurn = (currentTurnForMisses as any)?.turn_number || 0;

    if (turnState.phase === 'decision') {
      turnState.phase = 'resolution';
      turnState.timeRemaining = -1;
    }

    // Conditional update — another click (e.g. timer auto-transition)
    // between our read and write is detected and rejected.
    const endRes = await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, turn_state_version = turn_state_version + 1,
          updated_at = datetime('now')
      WHERE period_id = ? AND turn_state_version = ?
    `).bind(JSON.stringify(turnState), periodId, expectedVersion).run();

    if (((endRes.meta as any) || {}).changes === 0) {
      return c.json({ message: 'Turn state changed in another tab. Please refresh.' }, 409);
    }

    // Record 'missed' rows for every student who didn't submit this turn.
    // Best-effort: a DB hiccup here should not fail the phase flip the
    // teacher just performed. We only run this on a real phase flip
    // (missTurn > 0) and skip if the migration hasn't been applied yet
    // (catch the 'no such column: status' error silently).
    let missedCount = 0;
    if (missTurn > 0) {
      try {
        const absent = await c.env.DB.prepare(`
          SELECT s.id AS student_id
          FROM students s
          WHERE s.period_id = ?
            AND NOT EXISTS (
              SELECT 1 FROM turn_decisions td
              WHERE td.period_id = s.period_id
                AND td.student_id = s.id
                AND td.turn_number = ?
            )
        `).bind(periodId, missTurn).all<any>();
        const rows = (absent?.results || []) as any[];
        for (const r of rows) {
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO turn_decisions
              (period_id, student_id, turn_number, decision_data, status, created_at)
            VALUES (?, ?, ?, '{}', 'missed', datetime('now'))
          `).bind(periodId, r.student_id, missTurn).run();
          missedCount++;
        }
      } catch (missErr) {
        // Migration 0006 not applied yet, or transient DB error. Don't
        // fail the phase flip; the teacher already clicked.
        console.warn('Missed-turn recording skipped:', missErr);
      }
    }

    return c.json({
      message: 'Phase ended',
      turnState,
      missedCount,
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
    ).bind(periodId, user.id).first<any>();

    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }

    // Get current turn state + version for optimistic concurrency.
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state, turn_state_version FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');
    const expectedVersion = ((gameState as any)?.turn_state_version) || 0;
    turnState.isPaused = !turnState.isPaused;

    // Conditional update — if something else bumped the version (e.g. a
    // submit-turn mirror write) we bail instead of stomping its changes.
    const pauseRes = await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, turn_state_version = turn_state_version + 1,
          updated_at = datetime('now')
      WHERE period_id = ? AND turn_state_version = ?
    `).bind(JSON.stringify(turnState), periodId, expectedVersion).run();

    if (((pauseRes.meta as any) || {}).changes === 0) {
      return c.json({ message: 'Turn state changed in another tab. Please refresh.' }, 409);
    }

    return c.json({
      message: `Turn ${turnState.isPaused ? 'paused' : 'resumed'}`,
      turnState
    }, 200);
  } catch (error) {
    console.error('Pause error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// GET /student/:periodId/missed-turns - Turns this student needs to make up.
//
// Returns rows with status='missed' for the calling student in the period.
// Empty array means no make-ups outstanding. Students without the status
// column (migration 0006 not applied) get an empty list.
gameRouter.get('/student/:periodId/missed-turns', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify student belongs to period.
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();
    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    try {
      const rows = await c.env.DB.prepare(`
        SELECT turn_number AS turnNumber, created_at AS createdAt
        FROM turn_decisions
        WHERE period_id = ? AND student_id = ? AND status = 'missed'
        ORDER BY turn_number ASC
      `).bind(periodId, user.id).all<any>();
      return c.json({ missedTurns: rows?.results || [] }, 200);
    } catch (e) {
      // Pre-migration fallback: column doesn't exist yet.
      return c.json({ missedTurns: [] }, 200);
    }
  } catch (error) {
    console.error('Missed-turns fetch error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /student/:periodId/makeup-turn - Submit a decision for a past missed turn.
//
// Requires the student to have an existing turn_decisions row with
// status='missed' for the target turnNumber. Flips it to 'made_up' and
// writes decision_data. Separate endpoint from submit-turn because:
//   - submit-turn requires phase === 'decision' (rejected for past turns)
//   - make-ups happen AFTER the phase has ended, often turns later
//   - semantics of the combat log differ (catch-up tag)
gameRouter.post('/student/:periodId/makeup-turn', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { turnNumber, decision } = await c.req.json() as any;

    if (typeof turnNumber !== 'number' || turnNumber < 1) {
      return c.json({ message: 'Missing or invalid turnNumber' }, 400);
    }

    // Verify student belongs to period.
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();
    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Must have an outstanding 'missed' row to make up. This enforces the
    // invariant: no retroactive submissions for turns the student already
    // submitted on time, and no make-ups for turns they weren't absent for.
    const missed = await c.env.DB.prepare(
      `SELECT id, status FROM turn_decisions
       WHERE period_id = ? AND student_id = ? AND turn_number = ?`
    ).bind(periodId, user.id, turnNumber).first<any>();

    if (!missed) {
      return c.json({ message: 'No missed-turn record for this turn' }, 404);
    }
    if ((missed as any).status !== 'missed') {
      return c.json({ message: 'Turn is not eligible for make-up' }, 409);
    }

    // Flip status to 'made_up' and write the student's decision. Keyed
    // by row id so we update exactly the matched row.
    const upd = await c.env.DB.prepare(`
      UPDATE turn_decisions
      SET status = 'made_up',
          decision_data = ?,
          created_at = datetime('now')
      WHERE id = ? AND status = 'missed'
    `).bind(JSON.stringify(decision || {}), (missed as any).id).run();

    if (((upd.meta as any) || {}).changes === 0) {
      return c.json({ message: 'Make-up raced with another write. Retry.' }, 409);
    }

    return c.json({
      message: 'Make-up turn recorded',
      turnNumber,
      status: 'made_up',
    }, 200);
  } catch (error) {
    console.error('Make-up turn error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// POST /student/:periodId/submit-turn - Submit turn decisions
gameRouter.post('/student/:periodId/submit-turn', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { decision } = await c.req.json() as any;

    // Verify student and period
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();

    if (!student) {
      return c.json({ message: 'Student not found in this period' }, 404);
    }

    // Read current turn scope. We reject submissions outside the decision
    // phase so a student can't sneak a decision in after the teacher ends it.
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state, turn_number, turn_state_version FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    if (!gameState) {
      return c.json({ message: 'Game not started' }, 400);
    }

    const turnNumber = (gameState as any).turn_number || 0;
    const turnState = JSON.parse((gameState as any).turn_state || '{}');

    if (turnNumber === 0 || turnState.phase !== 'decision') {
      return c.json({ message: 'Not in decision phase' }, 409);
    }

    // Idempotent upsert keyed on (period, student, turn). UNIQUE + REPLACE
    // means a double-clicked submit never inflates the count; it just
    // overwrites the prior row for the same turn.
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO turn_decisions (period_id, student_id, turn_number, decision_data, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(periodId, user.id, turnNumber, JSON.stringify(decision)).run();

    // Count for *this* turn from truth, not from a drifty JSON counter.
    const submissions = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM turn_decisions WHERE period_id = ? AND turn_number = ?'
    ).bind(periodId, turnNumber).first<any>();
    const submittedCount = (submissions as any)?.count || 0;

    // Mirror the count into turn_state so polling clients see it. Use
    // optimistic concurrency; a miss here is cosmetic (count is still
    // authoritative in turn_decisions).
    turnState.submittedCount = submittedCount;
    const expectedVersion = (gameState as any).turn_state_version || 0;
    await c.env.DB.prepare(`
      UPDATE game_states
      SET turn_state = ?, turn_state_version = turn_state_version + 1,
          updated_at = datetime('now')
      WHERE period_id = ? AND turn_state_version = ?
    `).bind(JSON.stringify(turnState), periodId, expectedVersion).run();

    return c.json({
      message: 'Turn submitted',
      result: { submitted: true, submittedCount }
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

    // Get current turn state + version. We need the version so the
    // auto-transition below can be done atomically when 25 students all
    // poll in the same second after the timer hits zero.
    const gameState = await c.env.DB.prepare(
      'SELECT turn_state, turn_state_version FROM game_states WHERE period_id = ?'
    ).bind(periodId).first<any>();

    const turnState = JSON.parse((gameState as any)?.turn_state || '{}');

    // If there's a deadline, calculate remaining time
    if (turnState.deadline) {
      const remaining = Math.max(0, Math.floor((turnState.deadline - Date.now()) / 1000));
      turnState.timeRemaining = remaining;

      // If time expired and phase is still decision, *try* to auto-transition.
      // Conditional on version: exactly one poll wins; the rest just return
      // the resolution-phase state without double-writing.
      if (remaining === 0 && turnState.phase === 'decision') {
        const expectedVersion = ((gameState as any)?.turn_state_version) || 0;
        turnState.phase = 'resolution';
        await c.env.DB.prepare(`
          UPDATE game_states
          SET turn_state = ?, turn_state_version = turn_state_version + 1,
              updated_at = datetime('now')
          WHERE period_id = ? AND turn_state_version = ?
        `).bind(JSON.stringify(turnState), periodId, expectedVersion).run();
      }
    }

    return c.json(turnState, 200);
  } catch (error) {
    console.error('Get turn state error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// ============================================================================
// LIVE LEADERBOARD — accessible to students (and teachers via same route)
// ============================================================================
// Returns all civs in a period sorted by Final Score. Drives the in-game
// scoreboard tab's "Live Leaderboard" panel so every student can see how
// their total compares to the rest of the class in real time. Poll this
// every ~10s from the client (not too fast — a 30-student classroom
// hitting a 5s poll would be chatty for no real benefit).
gameRouter.get('/student/:periodId/leaderboard', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');

    // Verify the requesting student belongs to this period. Teachers can
    // also hit this endpoint (same path) but will fail the student middleware
    // — they have the /teacher/*overview path for their dashboard.
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND period_id = ?'
    ).bind(user.id, periodId).first<any>();

    if (!student) {
      return c.json({ message: 'Not a member of this period' }, 403);
    }

    const sessions = await c.env.DB.prepare(`
      SELECT s.id, s.name, gs.civilization_id, gs.progress_data
      FROM students s
      LEFT JOIN game_sessions gs ON s.id = gs.student_id
      WHERE s.period_id = ?
    `).bind(periodId).all<any>();

    const rows = sessions.results.map((session: any) => {
      const progressData = session.progress_data ? JSON.parse(session.progress_data) : {};
      let finalScore = { total: 0, breakdown: [] as any[], milestones: 0 };
      try {
        finalScore = calculateFinalScore(progressData);
      } catch (e) {
        // Keep zero-score on parse failure; don't break the leaderboard.
      }
      return {
        studentId: session.id,
        studentName: session.name,
        civilizationId: session.civilization_id || 'egypt',
        total: finalScore.total,
        breakdown: finalScore.breakdown,
        milestones: finalScore.milestones,
        isYou: session.id === user.id,
      };
    });

    // Sort descending; ties are broken by studentId for stability so the
    // UI doesn't reshuffle every poll on equal scores.
    rows.sort((a: any, b: any) => b.total - a.total || a.studentId - b.studentId);

    // Award ranks (1-indexed). Tied scores share a rank.
    let lastScore = -1;
    let lastRank = 0;
    rows.forEach((r: any, i: number) => {
      if (r.total !== lastScore) {
        lastRank = i + 1;
        lastScore = r.total;
      }
      r.rank = lastRank;
    });

    return c.json({ periodId, rows }, 200);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});
