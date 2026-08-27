import { Hono } from "hono";
import type { AppEnv } from "./types";
import { security } from "./middleware/security";
import { settings } from "./routes/settings";
import { presets } from "./routes/presets";
import { history } from "./routes/history";
import { assets } from "./routes/assets";
import { gallery } from "./routes/gallery";
import { ApiError } from "./utils/json";
import { failure, success } from "./utils/response";

const app = new Hono<AppEnv>();
app.use("*", security);
app.get("/api/health", (c) => success(c, { status: "ok" }));
app.route("/api/settings", settings);
app.route("/api/presets", presets);
app.route("/api/history", history);
app.route("/api/assets", assets);
app.route("/api/gallery", gallery);
app.notFound((c) => failure(c, "NOT_FOUND", "Endpoint tidak ditemukan.", 404));
app.onError((error, c) => {
  if (error instanceof ApiError)
    return failure(c, error.code, error.message, error.status);
  console.error(
    JSON.stringify({ requestId: c.get("requestId"), message: error.message }),
  );
  return failure(c, "INTERNAL_ERROR", "Terjadi kesalahan pada server.", 500);
});

async function cleanup(env: AppEnv["Bindings"]): Promise<void> {
  const expired = await env.DB.prepare(
    "SELECT id FROM gallery_events WHERE expires_at < ? LIMIT 50",
  )
    .bind(new Date().toISOString())
    .all<{ id: string }>();
  for (const event of expired.results) {
    const objects = await env.DB.prepare(
      "SELECT object_key FROM gallery_photos WHERE event_id=?",
    )
      .bind(event.id)
      .all<{ object_key: string }>();
    if (objects.results.length)
      await env.ASSETS.delete(objects.results.map((item) => item.object_key));
    await env.DB.prepare("DELETE FROM gallery_photos WHERE event_id=?")
      .bind(event.id)
      .run();
    await env.DB.prepare("DELETE FROM gallery_events WHERE id=?")
      .bind(event.id)
      .run();
  }
}

export default {
  fetch: app.fetch,
  scheduled: (
    _controller: ScheduledController,
    env: AppEnv["Bindings"],
    context: ExecutionContext,
  ) => context.waitUntil(cleanup(env)),
};
