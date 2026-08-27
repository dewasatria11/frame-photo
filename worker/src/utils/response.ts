import type { Context } from 'hono';
import type { AppEnv } from '../types';

export const success = (c: Context<AppEnv>, data: unknown, status = 200) =>
  c.json({ ok: true as const, data }, status as 200);

export const failure = (c: Context<AppEnv>, code: string, message: string, status: number) =>
  c.json({ ok: false as const, error: { code, message }, requestId: c.get('requestId') }, status as 400);
