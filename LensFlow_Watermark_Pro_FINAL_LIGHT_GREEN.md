# MASTER SPEC — Auto Watermark Folder Watcher Pro AI Clone

> **Tujuan dokumen**

> **REVISI FINAL PERSONAL ACCESS:** Aplikasi ini **tanpa login, tanpa password, tanpa session timeout, tanpa sistem akun, dan tanpa AI/AI**. Membuka URL langsung memberikan akses penuh ke dashboard.
>
> Dokumen ini adalah spesifikasi implementasi lengkap untuk AI coding agent/Codex di VSCode.
> Bangun aplikasi web production-grade yang mereplikasi **alur, fungsi, layout, dan UX inti** dari referensi Auto Watermark Folder Watcher Pro AI pada `weddinganku.com/watermarks/`, tetapi **jangan menyalin logo, merek, teks branding, aset proprietary, atau identitas visual milik situs referensi secara mentah**.
>
> Gunakan brand sementara: **LensFlow Watermark Pro**.
>
> Deployment target:
>
> - Frontend/full-stack web shell: **Nuxt 4 + Vue 3**
> - Hosting frontend: **Vercel**
> - Source control: **GitHub**
> - Database: **Cloudflare D1**
> - Object storage opsional: **Cloudflare R2**
> - Cloud API gateway: **Cloudflare Worker**
> - AI: **Google AI API**, dipanggil hanya dari server/Worker, tidak pernah langsung dari browser.
>
> Flow deployment wajib:
>
> `Local VSCode -> git add/commit -> git push GitHub -> Import repository di Vercel`
>
> Jangan membuat workflow deployment yang mengharuskan deploy frontend langsung dari CLI Cloudflare.

---

# 1. PRODUCT SUMMARY

Buat aplikasi bernama **LensFlow Watermark Pro**.

Aplikasi ditujukan untuk fotografer/event operator yang membutuhkan workflow:

```text
Kamera / tethering / card reader
            ↓
      Folder Input lokal
            ↓
Browser mendeteksi foto baru
            ↓
Canvas/Image processing lokal
            ↓
Watermark / frame / disabled
            ↓
      Folder Output lokal
            ↓
Preview + fullscreen display
```

Tujuan utama:

1. Operator memilih folder input.
2. Operator memilih folder output.
3. Operator mengunggah logo/frame watermark.
4. Operator mengatur posisi, scale, opacity, margin, rotation.
5. Operator menekan **Mulai Auto-Watch**.
6. Aplikasi mengecek folder input secara periodik.
7. Setiap gambar baru diproses.
8. Hasil disimpan otomatis ke folder output.
9. Foto terbaru bisa langsung muncul pada mode fullscreen display.
10. Log pemrosesan terlihat real-time.
11. User dapat memproses foto manual via drag & drop.
12. User dapat mengunduh single image atau ZIP.
13. AI AI dapat membantu membuat caption dan menentukan rekomendasi posisi watermark.
14. Branding aplikasi dapat dikustomisasi.
15. Pengaturan tersimpan sehingga operator tidak perlu mengulang setup setiap refresh.

---

# 2. IMPORTANT ARCHITECTURE RULE

## 2.1 Local-first image processing

**JANGAN upload setiap foto event ke server sebagai workflow default.**

Foto event harus:

- dibaca dari folder lokal melalui File System Access API;
- diproses di browser dengan Canvas API / OffscreenCanvas bila tersedia;
- disimpan ke folder lokal output;
- hanya metadata pemrosesan yang opsional dikirim ke database.

Alasan:

- latency rendah;
- tidak boros bandwidth;
- tetap berfungsi meski koneksi internet tidak stabil;
- privasi foto lebih baik;
- penggunaan Cloudflare free tier lebih hemat.

## 2.2 Cloud responsibilities

Cloudflare digunakan untuk:

- app preferences;
- presets metadata;
- branding configuration;
- optional processing history;
- optional watermark asset backup.

Aplikasi ini adalah **milik pribadi dan full-access tanpa login/password**.
Tidak ada sistem akun, password, session, role, atau session timeout.

## 2.3 Browser compatibility

Folder Watcher membutuhkan:

- Chromium-based browser modern:
  - Google Chrome
  - Microsoft Edge
  - Brave
- HTTPS pada production
- `window.showDirectoryPicker()`

Jika API tidak tersedia:

- tampilkan fallback mode manual drag-drop;
- jangan crash;
- tampilkan warning informatif.

Safari/Firefox tidak boleh diklaim mendukung folder auto-watch penuh bila browser belum menyediakan API yang sama.

---

# 3. REFERENCE FEATURE PARITY

Implementasikan feature parity terhadap workflow referensi berikut:

- Folder Input
- Folder Output
- Prefix filename
- Auto-Watch
- interval scan default 2 detik
- Watermark Logo
- Frame Utuh
- upload PNG/WEBP/JPG/SVG
- quick presets
- scale
- opacity
- edge margin
- rotation
- 9-grid position
- preview
- test sample image
- drag/drop processing
- full screen
- processed count
- clear log
- ZIP download
- single download
- latest-photo display
- editable app branding

Do not implement only a static mockup.
Semua fungsi utama harus bekerja.

---

# 4. TECHNOLOGY STACK

## Frontend

Use:

- Nuxt 4
- Vue 3
- TypeScript strict
- Tailwind CSS
- Pinia
- VueUse where useful
- Lucide icons
- Zod
- browser-image-compression only if required
- JSZip
- File System Access API
- Canvas API / OffscreenCanvas

Do not use:

- jQuery
- Bootstrap
- large UI kits that make the page look generic
- fake generated dashboard components
- unnecessary animation libraries

## Backend

Use a separate **Cloudflare Worker API** with:

- Hono
- Cloudflare D1 binding
- Cloudflare R2 binding
- Web Crypto API
- Zod
- CORS allowlist

Worker responsibility:

```text
/api/settings/*
/api/presets/*
/api/history/*
/api/assets/*
```

Tidak ada endpoint login, logout, user, session, role, atau change-password.

Nuxt on Vercel calls the Worker through:

```env
NUXT_PUBLIC_API_BASE=https://your-worker.your-subdomain.workers.dev
```

Never connect the browser directly to D1.

---

# 5. REPOSITORY STRUCTURE

Use a monorepo:

```text
lensflow-watermark-pro/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css
│   ├── components/
│   │   ├── branding/
│   │   ├── common/
│   │   ├── display/
│   │   ├── folders/
│   │   ├── layout/
│   │   ├── logs/
│   │   ├── preview/
│   │   └── watermark/
│   ├── composables/
│   │   ├── useFolderAccess.ts
│   │   ├── useFolderWatcher.ts
│   │   ├── useImageProcessor.ts
│   │   ├── useLocalSettings.ts
│   │   ├── useProcessedFiles.ts
│   │   └── useWatermark.ts
│   ├── layouts/
│   │   └── default.vue
│   ├── pages/
│   │   ├── index.vue
│   │   └── display.vue
│   ├── stores/
│   │   ├── processor.ts
│   │   └── settings.ts
│   ├── types/
│   ├── utils/
│   └── app.vue
├── public/
│   ├── favicon.svg
│   └── presets/
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   └── utils/
│   ├── migrations/
│   │   └── 0001_init.sql
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── .env.example
├── .gitignore
├── nuxt.config.ts
├── package.json
├── README.md
└── MASTER_SPEC.md
```

---

# 6. DESIGN DIRECTION — PRODUCTION LIGHT GREEN

The UI/UX must look **production-ready, polished, deliberate, and human-designed**.

This project must **NOT** look like AI-slop.

## Core visual direction

Use a **light theme** with:

- white application background;
- soft neutral gray surfaces;
- emerald/green as primary accent;
- clean borders;
- subtle shadows only where useful;
- dense but comfortable layout;
- strong visual hierarchy;
- desktop utility feel;
- consistent spacing;
- restrained use of rounded corners.

The application should feel like:

```text
Professional event photography utility
+ modern SaaS-level polish
+ desktop workstation efficiency
```

Not like:

