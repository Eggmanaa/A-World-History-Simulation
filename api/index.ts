import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { teacherRouter } from './routes/teacher';
import { studentRouter } from './routes/student';
import { gameRouter } from './routes/game';
import { diplomacyRouter } from './routes/diplomacy';
import type { AppEnv } from './types';

const api = new Hono<AppEnv>();

// Enable CORS
api.use('/*', cors({
  origin: '*',
  credentials: true
}));

// Health check
api.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'API is running' });
});

// Mount routers
api.route('/auth', authRouter);
api.route('/teacher', teacherRouter);
api.route('/student', studentRouter);
api.route('/game', gameRouter);
api.route('/diplomacy', diplomacyRouter);

export { api };
