<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
const paths: Record<string, string[]> = {
  settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  fullscreen: ['M8 3H5a2 2 0 0 0-2 2v3', 'm3 3-3-3', 'M16 3h3a2 2 0 0 1 2 2v3', 'm18 6 3-3', 'M8 21H5a2 2 0 0 1-2-2v-3', 'm3 18 3 3', 'M16 21h3a2 2 0 0 0 2-2v-3', 'm18 18 3 3'],
  folder: ['M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  upload: ['M12 3v12', 'm7 8 5-5 5 5', 'M5 21h14'],
  image: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'm3 16 5-5 4 4 3-3 6 6', 'M14.5 8.5h.01'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v5', 'M14 11v5'],
  pause: ['M8 5v14', 'M16 5v14'], play: ['m6 3 14 9-14 9z'], stop: ['M5 5h14v14H5z'],
  close: ['M18 6 6 18', 'm6 6 12 12'], check: ['m20 6-11 11-5-5'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  chevronLeft: ['m15 18-6-6 6-6'], chevronRight: ['m9 18 6-6-6-6'],
  external: ['M15 3h6v6', 'm10 14 11-11', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
  rotate: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
}
</script>
<template><svg :width="props.size" :height="props.size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in (paths[props.name] || paths.info)" :key="d" :d="d" /></svg></template>

