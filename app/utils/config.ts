import { DEFAULT_SETTINGS } from './defaults'
import type { AppSettings } from '../types'

const number = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback

export function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_SETTINGS)
  const input = value as Partial<AppSettings>
  const output = input.output ?? DEFAULT_SETTINGS.output
  return {
    branding: {
      appName: String(input.branding?.appName || DEFAULT_SETTINGS.branding.appName).slice(0, 100),
      tagline: String(input.branding?.tagline || DEFAULT_SETTINGS.branding.tagline).slice(0, 180),
      ...(input.branding?.logoUrl ? { logoUrl: input.branding.logoUrl } : {}),
    },
    output: {
      format: ['jpeg', 'png', 'webp'].includes(output.format) ? output.format : 'jpeg',
      quality: number(output.quality, 0.92, 0.6, 1), prefix: String(output.prefix ?? 'wm_').slice(0, 50),
      collision: ['skip', 'overwrite', 'auto-number'].includes(output.collision) ? output.collision : 'auto-number',
      ...(output.maxWidth ? { maxWidth: number(output.maxWidth, 0, 1, 20000) } : {}), ...(output.maxHeight ? { maxHeight: number(output.maxHeight, 0, 1, 20000) } : {}),
    },
    watcher: { intervalMs: number(input.watcher?.intervalMs, 2000, 500, 60000), stabilityDelayMs: number(input.watcher?.stabilityDelayMs, 750, 500, 5000), concurrency: [1, 2, 3].includes(input.watcher?.concurrency ?? 0) ? input.watcher!.concurrency : 1 },
    watermark: { layers: (input.watermark?.layers ?? []).filter((layer) => layer?.type === 'frame'), output: { ...DEFAULT_SETTINGS.output, ...output } },
  }
}
