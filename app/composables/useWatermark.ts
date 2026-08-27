import type { OverlayLayer } from '../types'

export function useWatermark() {
  const sortLayers = (layers: OverlayLayer[]): OverlayLayer[] => [...layers].filter((layer) => layer.enabled).sort((a, b) => a.zIndex - b.zIndex)
  const validateAsset = (file: File, maxBytes = 10 * 1024 * 1024): void => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) throw new Error('Format watermark tidak didukung.')
    if (file.size > maxBytes) throw new Error('Ukuran watermark melebihi batas.')
  }
  return { sortLayers, validateAsset }
}

