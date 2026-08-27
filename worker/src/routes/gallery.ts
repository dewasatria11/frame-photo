import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types";
import { readJson } from "../utils/json";
import { failure, success } from "../utils/response";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const eventInput = z.object({
  name: z.string().trim().min(2).max(100),
  retentionDays: z.number().int().min(1).max(365).default(30),
});
const photoName = /^[^/\\\u0000-\u001f]{1,180}\.(?:jpe?g|png|webp)$/i;
function validImage(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg")
    return (
      bytes.length > 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes.at(-2) === 0xff &&
      bytes.at(-1) === 0xd9
    );
  if (mime === "image/png")
    return (
      bytes.length > 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every(
        (value, index) => bytes[index] === value,
      )
    );
  return (
    bytes.length > 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}

function token(bytes = 24): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function authorized(
  c: Parameters<typeof success>[0],
  eventId: string,
  rawToken: string | undefined,
) {
  if (!rawToken) return null;
  return c.env.DB.prepare(
    "SELECT id,name,sharing_enabled,expires_at FROM gallery_events WHERE id=? AND token_hash=?",
  )
    .bind(eventId, await hash(rawToken))
    .first<{
      id: string;
      name: string;
      sharing_enabled: number;
      expires_at: string;
    }>();
}

export const gallery = new Hono<AppEnv>();

gallery.post("/events", async (c) => {
  const parsed = eventInput.safeParse(await readJson(c));
  if (!parsed.success)
    return failure(
      c,
      "INVALID_REQUEST",
      "Nama event atau masa retensi tidak valid.",
      400,
    );
  const id = crypto.randomUUID(),
    shareToken = token(),
    now = new Date(),
    expires = new Date(now.getTime() + parsed.data.retentionDays * 86_400_000);
  await c.env.DB.prepare(
    "INSERT INTO gallery_events (id,name,token_hash,sharing_enabled,retention_days,created_at,expires_at) VALUES (?,?,?,?,?,?,?)",
  )
    .bind(
      id,
      parsed.data.name,
      await hash(shareToken),
      1,
      parsed.data.retentionDays,
      now.toISOString(),
      expires.toISOString(),
    )
    .run();
  return success(
    c,
    {
      id,
      name: parsed.data.name,
      token: shareToken,
      sharingEnabled: true,
      retentionDays: parsed.data.retentionDays,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    201,
  );
});

gallery.get("/events", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id,name,sharing_enabled AS sharingEnabled,retention_days AS retentionDays,created_at AS createdAt,expires_at AS expiresAt,(SELECT COUNT(*) FROM gallery_photos p WHERE p.event_id=e.id) AS photoCount FROM gallery_events e ORDER BY created_at DESC LIMIT 100",
  ).all();
  return success(c, { events: rows.results });
});

gallery.put("/events/:id/sharing", async (c) => {
  const parsed = z
    .object({ enabled: z.boolean() })
    .safeParse(await readJson(c));
  if (!parsed.success)
    return failure(c, "INVALID_REQUEST", "Status berbagi tidak valid.", 400);
  const result = await c.env.DB.prepare(
    "UPDATE gallery_events SET sharing_enabled=? WHERE id=?",
  )
    .bind(parsed.data.enabled ? 1 : 0, c.req.param("id"))
    .run();
  if (!result.meta.changes)
    return failure(c, "NOT_FOUND", "Event tidak ditemukan.", 404);
  return success(c, { sharingEnabled: parsed.data.enabled });
});