```text
generic AI dashboard
template admin panel
crypto dashboard
neon SaaS
glassmorphism demo
over-designed landing page
```

---

## 6.1 COLOR SYSTEM

Primary theme:

```css
--bg-app: #f7faf8;
--bg-page: #ffffff;
--surface: #ffffff;
--surface-soft: #f3f7f4;
--surface-muted: #eef3ef;

--text-main: #162018;
--text-secondary: #4d5c51;
--text-muted: #7a897e;

--border: #dfe8e1;
--border-strong: #c9d7cc;

--primary: #16a34a;
--primary-hover: #15803d;
--primary-active: #166534;
--primary-soft: #eaf7ee;
--primary-softer: #f3fbf5;

--success: #16a34a;
--warning: #d97706;
--danger: #dc2626;
--info: #2563eb;
```

Use green as a functional accent, not everywhere.

Do not make every card green.

Preferred ratio:

```text
70% white / neutral
20% soft gray / structural surfaces
10% green accent
```

---

## 6.2 TYPOGRAPHY

Use:

```text
Inter
```

Fallback:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Typography rules:

```text
Page title       24–28px / 700
Section title    17–20px / 600–700
Card title       15–16px / 600
Body             14px / 400–500
Label            12–13px / 500–600
Caption          11–12px / 400–500
```

Do not use giant 48–64px headings inside the application.

Do not use decorative fonts.

---

## 6.3 SPACING SYSTEM

Use consistent spacing scale:

```text
4
8
12
16
20
24
32
40
```

Default card padding:

```text
20–24px desktop
16px tablet/mobile
```

Default vertical gap between sections:

```text
20–24px
```

Avoid:

- random 13px/27px gaps;
- excessive whitespace;
- oversized cards.

---

## 6.4 BORDER RADIUS

Use restrained radius:

```text
Buttons: 8–10px
Inputs: 8–10px
Cards: 12px
Large panel/modal: 14px
```

Do not use `rounded-3xl` everywhere.

Do not turn every control into a pill.

Pills only for:

- status badges;
- compact filters;
- small tags.

---

## 6.5 SHADOWS

Use shadows sparingly.

Preferred card:

```css
box-shadow:
  0 1px 2px rgba(16, 24, 40, 0.04),
  0 2px 8px rgba(16, 24, 40, 0.03);
```

Most cards may use:

```text
border only
```

Avoid:

- large floating shadows;
- glow;
- green neon shadow;
- blurry glass cards.

---

## 6.6 APPLICATION SHELL

Desktop shell:

```text
white / light-gray page
```

Header:

```text
white
bottom border
sticky
height 64–68px
```

Main content:

```text
max-width: 1440px
centered
24px horizontal padding
24px vertical spacing
```

Do not build a huge sidebar unless functionally required.

Preferred navigation:

```text
Top header + compact settings/actions
```

This application should feel focused, not like an enterprise admin panel.

---

## 6.7 HEADER DESIGN

Left:

```text
[logo mark] LensFlow Watermark Pro
            Event Photo Processor
```

Logo mark:

- simple original geometric symbol;
- green accent;
- no generic AI sparkle icon.

Right:

```text
[status dot + Idle/Watching]
[Fullscreen]
[Settings]
```

Use clean icon buttons.

No avatar/account menu because there is no login.

---

## 6.8 CARD DESIGN

Card:

```text
background: white
border: 1px solid var(--border)
radius: 12px
```

Header area:

```text
title
short supporting text
optional right-side action
```

Avoid cards-inside-cards-inside-cards.

Each card should represent one clear functional group.

Good:

```text
Folder Automation
Watermark Designer
Live Preview
Processing Console
Recent Results
```

Bad:

```text
one card for every tiny input
```

---

## 6.9 BUTTON SYSTEM

Primary:

```text
green background
white text
```

Examples:

```text
Mulai Auto-Watch
Simpan Pengaturan
Proses Foto
```

Secondary:

```text
white
neutral border
dark text
```

Ghost:

```text
transparent
subtle hover
```

Danger:

```text
red only for destructive actions
```

Do not use gradients on buttons.

Do not use all-caps buttons.

Do not use excessive icon + text + badge combinations.

---

## 6.10 INPUTS

Inputs:

```text
height 40–44px
white background
neutral border
8–10px radius
green focus ring
```

Focus:

```css
outline: none;
box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
border-color: #16a34a;
```

Labels must sit above controls.

Placeholder text should be muted.

Do not use floating labels.

---

## 6.11 SLIDERS

Sliders should be compact and professional.

Layout:

```text
Scale                         25%
[────────────●──────────────]
```

Do not use oversized colorful slider tracks.

Use green only for active track.

---

## 6.12 STATUS DESIGN

Status badge examples:

```text
● Idle
● Watching
● Paused
● Processing
● Error
```

Colors:

```text
Idle       gray
Watching   green
Paused     amber
Processing blue/green
Error      red
```

Avoid animated glow.

A subtle pulse only for `Watching` is acceptable.

---

## 6.13 PREVIEW AREA

Preview must be visually dominant but restrained.

Use:

```text
large white card
inner dark-neutral image stage
```

Image stage:

```css
background: #111827;
border-radius: 10px;
```

Why dark stage:

- makes white/transparent frames easy to inspect;
- improves visual contrast;
- keeps rest of application light.

Preview controls stay on white surface around the stage.

---

## 6.14 PROCESSING CONSOLE

Console may use a dark inner surface while the app remains light.

Recommended:

```text
Card outer = white
Console inner = #111827
Log text = light gray
Success = soft green
Warning = amber
Error = red
```

This keeps the application visually professional without turning the whole UI dark.

---

## 6.15 EMPTY STATES

Empty states must be compact.

Example:

```text
Belum ada foto yang diproses
Pilih foto uji atau jalankan Auto-Watch.
```

Use one small icon.

Do not use:

- large illustrations;
- AI-generated graphics;
- huge empty-state blocks.

---

## 6.16 MODALS

Modal width:

```text
480–640px
```

Structure:

```text
Title
short description
form
footer actions
```

Background overlay:

```text
rgba(15, 23, 42, 0.30)
```

Do not overblur.

---

## 6.17 ICONOGRAPHY

Use:

```text
Lucide Icons
```

Rules:

- consistent stroke width;
- mostly 16–20px;
- icons support meaning;
- do not use emoji;
- do not use sparkles icon for generic features;
- do not use random icon inside every heading.

---

## 6.18 MOTION

Motion must be subtle.

Allowed:

```text
150–200ms hover transitions
small fade
small translate 1–2px
status pulse
modal fade
```

Avoid:

```text
bouncy animations
parallax
rotating gradients
floating blobs
animated glowing borders
```

---

## 6.19 AI-SLOP PROHIBITIONS

The coding agent must specifically avoid these common AI-generated UI patterns:

- huge gradient hero;
- purple/blue/green glowing blobs;
- glassmorphism cards everywhere;
- excessive `rounded-2xl` / `rounded-3xl`;
- excessive shadows;
- random KPI dashboard cards;
- meaningless charts;
- oversized icon tiles;
- giant section headings;
- gradient text;
- decorative sparkles;
- fake testimonials;
- marketing landing-page sections inside the app;
- excessive badges;
- every card having an icon;
- random pill components;
- multi-color gradients;
- giant empty areas;
- lorem ipsum;
- fake analytics;
- “AI-powered” labels;
- futuristic cyber aesthetic.

This is a **working utility**, not a promotional SaaS landing page.

---

## 6.20 VISUAL HIERARCHY

Primary hierarchy:

```text
1. Auto-Watch status/action
2. Input / Output folder
3. Preview
4. Watermark configuration
5. Processing history/log
6. Secondary settings
```

The most important operational state must always be visible without scrolling on common 1080p laptop screens.

---

## 6.21 DESKTOP LAYOUT TARGET

