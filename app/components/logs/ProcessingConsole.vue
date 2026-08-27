<script setup lang="ts">
const props = defineProps<{ logs: any[]; count: number }>()
defineEmits<{ clear: [] }>()
const autoScroll = ref(true); const box = ref<HTMLElement>()
watch(() => props.logs.length, async () => { if (autoScroll.value) { await nextTick(); box.value?.scrollTo({ top: box.value.scrollHeight }) } })
function time(value: any) { return new Intl.DateTimeFormat('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(new Date(value || Date.now())) }
</script>
<template><section class="card console-card"><div class="card-heading compact"><div><div class="title-line"><h2>Konsol Pemantau</h2><span class="live-label">Real-Time</span></div><p>Telah diproses: <strong>{{ count }} foto</strong></p></div><div class="console-actions"><label class="tiny-check"><input v-model="autoScroll" type="checkbox"> Auto-scroll</label><button class="btn btn-ghost" @click="$emit('clear')">Bersihkan</button></div></div><div ref="box" class="console-box" role="log" aria-live="polite"><div v-if="!logs.length" class="console-empty">Konsol siap. Aktivitas pemrosesan akan tampil di sini.</div><div v-for="(log, i) in logs" :key="log.id || i" class="log-line"><time>{{ time(log.createdAt || log.timestamp) }}</time><b :data-type="String(log.type || 'INFO').toLowerCase()">{{ String(log.type || 'INFO').toUpperCase() }}</b><span>{{ log.message }}</span></div></div></section></template>

