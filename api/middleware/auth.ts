import { Context, Next, HonoRequest } from 'hono';
import { verifyToken } from '../utils/crypto';

// Get JWT_SECRET from environment or use fallback
const getJWTSecret = (env?: any): string => {
  return env?.JWT_SECRET || 'your-secret-key-change-in-production';
};

export const authMiddleware = (jwtSecret?: string) => {
  return async (c: Context, next: Next) => {
    const secret = jwtSecret || getJWTSecret(c.env);
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, secret);
      c.set('user', payload);
      await next();
    } catch (error) {
      return c.json({ message: 'Invalid token' }, 401);
    }
  };
};

export const teacherAuthMiddleware = (jwtSecret?: string) => {
  return async (c: Context, next: Next) => {
    const secret = jwtSecret || getJWTSecret(c.env);
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, secret);
      if (payload.role !== 'teacher') {
        return c.json({ message: 'Forbidden: Teacher access required' }, 403);
      }
      c.set('user', payload);
      await next();
    } catch (error) {
      return c.json({ message: 'Invalid token' }, 401);
    }
  };
};

export const studentAuthMiddleware = (jwtSecret?: string) => {
  return async (c: Context, next: Next) => {
    const secret = jwtSecret || getJWTSecret(c.env);
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, secret);
      if (payload.role !== 'student') {
        return c.json({ message: 'Forbidden: Student access required' }, 403);
      }
      c.set('user', payload);
      await next();
    } catch (error) {
      return c.json({ message: 'Invalid token' }, 401);
    }
  };
};

export { getJWTSecret };
