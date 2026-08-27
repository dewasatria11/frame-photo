# LensFlow Watermark Pro

LensFlow adalah workstation web direct-access untuk memantau folder foto, memberi logo/frame/teks watermark secara lokal, menyimpan hasil ke folder lain, dan menampilkan foto terbaru. Tidak ada login dan tidak ada integrasi AI. Foto event tidak dikirim ke server.

## Features

- File System Access API: input/output folder, izin persisten, polling stabil, antrean satu-per-satu
- Canvas multi-layer: logo, frame, dan teks manual; scale, opacity, margin, rotation, dan 9 posisi
- JPEG/PNG/WebP, kualitas output, prefix aman, collision skip/overwrite/auto-number
- Drag-and-drop manual, preview original/hasil, unduh tunggal dan ZIP
- Recent results, processing console, fullscreen `/display`, BroadcastChannel
- Preset dan branding tersimpan lokal; cloud sync opsional
- Worker Hono dengan D1, R2, CORS/Origin allowlist, validasi, dan rate limiting

## Architecture

Foto dibaca, diproses, dan ditulis di browser. IndexedDB menyimpan directory handle dan konfigurasi lokal. Worker hanya menyimpan konfigurasi, preset, ringkasan riwayat, dan aset watermark opsional. D1 tidak menyimpan binary foto event dan R2 tidak menerima foto event secara otomatis.

## Requirements

- Node.js 20.19+ dan npm
- Chrome, Edge, atau Brave modern untuk Auto-Watch
- HTTPS di production (`localhost` diperbolehkan untuk development)
- Akun Cloudflare hanya jika sinkronisasi cloud digunakan

Safari/Firefox dapat memakai pemrosesan manual, tetapi dukungan folder watcher penuh tidak diklaim.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Worker dijalankan pada terminal lain:

```bash
cd worker
npm install
npm run db:migrate:local
npm run dev
```

Secara default aplikasi memakai Worker production di `https://lensflow-api.al-ikhsan-media.workers.dev`. Untuk pengembangan Worker lokal, override dengan `NUXT_PUBLIC_API_BASE=http://localhost:8787`. Bila Worker mati, fungsi lokal tetap berjalan.

## Cloudflare D1 setup

```bash
cd worker
npx wrangler login
npx wrangler d1 create lensflow
```

Salin `database_id` hasil perintah ke `worker/wrangler.toml`, lalu:

```bash
npm run db:migrate:remote
```

## Cloudflare R2 setup

```bash
npx wrangler r2 bucket create lensflow-assets
```

Bucket sebaiknya private. Endpoint Worker mem-proxy akses aset setelah validasi MIME dan ukuran. Event originals dan output tidak diunggah.

## Worker secrets

Atur origin eksplisit berbentuk daftar dipisahkan koma:

```bash
npx wrangler secret put ALLOWED_ORIGINS
```

Contoh nilai: `https://watermark.example.com,http://localhost:3000`. Jangan gunakan wildcard production dan jangan commit `.dev.vars` atau token Cloudflare.

## Direct-access mode

Membuka `/` langsung menampilkan dashboard. Proyek sengaja tidak memiliki akun, password, cookie session, logout, atau role. Siapa pun yang mengetahui URL dapat membuka UI; gunakan proteksi domain/infrastruktur jika diperlukan. Worker tetap menolak write request dari Origin yang tidak terdaftar.

## Running checks

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
cd worker && npm run test && npm run check
```

E2E memakai Chromium dan mock browser API bila diperlukan. Instal browser Playwright sekali dengan `npx playwright install chromium`.

## GitHub push

```bash
git init
git add .
git commit -m "feat: initial LensFlow Watermark Pro"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY>
git push -u origin main
```

## Vercel deployment

Import repository GitHub melalui **Add New → Project**, biarkan Vercel mendeteksi Nuxt, lalu isi:

```text
NUXT_PUBLIC_APP_NAME=LensFlow Watermark Pro
NUXT_PUBLIC_API_BASE=https://YOUR-WORKER.workers.dev
```

Frontend dibangun oleh integrasi Git Vercel, bukan melalui Cloudflare CLI. Deploy Worker terpisah dari folder `worker` dengan `npm run deploy`.

## Custom domain

Pola yang disarankan ialah `watermark.example.com` untuk Vercel dan `api.example.com` untuk Worker. Setelah domain berubah, perbarui `ALLOWED_ORIGINS`. Jangan wildcard `*.vercel.app`; daftarkan preview yang memang perlu melakukan cloud write.

## Browser compatibility and permissions

Directory handle yang dipulihkan dari IndexedDB mungkin meminta izin lagi setelah browser dibuka ulang. Berikan read untuk input dan readwrite untuk output. Input dan output yang sama diblokir untuk mencegah loop.

## Privacy

Foto diproses secara lokal di perangkat secara default dan tidak dikirim ke layanan AI. Cloud sync hanya mencakup metadata/config/aset yang dipilih. Jangan menyimpan informasi rahasia di D1 karena aplikasi menggunakan model personal direct-access.

## Troubleshooting

- **Folder picker tidak muncul:** gunakan Chromium modern pada HTTPS atau localhost. Gunakan drag-and-drop manual sebagai fallback.
- **Izin folder hilang:** klik pilih/ulangi izin; browser dapat meminta otorisasi ulang untuk handle tersimpan.
- **Foto tidak terdeteksi:** pastikan watcher aktif, ekstensi JPG/JPEG/PNG/WebP, file selesai ditulis, dan folder input benar.
- **Output tidak tersimpan:** periksa izin write, ruang disk, konflik folder, dan collision mode.
- **API cloud gagal:** pemrosesan lokal tetap bekerja. Periksa URL Worker, koneksi, migrasi, dan `ALLOWED_ORIGINS`.
- **Berfungsi lokal tetapi gagal production:** periksa HTTPS, exact Origin, `NUXT_PUBLIC_API_BASE`, deploy Worker, dan environment Vercel.

## Operational notes

Object URL hasil hanya dipertahankan untuk galeri terbaru dan dilepas saat tidak dipakai. Log cloud berupa ringkasan job, bukan setiap baris console. Untuk event panjang, pertahankan concurrency 1 dan galeri maksimum agar penggunaan memori stabil.

## Cloud Gallery dan QR event

Operator membuat event dari kartu **Cloud Gallery & QR**. Setiap output ber-frame tetap disimpan penuh ke folder lokal dan salinan JPEG maksimal 3000 px (quality 87%) masuk antrean IndexedDB untuk di-upload ke R2. Koneksi yang terputus tidak menghentikan Auto-Watch; antrean dilanjutkan ketika browser kembali online.

QR mengarah ke `/gallery/{eventId}?token={token}`. Bucket tetap private dan Worker memvalidasi hash token sebelum memberikan daftar atau binary foto. Token tersimpan lokal pada workstation operator, sedangkan D1 hanya menyimpan hash. Event kedaluwarsa beserta object R2 dibersihkan setiap hari pukul 03:00 UTC oleh Cron Trigger Worker.

Route `/display` menampilkan QR kecil di kanan bawah. Setelah 20 detik tanpa foto baru, QR membesar otomatis. Tekan `Q` untuk mengganti ukuran QR dan `F` untuk fullscreen. Gunakan mode display **Extend** agar dashboard tetap berada di laptop dan `/display` berada di monitor kedua.
