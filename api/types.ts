// Shared API types for Hono routers.
// Centralizes the Bindings (Cloudflare env) and Variables (per-request context)
// so every route file can do `new Hono<AppEnv>()` and get `c.env.DB` and
// `c.get('user')` typed correctly.

export type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

// Shape of the JWT payload we put on the context via `c.set('user', ...)`.
// `username` is present on student/teacher logins; `role` discriminates routes.
export interface AuthUser {
  id: number | string;
  username?: string;
  role: 'teacher' | 'student';
  [k: string]: unknown;
}

export type Variables = {
  user: AuthUser;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
