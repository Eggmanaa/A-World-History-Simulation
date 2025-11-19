import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { api } from '../api';

// Define bindings for Cloudflare Workers
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  credentials: true
}));

// Mount API routes
app.route('/api', api);

// Serve static files from dist directory
app.use('/*', serveStatic({ root: './' }));

// Fallback to index.html for client-side routing
app.get('*', serveStatic({ path: './index.html' }));

export default app;
