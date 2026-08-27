<script setup lang="ts">
defineProps<{ appName: string; tagline: string; status: string }>()
defineEmits<{ settings: []; fullscreen: [] }>()
const labels: Record<string, string> = { idle: 'Siap', ready: 'Siap', watching: 'Memantau', paused: 'Dijeda', processing: 'Memproses', error: 'Bermasalah', 'requesting-permission': 'Meminta izin' }
</script>
<template>
  <header class="app-header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand" aria-label="LensFlow beranda">
        <span class="brand-mark"><span /></span>
        <span class="brand-copy"><strong>{{ appName }}</strong><small>{{ tagline }}</small></span>
        <span class="pro-badge">PRO</span>
      </NuxtLink>
      <nav class="header-actions" aria-label="Tindakan aplikasi">
        <span class="status-badge" :data-status="status"><i />{{ labels[status] || status }}</span>
        <button class="btn btn-icon mobile-hidden" type="button" aria-label="Buka tampilan layar penuh" title="Layar penuh (F)" @click="$emit('fullscreen')"><AppIcon name="fullscreen" /></button>
        <button class="btn btn-secondary settings-btn" type="button" @click="$emit('settings')"><AppIcon name="settings" /><span>Pengaturan</span></button>
      </nav>
    </div>
  </header>
</template>

