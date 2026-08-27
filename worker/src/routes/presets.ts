import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { idSchema, presetCreateSchema, presetUpdateSchema } from '../schemas';
import { readJson } from '../utils/json';
import { failure, success } from '../utils/response';

type Row = { id: string; name: string; config_json: string; asset_key: string | null; created_at: string; updated_at: string };
const format = (r: Row) => ({ id: r.id, name: r.name, config: JSON.parse(r.config_json), assetKey: r.asset_key, createdAt: r.created_at, updatedAt: r.updated_at });
export const presets = new Hono<AppEnv>();

presets.get('/', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM presets ORDER BY updated_at DESC LIMIT 200').all<Row>();
  return success(c, rows.results.map(format));
});
presets.post('/', async (c) => {
  const body = presetCreateSchema.safeParse(await readJson(c));
  if (!body.success) return failure(c, 'INVALID_REQUEST', 'Preset tidak valid.', 400);
  const id = body.data.id ?? crypto.randomUUID(), now = new Date().toISOString();
  try {
    await c.env.DB.prepare('INSERT INTO presets (id,name,config_json,asset_key,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .bind(id, body.data.name, JSON.stringify(body.data.config), body.data.assetKey ?? null, now, now).run();
  } catch { return failure(c, 'CONFLICT', 'ID preset sudah digunakan.', 409); }
  return c.json({ ok: true as const, data: { id, ...body.data, assetKey: body.data.assetKey ?? null, createdAt: now, updatedAt: now } }, 201);
});
presets.put('/:id', async (c) => {
  const id = idSchema.safeParse(c.req.param('id'));
  const body = presetUpdateSchema.safeParse(await readJson(c));
  if (!id.success || !body.success) return failure(c, 'INVALID_REQUEST', 'Preset tidak valid.', 400);
  const old = await c.env.DB.prepare('SELECT * FROM presets WHERE id=?').bind(id.data).first<Row>();
  if (!old) return failure(c, 'NOT_FOUND', 'Preset tidak ditemukan.', 404);
  const next = { name: body.data.name ?? old.name, config: body.data.config ?? JSON.parse(old.config_json), assetKey: body.data.assetKey === undefined ? old.asset_key : body.data.assetKey };
  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE presets SET name=?,config_json=?,asset_key=?,updated_at=? WHERE id=?').bind(next.name, JSON.stringify(next.config), next.assetKey, now, id.data).run();
  return success(c, { id: id.data, ...next, createdAt: old.created_at, updatedAt: now });
});
presets.delete('/:id', async (c) => {
  const id = idSchema.safeParse(c.req.param('id'));
  if (!id.success) return failure(c, 'INVALID_REQUEST', 'ID preset tidak valid.', 400);
  const result = await c.env.DB.prepare('DELETE FROM presets WHERE id=?').bind(id.data).run();
  if (!result.meta.changes) return failure(c, 'NOT_FOUND', 'Preset tidak ditemukan.', 404);
  return success(c, { deleted: true });
});
