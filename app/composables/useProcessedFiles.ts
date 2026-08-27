import { computed, onScopeDispose, ref } from 'vue'
import type { ProcessedResult } from '../types'
import { idbSet } from '../utils/indexedDb'

const CHANNEL = 'lensflow-display'
export function useProcessedFiles(limit = 30) {
  const results = ref<ProcessedResult[]>([]); const selected = ref<ProcessedResult>(); const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : undefined
  const latest = computed(() => results.value[0])
  function announce(result: ProcessedResult): void { const message = { type: 'NEW_PROCESSED_IMAGE', id: result.id, objectUrl: result.objectUrl, fileName: result.fileName, createdAt: result.createdAt }; channel?.postMessage(message); try { localStorage.setItem('lensflow-display-event', JSON.stringify({ ...message, objectUrl: undefined })) } catch { /* storage may be unavailable */ } }
  async function publish(blob: Blob, fileName: string, sourceName?: string): Promise<ProcessedResult> { const result: ProcessedResult = { id: crypto.randomUUID(), blob, objectUrl: URL.createObjectURL(blob), fileName, createdAt: Date.now(), status: 'success', ...(sourceName ? { sourceName } : {}) }; results.value.unshift(result); for (const stale of results.value.splice(limit)) URL.revokeObjectURL(stale.objectUrl); selected.value = result; await idbSet('jobs', result.id, { ...result, objectUrl: '' }); announce(result); return result }
  function select(id: string): void { selected.value = results.value.find((item) => item.id === id) }
  function remove(id: string): void { const index = results.value.findIndex((item) => item.id === id); if (index >= 0) { URL.revokeObjectURL(results.value[index]!.objectUrl); results.value.splice(index, 1) } if (selected.value?.id === id) selected.value = undefined }
  function clear(): void { results.value.forEach((item) => URL.revokeObjectURL(item.objectUrl)); results.value = []; selected.value = undefined }
  function download(result = selected.value ?? latest.value): void { if (!result) return; const anchor = document.createElement('a'); anchor.href = result.objectUrl; anchor.download = result.fileName; anchor.click() }
  onScopeDispose(() => channel?.close())
  return { results, latest, selected, publish, select, remove, clear, download }
}

