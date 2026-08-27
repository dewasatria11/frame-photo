<script setup lang="ts">
const props = defineProps<{ previewUrl?: string; originalUrl?: string; fileName?: string; dimensions?: string; processing?: boolean }>()
const emit = defineEmits<{ files: [files: File[]]; sample: []; process: []; download: []; fullscreen: [] }>()
const input = ref<HTMLInputElement>(); const dragging = ref(false); const view = ref<'result'|'original'>('result')
const visibleUrl = computed(() => view.value === 'original' ? props.originalUrl || props.previewUrl : props.previewUrl)
function take(files?: FileList | null) { const accepted = [...(files || [])].filter(f => f.type.startsWith('image/')); if (accepted.length) emit('files', accepted) }
</script>
<template>
  <section class="card preview-card" aria-labelledby="preview-heading">
    <div class="card-heading compact"><div><div class="eyebrow">Langkah 3</div><h2 id="preview-heading">Pratinjau Hasil</h2></div><span v-if="dimensions" class="resolution-badge">{{ dimensions }}</span></div>
    <div class="preview-toolbar"><div class="segmented small"><button :disabled="!originalUrl" :class="{active:view==='original'}" @click="view='original'">Original</button><button :disabled="!previewUrl" :class="{active:view==='result'}" @click="view='result'">Hasil</button></div><div class="toolbar-actions"><button class="btn btn-ghost" @click="emit('sample')">Uji Foto Contoh</button><button class="btn btn-icon" aria-label="Buka layar penuh" :disabled="!previewUrl" @click="emit('fullscreen')"><AppIcon name="fullscreen" /></button></div></div>
    <div :class="['preview-stage', { dragging }]" tabindex="0" role="button" aria-label="Pilih atau lepaskan foto untuk diproses" @click="!visibleUrl && input?.click()" @keydown.enter="input?.click()" @dragenter.prevent="dragging=true" @dragover.prevent @dragleave.prevent="dragging=false" @drop.prevent="dragging=false; take($event.dataTransfer?.files)">
      <img v-if="visibleUrl" :src="visibleUrl" :alt="fileName ? `Pratinjau ${fileName}` : 'Pratinjau hasil watermark'">
      <div v-else class="preview-empty"><span class="preview-empty-icon"><AppIcon name="image" :size="26" /></span><strong>Lepaskan foto di sini</strong><span>atau klik untuk memilih JPG, PNG, atau WEBP</span><button class="btn btn-secondary" type="button" @click.stop="input?.click()">Pilih Foto</button></div>
      <div v-if="processing" class="processing-cover"><span class="spinner" /><strong>Sedang memproses foto…</strong></div>
      <input ref="input" class="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" @change="take(($event.target as HTMLInputElement).files)">
    </div>
    <div class="preview-footer"><div class="file-meta"><strong>{{ fileName || 'Belum ada foto' }}</strong><small>{{ fileName ? 'Pratinjau mengikuti pengaturan aktif' : 'Auto-Watch atau pemrosesan manual akan tampil di sini.' }}</small></div><div class="preview-actions"><button class="btn btn-secondary" :disabled="!previewUrl" @click="emit('download')"><AppIcon name="download" />Unduh Single</button><button class="btn btn-primary" :disabled="!originalUrl || processing" @click="emit('process')">Proses Foto</button></div></div>
  </section>
</template>
