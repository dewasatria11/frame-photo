import { defineStore } from 'pinia'
import { reactive, toRaw } from 'vue'
import { DEFAULT_SETTINGS } from '../utils/defaults'
import { normalizeSettings } from '../utils/config'
import { useLocalSettings } from '../composables/useLocalSettings'
import type { AppSettings } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive<AppSettings>(structuredClone(DEFAULT_SETTINGS)); const local = useLocalSettings()
  async function hydrate(): Promise<void> { Object.assign(settings, await local.loadSettings()) }
  async function persist(): Promise<void> { await local.saveSettings(structuredClone(toRaw(settings))) }
  async function patchSettings(patch: Partial<AppSettings>): Promise<void> { Object.assign(settings, normalizeSettings({ ...toRaw(settings), ...patch })); await persist() }
  async function reset(): Promise<void> { Object.assign(settings, structuredClone(DEFAULT_SETTINGS)); await persist() }
  return { settings, hydrate, patchSettings, reset }
})
