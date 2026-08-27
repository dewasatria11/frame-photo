<script setup lang="ts">
defineProps<{ inputName?: string; outputName?: string; prefix: string; status: string; supported: boolean; nextScan?: number }>()
const emit = defineEmits<{ pickInput: []; pickOutput: []; updatePrefix: [value: string]; start: []; pause: []; stop: [] }>()
const localPrefix = ref('')
watch(() => useAttrs(), () => {}, { deep: true })
onMounted(() => { localPrefix.value = String((getCurrentInstance()?.props as any).prefix || 'wm_') })
</script>
<template>
  <section class="card folder-card" aria-labelledby="folder-heading">
    <div class="card-heading">
      <div><div class="eyebrow">Langkah 1</div><h2 id="folder-heading">Pengaturan Folder Otomatis</h2><p>Pilih sumber dan tujuan, lalu biarkan LensFlow menangani foto baru.</p></div>
      <div class="privacy-note"><AppIcon name="info" :size="15" /> Foto tetap di perangkat Anda</div>
    </div>
    <div v-if="!supported" class="notice warning" role="alert"><AppIcon name="info" /> Auto-Watch membutuhkan Chrome, Edge, atau Brave terbaru. Pemrosesan manual tetap tersedia.</div>
    <div class="folder-grid">
      <div class="field-group folder-field">
        <label>1. Folder Input <span>(Sumber Foto)</span></label>
        <div class="folder-value"><AppIcon name="folder" /><span :class="{ muted: !inputName }">{{ inputName || 'Belum memilih folder input' }}</span></div>
        <button class="btn btn-secondary" type="button" :disabled="!supported" @click="emit('pickInput')">Pilih Folder</button>
      </div>
      <div class="field-group folder-field">
        <label>2. Folder Output <span>(Tujuan Simpan)</span></label>
        <div class="folder-value"><AppIcon name="folder" /><span :class="{ muted: !outputName }">{{ outputName || 'Belum memilih folder output' }}</span></div>
        <button class="btn btn-secondary" type="button" :disabled="!supported" @click="emit('pickOutput')">Pilih Folder</button>
      </div>
      <div class="field-group prefix-field">
        <label for="prefix">3. Awalan Nama File</label>
        <div class="input-action"><input id="prefix" v-model="localPrefix" maxlength="50" placeholder="wm_" @keydown.enter="emit('updatePrefix', localPrefix)"><button class="btn btn-secondary" type="button" @click="emit('updatePrefix', localPrefix)">Simpan</button></div>
        <small>Contoh: {{ localPrefix || 'wm_' }}DSC_0897.jpg</small>
      </div>
      <div class="watch-panel">
        <div><strong>Auto-Watch</strong><small>Deteksi → watermark → simpan</small></div>
        <div v-if="status === 'watching' || status === 'processing'" class="watch-actions"><span class="next-scan">Scan {{ ((nextScan || 0) / 1000).toFixed(1) }}d</span><button class="btn btn-secondary" @click="emit('pause')"><AppIcon name="pause" />Jeda</button><button class="btn btn-ghost danger-text" aria-label="Hentikan Auto-Watch" @click="emit('stop')"><AppIcon name="stop" /></button></div>
        <div v-else-if="status === 'paused'" class="watch-actions"><button class="btn btn-primary" @click="emit('start')"><AppIcon name="play" />Lanjutkan</button><button class="btn btn-ghost danger-text" aria-label="Hentikan Auto-Watch" @click="emit('stop')"><AppIcon name="stop" /></button></div>
        <button v-else class="btn btn-primary" :disabled="!supported || !inputName || !outputName" @click="emit('start')"><AppIcon name="play" />Mulai Auto-Watch</button>
      </div>
    </div>
  </section>
</template>
