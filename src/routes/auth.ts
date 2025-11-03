import { Hono } from 'hono'
import type { Bindings } from '../types'
import { generateId, hashPassword, verifyPassword, generateInviteCode } from '../db'

const auth = new Hono<{ Bindings: Bindings }>()

// Teacher Registration
auth.post('/teacher/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }
    
    const db = c.env.DB
    
    // Check if email exists
    const existing = await db.prepare(
      'SELECT id FROM teachers WHERE email = ?'
    ).bind(email).first()
    
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400)
    }
    
    // Create teacher account
    const teacherId = generateId()
    const passwordHash = await hashPassword(password)
    const now = Date.now()
    
    await db.prepare(
      'INSERT INTO teachers (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(teacherId, email, passwordHash, name || null, now).run()
    
    return c.json({
      success: true,
      teacher: {
        id: teacherId,
        email,
        name
      }
    })
  } catch (error) {
    console.error('Teacher registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Teacher Login
auth.post('/teacher/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get teacher
    const teacher = await db.prepare(
      'SELECT id, email, password_hash, name FROM teachers WHERE email = ?'
    ).bind(email).first()
    
    if (!teacher) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Verify password
    const valid = await verifyPassword(password, teacher.password_hash as string)
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    return c.json({
      success: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name
      }
    })
  } catch (error) {
    console.error('Teacher login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Student Registration (with invite code)
auth.post('/student/register', async (c) => {
  try {
    const { email, password, name, inviteCode } = await c.req.json()
    
    if (!email || !password || !name || !inviteCode) {
      return c.json({ error: 'All fields required' }, 400)
    }
    
    const db = c.env.DB
    
    // Check if email exists
    const existing = await db.prepare(
      'SELECT id FROM students WHERE email = ?'
    ).bind(email).first()
    
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400)
    }
    
    // Validate invite code and get period
    const period = await db.prepare(
      'SELECT id, teacher_id, name FROM periods WHERE invite_code = ? AND archived = FALSE'
    ).bind(inviteCode.toUpperCase()).first()
    
    if (!period) {
      return c.json({ error: 'Invalid or expired invite code' }, 400)
    }
    
    // Create student account
    const studentId = generateId()
    const passwordHash = await hashPassword(password)
    const now = Date.now()
    
    await db.prepare(
      'INSERT INTO students (id, email, password_hash, name, period_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(studentId, email, passwordHash, name, period.id, now).run()
    
    return c.json({
      success: true,
      student: {
        id: studentId,
        email,
        name,
        period_id: period.id,
        period_name: period.name
      }
    })
  } catch (error) {
    console.error('Student registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Student Login
auth.post('/student/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }
    
    const db = c.env.DB
    
    // Get student with period info
    const student = await db.prepare(`
      SELECT s.id, s.email, s.password_hash, s.name, s.period_id,
             p.name as period_name
      FROM students s
      JOIN periods p ON s.period_id = p.id
      WHERE s.email = ?
    `).bind(email).first()
    
    if (!student) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Verify password
    const valid = await verifyPassword(password, student.password_hash as string)
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    return c.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        period_id: student.period_id,
        period_name: student.period_name
      }
    })
  } catch (error) {
    console.error('Student login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

export default auth
