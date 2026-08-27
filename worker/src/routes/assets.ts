import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { failure, success } from '../utils/response';

const MAX_BYTES = 5 * 1024 * 1024;
const types = new Map([['image/png','png'],['image/jpeg','jpg'],['image/webp','webp'],['image/svg+xml','svg']]);
const assetId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg|webp|svg)$/i;

function signature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b);
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  if (mime === 'image/webp') return new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
  return true;
}

export const assets = new Hono<AppEnv>();
assets.post('/', async (c) => {
  const declared = Number(c.req.header('content-length') ?? 0);
  if (declared > MAX_BYTES + 128 * 1024) return failure(c, 'PAYLOAD_TOO_LARGE', 'Aset maksimal 5 MB.', 413);
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) return failure(c, 'UNSUPPORTED_MEDIA_TYPE', 'Gunakan multipart/form-data.', 415);
  let form: FormData;
  try { form = await c.req.formData(); } catch { return failure(c, 'INVALID_REQUEST', 'Form upload tidak valid.', 400); }
  const file = form.get('file');
  if (!(file instanceof File)) return failure(c, 'INVALID_REQUEST', 'Field file wajib diisi.', 400);
  const mime = file.type.toLowerCase(), extension = types.get(mime);
  if (!extension) return failure(c, 'UNSUPPORTED_MEDIA_TYPE', 'Format aset harus PNG, JPG, WEBP, atau SVG.', 415);
  if (file.size < 1 || file.size > MAX_BYTES) return failure(c, 'PAYLOAD_TOO_LARGE', 'Aset harus berukuran 1 byte sampai 5 MB.', 413);
  const data = new Uint8Array(await file.arrayBuffer());
  if (!signature(data, mime)) return failure(c, 'INVALID_FILE', 'Isi file tidak sesuai dengan MIME.', 400);
  if (mime === 'image/svg+xml') {
    const svg = new TextDecoder().decode(data);
    if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg) || /<(?:script|foreignObject|iframe|object|embed)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|data:|javascript:)/i.test(svg)) {
      return failure(c, 'UNSAFE_SVG', 'SVG mengandung atau menyerupai konten aktif.', 400);
    }
  }
  const id = `${crypto.randomUUID()}.${extension}`, key = `uploads/${id}`;
  await c.env.ASSETS.put(key, data, { httpMetadata: { contentType: mime, cacheControl: 'private, max-age=3600' }, customMetadata: { originalName: file.name.slice(0, 200), uploadedAt: new Date().toISOString() } });
  return c.json({ ok:true as const, data:{ id, mimeType:mime, size:file.size } }, 201);
});
assets.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!assetId.test(id)) return failure(c, 'INVALID_REQUEST', 'ID aset tidak valid.', 400);
  const object = await c.env.ASSETS.get(`uploads/${id}`);
  if (!object) return failure(c, 'NOT_FOUND', 'Aset tidak ditemukan.', 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (headers.get('Content-Type') === 'image/svg+xml') headers.set('Content-Disposition', `attachment; filename="${id}"`);
  return new Response(object.body, { headers });
});
assets.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (!assetId.test(id)) return failure(c, 'INVALID_REQUEST', 'ID aset tidak valid.', 400);
  const key = `uploads/${id}`;
  if (!await c.env.ASSETS.head(key)) return failure(c, 'NOT_FOUND', 'Aset tidak ditemukan.', 404);
  await c.env.ASSETS.delete(key);
  return success(c, { deleted:true });
});
