import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ProcessedResult, ProcessingLog, ProcessingStage, QueueItem, WatcherState } from '../types'

export const useProcessorStore = defineStore('processor', () => {
  const state = ref<WatcherState>('idle'); const queue = ref<QueueItem[]>([]); const logs = ref<ProcessingLog[]>([]); const processedCount = ref(0); const latestResult = ref<ProcessedResult>(); const recentResults = ref<ProcessedResult[]>([]); const selectedResult = ref<ProcessedResult>()
  const watching = computed(() => state.value === 'watching' || state.value === 'processing'); const paused = computed(() => state.value === 'paused')
  function setState(value: WatcherState): void { state.value = value }
  function enqueue(file: File): QueueItem { const item: QueueItem = { id: crypto.randomUUID(), fileName: file.name, file, status: 'queued', createdAt: Date.now() }; queue.value.push(item); return item }
  function updateQueue(id: string, status: ProcessingStage, error?: string): void { const item = queue.value.find((entry) => entry.id === id); if (item) { item.status = status; item.error = error } }
  function addLog(typeOrEntry: ProcessingLog['type'] | Pick<ProcessingLog, 'type' | 'message'>, message?: string): void {
    const type = typeof typeOrEntry === 'string' ? typeOrEntry : typeOrEntry.type
    const resolvedMessage = typeof typeOrEntry === 'string' ? (message ?? '') : typeOrEntry.message
    logs.value.push({ id: crypto.randomUUID(), type, message: resolvedMessage, createdAt: Date.now() })
    if (logs.value.length > 500) logs.value.splice(0, logs.value.length - 500)
  }
  function addResult(result: ProcessedResult): void { latestResult.value = result; selectedResult.value = result; recentResults.value.unshift(result); for (const stale of recentResults.value.splice(30)) URL.revokeObjectURL(stale.objectUrl); if (result.status === 'success') processedCount.value++ }
  function clearLogs(): void { logs.value = [] }
  function resetSession(): void { queue.value = []; clearLogs(); processedCount.value = 0 }
  return { state, watching, paused, queue, logs, processedCount, latestResult, recentResults, selectedResult, setState, enqueue, updateQueue, addLog, addResult, clearLogs, resetSession }
})
