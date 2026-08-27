import type { Position9 } from '../types'

export interface Point { x: number; y: number }
export interface Size { width: number; height: number }

export function scaledSize(source: Size, scale: number): Size {
  const safe = Math.max(0, scale)
  return { width: source.width * safe, height: source.height * safe }
}

export function containSize(source: Size, bounds: Size): Size {
  const ratio = Math.min(bounds.width / source.width, bounds.height / source.height)
  return scaledSize(source, ratio)
}

export function coverSize(source: Size, bounds: Size): Size {
  const ratio = Math.max(bounds.width / source.width, bounds.height / source.height)
  return scaledSize(source, ratio)
}

export function positionInCanvas(canvas: Size, item: Size, position: Position9, margin = 0): Point {
  const horizontal = position.endsWith('left') ? margin : position.endsWith('right') ? canvas.width - item.width - margin : (canvas.width - item.width) / 2
  const vertical = position.startsWith('top') ? margin : position.startsWith('bottom') ? canvas.height - item.height - margin : (canvas.height - item.height) / 2
  return { x: horizontal, y: vertical }
}

