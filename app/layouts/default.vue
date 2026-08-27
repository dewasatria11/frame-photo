<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'id' },
  titleTemplate: (title) => title ? `${title} · LensFlow` : 'LensFlow Watermark Pro',
  meta: [
    { name: 'theme-color', content: '#ffffff' },
    { name: 'description', content: 'Pemroses watermark foto event yang bekerja lokal di browser.' },
  ],
})
</script>

<template>
  <div class="app-shell"><slot /></div>
</template>

