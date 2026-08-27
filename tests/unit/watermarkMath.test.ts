import { describe, expect, it } from 'vitest'
import { containSize, coverSize, positionInCanvas, scaledSize } from '../../app/utils/watermarkMath'

describe('watermark math', () => {
  it('scales proportionally', () => { expect(scaledSize({ width: 400, height: 200 }, 0.25)).toEqual({ width: 100, height: 50 }) })
  it('positions at all representative anchors', () => { expect(positionInCanvas({ width: 1000, height: 800 }, { width: 100, height: 50 }, 'top-left', 20)).toEqual({ x: 20, y: 20 }); expect(positionInCanvas({ width: 1000, height: 800 }, { width: 100, height: 50 }, 'center', 20)).toEqual({ x: 450, y: 375 }); expect(positionInCanvas({ width: 1000, height: 800 }, { width: 100, height: 50 }, 'bottom-right', 20)).toEqual({ x: 880, y: 730 }) })
  it('calculates contain and cover', () => { expect(containSize({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({ width: 100, height: 50 }); expect(coverSize({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({ width: 200, height: 100 }) })
})