For >= 1200px:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├─────────────────────────────────────────────────────────────┤
│ Folder Automation                                           │
│                                                             │
│ ┌──────────────────────┐  ┌──────────────────────────────┐  │
│ │ Watermark Designer   │  │ Live Preview                 │  │
│ │                      │  │                              │  │
│ │ controls             │  │ image stage                  │  │
│ │                      │  │                              │  │
│ └──────────────────────┘  └──────────────────────────────┘  │
│                                                             │
│ Processing Console / Recent Results                         │
└─────────────────────────────────────────────────────────────┘
```

Suggested columns:

```text
Designer: 38–42%
Preview: 58–62%
```

Do not make left controls too narrow.

---

## 6.22 TABLET/MOBILE

Tablet:

```text
2-column where possible
```

Mobile:

```text
single-column
```

Prioritize:

```text
status
folder selection
preview
start/stop
watermark controls
```

No horizontal scrolling.

---

## 6.23 PRODUCTION QUALITY CHECK

Before considering UI complete, verify:

- alignment consistent;
- no clipped text;
- no overflowing buttons;
- no random spacing;
- labels readable;
- all states designed;
- hover states consistent;
- focus states visible;
- empty states polished;
- loading states not fake;
- destructive actions clearly separated;
- no visual noise.

---

## 6.24 FINAL VISUAL BRIEF FOR CODEX

Use this instruction as authoritative:

> Build LensFlow Watermark Pro as a **clean production-grade light application** with a **white + emerald green visual system**. The UI should feel like a polished professional tool used by event photographers during real jobs. Keep it compact, deliberate, and functional. Avoid all common AI-generated SaaS/dashboard aesthetics. No gradients, no glow, no glassmorphism, no giant hero, no random analytics, no decorative AI icons. Use green as an accent, white and soft gray as the foundation, precise spacing, strong alignment, subtle borders, restrained shadows, and excellent desktop usability.

---

# 7. DIRECT ACCESS MODE

Aplikasi **tidak menggunakan login**.

Route utama:

```text
/
```

Saat URL dibuka:

```text
Browser
   ↓
Dashboard LensFlow Watermark Pro
```

Tidak ada:

- login page;
- password prompt;
- user account;
- session timeout;
- logout;
- role permission;
- change password.

Semua fitur utama langsung tersedia.

## Personal-use warning

Karena tidak ada autentikasi:

- siapa pun yang mengetahui URL production dapat membuka dashboard;
- jangan simpan data rahasia di D1;
- jangan menampilkan API key pada frontend;
- AI tetap harus melalui Cloudflare Worker;
- endpoint Worker tetap harus dibatasi dengan CORS/Origin agar tidak disalahgunakan;
- CORS/Origin harus dibatasi hanya ke domain frontend yang digunakan.

Jika ingin lebih privat tanpa menambahkan login aplikasi, gunakan proteksi di level infrastruktur/domain secara terpisah di masa depan. Namun **MVP ini tetap full-access tanpa password**.

---

# 8. STARTUP BEHAVIOR

Saat aplikasi dibuka:

1. langsung tampil dashboard utama;
2. load konfigurasi lokal dari IndexedDB/localStorage;
3. sinkronkan settings/preset dari Cloudflare bila tersedia;
4. tampilkan first-run setup jika folder belum dipilih;
5. tidak ada redirect autentikasi.

Jika API cloud gagal, fungsi watermark lokal tetap bisa digunakan.

---

# 9. MAIN APPLICATION LAYOUT

Desktop structure:

```text
┌────────────────────────────────────────────────────────────┐
│ Logo / App Name                    Fullscreen  Settings    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Folder Automation                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Input | Output | Prefix | Auto-watch                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│                                                            │
│  Watermark Designer      Preview                           │
│  ┌───────────────────┐   ┌─────────────────────────────┐  │
│  │ controls          │   │                             │  │
│  │ upload            │   │         canvas              │  │
│  │ scale             │   │                             │  │
│  │ opacity           │   └─────────────────────────────┘  │
│  │ position          │                                    │
│  └───────────────────┘                                    │
│                                                            │
│  Processing Console                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Tablet/mobile:

- controls stack vertically;
- folder auto-watcher functionality may show browser support warning;
- manual processing remains available.

---

# 10. HEADER

Header contains:

Left:

- small brand mark;
- custom app name;
- `PRO` badge.

Right:

- system status:
  - Idle
  - Watching
  - Processing
  - Paused
  - Error
- Fullscreen button
- Settings button
- settings menu

Keep header sticky.

---

# 11. FOLDER AUTOMATION CARD

Heading:

```text
Pengaturan Folder Otomatis
Langkah 1
```

## Input folder

UI:

```text
1. Folder Input (Sumber Foto)
[ Belum memilih folder input...        ] [ Pilih Folder ]
```

Use:

```js
window.showDirectoryPicker({
  mode: 'read'
})
```

Store handle using IndexedDB if supported.

Never store absolute local path in cloud DB.

Display only safe folder name.

## Output folder

UI:

```text
2. Folder Output (Tujuan Simpan Otomatis)
[ Belum memilih folder output...       ] [ Pilih Folder ]
```

Use:

```js
window.showDirectoryPicker({
  mode: 'readwrite'
})
```

Before starting:

- verify permission;
- request permission if required.

## Prefix

UI:

```text
3. Awalan / Prefix Nama File Output
[ wm_                                ] [ Simpan Prefix ]
```

Rules:

- max 50 chars;
- block invalid filesystem characters;
- default `wm_`;
- preview resulting filename.

Example:

```text
Input:
DSC_0897.JPG

Output:
wm_DSC_0897.jpg
```

---

# 12. AUTO-WATCH

Control card:

```text
Pantau Folder Otomatis (Auto-Watch)

Deteksi foto baru → Watermark → Simpan Output → Tampil Full Screen

[ Mulai ]
```

Once active:

```text
[ Pause ] [ Stop ]

● Sedang memantau folder
Scan berikutnya: 1.4s
```

Default interval:

```ts
2000
```

Do not use recursive uncontrolled `setInterval`.

Prefer an async polling loop:

```ts
while (watching) {
  await scan()
  await sleep(interval)
}
```

Prevent overlapping scans.

---

# 13. FILE DETECTION

Accepted image types:

```text
.jpg
.jpeg
.png
.webp
```

Optional future support:

```text
.heic
```

Do not treat RAW camera files as fully supported unless decoder is implemented.

Ignore:

```text
.hidden
Thumbs.db
desktop.ini
already processed files
temporary camera files
```

Maintain a local fingerprint cache.

Fingerprint:

```text
name
size
lastModified
```

Suggested key:

```ts
`${name}:${size}:${lastModified}`
```

Process only stable files.

Important:

Some tethering software may still be writing the file.
Before processing:

1. detect candidate;
2. wait briefly;
3. read size;
4. wait 500–1000 ms;
5. read metadata again;
6. only process if size is unchanged.

---

# 14. PROCESSING QUEUE

Never process multiple giant photos uncontrollably.

Create queue:

```ts
type QueueItem = {
  id: string
  fileName: string
  file: File
  status: 'queued' | 'processing' | 'success' | 'error'
  createdAt: number
}
```

Default concurrency:

```text
1
```

Optional advanced setting:

```text
1–3 workers
```

Processing state:

```text
Queued
Reading
Decoding
Applying overlay
Encoding
Writing
Completed
Failed
```

---

# 15. WATERMARK MODES

Support exactly two primary modes.

## Mode A — Watermark Logo

Overlay image sits on top of photograph.

Controls:

- image asset;
- scale;
- opacity;
- margin;
- rotation;
- 9-grid position.

## Mode B — Frame Utuh

Frame is drawn covering complete image dimensions.

Typical transparent PNG frame:

```text
frame width = image width
frame height = image height
```

Options:

- fit
- cover
- stretch

Default:

```text
fit
```

---

# 16. WATERMARK ASSET UPLOAD

Dropzone:

```text
Unggah Gambar Logo / Frame
PNG transparan disarankan

[ Drag file di sini ]
atau klik untuk memilih

PNG · WEBP · JPG · SVG
```

Validation:

- MIME whitelist;
- max configurable file size;
- image decode validation;
- reject malformed images;
- sanitize SVG or rasterize it before canvas use.

