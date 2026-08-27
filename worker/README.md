# LensFlow Cloud API

Cloudflare Worker tanpa autentikasi untuk sinkronisasi pengaturan, preset, ringkasan riwayat, dan backup aset opsional. Foto event asli tidak pernah diunggah oleh API ini.

## Setup

1. `npm install`
2. Buat D1 `lensflow` dan R2 `lensflow-assets`.
3. Ganti placeholder `database_id` di `wrangler.toml`.
4. Set allowlist: `wrangler secret put ALLOWED_ORIGINS` (daftar origin dipisahkan koma, tanpa path).
5. `npm run db:migrate:local` lalu `npm run dev`.

Semua operasi tulis wajib memiliki header `Origin` yang persis cocok dengan allowlist. Rate limit memori (60 write/menit/IP/isolate) hanya best-effort; tambahkan Cloudflare WAF Rate Limiting untuk proteksi terdistribusi production.

Upload aset memakai `multipart/form-data` dengan field `file`, maksimum 5 MB. R2 tetap private dan aset diakses melalui endpoint Worker.
