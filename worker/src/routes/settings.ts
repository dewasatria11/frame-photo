import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { readJson, ApiError } from '../utils/json';
import { failure, success } from '../utils/response';
import { settingsSchema } from '../schemas';

export const settings = new Hono<AppEnv>();

settings.get('/', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value_json, updated_at FROM app_settings ORDER BY key').all<{ key: string; value_json: string; updated_at: string }>();
  const values: Record<string, unknown> = {};
  for (const row of rows.results) {
    try { values[row.key] = JSON.parse(row.value_json); } catch { values[row.key] = null; }
  }
  return success(c, { settings: values, updatedAt: rows.results.reduce((latest, r) => r.updated_at > latest ? r.updated_at : latest, '') || null });
});

settings.put('/', async (c) => {
  const parsed = settingsSchema.safeParse(await readJson(c));
  if (!parsed.success) return failure(c, 'INVALID_REQUEST', 'Pengaturan tidak valid.', 400);
  const now = new Date().toISOString();
  const statements = Object.entries(parsed.data).map(([key, value]) => c.env.DB.prepare(
    `INSERT INTO app_settings (id, key, value_json, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
  ).bind(crypto.randomUUID(), key, JSON.stringify(value), now));
  if (statements.length) await c.env.DB.batch(statements);
  return success(c, { settings: parsed.data, updatedAt: now });
});
