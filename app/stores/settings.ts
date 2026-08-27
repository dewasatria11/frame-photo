import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { DEFAULT_SETTINGS } from '../utils/defaults'
import { normalizeSettings } from '../utils/config'
import { useLocalSettings } from '../composables/useLocalSettings'
import type { AppSettings } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive<AppSettings>(structuredClone(DEFAULT_SETTINGS)); const local = useLocalSettings()
  async function hydrate(): Promise<void> { Object.assign(settings, await local.loadSettings()) }
  async function patchSettings(patch: Partial<AppSettings>): Promise<void> { Object.assign(settings, normalizeSettings({ ...settings, ...patch })); await local.saveSettings(settings) }
  async function reset(): Promise<void> { Object.assign(settings, structuredClone(DEFAULT_SETTINGS)); await local.saveSettings(settings) }
  return { settings, hydrate, patchSettings, reset }
})

