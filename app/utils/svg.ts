const SVG_MIME = 'image/svg+xml'

export function sanitizeSvgText(svg: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, SVG_MIME)
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('SVG tidak valid.')
  doc.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video').forEach((node) => node.remove())
  for (const element of doc.querySelectorAll('*')) {
    for (const attr of Array.from(element.attributes)) {
      const value = attr.value.trim().toLowerCase()
      if (attr.name.toLowerCase().startsWith('on') || value.startsWith('javascript:') || ((attr.name === 'href' || attr.name.endsWith(':href')) && !value.startsWith('#'))) element.removeAttribute(attr.name)
    }
  }
  return new XMLSerializer().serializeToString(doc.documentElement)
}

export async function safeSvgToImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (blob.size > 10 * 1024 * 1024) throw new Error('SVG terlalu besar.')
  const safeBlob = new Blob([sanitizeSvgText(await blob.text())], { type: SVG_MIME })
  if (typeof createImageBitmap === 'function') return createImageBitmap(safeBlob)
  const url = URL.createObjectURL(safeBlob)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return image
  } finally { URL.revokeObjectURL(url) }
}

