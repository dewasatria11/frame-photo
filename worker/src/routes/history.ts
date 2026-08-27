import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { historySchema } from '../schemas';
import { readJson } from '../utils/json';
import { failure, success } from '../utils/response';

export const history = new Hono<AppEnv>();
history.get('/', async (c) => {
  const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), cursor: z.string().datetime().optional() }).safeParse(c.req.query());
  if (!query.success) return failure(c, 'INVALID_REQUEST', 'Parameter history tidak valid.', 400);
  const sql = query.data.cursor
    ? 'SELECT * FROM processing_history WHERE created_at < ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM processing_history ORDER BY created_at DESC LIMIT ?';
  const stmt = query.data.cursor ? c.env.DB.prepare(sql).bind(query.data.cursor, query.data.limit + 1) : c.env.DB.prepare(sql).bind(query.data.limit + 1);
  const rows = await stmt.all<Record<string, unknown>>();
  const more = rows.results.length > query.data.limit;
  const items = rows.results.slice(0, query.data.limit).map((r) => ({ id:r.id, sourceFilename:r.source_filename, outputFilename:r.output_filename, status:r.status, durationMs:r.duration_ms, settings:r.settings_json ? JSON.parse(r.settings_json as string) : null, errorMessage:r.error_message, createdAt:r.created_at }));
  return success(c, { items, nextCursor: more ? items.at(-1)?.createdAt : null });
});
history.post('/', async (c) => {
  const body = historySchema.safeParse(await readJson(c));
  if (!body.success) return failure(c, 'INVALID_REQUEST', 'Riwayat tidak valid.', 400);
  const d = body.data, id = d.id ?? crypto.randomUUID(), createdAt = new Date().toISOString();
  await c.env.DB.prepare('INSERT INTO processing_history (id,source_filename,output_filename,status,duration_ms,settings_json,error_message,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(id,d.sourceFilename,d.outputFilename ?? null,d.status,d.durationMs ?? null,d.settings ? JSON.stringify(d.settings) : null,d.errorMessage ?? null,createdAt).run();
  return c.json({ ok:true as const, data:{ id, createdAt } }, 201);
});
history.delete('/', async (c) => {
  const before = c.req.query('before');
  if (before && !z.string().datetime().safeParse(before).success) return failure(c, 'INVALID_REQUEST', 'Tanggal tidak valid.', 400);
  const result = before ? await c.env.DB.prepare('DELETE FROM processing_history WHERE created_at < ?').bind(before).run() : await c.env.DB.prepare('DELETE FROM processing_history').run();
  return success(c, { deleted: result.meta.changes });
});
