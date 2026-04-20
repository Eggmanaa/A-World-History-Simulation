import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { api } from '../api';

// Define bindings for Cloudflare Workers/Pages
interface Bindings {
  DB?: D1Database;
  ASSETS?: { fetch(req: Request): Promise<Response> };
}

type HonoEnv = {
  Bindings: Bindings;
};

const app = new Hono<HonoEnv>();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  credentials: true
}));

// Mount API routes
app.route('/api', api);

// Serve static assets for everything else (Cloudflare Pages)
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  // Fallback if ASSETS binding is not available
  return c.text('Not Found', 404);
});

export default app;
