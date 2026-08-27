import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';
import { failure } from '../utils/response';

const counters = new Map<string, { count: number; reset: number }>();
const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function origins(raw: string | undefined): Set<string> {
  return new Set((raw ?? '').split(',').map((v) => v.trim()).filter(Boolean).map((v) => {
    try { return new URL(v).origin; } catch { return ''; }
  }).filter(Boolean));
}

export const security = createMiddleware<AppEnv>(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  const allowed = origins(c.env.ALLOWED_ORIGINS);
  const origin = c.req.header('origin');
  const isAllowed = !!origin && allowed.has(origin);
  if (origin && isAllowed) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    c.header('Access-Control-Max-Age', '86400');
  }
  if (c.req.method === 'OPTIONS') {
    if (!isAllowed) return failure(c, 'ORIGIN_NOT_ALLOWED', 'Origin tidak diizinkan.', 403);
    return c.body(null, 204);
  }
  if (WRITE.has(c.req.method) && !isAllowed) return failure(c, 'ORIGIN_NOT_ALLOWED', 'Origin tidak diizinkan.', 403);

  if (WRITE.has(c.req.method)) {
    const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
    const key = `${ip}:${Math.floor(Date.now() / 60_000)}`;
    const item = counters.get(key) ?? { count: 0, reset: Date.now() + 60_000 };
    item.count += 1;
    counters.set(key, item);
    if (counters.size > 2000) for (const [k, v] of counters) if (v.reset < Date.now()) counters.delete(k);
    c.header('RateLimit-Limit', '60');
    c.header('RateLimit-Remaining', String(Math.max(0, 60 - item.count)));
    if (item.count > 60) return failure(c, 'RATE_LIMITED', 'Terlalu banyak permintaan. Coba lagi nanti.', 429);
  }
  await next();
});
