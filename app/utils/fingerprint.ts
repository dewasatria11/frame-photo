export interface FingerprintSource { name: string; size: number; lastModified: number }
export function createFingerprint(file: FingerprintSource): string { return `${file.name}:${file.size}:${file.lastModified}` }

export function isSupportedImage(name: string): boolean {
  return /\.(?:jpe?g|png|webp)$/i.test(name) && !name.startsWith('.')
}

export function shouldIgnoreFile(name: string, outputPrefix = ''): boolean {
  const lower = name.toLowerCase()
  return name.startsWith('.') || lower === 'thumbs.db' || lower === 'desktop.ini' || /\.(?:tmp|part|crdownload)$/i.test(name) || (!!outputPrefix && name.startsWith(outputPrefix))
}