For untrusted SVG:

**Do not inject raw SVG into DOM with `v-html`.**

---

# 17. QUICK WATERMARK PRESETS

Display compact preset chips/cards.

Examples:

- Copyright
- Camera Info
- Minimal White
- Minimal Dark
- Bottom Bar
- Event Frame

Preset can contain:

```ts
interface WatermarkPreset {
  id: string
  name: string
  mode: 'logo' | 'frame'
  scale: number
  opacity: number
  margin: number
  rotation: number
  position: Position9
  assetUrl?: string
}
```

Allow:

- save custom preset;
- rename;
- duplicate;
- delete.

---

# 18. WATERMARK CONTROLS

## Scale

Range:

```text
5%–100%
```

Default:

```text
25%
```

Display live value.

## Opacity

Range:

```text
0%–100%
```

Default:

```text
85%
```

## Margin

Range:

```text
0–300 px
```

Default:

```text
30 px
```

## Rotation

Range:

```text
-180° to +180°
```

Default:

```text
0°
```

Provide reset icon.

All slider changes update preview immediately.

Debounce only expensive redraw operations if necessary.

---

# 19. 9-GRID POSITION CONTROL

Positions:

```text
top-left       top-center       top-right
middle-left    center           middle-right
bottom-left    bottom-center    bottom-right
```

UI:

```text
↖   ↑   ↗
←   •   →
↙   ↓   ↘
```

Do not use Unicode arrows as final visual if Lucide icons can represent placement more professionally.

Selected grid button must have clear active state.

---

# 20. WATERMARK POSITION CALCULATION

For watermark logo:

```ts
const scaledWidth = logo.width * scale
const scaledHeight = logo.height * scale
```

Calculate `x`,`y` based on image dimensions and margin.

Examples:

```ts
topLeft:
x = margin
y = margin

topCenter:
x = (canvas.width - scaledWidth) / 2
y = margin

topRight:
x = canvas.width - scaledWidth - margin
y = margin

center:
x = (canvas.width - scaledWidth) / 2
y = (canvas.height - scaledHeight) / 2

bottomRight:
x = canvas.width - scaledWidth - margin
y = canvas.height - scaledHeight - margin
```

Rotation should use canvas transform around watermark center.

Always:

```ts
ctx.save()
...
ctx.restore()
```

---

# 21. IMAGE ORIENTATION

Critical requirement.

Respect EXIF orientation where browser decode does not already normalize.

Do not output rotated portrait images incorrectly.

Test:

- portrait;
- landscape;
- camera JPEG with EXIF rotate;
- phone images.

---

# 22. OUTPUT IMAGE SETTINGS

Default:

```text
Format: JPEG
Quality: 92%
```

Options:

```text
JPEG
PNG
WEBP
```

JPEG quality:

```text
60–100%
```

Preserve source resolution unless max-resolution setting is enabled.

Optional advanced:

```text
Max width
Max height
Resize mode
```

Default:

```text
No resize
```

---

# 23. OUTPUT FILE WRITING

Use File System Access API.

Pseudo-flow:

```ts
const handle = await outputHandle.getFileHandle(outputName, {
  create: true
})

const writable = await handle.createWritable()
await writable.write(blob)
await writable.close()
```

Protect against collisions.

Collision setting:

```text
Skip
Overwrite
Auto-number
```

Default:

```text
Auto-number
```

Example:

```text
wm_DSC_001.jpg
wm_DSC_001_2.jpg
wm_DSC_001_3.jpg
```

---

# 24. DRAG & DROP MANUAL PROCESSING

Preview area supports:

```text
Lepaskan Foto di Sini
```

Behavior:

1. Drag image.
2. Render preview.
3. Apply current watermark settings.
4. Allow download.
5. If output directory has permission, offer Save Output.
6. Add item to recent processed list.

Also support click-to-browse.

---

# 25. PREVIEW PANEL

Title:

```text
Pratinjau Hasil
```

Top-right:

```text
original resolution badge
```

Toolbar:

```text
Uji Contoh Foto
Fit
100%
Fullscreen
```

Canvas container:

- checkerboard only when relevant;
- dark neutral background;
- no distorted scaling;
- use contain.

Before image loaded:

```text
Belum ada foto
Pilih foto uji atau mulai Auto-Watch.
```

---

# 26. BEFORE / AFTER OPTION

Add a useful enhancement not mandatory in reference:

```text
[ Original | Hasil ]
```

or press-and-hold preview.

This is acceptable because it improves usability without changing the primary workflow.

---

# 27. FULLSCREEN EVENT DISPLAY

Dedicated route:

```text
/display
```

and fullscreen overlay from main app.

Display latest successful output.

Design:

- black background;
- image centered;
- `object-fit: contain`;
- optional studio logo;
- minimal metadata;
- no admin controls.

Overlay:

```text
Nama file
Waktu diproses
```

Auto-hide after 3 seconds.

Keyboard:

```text
Esc = exit fullscreen
F = fullscreen
Left = previous
Right = next
```

Use:

```js
document.documentElement.requestFullscreen()
```

Listen for:

```text
fullscreenchange
```

---

# 28. DISPLAY AUTO-UPDATE

When a new photo completes:

```text
processorStore.latestResult
```

Display route should update instantly in the same browser tab.

For separate display tab:

Use:

```text
BroadcastChannel
```

Channel:

```text
lensflow-display
```

Messages:

```ts
{
  type: 'NEW_PROCESSED_IMAGE',
  id,
  objectUrl,
  fileName,
  createdAt
}
```

Fallback:

- `localStorage` storage event;
- IndexedDB lookup.

Do not send raw 20MB base64 strings via localStorage.

---

# 29. RECENT GALLERY

Keep recent processed files locally.

Default:

```text
last 30
```

Gallery includes:

- thumbnail;
- filename;
- time;
- success/error;
- download;
- open fullscreen.

Use object URLs carefully.

Revoke no-longer-used URLs:

```js
URL.revokeObjectURL()
```

---

# 30. ZIP DOWNLOAD

Button:

```text
Unduh Semua ZIP
```

Use JSZip.

Include only current batch/recent session outputs available in memory/IndexedDB.

Filename:

```text
lensflow-output-YYYY-MM-DD-HHmm.zip
```

Provide progress:

```text
Membuat ZIP 37%
```

Disable button while generating.

Do not freeze UI with large batches.
If necessary yield between items.

---

# 31. SINGLE DOWNLOAD

Button:

```text
Unduh Single
```

Behavior:

- downloads selected/latest processed image;
- preserve generated filename;
- disabled when no result.

---

# 32. REAL-TIME PROCESSING CONSOLE

Heading:

```text
Konsol Pemantau Latar Belakang
Real-Time
```

Header:

```text
Telah diproses: 0 foto

[ Bersihkan Log ]
```

Log example:

```text
19:42:10  INFO     Sistem siap
19:42:21  INFO     Folder input dipilih: EVENT_A
19:42:25  WATCH    Auto-Watch dimulai
19:43:02  FOUND    DSC_4021.JPG
19:43:03  PROCESS  Menerapkan watermark
19:43:04  SUCCESS  wm_DSC_4021.jpg
```

Types:

```ts
INFO
WATCH
FOUND
PROCESS
SUCCESS
WARNING
ERROR
AI
```

Keep max:

```text
500 entries
```

Auto-scroll only if user is already near bottom.

Add toggle:

```text
Auto-scroll
```

---

# 33. NO AI / NO GEMINI

Aplikasi ini **tidak menggunakan AI, OpenAI, atau layanan AI apa pun**.

Tidak ada:

- API key AI;
- endpoint AI;
- upload preview ke AI;
- disabled;
- disabled placement;
- disabled;
- disabled text.

Semua proses watermark harus bekerja **sepenuhnya lokal di browser**.

Keuntungan:

- setup lebih sederhana;
- tidak ada biaya/quota API;
- tidak ada risiko API key bocor;
- tidak bergantung internet untuk pemrosesan foto;
- lebih cocok untuk event panjang;
- privasi foto lebih baik.

---

