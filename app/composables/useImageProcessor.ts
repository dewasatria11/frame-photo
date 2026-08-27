import type { FrameOverlay, ImageOverlay, OverlayLayer, OutputSettings, TextOverlay, WatermarkConfig } from '../types'
import { containSize, coverSize, positionInCanvas, scaledSize } from '../utils/watermarkMath'
import { safeSvgToImage } from '../utils/svg'

type Drawable = ImageBitmap | HTMLImageElement
function dimensions(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLImageElement) return { width: source.naturalWidth, height: source.naturalHeight }
  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) return { width: source.videoWidth, height: source.videoHeight }
  if ('displayWidth' in source && 'displayHeight' in source) return { width: source.displayWidth, height: source.displayHeight }
  if ('width' in source && 'height' in source) return { width: Number(source.width), height: Number(source.height) }
  throw new Error('Dimensi gambar tidak tersedia.')
}
async function decode(source: Blob | CanvasImageSource): Promise<CanvasImageSource> {
  if (!(source instanceof Blob)) return source
  if (source.type === 'image/svg+xml') return safeSvgToImage(source)
  return createImageBitmap(source, { imageOrientation: 'from-image' })
}
function transformed(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number, rotation: number, opacity: number, draw: () => void): void {
  ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, opacity)); ctx.translate(x + width / 2, y + height / 2); ctx.rotate(rotation * Math.PI / 180); ctx.translate(-width / 2, -height / 2); draw(); ctx.restore()
}
async function drawImageLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: ImageOverlay, canvas: { width: number; height: number }): Promise<void> {
  const image = await decode(layer.source); const size = scaledSize(dimensions(image), layer.scale); const point = positionInCanvas(canvas, size, layer.position, layer.margin)
  transformed(ctx, point.x, point.y, size.width, size.height, layer.rotation, layer.opacity, () => ctx.drawImage(image, 0, 0, size.width, size.height)); if ('close' in image) (image as ImageBitmap).close()
}
async function drawFrameLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: FrameOverlay, canvas: { width: number; height: number }): Promise<void> {
  const image = await decode(layer.source); const original = dimensions(image); const size = layer.fit === 'stretch' ? canvas : layer.fit === 'cover' ? coverSize(original, canvas) : containSize(original, canvas); const point = positionInCanvas(canvas, size, 'center')
  transformed(ctx, point.x, point.y, size.width, size.height, layer.rotation, layer.opacity, () => ctx.drawImage(image, 0, 0, size.width, size.height)); if ('close' in image) (image as ImageBitmap).close()
}
function drawTextLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: TextOverlay, canvas: { width: number; height: number }): void {
  ctx.save(); ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`; ctx.textAlign = layer.align; ctx.textBaseline = 'top'; const metrics = ctx.measureText(layer.text); const size = { width: metrics.width, height: layer.fontSize * 1.25 }; const point = positionInCanvas(canvas, size, layer.position, layer.margin)
  transformed(ctx, point.x, point.y, size.width, size.height, layer.rotation, layer.opacity, () => { if (layer.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = Math.max(2, layer.fontSize * .12) } if (layer.stroke) { ctx.lineWidth = Math.max(1, layer.fontSize * .05); ctx.strokeStyle = layer.color === '#000000' ? '#ffffff' : '#000000'; ctx.strokeText(layer.text, layer.align === 'center' ? size.width / 2 : layer.align === 'right' ? size.width : 0, 0) } ctx.fillStyle = layer.color; ctx.fillText(layer.text, layer.align === 'center' ? size.width / 2 : layer.align === 'right' ? size.width : 0, 0) }); ctx.restore()
}
function targetSize(source: { width: number; height: number }, output: OutputSettings) { if (!output.maxWidth && !output.maxHeight) return source; const ratio = Math.min(1, (output.maxWidth ?? Infinity) / source.width, (output.maxHeight ?? Infinity) / source.height); return scaledSize(source, ratio) }
export function useImageProcessor() {
  async function processImage(file: Blob, config: WatermarkConfig): Promise<Blob> {
    const bitmap: Drawable = await createImageBitmap(file, { imageOrientation: 'from-image' }); const size = targetSize(dimensions(bitmap), config.output); const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size.width, size.height) : Object.assign(document.createElement('canvas'), size); const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null; if (!ctx) throw new Error('Canvas tidak tersedia.'); ctx.drawImage(bitmap, 0, 0, size.width, size.height)
    for (const layer of [...config.layers].filter((item) => item.enabled).sort((a, b) => a.zIndex - b.zIndex)) { if (layer.type === 'image') await drawImageLayer(ctx, layer, size); else if (layer.type === 'frame') await drawFrameLayer(ctx, layer, size); else drawTextLayer(ctx, layer, size) }
    bitmap.close?.(); const type = `image/${config.output.format}`; if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality: config.output.quality }); return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Gagal mengenkode gambar.')), type, config.output.quality))
  }
  return { processImage }
}
