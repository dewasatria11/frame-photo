import { idbGet, idbSet } from '../utils/indexedDb'
import { normalizeSettings } from '../utils/config'
import type { AppSettings, FileSystemDirectoryHandle } from '../types'

export function useLocalSettings() {
  const loadSettings = async (): Promise<AppSettings> => normalizeSettings(await idbGet<unknown>('settings', 'current'))
  const saveSettings = (settings: AppSettings): Promise<void> => idbSet('settings', 'current', settings)
  const loadHandle = (kind: 'input' | 'output'): Promise<FileSystemDirectoryHandle | undefined> => idbGet('handles', kind)
  const saveHandle = (kind: 'input' | 'output', handle: FileSystemDirectoryHandle): Promise<void> => idbSet('handles', kind, handle)
  return { loadSettings, saveSettings, loadHandle, saveHandle }
}

