import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { api } from '../api';

// Define bindings for Cloudflare Workers
type Bindings = {
  DB: D1Database;
  ASSETS: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  credentials: true
}));

// Mount API routes
app.route('/api', api);

// Serve static assets for everything else
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
