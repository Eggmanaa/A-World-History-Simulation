import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto';
import { JWT_SECRET } from '../middleware/auth';

type Bindings = {
  DB: D1Database;
};

export const authRouter = new Hono<{ Bindings: Bindings }>();

// Teacher Registration
authRouter.post('/teacher/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    
    // Validation
    if (!name || !email || !password) {
      return c.json({ message: 'All fields are required' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ message: 'Password must be at least 8 characters' }, 400);
    }
    
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM teachers WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ message: 'Email already registered' }, 400);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert teacher
    const result = await c.env.DB.prepare(
      'INSERT INTO teachers (name, email, password_hash) VALUES (?, ?, ?)'
    ).bind(name, email, hashedPassword).run();
    
    // Generate token
    const token = await generateToken({
      id: result.meta.last_row_id,
      email,
      role: 'teacher'
    }, JWT_SECRET);
    
    return c.json({
      message: 'Registration successful',
      token,
      user: { id: result.meta.last_row_id, name, email, role: 'teacher' }
    }, 201);
    
  } catch (error) {
    console.error('Teacher registration error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Teacher Login
authRouter.post('/teacher/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Validation
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400);
    }
    
    // Find teacher
    const teacher = await c.env.DB.prepare(
      'SELECT id, name, email, password_hash FROM teachers WHERE email = ?'
    ).bind(email).first();
    
    if (!teacher) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, teacher.password_hash as string);
    if (!valid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    // Generate token
    const token = await generateToken({
      id: teacher.id,
      email: teacher.email,
      role: 'teacher'
    }, JWT_SECRET);
    
    return c.json({
      message: 'Login successful',
      token,
      user: { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher' }
    });
    
  } catch (error) {
    console.error('Teacher login error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Student Login
authRouter.post('/student/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    // Validation
    if (!username || !password) {
      return c.json({ message: 'Username and password are required' }, 400);
    }
    
    // Find student
    const student = await c.env.DB.prepare(
      'SELECT id, name, username, password_hash, period_id FROM students WHERE username = ?'
    ).bind(username).first();
    
    if (!student) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, student.password_hash as string);
    if (!valid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }
    
    // Generate token
    const token = await generateToken({
      id: student.id,
      username: student.username,
      role: 'student',
      periodId: student.period_id
    }, JWT_SECRET);
    
    return c.json({
      message: 'Login successful',
      token,
      user: { 
        id: student.id, 
        name: student.name, 
        username: student.username, 
        role: 'student',
        periodId: student.period_id
      }
    });
    
  } catch (error) {
    console.error('Student login error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});

// Student Join with Invite Code
authRouter.post('/student/join', async (c) => {
  try {
    const { username, name, password, inviteCode } = await c.req.json();
    
    // Validation
    if (!username || !name || !password || !inviteCode) {
      return c.json({ message: 'All fields are required' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ message: 'Password must be at least 6 characters' }, 400);
    }
    
    // Check if username already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM students WHERE username = ?'
    ).bind(username).first();
    
    if (existing) {
      return c.json({ message: 'Username already taken' }, 400);
    }
    
    // Validate invite code and get period
    const invite = await c.env.DB.prepare(`
      SELECT id, teacher_id, period_id, uses_remaining 
      FROM invite_codes 
      WHERE code = ? AND uses_remaining > 0
    `).bind(inviteCode.toUpperCase()).first();
    
    if (!invite) {
      return c.json({ message: 'Invalid or expired invite code' }, 400);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert student
    const result = await c.env.DB.prepare(`
      INSERT INTO students (name, username, password_hash, teacher_id, period_id) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(name, username, hashedPassword, invite.teacher_id, invite.period_id).run();
    
    // Decrement invite code uses
    await c.env.DB.prepare(
      'UPDATE invite_codes SET uses_remaining = uses_remaining - 1 WHERE id = ?'
    ).bind(invite.id).run();
    
    // Generate token
    const token = await generateToken({
      id: result.meta.last_row_id,
      username,
      role: 'student',
      periodId: invite.period_id
    }, JWT_SECRET);
    
    return c.json({
      message: 'Successfully joined!',
      token,
      user: { 
        id: result.meta.last_row_id, 
        name, 
        username, 
        role: 'student',
        periodId: invite.period_id
      }
    }, 201);
    
  } catch (error) {
    console.error('Student join error:', error);
    return c.json({ message: 'Internal server error' }, 500);
  }
});
