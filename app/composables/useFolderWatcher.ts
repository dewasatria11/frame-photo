import { readonly, ref, shallowRef, type Ref } from 'vue'
import type { FileSystemDirectoryHandle, FileSystemFileHandle, WatcherSettings, WatcherState } from '../types'
import { createFingerprint, isSupportedImage, shouldIgnoreFile } from '../utils/fingerprint'
import { idbGet, idbSet } from '../utils/indexedDb'

interface Options { inputHandle: Ref<FileSystemDirectoryHandle | undefined>; getSettings: () => WatcherSettings & { outputPrefix?: string }; onFile: (file: File) => Promise<void> }
const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve) => { const id = setTimeout(resolve, ms); signal?.addEventListener('abort', () => { clearTimeout(id); resolve() }, { once: true }) })

export function useFolderWatcher(options: Options) {
  const state = ref<WatcherState>('idle'); const error = shallowRef<Error>(); const controller = shallowRef<AbortController>(); const nextScanInMs = ref(0); let scanLock = false
  async function stableFile(handle: FileSystemFileHandle, delay: number): Promise<File | null> { const first = await handle.getFile(); await wait(delay, controller.value?.signal); const second = await handle.getFile(); return first.size === second.size && first.lastModified === second.lastModified ? second : null }
  async function scanOnce(): Promise<void> {
    if (scanLock) return; const directory = options.inputHandle.value; if (!directory) throw new Error('Folder input belum dipilih.'); scanLock = true
    try { for await (const entry of directory.values()) { if (entry.kind !== 'file' || !isSupportedImage(entry.name) || shouldIgnoreFile(entry.name, options.getSettings().outputPrefix)) continue; const file = await entry.getFile(); const fingerprint = createFingerprint(file); if (await idbGet<boolean>('fingerprints', fingerprint)) continue; const stable = await stableFile(entry, options.getSettings().stabilityDelayMs); if (!stable) continue; await options.onFile(stable); await idbSet('fingerprints', createFingerprint(stable), true) } } finally { scanLock = false }
  }
  async function countdown(signal: AbortSignal): Promise<void> {
    const deadline = Date.now() + options.getSettings().intervalMs
    while (!signal.aborted && Date.now() < deadline) { nextScanInMs.value = Math.max(0, deadline - Date.now()); await wait(Math.min(250, nextScanInMs.value), signal) }
    nextScanInMs.value = 0
  }
  async function safeScan(): Promise<boolean> { try { await scanOnce(); return true } catch (cause) { error.value = cause instanceof Error ? cause : new Error(String(cause)); state.value = 'error'; return false } }
  async function loop(signal: AbortSignal): Promise<void> { while (!signal.aborted) { if (state.value === 'watching' && !await safeScan()) return; await countdown(signal) } }
  async function start(): Promise<void> { if (state.value === 'watching') return; controller.value?.abort(); controller.value = new AbortController(); error.value = undefined; state.value = 'watching'; void loop(controller.value.signal) }
  function pause(): void { if (state.value === 'watching') { state.value = 'paused'; nextScanInMs.value = 0 } }
  async function resume(): Promise<void> { if (state.value !== 'paused') return; state.value = 'watching'; await safeScan() }
  function stop(): void { controller.value?.abort(); controller.value = undefined; state.value = 'idle'; nextScanInMs.value = 0; scanLock = false }
  return { state: readonly(state), error: readonly(error), nextScanInMs: readonly(nextScanInMs), start, pause, resume, stop, scanOnce }
}
