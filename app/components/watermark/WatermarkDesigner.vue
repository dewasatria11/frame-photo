<script setup lang="ts">
type Layer = Record<string, any>
const props = defineProps<{ layers: Layer[]; selectedId?: string; output: Record<string, any> }>()
const emit = defineEmits<{ updateLayer: [id: string, patch: Record<string, any>]; select: [id: string]; addImage: [file: File, kind: 'frame']; remove: [id: string]; updateOutput: [patch: Record<string, any>] }>()
const tab = ref<'layers'|'output'>('layers')
const active = computed(() => props.layers.find(l => l.id === props.selectedId) || props.layers[0])
const fileInput = ref<HTMLInputElement>()
function chooseFrame() { fileInput.value?.click() }
function filePicked(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) emit('addImage', f, 'frame'); (e.target as HTMLInputElement).value = '' }
function patch(key: string, value: any) { if (active.value) emit('updateLayer', active.value.id, { [key]: value }) }
</script>
<template>
  <section class="card designer" aria-labelledby="designer-heading">
    <div class="card-heading compact"><div><div class="eyebrow">Langkah 2</div><h2 id="designer-heading">Desainer Watermark</h2></div><div class="segmented small"><button :class="{ active: tab==='layers' }" @click="tab='layers'">Layer</button><button :class="{ active: tab==='output' }" @click="tab='output'">Output</button></div></div>
    <template v-if="tab === 'layers'">
      <div class="layer-actions"><button class="btn btn-secondary" @click="chooseFrame"><AppIcon name="image" />Unggah Frame</button><input ref="fileInput" class="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="filePicked"></div>
      <div v-if="layers.length" class="layer-list" aria-label="Daftar layer">
        <button v-for="layer in layers" :key="layer.id" :class="['layer-row', { active: layer.id === active?.id }]" @click="emit('select', layer.id)"><span class="layer-type">FR</span><span><strong>{{ layer.name || 'Frame watermark' }}</strong><small>{{ layer.enabled === false ? 'Dinonaktifkan' : 'Aktif' }}</small></span><input :checked="layer.enabled !== false" type="checkbox" :aria-label="`Aktifkan ${layer.name || 'frame'}`" @click.stop @change="emit('updateLayer', layer.id, { enabled: ($event.target as HTMLInputElement).checked })"></button>
      </div>
      <div v-else class="compact-empty"><AppIcon name="image" /><strong>Belum ada frame</strong><span>Unggah PNG transparan dengan rasio yang sama seperti foto.</span></div>
      <div v-if="active" class="control-stack">
        <label class="range-control"><span>Opasitas <output>{{ Math.round((active.opacity ?? .85)*100) }}%</output></span><input type="range" min="0" max="100" :value="(active.opacity ?? .85)*100" @input="patch('opacity', Number(($event.target as HTMLInputElement).value)/100)"></label>
        <div class="field-group"><label for="frame-fit">Penyesuaian frame</label><select id="frame-fit" :value="active.fit || 'fit'" @change="patch('fit', ($event.target as HTMLSelectElement).value)"><option value="fit">Fit — seluruh frame terlihat</option><option value="cover">Cover — memenuhi foto</option><option value="stretch">Stretch — tepat ukuran foto</option></select></div>
        <button class="btn btn-ghost danger-text remove-layer" @click="emit('remove', active.id)"><AppIcon name="trash" />Hapus layer</button>
      </div>
    </template>
    <div v-else class="control-stack output-settings">
      <div class="control-columns"><div class="field-group"><label for="format">Format</label><select id="format" :value="output.format || 'jpeg'" @change="emit('updateOutput', { format: ($event.target as HTMLSelectElement).value })"><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WEBP</option></select></div><div class="field-group"><label for="collision">Nama sama</label><select id="collision" :value="output.collision || 'auto-number'" @change="emit('updateOutput', { collision: ($event.target as HTMLSelectElement).value })"><option value="auto-number">Nomor otomatis</option><option value="skip">Lewati</option><option value="overwrite">Timpa</option></select></div></div>
      <label v-if="(output.format || 'jpeg') !== 'png'" class="range-control"><span>Kualitas <output>{{ Math.round((output.quality ?? .92)*100) }}%</output></span><input type="range" min="60" max="100" :value="(output.quality ?? .92)*100" @input="emit('updateOutput', { quality: Number(($event.target as HTMLInputElement).value)/100 })"></label>
      <label class="check-row"><input type="checkbox" :checked="!!output.resizeEnabled" @change="emit('updateOutput', { resizeEnabled: ($event.target as HTMLInputElement).checked })"><span><strong>Batasi resolusi output</strong><small>Resolusi sumber dipertahankan secara default.</small></span></label>
    </div>
  </section>
</template>