# 34. TEXT WATERMARK MANUAL

Tetap sediakan text watermark **manual** tanpa AI.

User dapat mengetik sendiri:

```text
Nama Event
Nama Pengantin
Tanggal
Nama Studio
Copyright
Tagline
```

Options:

- font family from safe allowlist;
- font size;
- font weight;
- color;
- opacity;
- shadow;
- stroke;
- alignment;
- 9-grid position.

Safe font allowlist:

```text
Inter
Arial
Georgia
Times New Roman
system-ui
```

Tidak boleh loading arbitrary remote fonts at runtime.

---

# 35. MULTI-LAYER OVERLAY ENGINE

Internal architecture should allow:

```ts
type OverlayLayer =
  | ImageOverlay
  | FrameOverlay
  | TextOverlay
```

Processing engine should support multiple layers.

Example:

```text
Frame
+ Studio logo
+ Manual caption
```

Each layer has:

```ts
id
enabled
type
zIndex
opacity
position
rotation
```

---

# 36. INTERNET INDEPENDENCE

Core application must work without internet after the page/app shell has loaded.

Required local functions:

- folder picker;
- auto-watch;
- image processing;
- watermark;
- frame;
- manual text watermark;
- preview;
- fullscreen display;
- save to output folder;
- ZIP;
- local presets;
- local logs.

Cloudflare sync is optional enhancement only.

---

# 37. PRIVACY PRINCIPLE

Default behavior:

```text
Foto tidak di-upload ke layanan AI.
Foto event diproses lokal di perangkat.
```

Jika R2 backup diaktifkan, hanya aset seperti logo/frame/preset yang boleh diunggah secara default.

Foto event asli dan hasil output tetap lokal kecuali fitur cloud upload khusus dibuat di masa depan.

---

# 38. RESERVED FOR FUTURE NON-AI EXTENSIONS

Possible future features:

- QR gallery;
- LAN display sync;
- printing queue;
- event preset manager;
- desktop companion.

Jangan tambahkan AI di MVP.

---

# 39. APP BRANDING SETTINGS

Modal:

```text
Pengaturan Nama Aplikasi & Branding

Nama Utama Aplikasi / Studio
[ LensFlow Watermark Pro ]

Sub-Judul / Tagline
[ Sistem Watermark Otomatis Event & Studio ]

[ Reset Default ] [ Simpan Nama ]
```

Persist:

1. local first;
2. sync to cloud settings if logged in.

Fields:

```text
app_name
tagline
logo_url
```

No page reload required.

---

# 40. NO AUTHENTICATION SETTINGS

Tidak ada menu:

- login;
- logout;
- change password;
- account;
- role management;
- session management.

Jangan membuat komponen autentikasi tersembunyi atau default password.

---

# 41. LOCAL SETTINGS

Use IndexedDB for:

```text
directory handles
recent fingerprints
recent jobs
local watermark asset
current configuration
```

Use `localStorage` only for small non-sensitive preferences:

```text
UI density
last selected tab
theme preference
```

Never store:

```text
Cloudflare API token
Worker secrets
```

---

# 42. PINIA STORES

## settings store

State:

```ts
branding
watermark
output
ai
watcher
```

## processor store

State:

```ts
watching
paused
queue
logs
processedCount
latestResult
recentResults
selectedResult
```

---

# 43. DATABASE — CLOUDFLARE D1

Create migrations.

## app_settings

```sql
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## presets

```sql
CREATE TABLE presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL,
  asset_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## processing_history

```sql
CREATE TABLE processing_history (
  id TEXT PRIMARY KEY,
  source_filename TEXT NOT NULL,
  output_filename TEXT,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  settings_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_processing_history_created_at
ON processing_history(created_at);
```

Do not store raw local photo binary in D1.

---

# 44. R2 STORAGE

Bucket:

```text
lensflow-assets
```

Use R2 only for:

- logo backup;
- custom watermark preset assets;
- frame assets;
- optional thumbnails explicitly enabled by user.

Do not automatically upload event originals.

Object pattern:

```text
presets/{presetId}/asset.webp
branding/logo.webp
```

Set file-size limits.

Validate MIME.

Prefer private bucket + signed/proxied access.

---

# 45. CLOUDFLARE WORKER ENV

`worker/wrangler.toml` concept:

```toml
name = "lensflow-api"
main = "src/index.ts"
compatibility_date = "2026-08-01"

[[d1_databases]]
binding = "DB"
database_name = "lensflow"
database_id = "REPLACE_ME"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "lensflow-assets"
```

Secrets:

```text
ALLOWED_ORIGINS
```

Use:

```bash
wrangler secret put ```

Do not put secrets in `wrangler.toml`.

---

# 46. WORKER API ROUTES

Base:

```text
/api
```

## Settings

```text
GET    /api/settings
PUT    /api/settings
```

## Presets

```text
GET    /api/presets
POST   /api/presets
PUT    /api/presets/:id
DELETE /api/presets/:id
```

## History

```text
GET    /api/history
POST   /api/history
DELETE /api/history
```

## Asset

```text
POST   /api/assets
GET    /api/assets/:id
DELETE /api/assets/:id
```

---

# 47. API RESPONSE FORMAT

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Permintaan tidak valid."
  }
}
```

Do not expose stack traces in production.

---

# 48. NO-AUTH API SECURITY MODEL

Aplikasi tidak menggunakan cookie session atau akun.

Cloudflare Worker tetap wajib dilindungi dari penyalahgunaan melalui:

- strict CORS allowlist;
- Origin validation;
- request size limits;
- MIME validation;
- rate limiting;
- no secrets in frontend;
- optional Cloudflare WAF/rate limiting rules.

Frontend boleh full-access, tetapi Worker tidak boleh menjadi open API yang bisa disalahgunakan.

Recommended origins:

```text
https://watermark.example.com
http://localhost:3000
```

Do not allow arbitrary origins.

---

# 49. REQUEST ORIGIN VALIDATION

Untuk semua endpoint write/AI:

- cek `Origin`;
- hanya izinkan origin frontend yang dikonfigurasi;
- tolak origin yang tidak dikenal;
- batasi methods dan headers;
- jangan gunakan wildcard CORS untuk endpoint sensitif/AI.

Karena tidak ada cookie auth, CSRF berbasis session tidak diperlukan, tetapi **Origin validation tetap wajib** untuk mencegah penyalahgunaan endpoint dari website lain.

---

# 50. RATE LIMITING

General write endpoints:

```text
reasonable IP-based limit
```

Protect endpoints against abuse.

---

# 51. WORKER SIMPLICITY

Worker tidak menangani AI.

Worker hanya menangani kebutuhan cloud ringan seperti:

- settings sync;
- preset metadata;
- history summary;
- optional R2 asset backup.

Tidak ada image inference, prompt processing, atau API key AI.

---

# 52. NUXT ENVIRONMENT

`.env.example`

```env
NUXT_PUBLIC_APP_NAME=LensFlow Watermark Pro
NUXT_PUBLIC_API_BASE=http://localhost:8787
```

Production Vercel:

```text
NUXT_PUBLIC_APP_NAME
NUXT_PUBLIC_API_BASE
```

No private Worker/Cloudflare secrets should be present in Vercel frontend env unless a server-only Nuxt route genuinely requires them.

---

# 53. NUXT CONFIG

Requirements:

- TypeScript strict;
- Tailwind;
- Pinia;
- sensible meta tags;
- runtime config;
- Vercel-compatible Nitro deployment.

Do not hardcode local API URL.

Use:

```ts
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE
  }
}
```

---

# 54. API CLIENT

Create single API client.

Features:

- base URL from runtime config;
- typed response;
- API availability/error handling;
- timeout;
- error normalization.

Never scatter raw `$fetch('https://...')` across components.

---

# 55. FOLDER PERMISSION UX

When restored from IndexedDB, directory handles may need permission again.

Implement:

```ts
await handle.queryPermission({ mode: 'readwrite' })
await handle.requestPermission({ mode: 'readwrite' })
```

If denied:

```text
Akses folder perlu diberikan kembali.
[Pilih/Ulangi Izin]
```

Do not falsely show watcher as running.

---

# 56. WATCHER STATE MACHINE

Use explicit states:

```ts
type WatcherState =
  | 'idle'
  | 'requesting-permission'
  | 'ready'
  | 'watching'
  | 'paused'
  | 'processing'
  | 'error'
