<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();
const token = computed(() => String(route.query.token || ""));
const eventId = computed(() => String(route.params.eventId));
const endpoint = computed(
  () =>
    `${String(config.public.apiBase).replace(/\/$/, "")}/api/gallery/public/${encodeURIComponent(eventId.value)}?token=${encodeURIComponent(token.value)}`,
);
const { data, error, refresh, status } = await useFetch<any>(endpoint, {
  server: false,
});
let timer: number;
const photos = computed(() => data.value?.data?.photos ?? []);
const event = computed(() => data.value?.data?.event);
function src(id: string) {
  return `${String(config.public.apiBase).replace(/\/$/, "")}/api/gallery/public/${encodeURIComponent(eventId.value)}/photos/${id}?token=${encodeURIComponent(token.value)}`;
}
onMounted(() => (timer = window.setInterval(() => refresh(), 5000)));
onBeforeUnmount(() => clearInterval(timer));
useHead({
  title: computed(() =>
    event.value?.name
      ? `${event.value.name} · LensFlow Gallery`
      : "LensFlow Gallery",
  ),
});
</script>
<template>
  <main class="public-gallery">
    <header>
      <span class="brand-mark"><span /></span>
      <div>
        <p>LensFlow Gallery</p>
        <h1>{{ event?.name || "Galeri Foto" }}</h1>
      </div>
      <button class="btn btn-secondary" @click="() => refresh()">
        Perbarui
      </button>
    </header>
    <div v-if="status === 'pending'" class="gallery-message">
      Memuat galeri…
    </div>
    <div v-else-if="error" class="gallery-message error">
      <h2>Galeri tidak tersedia</h2>
      <p>Link mungkin salah, dinonaktifkan, atau sudah kedaluwarsa.</p>
    </div>
    <template v-else
      ><div class="gallery-summary">
        <span>{{ photos.length }} foto</span
        ><small>Foto terbaru diperbarui otomatis.</small>
      </div>
      <div v-if="photos.length" class="photo-grid">
        <a
          v-for="photo in photos"
          :key="photo.id"
          :href="src(photo.id)"
          target="_blank"
          ><img
            :src="src(photo.id)"
            :alt="photo.fileName"
            loading="lazy"
          /><span>{{ photo.fileName }}</span></a
        >
      </div>
      <div v-else class="gallery-message">
        <h2>Menunggu foto</h2>
        <p>Foto hasil event akan muncul di sini setelah selesai diproses.</p>
      </div></template
    >
  </main>
</template>
