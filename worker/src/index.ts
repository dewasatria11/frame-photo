import { Hono } from 'hono';
import type { AppEnv } from './types';
import { security } from './middleware/security';
import { settings } from './routes/settings';
import { presets } from './routes/presets';
import { history } from './routes/history';
import { assets } from './routes/assets';
import { ApiError } from './utils/json';
import { failure, success } from './utils/response';

const app = new Hono<AppEnv>();
app.use('*', security);
app.get('/api/health', (c) => success(c, { status: 'ok' }));
app.route('/api/settings', settings);
app.route('/api/presets', presets);
app.route('/api/history', history);
app.route('/api/assets', assets);
app.notFound((c) => failure(c, 'NOT_FOUND', 'Endpoint tidak ditemukan.', 404));
app.onError((error, c) => {
  if (error instanceof ApiError) return failure(c, error.code, error.message, error.status);
  console.error(JSON.stringify({ requestId: c.get('requestId'), message: error.message }));
  return failure(c, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.', 500);
});

export default app;