```

Avoid scattered booleans:

```text
isWatching
isPaused
isRunning
isProcessing
```

that can contradict each other.

---

# 57. ERROR HANDLING

Handle:

- directory permission revoked;
- output unavailable;
- malformed image;
- unsupported file;
- canvas failure;
- quota exceeded;
- disk write failure;
- network timeout;
- session expired;
- D1 API failure;
- R2 failure.

Core local processing should continue if cloud history sync fails.

Example:

```text
Foto berhasil diproses lokal.
Riwayat cloud gagal disinkronkan.
```

---

# 58. OFFLINE / DEGRADED MODE

App should remain usable for local watermark operations when:

- internet temporarily disappears;
- Cloudflare history endpoint unavailable.

Tidak ada session/auth requirement.

A brief network interruption must not terminate active local folder processing.

Queue history sync and retry later.

---

# 59. PROCESSING LOG PERSISTENCE

Store current session logs locally.

Do not continuously insert every log line into D1.

Cloud history should contain summary records only.

Example:

```text
source
output
status
duration
timestamp
preset id
```

---

# 60. PERFORMANCE

Target:

- no full-page re-render when log changes;
- preview interactions responsive;
- process 24 MP JPEGs without permanently locking UI;
- cap thumbnails;
- release object URLs;
- no base64 state storage for full-res photos;
- avoid duplicating image ArrayBuffers.

When possible:

```text
createImageBitmap
OffscreenCanvas
Web Worker
```

May be used incrementally.

---

# 61. WEB WORKER IMAGE ENGINE — PREFERRED

Preferred final implementation:

```text
Browser main thread
      ↓
Image Processing Web Worker
      ↓
OffscreenCanvas
      ↓
Blob result
```

If browser lacks OffscreenCanvas:

fallback to main-thread Canvas with controlled queue.

---

# 62. PWA OPTION

Optional but recommended:

- installable PWA;
- manifest;
- app icon;
- cache static app shell.

Do not cache auth/API responses containing sensitive data indiscriminately.

---

# 63. RESPONSIVENESS

Desktop is primary.

Breakpoints:

```text
< 768px
768–1199px
>= 1200px
```

On mobile:

- preview full width;
- controls below;
- make 9-grid easy to tap;
- folder watcher warning if unsupported.

---

# 64. ACCESSIBILITY

Requirements:

- visible keyboard focus;
- labels for all form fields;
- `aria-label` icon buttons;
- not color-only statuses;
- Esc closes modal/fullscreen;
- dialogs trap focus;
- sliders have numeric values.

---

# 65. KEYBOARD SHORTCUTS

Add:

```text
Space   pause/resume watcher when not typing
F       fullscreen latest image
P       process selected test image
C       clear logs (with confirmation)
Esc     close modal/fullscreen
```

Do not trigger shortcuts while focus is in input/textarea/contenteditable.

---

# 66. CONFIRMATION DIALOGS

Require confirmation for:

- clear processing history;
- delete preset;
- overwrite same file if overwrite mode;
- logout while queue processing;
- reset all settings.

No confirmation needed for:

- clear temporary console log;
- switching watermark position.

---

# 67. TOASTS

Use compact toast system.

Examples:

```text
Folder input berhasil dipilih
Auto-Watch dimulai
Watermark tersimpan
Foto berhasil diproses
Akses folder ditolak
```

Do not spam one toast for every watched image during high-volume events.
Use log panel for repetitive success status.

---

# 68. SETTINGS MENU

Menu:

```text
Branding
Preset
Riwayat
Tentang Aplikasi
Reset Pengaturan
```

Tidak ada Account, Login, Logout, atau Change Password.

No unnecessary full enterprise admin dashboard for v1.

---

# 69. HISTORY DRAWER / MODAL

Optional cloud history screen:

Columns:

```text
Time
Source
Output
Status
Duration
Preset
```

Filters:

```text
Today
Success
Failed
Search filename
```

Pagination.

Do not load unlimited rows.

---

# 70. DATE/TIME

Display in user locale.

Default:

```text
id-ID
Asia/Jakarta
```

Store UTC ISO string in database.

---

# 71. PRIVACY

Add concise privacy notice:

```text
Foto diproses secara lokal di perangkat Anda secara default.
Foto event tidak dikirim ke layanan AI.
```

This statement must match implementation.

---

# 72. NO EXTERNAL IMAGE AI TRANSMISSION

Tidak ada fitur yang mengirim preview/foto ke AI atau layanan AI lainnya.

Core principle:

```text
Input photo → local browser processing → output photo
```

Jika cloud sync aktif, yang dikirim hanya metadata/config/aset preset sesuai kebutuhan, bukan foto event utama.

---

# 73. SECURITY HEADERS

Configure appropriate headers:

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy
Strict-Transport-Security on production/custom domain
```

CSP must permit only required AI/API/image sources.

Avoid `'unsafe-eval'`.

---

# 74. XSS PROTECTION

Never render:

- filenames via `v-html`;
- SVG user upload raw in DOM.

Treat all as text.

---

# 75. FILE NAME SANITIZATION

Sanitize output names.

Remove/replace:

```text
/ \ : * ? " < > |
control characters
```

Trim trailing dots/spaces where relevant.

Prevent path traversal.

---

# 76. BRANDING ASSET

Logo upload:

- PNG/WEBP;
- max 2 MB;
- crop preview;
- saved to R2 when cloud backup enabled;
- local fallback.

---

# 77. FIRST-RUN EXPERIENCE

Saat aplikasi pertama kali dibuka:

Show compact 3-step onboarding:

```text
1. Pilih Folder Input
2. Pilih Folder Output
3. Unggah Watermark / pilih preset
```

CTA:

```text
Mulai Setup
```

Do not create a multi-page wizard.
Main UI should remain visible.

---

# 78. EMPTY STATES

No watermark:

```text
Belum ada watermark.
Unggah logo atau gunakan preset.
```

No processed photos:

```text
Belum ada foto yang diproses.
```

No logs:

```text
Konsol siap.
```

No folder:

```text
Belum memilih folder.
```

---

# 79. PROCESSING PROGRESS

For current image:

```text
DSC_4902.JPG

Decoding       ✓
Watermark      ✓
Encoding       72%
Saving         waiting
```

Do not fake exact percentages if browser encoder API does not expose them.
Use indeterminate state instead.

---

# 80. CANVAS PROCESSOR PSEUDOCODE

```ts
async function processImage(
  file: File,
  config: WatermarkConfig
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  const canvas = createCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(bitmap, 0, 0)

  for (const layer of config.layers.sort(byZIndex)) {
    if (!layer.enabled) continue

    if (layer.type === 'image') {
      drawImageWatermark(ctx, layer, canvas.width, canvas.height)
    }

    if (layer.type === 'frame') {
      drawFrame(ctx, layer, canvas.width, canvas.height)
    }

    if (layer.type === 'text') {
      drawTextWatermark(ctx, layer, canvas.width, canvas.height)
    }
  }

  bitmap.close?.()

  return canvasToBlob(canvas, config.output)
}
```

Do not implement processing by CSS screenshot.

---

# 81. PROCESSING IDEMPOTENCY

Watcher must never repeatedly watermark the same file every 2 seconds.

Use:

```text
fingerprint cache
```

and optionally output check.

When source file metadata changes later, treat as updated file only after stability threshold.

---

# 82. SOURCE/OUTPUT LOOP PROTECTION

If user accidentally selects same directory as both input and output:

BLOCK watcher.

Message:

```text
Folder Input dan Output tidak boleh sama karena dapat menyebabkan file diproses berulang.
```

Also detect output nested inside input if feasible.
At minimum ignore files beginning with configured output prefix.

---

# 83. SAMPLE TEST PHOTO

