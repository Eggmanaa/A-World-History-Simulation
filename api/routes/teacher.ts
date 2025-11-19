import { Hono } from 'hono';
import { teacherAuthMiddleware } from '../middleware/auth';
import { generateInviteCode } from '../utils/crypto';

type Bindings = {
  DB: D1Database;
};

export const teacherRouter = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all teacher routes
teacherRouter.use('/*', teacherAuthMiddleware);

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
    
    // Get student count per period
    const studentCounts = await c.env.DB.prepare(`
      SELECT period_id, COUNT(*) as count 
      FROM students 
      WHERE teacher_id = ? 
      GROUP BY period_id
    `).bind(user.id).all();
    
    return c.json({
      teacher,
      periods: periods.results,
      studentCounts: studentCounts.results
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
    const { name, startYear, endYear } = await c.req.json();
    
    if (!name || !startYear || !endYear) {
      return c.json({ message: 'All fields are required' }, 400);
    }
    
    if (startYear >= endYear) {
      return c.json({ message: 'Start year must be before end year' }, 400);
    }
    
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
