import { describe, expect, it } from 'vitest'
import { buildOutputName, numberedFilename, sanitizeFilename, sanitizePrefix } from '../../app/utils/filename'

describe('filename utilities', () => {
  it('removes traversal, control and filesystem-reserved characters', () => { expect(sanitizeFilename('../bad\0:name?.jpg')).toBe('bad_name_.jpg') })
  it('limits prefix length', () => { expect(sanitizePrefix('x'.repeat(70))).toHaveLength(50) })
  it('creates a normalized output extension', () => { expect(buildOutputName('DSC_01.JPG', 'EVENT_', 'jpeg')).toBe('EVENT_DSC_01.jpg') })
  it('auto-numbers before extension', () => { expect(numberedFilename('photo.jpg', 3)).toBe('photo_3.jpg') })
})