Bundled royalty-free/sample placeholder image under:

```text
/public/sample/test-event.jpg
```

Do not copy sample from reference site without permission.

Button:

```text
Uji Contoh Foto
```

---

# 84. PRESET ASSETS

Use original generic assets created for project.

Do not copy proprietary watermarks from reference.

Preset names/functionality may be equivalent, but asset graphics must be original.

---

# 85. LOADING SKELETONS

Use only for remote cloud data:

- presets sync;
- history;
- branding sync.

Do not show unnecessary skeleton for local controls.

---

# 86. TESTING

Use:

- Vitest
- Nuxt Test Utils where relevant
- Playwright for critical E2E.

Unit tests:

```text
filename sanitizer
position math
collision name generator
watermark scale math
config validation
API error mapping
fingerprint generation
```

E2E:

```text
open app directly
change watermark controls
manual image processing
settings persistence
cloud API error handling
```

File System Access API can be mocked in E2E.

---

# 87. SECURITY TEST CHECKLIST

Verify:

- tidak ada password/auth code yang tidak diperlukan;
- Cloudflare token absent from Git;
- `.env` ignored;
- R2 bucket not public unless intentionally configured;
- write endpoints rate limited;
- CORS restricted;
- Origin validation enabled;
- SVG cannot execute script;
- filename cannot path traverse;
- AI output cannot inject HTML.

---

# 88. GITIGNORE

Must include:

```gitignore
node_modules
.nuxt
.output
dist
.env
.env.*
!.env.example
.dev.vars
.wrangler
.DS_Store
*.log
```

Never commit secrets.

---

# 89. PACKAGE SCRIPTS

Root:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Worker scripts separately:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate:local": "wrangler d1 migrations apply lensflow --local",
    "db:migrate:remote": "wrangler d1 migrations apply lensflow --remote"
  }
}
```

---

# 90. LOCAL DEVELOPMENT

Terminal A:

```bash
npm install
npm run dev
```

Terminal B:

```bash
cd worker
npm install
npm run dev
```

Local env:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8787
```

---

# 91. CLOUDFLARE INITIAL SETUP

Operator steps:

```bash
cd worker
npx wrangler login

npx wrangler d1 create lensflow
npx wrangler r2 bucket create lensflow-assets
```

Copy generated D1 ID into `wrangler.toml`.

Apply migration:

```bash
npm run db:migrate:remote
```

Set Worker secrets:

```bash
npx wrangler secret put npx wrangler secret put ALLOWED_ORIGINS
```

Deploy API:

```bash
npm run deploy
```

Copy Worker URL.

---

# 92. NO ADMIN BOOTSTRAP

Tidak ada pembuatan akun admin.

Setelah frontend dan Worker selesai dikonfigurasi:

```text
Open URL
   ↓
Dashboard langsung terbuka
```

Jangan membuat default credential seperti:

```text
admin
admin123
password
```

karena autentikasi memang tidak digunakan.

---

# 93. GITHUB FLOW

After local project works:

```bash
git init
git add .
git commit -m "feat: initial LensFlow Watermark Pro"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY>
git push -u origin main
```

Subsequent changes:

```bash
git add .
git commit -m "feat: improve watermark workflow"
git push
```

Frontend deployment must follow Git integration.

---

# 94. VERCEL IMPORT

Procedure:

1. Login Vercel.
2. Add New → Project.
3. Import GitHub repository.
4. Vercel detects Nuxt.
5. Add environment variables.
6. Deploy.

Set:

```text
NUXT_PUBLIC_APP_NAME=LensFlow Watermark Pro
NUXT_PUBLIC_API_BASE=https://YOUR-WORKER.workers.dev
```

Build command:

```text
nuxt build
```

Vercel should use Nuxt auto-detection.

Do not add unnecessary custom `vercel.json` unless required.

---

# 95. PRODUCTION DOMAIN

Recommended:

```text
watermark.example.com -> Vercel
api.example.com       -> Cloudflare Worker
```

Update CORS allowlist after domain is ready.

If using default domains initially:

```text
https://project-name.vercel.app
https://worker-name.username.workers.dev
```

Credentials/cookies across different sites require careful SameSite/CORS handling.

Custom domain tetap direkomendasikan agar Origin/CORS API lebih mudah dikontrol.

---

# 96. VERCEL PREVIEW DEPLOYMENTS

Preview deploys use different domains.

Do not wildcard `*.vercel.app` carelessly for API CORS in production.

Use:

- explicit dev/preview allowlist;
- or disable privileged cloud writes for unknown previews.

---

# 97. FREE-TIER AWARE DESIGN

D1:

Use for small relational data/config/history.

R2:

Use for reusable watermark assets only.

Main event photos:

**local-only by default**.

This dramatically reduces storage and operation usage.

Add retention setting:

```text
Processing history: 30 / 90 / 180 days
```

Clean old metadata via scheduled Worker if needed.

---

# 98. UX COPY — MAIN

Recommended original copy:

Header:

```text
LensFlow Watermark Pro
AUTO EVENT IMAGE PROCESSOR
```

Folder:

```text
Folder Automation
Pilih sumber foto dan lokasi hasil pemrosesan.
```

Watch:

```text
Auto-Watch
Foto baru akan diproses secara otomatis saat terdeteksi.
```

AI:

```text
Presets & Watermark
Gunakan preset untuk mempercepat workflow.
```

Designer:

```text
Watermark Designer
Atur identitas visual tanpa mengubah file asli.
```

Preview:

```text
Live Preview
Lihat hasil sebelum diterapkan ke seluruh batch.
```

Console:

```text
Processing Console
Aktivitas pemantauan dan pemrosesan foto.
```

---

# 99. STATUS BADGES

Map:

```text
idle       Neutral
ready      Info
watching   Success
paused     Warning
processing Accent
error      Danger
```

Animate only watching indicator subtly.

No excessive glowing UI.

---

# 100. FINAL UI QUALITY BAR

The page should look like:

- a commercial photographer workstation tool;
- deliberate typography;
- consistent spacing;
- aligned controls;
- dense but not cramped;
- useful desktop layout.

The page must NOT look like:

- generic disabled SaaS landing page;
- crypto dashboard;
- template admin panel;
- neon glassmorphism demo;
- random cards with huge padding.

---

# 101. NO PLACEHOLDER IMPLEMENTATION RULE

Agent must not finish with:

```ts
// TODO implement
alert('Coming soon')
console.log('fake process')
```

for core functionality.

Core features must be operational.

Allowed postponed functions should be clearly marked under `/docs/roadmap.md`, not presented as working UI.

---

# 102. DEFINITION OF DONE — DIRECT ACCESS

- [ ] Opening `/` directly shows the application.
- [ ] No login screen exists.
- [ ] No password is required.
- [ ] No session timeout exists.
- [ ] No logout/change-password UI exists.
- [ ] No users/sessions tables are required.
- [ ] AI/API secrets remain server-side.
- [ ] Worker AI/write endpoints have Origin validation and rate limiting.

---

# 103. DEFINITION OF DONE — FOLDERS

- [ ] Input folder picker works in supported Chromium.
- [ ] Output folder picker works.
- [ ] Permissions are checked.
- [ ] Folder handles persist locally where allowed.
- [ ] Same input/output is rejected.
- [ ] Permission denial has clean error state.

---

# 104. DEFINITION OF DONE — WATCHER

- [ ] Start works.
- [ ] Pause works.
- [ ] Stop works.
- [ ] Default polling approximately every 2 seconds.
- [ ] Same photo is not repeatedly processed.
- [ ] Partially-written photos are handled.
- [ ] New files enter queue.
- [ ] Queue does not overlap uncontrollably.

---

# 105. DEFINITION OF DONE — WATERMARK

- [ ] Upload logo works.
- [ ] Frame mode works.
- [ ] Scale works.
- [ ] Opacity works.
- [ ] Margin works.
- [ ] Rotation works.
- [ ] 9-grid position works.
- [ ] Preview updates live.
- [ ] Full-resolution output uses same configuration.
- [ ] Output filename prefix works.

