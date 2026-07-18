import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { teacherAuthMiddleware } from '../middleware/auth';
import { generateInviteCode } from '../utils/crypto';

export const teacherRouter = new Hono<AppEnv>();

// Apply authentication middleware to all teacher routes
teacherRouter.use('/*', teacherAuthMiddleware());

// Get dashboard data
teacherRouter.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');
    
    // Get teacher info
    const teacher = await c.env.DB.prepare(
      'SELECT id, name, email FROM teachers WHERE id = ?'
    ).bind(user.id).first();
    
    // Get periods
    const periods = await c.env.DB.prepare(`
      SELECT id, name, start_year, end_year, current_year, created_at
      FROM periods
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    // Apr 2026 MP fix: pull each student row + their selected civilization
    // (via game_sessions) so the client can render the period roster
    // and gate Start Game on actual roster size. Without this the
    // /dashboard endpoint returned only group-by counts which the
    // TeacherDashboard client wasn't reading, so 'Joined Students (0)'
    // showed even when students had successfully joined.
    const allStudents = await c.env.DB.prepare(`
      SELECT s.id, s.name, s.period_id, gs.civilization_id
      FROM students s
      LEFT JOIN game_sessions gs ON gs.student_id = s.id
      WHERE s.teacher_id = ?
      ORDER BY s.id ASC
    `).bind(user.id).all<any>();

    const studentsByPeriod: Record<string, any[]> = {};
    for (const row of (allStudents?.results || [])) {
      const pid = String(row.period_id);
      if (!studentsByPeriod[pid]) studentsByPeriod[pid] = [];
      studentsByPeriod[pid].push({
        id: row.id,
        name: row.name,
        civId: row.civilization_id || '',
      });
    }

    // isActive: a period is active once its game_states row exists (the
    // teacher clicked Start Game). Previously hardcoded false, which
    // stranded teachers on the Setup tab after any page refresh - Start
    // Game 400'd ('already started') and the Advance Turn button was
    // unreachable, stalling the whole class.
    const activeRows = await c.env.DB.prepare(`
      SELECT gs.period_id
      FROM game_states gs
      JOIN periods p ON p.id = gs.period_id
      WHERE p.teacher_id = ?
    `).bind(user.id).all<any>();
    const activePeriodIds = new Set(
      (activeRows?.results || []).map((r: any) => String(r.period_id))
    );

    // Latest invite code per period so the teacher can re-show it after a
    // refresh instead of generating a fresh one every time.
    const codeRows = await c.env.DB.prepare(`
      SELECT ic.period_id, ic.code
      FROM invite_codes ic
      JOIN periods p ON p.id = ic.period_id
      WHERE p.teacher_id = ? AND ic.uses_remaining > 0
      ORDER BY ic.id ASC
    `).bind(user.id).all<any>();
    const codeByPeriod: Record<string, string> = {};
    for (const r of (codeRows?.results || [])) {
      // ASC iteration means the LAST write per period wins = newest code.
      codeByPeriod[String(r.period_id)] = r.code;
    }

    // Augment each period with roster + isActive + latest invite code.
    const periodsList = (periods.results || []).map((p: any) => ({
      ...p,
      joinedStudents: studentsByPeriod[String(p.id)] || [],
      isActive: activePeriodIds.has(String(p.id)),
      inviteCode: codeByPeriod[String(p.id)] || '',
    }));

    return c.json({
      teacher,
      periods: periodsList,
      studentCounts: Object.entries(studentsByPeriod).map(([pid, list]) => ({
        period_id: Number(pid),
        count: list.length,
      })),
    });
    
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Create period
teacherRouter.post('/periods', async (c) => {
  try {
    const user = c.get('user');
    const { name, startYear: rawStart, endYear: rawEnd } = await c.req.json();

    if (!name) {
      return c.json({ message: 'Period name is required' }, 400);
    }

    const startYear = rawStart || -50000;
    const endYear = rawEnd || 362;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO periods (teacher_id, name, start_year, end_year, current_year) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(user.id, name, startYear, endYear, startYear).run();
    
    return c.json({
      message: 'Period created successfully',
      period: {
        id: result.meta.last_row_id,
        name,
        startYear,
        endYear,
        currentYear: startYear
      }
    }, 201);
    
  } catch (error) {
    console.error('Create period error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Generate invite code
teacherRouter.post('/invite-codes', async (c) => {
  try {
    const user = c.get('user');
    const { periodId, maxUses = 30 } = await c.req.json();
    
    if (!periodId) {
      return c.json({ message: 'Period ID is required' }, 400);
    }
    
    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();
    
    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }
    
    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM invite_codes WHERE code = ?'
      ).bind(code).first();
      
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }
    
    // Insert invite code
    const result = await c.env.DB.prepare(`
      INSERT INTO invite_codes (code, teacher_id, period_id, max_uses, uses_remaining) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(code, user.id, periodId, maxUses, maxUses).run();
    
    return c.json({
      message: 'Invite code created successfully',
      inviteCode: {
        id: result.meta.last_row_id,
        code,
        periodId,
        maxUses,
        usesRemaining: maxUses
      }
    }, 201);
    
  } catch (error) {
    console.error('Create invite code error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Get students for a period
teacherRouter.get('/periods/:periodId/students', async (c) => {
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
    
    // Get students
    const students = await c.env.DB.prepare(`
      SELECT id, name, username, created_at 
      FROM students 
      WHERE period_id = ? 
      ORDER BY name
    `).bind(periodId).all();
    
    return c.json({ students: students.results });
    
  } catch (error) {
    console.error('Get students error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Update timeline (current year)
teacherRouter.patch('/periods/:periodId/timeline', async (c) => {
  try {
    const user = c.get('user');
    const periodId = c.req.param('periodId');
    const { currentYear } = await c.req.json();
    
    if (currentYear === undefined) {
      return c.json({ message: 'Current year is required' }, 400);
    }
    
    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT start_year, end_year FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first();
    
    if (!period) {
      return c.json({ message: 'Period not found' }, 404);
    }
    
    if (currentYear < period.start_year || currentYear > period.end_year) {
      return c.json({ message: 'Year must be within period range' }, 400);
    }
    
    // Update timeline
    await c.env.DB.prepare(
      'UPDATE periods SET current_year = ? WHERE id = ?'
    ).bind(currentYear, periodId).run();
    
    return c.json({ message: 'Timeline updated successfully', currentYear });
    
  } catch (error) {
    console.error('Update timeline error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});
