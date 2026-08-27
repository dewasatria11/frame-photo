import type { CollisionMode, FileSystemDirectoryHandle } from '../types'
import { numberedFilename, sanitizeFilename } from '../utils/filename'

async function exists(directory: FileSystemDirectoryHandle, name: string): Promise<boolean> { try { await directory.getFileHandle(name); return true } catch (error) { if (error instanceof DOMException && error.name === 'NotFoundError') return false; throw error } }

export function useOutputWriter() {
  async function resolveName(directory: FileSystemDirectoryHandle, requested: string, collision: CollisionMode): Promise<string | null> {
    const safe = sanitizeFilename(requested)
    if (!await exists(directory, safe) || collision === 'overwrite') return safe
    if (collision === 'skip') return null
    for (let sequence = 2; sequence < 10000; sequence++) { const candidate = numberedFilename(safe, sequence); if (!await exists(directory, candidate)) return candidate }
    throw new Error('Tidak dapat menentukan nama output unik.')
  }
  async function writeOutput(directory: FileSystemDirectoryHandle, requested: string, blob: Blob, collision: CollisionMode): Promise<string | null> {
    const name = await resolveName(directory, requested, collision); if (!name) return null
    const handle = await directory.getFileHandle(name, { create: true }); const writable = await handle.createWritable()
    try { await writable.write(blob); await writable.close(); return name } catch (error) { await writable.abort?.(); throw error }
  }
  return { resolveName, writeOutput }
}

