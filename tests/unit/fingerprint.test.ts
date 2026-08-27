import { describe, expect, it } from 'vitest'
import { createFingerprint, isSupportedImage, shouldIgnoreFile } from '../../app/utils/fingerprint'

describe('file detection', () => {
  it('builds deterministic metadata fingerprint', () => { expect(createFingerprint({ name: 'a.jpg', size: 42, lastModified: 100 })).toBe('a.jpg:42:100') })
  it('accepts only supported raster files', () => { expect(isSupportedImage('A.JPEG')).toBe(true); expect(isSupportedImage('camera.raw')).toBe(false) })
  it('ignores system, temporary, and generated files', () => { expect(shouldIgnoreFile('Thumbs.db')).toBe(true); expect(shouldIgnoreFile('x.tmp')).toBe(true); expect(shouldIgnoreFile('wm_a.jpg', 'wm_')).toBe(true) })
})