gallery.post("/events/:id/photos", async (c) => {
  const event = await c.env.DB.prepare(
    "SELECT id FROM gallery_events WHERE id=?",
  )
    .bind(c.req.param("id"))
    .first();
  if (!event) return failure(c, "NOT_FOUND", "Event tidak ditemukan.", 404);
  const declared = Number(c.req.header("content-length") ?? 0);
  if (declared > MAX_PHOTO_BYTES)
    return failure(c, "PAYLOAD_TOO_LARGE", "Foto galeri maksimal 10 MB.", 413);
  const mime = (c.req.header("content-type") ?? "")
    .split(";")[0]!
    .toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
    return failure(
      c,
      "UNSUPPORTED_MEDIA_TYPE",
      "Gunakan JPEG, PNG, atau WEBP.",
      415,
    );
  const encodedName = c.req.header("x-file-name") ?? "";
  let fileName = "";
  try {
    fileName = decodeURIComponent(encodedName);
  } catch {
    return failure(c, "INVALID_REQUEST", "Nama file tidak valid.", 400);
  }
  if (!photoName.test(fileName))
    return failure(c, "INVALID_REQUEST", "Nama file foto tidak valid.", 400);
  const data = await c.req.arrayBuffer();
  if (!data.byteLength || data.byteLength > MAX_PHOTO_BYTES)
    return failure(
      c,
      "PAYLOAD_TOO_LARGE",
      "Foto galeri harus berukuran 1 byte sampai 10 MB.",
      413,
    );
  if (!validImage(new Uint8Array(data), mime))
    return failure(
      c,
      "INVALID_FILE",
      "Isi foto tidak sesuai dengan formatnya.",
      400,
    );
  const id = crypto.randomUUID(),
    key = `events/${c.req.param("id")}/photos/${id}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    createdAt = new Date().toISOString();
  await c.env.ASSETS.put(key, data, {
    httpMetadata: { contentType: mime, cacheControl: "private, max-age=3600" },
    customMetadata: { fileName, eventId: c.req.param("id"), createdAt },
  });
  await c.env.DB.prepare(
    "INSERT INTO gallery_photos (id,event_id,file_name,object_key,mime_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?)",
  )
    .bind(
      id,
      c.req.param("id"),
      fileName,
      key,
      mime,
      data.byteLength,
      createdAt,
    )
    .run();
  return success(c, { id, fileName, size: data.byteLength, createdAt }, 201);
});

gallery.delete("/events/:id", async (c) => {
  const id = c.req.param("id");
  const objects = await c.env.DB.prepare(
    "SELECT object_key FROM gallery_photos WHERE event_id=?",
  )
    .bind(id)
    .all<{ object_key: string }>();
  if (objects.results.length)
    await c.env.ASSETS.delete(objects.results.map((item) => item.object_key));
  await c.env.DB.prepare("DELETE FROM gallery_photos WHERE event_id=?")
    .bind(id)
    .run();
  const result = await c.env.DB.prepare("DELETE FROM gallery_events WHERE id=?")
    .bind(id)
    .run();
  if (!result.meta.changes)
    return failure(c, "NOT_FOUND", "Event tidak ditemukan.", 404);
  return success(c, { deleted: true });
});

gallery.get("/public/:eventId", async (c) => {
  const event = await authorized(
    c,
    c.req.param("eventId"),
    c.req.query("token"),
  );
  if (
    !event ||
    !event.sharing_enabled ||
    new Date(event.expires_at).getTime() < Date.now()
  )
    return failure(
      c,
      "GALLERY_UNAVAILABLE",
      "Galeri tidak tersedia atau sudah kedaluwarsa.",
      404,
    );
  const rows = await c.env.DB.prepare(
    "SELECT id,file_name AS fileName,mime_type AS mimeType,size_bytes AS size,created_at AS createdAt FROM gallery_photos WHERE event_id=? ORDER BY created_at DESC LIMIT 500",
  )
    .bind(event.id)
    .all();
  return success(c, {
    event: { id: event.id, name: event.name, expiresAt: event.expires_at },
    photos: rows.results,
  });
});

gallery.get("/public/:eventId/photos/:photoId", async (c) => {
  const event = await authorized(
    c,
    c.req.param("eventId"),
    c.req.query("token"),
  );
  if (
    !event ||
    !event.sharing_enabled ||
    new Date(event.expires_at).getTime() < Date.now()
  )
    return failure(c, "GALLERY_UNAVAILABLE", "Galeri tidak tersedia.", 404);
  const photo = await c.env.DB.prepare(
    "SELECT object_key,mime_type,file_name FROM gallery_photos WHERE id=? AND event_id=?",
  )
    .bind(c.req.param("photoId"), event.id)
    .first<{ object_key: string; mime_type: string; file_name: string }>();
  if (!photo) return failure(c, "NOT_FOUND", "Foto tidak ditemukan.", 404);
  const object = await c.env.ASSETS.get(photo.object_key);
  if (!object)
    return failure(c, "NOT_FOUND", "File foto tidak ditemukan.", 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": photo.mime_type,
      "Content-Length": String(object.size),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${photo.file_name.replace(/["\\]/g, "_")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
});
