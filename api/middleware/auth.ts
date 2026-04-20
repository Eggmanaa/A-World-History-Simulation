import { Context, Next, HonoRequest } from 'hono';
import { verifyToken } from '../utils/crypto';

// Get JWT_SECRET strictly from environment. No hardcoded fallback:
// a missing secret must hard-fail so we never sign or verify tokens with a known value.
const getJWTSecret = (env?: any): string => {
  const secret = env?.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or too short. Set it via wrangler pages secret put JWT_SECRET.');
  }
  return secret;
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
