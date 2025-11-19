import { Context, Next } from 'hono';
import { verifyToken } from '../utils/crypto';

const JWT_SECRET = 'your-secret-key-change-in-production'; // Should be in environment variables

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyToken(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ message: 'Invalid token' }, 401);
  }
}

export async function teacherAuthMiddleware(c: Context, next: Next) {
  await authMiddleware(c, async () => {
    const user = c.get('user');
    if (user.role !== 'teacher') {
      return c.json({ message: 'Forbidden: Teacher access required' }, 403);
    }
    await next();
  });
}

export async function studentAuthMiddleware(c: Context, next: Next) {
  await authMiddleware(c, async () => {
    const user = c.get('user');
    if (user.role !== 'student') {
      return c.json({ message: 'Forbidden: Student access required' }, 403);
    }
    await next();
  });
}

export { JWT_SECRET };
