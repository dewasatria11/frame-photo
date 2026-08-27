import type { AppSettings } from '../types'

export const DEFAULT_SETTINGS: AppSettings = {
  branding: { appName: 'LensFlow Watermark Pro', tagline: 'Sistem Watermark Otomatis Event & Studio' },
  output: { format: 'jpeg', quality: 0.92, prefix: 'wm_', collision: 'auto-number' },
  watcher: { intervalMs: 2000, stabilityDelayMs: 750, concurrency: 1 },
  watermark: { layers: [], output: { format: 'jpeg', quality: 0.92, prefix: 'wm_', collision: 'auto-number' } },
}

