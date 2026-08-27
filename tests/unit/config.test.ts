import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../../app/utils/config'

describe('configuration normalization', () => {
  it('uses defaults for invalid input', () => { const config = normalizeSettings(null); expect(config.output.quality).toBe(0.92); expect(config.watcher.intervalMs).toBe(2000) })
  it('clamps unsafe numeric values', () => { const config = normalizeSettings({ output: { format: 'jpeg', quality: 9, prefix: 'x', collision: 'skip' }, watcher: { intervalMs: 5, stabilityDelayMs: 20, concurrency: 1 } }); expect(config.output.quality).toBe(1); expect(config.watcher.intervalMs).toBe(500); expect(config.watcher.stabilityDelayMs).toBe(500) })
  it('retains frames and discards legacy logo/text layers', () => {
    const config = normalizeSettings({ watermark: { layers: [
      { id: 'frame', type: 'frame', enabled: true },
      { id: 'logo', type: 'image', enabled: true },
      { id: 'text', type: 'text', fontFamily: 'Inter', enabled: true },
    ] } })
    expect(config.watermark.layers.map(layer => layer.id)).toEqual(['frame'])
  })
})
