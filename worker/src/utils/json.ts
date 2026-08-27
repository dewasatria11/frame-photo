import type { Context } from 'hono';
import type { AppEnv } from '../types';

export async function readJson(c: Context<AppEnv>, maxBytes = 64 * 1024): Promise<unknown> {
  const contentType = c.req.header('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') throw new ApiError('UNSUPPORTED_MEDIA_TYPE', 'Content-Type harus application/json.', 415);
  const declared = Number(c.req.header('content-length') ?? 0);
  if (declared > maxBytes) throw new ApiError('PAYLOAD_TOO_LARGE', 'Ukuran permintaan melebihi batas.', 413);
  const text = await c.req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new ApiError('PAYLOAD_TOO_LARGE', 'Ukuran permintaan melebihi batas.', 413);
  try { return JSON.parse(text); } catch { throw new ApiError('INVALID_JSON', 'JSON tidak valid.', 400); }
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