---

# 106. DEFINITION OF DONE — OUTPUT

- [ ] Files save to selected output folder.
- [ ] Collision handling works.
- [ ] Single download works.
- [ ] ZIP download works.
- [ ] JPEG quality setting works.
- [ ] No unintended resolution loss by default.

---

# 107. DEFINITION OF DONE — DISPLAY

- [ ] Latest photo can display fullscreen.
- [ ] Separate display route works.
- [ ] New processed image updates display.
- [ ] Escape exits fullscreen.
- [ ] Previous/next works for recent results.

---

# 108. DEFINITION OF DONE — NO AI

- [ ] No AI dependency exists.
- [ ] No AI API key is required.
- [ ] No AI endpoint exists.
- [ ] No photo preview is sent to external AI.
- [ ] Manual text watermark works.
- [ ] Core watermark workflow remains fully local.

---

# 109. DEFINITION OF DONE — CLOUD

- [ ] D1 migrations run.
- [ ] Settings sync works.
- [ ] Presets sync works.
- [ ] Optional history works.
- [ ] R2 asset upload works.
- [ ] Main photo workflow does not require R2.
- [ ] Cloud API errors degrade gracefully.

---

# 110. DEFINITION OF DONE — DEPLOYMENT

- [ ] `.env` not committed.
- [ ] GitHub repository builds.
- [ ] Git push works.
- [ ] Vercel import succeeds.
- [ ] Nuxt production build succeeds.
- [ ] Worker production deployment succeeds.
- [ ] Vercel environment variables configured.
- [ ] Production frontend can reach Worker API.
- [ ] Dashboard opens directly without authentication.
- [ ] Worker rejects unauthorized Origins for protected write/AI endpoints.

---

# 111. CODE QUALITY REQUIREMENTS

- TypeScript strict.
- No `any` unless documented.
- Composables for browser APIs.
- Services for API/business logic.
- Components remain presentation-focused.
- No 1,000-line page component.
- Reusable watermark math separated from Vue.
- Errors typed.
- Zod schemas shared where practical.
- Functions small and testable.

---

# 112. IMPLEMENTATION ORDER FOR CODEX

Follow this order without asking for confirmation after each stage.

## Stage 1 — Bootstrap

- Nuxt 4
- Tailwind
- Pinia
- project structure
- lint/typecheck
- app shell

## Stage 2 — Main UI parity

- direct-access dashboard
- header
- folder card
- AI card
- designer
- preview
- console
- modals

## Stage 3 — Local image engine

- manual upload
- canvas renderer
- watermark layer
- frame
- controls
- download

## Stage 4 — Directory Access

- folder input/output
- permission persistence
- file scan
- watcher
- queue
- output writer

## Stage 5 — Fullscreen/display

- recent results
- BroadcastChannel
- fullscreen route
- navigation

## Stage 6 — Worker backend

- D1
- migration
- settings
- presets
- history
- Origin/CORS protection
- rate limiting

## Stage 7 — R2

- preset asset backup
- branding logo

## Stage 8 — Local workflow polish

- manual text watermark
- preset improvements
- offline/degraded behavior
- performance tuning

## Stage 9 — Hardening

- CSP
- CORS
- rate limiting
- CSRF protections
- SVG safety
- filename sanitation
- error boundary

## Stage 10 — Tests

- unit
- E2E
- browser API mocks

## Stage 11 — Documentation

- README
- environment variables
- Cloudflare setup
- Vercel setup
- GitHub flow
- troubleshooting

## Stage 12 — Final verification

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Fix all blocking errors.

Worker:

```bash
cd worker
npm run test
npm run deploy -- --dry-run
```

or equivalent Wrangler validation.

Do not report success until builds pass.

---

# 113. README MUST INCLUDE

README sections:

```text
Overview
Features
Architecture
Requirements
Local setup
Cloudflare D1 setup
Cloudflare R2 setup
Worker secrets
Direct-access mode
Running locally
GitHub push
Vercel deployment
Custom domain
Browser compatibility
Privacy
Troubleshooting
```

---

# 114. TROUBLESHOOTING DOCUMENTATION

Explain:

## Folder picker tidak muncul

Likely unsupported browser or insecure context.

## Folder permission kembali hilang

Browser requires permission renewal.

## Foto tidak terdeteksi

Check:

- watcher running;
- supported extension;
- file still writing;
- selected input folder.

## Output tidak tersimpan

Check:

- write permission;
- disk space;
- same folder conflict.

## AI gagal

Local watermark still works.
Check Worker secret and API quota.

## API works locally but not production

Check:

- HTTPS;
- CORS;
- allowed origin;
- API base URL;
- Worker deployment;
- environment variables.

---

# 115. DO NOT COPY THESE THINGS FROM REFERENCE

Do not duplicate:

- original site's logo;
- site owner name;
- proprietary brand name;
- watermark graphic assets;
- source code;
- private APIs;
- passwords;
- hidden credentials.

Replicate the **product concept, functional workflow, information architecture, and interaction behavior** while implementing original code and original branding.

---

# 116. CODING AGENT EXECUTION INSTRUCTION

You are the implementation agent.

Do not only explain how to build it.
Create the actual files.

Rules:

1. Inspect repository before changing files.
2. Preserve working code when possible.
3. Build incrementally.
4. Use production-quality patterns.
5. Never hardcode secrets.
Do not add login/password/session authentication; this is intentionally a direct-access personal app.
Do not add AI, OpenAI, or any other AI integration.
6. Never fabricate a successful build.
7. Run relevant tests.
8. Fix type errors.
9. Fix build errors.
10. Keep README current.
11. Do not ask the human for trivial confirmations.
12. When a value truly must come from the human, add a clear placeholder in `.env.example` and continue implementing everything else.
13. Make the app visually polished.
14. Do not ship fake buttons.
15. UI theme must be light white + emerald green, production-grade, and explicitly non-AI-slop.
16. Do not replace real folder processing with upload-only mock behavior.
17. Do not upload user event photos to cloud by default.
18. Optimize for event usage lasting multiple hours.
---

# 117. FINAL ACCEPTANCE SCENARIO

The finished application should pass this real-world scenario:

```text
1. Operator opens production app on Chrome laptop.
2. Dashboard langsung terbuka tanpa login/password.
3. Operator selects camera/tether output folder as Folder Input.
4. Operator selects a different Folder Output.
5. Operator uploads transparent studio logo.
6. Operator chooses bottom-right.
7. Scale = 22%.
8. Opacity = 90%.
9. Margin = 36px.
10. Prefix = EVENT_
11. Operator presses Start.
12. Photographer takes a photo.
13. Tether software writes DSC_9001.JPG into Folder Input.
14. App detects stable completed file.
15. App processes it once.
16. App writes EVENT_DSC_9001.jpg to Folder Output.
17. Console shows success.
18. Processed count increments.
19. Latest preview changes.
20. Fullscreen display updates automatically.
21. Photographer takes another photo.
22. Same process repeats without reprocessing old image.
23. Temporary internet interruption occurs.
24. Local watcher continues.
25. Internet returns.
26. Optional history sync catches up.
27. Operator optionally adds a manual text caption.
28. Caption can be applied as a text layer.
29. Operator stops watcher.
30. Operator downloads session ZIP if desired.
```

If this scenario works reliably, the core application is complete.

---

# 118. POST-V1 IDEAS — DO NOT BLOCK MVP

Future roadmap only:

- QR gallery sharing;
- local network slideshow;
- dual-screen operator/display mode;
- hot folder via desktop companion;
- RAW decode;
- print queue;
- WhatsApp delivery;
- event-specific presets;
- client gallery;
- multiple simultaneous watch folders;
- Capture One/Lightroom integration;
- desktop Tauri wrapper.

These are not required for MVP.

---

# 119. FINAL PRODUCT PRINCIPLE

The application must prioritize:

```text
Reliability during events
> local processing speed
> safe file handling
> predictable output
> polished usability
> optional cloud sync
```

Do not sacrifice the core folder-watcher workflow for unnecessary SaaS features.

