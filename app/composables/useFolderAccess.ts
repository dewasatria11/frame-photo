import { computed, shallowRef } from 'vue'
import type { FileSystemDirectoryHandle } from '../types'
import { useLocalSettings } from './useLocalSettings'

declare global { interface Window { showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite'; id?: string }) => Promise<FileSystemDirectoryHandle> } }

export function useFolderAccess() {
  const inputHandle = shallowRef<FileSystemDirectoryHandle>()
  const outputHandle = shallowRef<FileSystemDirectoryHandle>()
  const { loadHandle, saveHandle } = useLocalSettings()
  const supported = computed(() => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function')
  const inputName = computed(() => inputHandle.value?.name ?? '')
  const outputName = computed(() => outputHandle.value?.name ?? '')

  async function ensurePermission(handle: FileSystemDirectoryHandle, mode: 'read' | 'readwrite', request = true): Promise<boolean> {
    if (await handle.queryPermission({ mode }) === 'granted') return true
    return request && await handle.requestPermission({ mode }) === 'granted'
  }
  async function restore(): Promise<void> { inputHandle.value = await loadHandle('input'); outputHandle.value = await loadHandle('output') }
  async function pickInput(): Promise<FileSystemDirectoryHandle> { if (!window.showDirectoryPicker) throw new Error('Folder picker hanya tersedia di browser Chromium modern.'); const handle = await window.showDirectoryPicker({ mode: 'read', id: 'lensflow-input' }); inputHandle.value = handle; await saveHandle('input', handle); return handle }
  async function pickOutput(): Promise<FileSystemDirectoryHandle> { if (!window.showDirectoryPicker) throw new Error('Folder picker hanya tersedia di browser Chromium modern.'); const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'lensflow-output' }); outputHandle.value = handle; await saveHandle('output', handle); return handle }
  async function validateDistinct(): Promise<boolean> { return !(inputHandle.value && outputHandle.value && await inputHandle.value.isSameEntry(outputHandle.value)) }
  return { supported, inputHandle, outputHandle, inputName, outputName, restore, pickInput, pickOutput, ensurePermission, validateDistinct }
}

