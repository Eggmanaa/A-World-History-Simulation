import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { teacherRouter } from './routes/teacher';
import { studentRouter } from './routes/student';

// Define bindings for Cloudflare Workers
type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();

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

export { api };
