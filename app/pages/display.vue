<script setup lang="ts">
const processor = useProcessorStore();
const settingsStore = useSettingsStore();
const index = ref(0);
const controls = ref(true);
const qrLarge = ref(false);
const galleryUrl = ref("");
let timer: number;
let qrTimer: number;
const results = computed(() => processor.recentResults || []);
const current = computed<any>(
  () =>
    processor.selectedResult ||
    results.value[index.value] ||
    processor.latestResult,
);
function wake() {
  controls.value = true;
  clearTimeout(timer);
  timer = window.setTimeout(() => (controls.value = false), 3000);
}
function scheduleQr() {
  clearTimeout(qrTimer);
  qrLarge.value = false;
  if (galleryUrl.value)
    qrTimer = window.setTimeout(() => (qrLarge.value = true), 20_000);
}
function move(delta: number) {
  if (!results.value.length) return;
  const at = results.value.findIndex((r: any) => r.id === current.value?.id);
  index.value =
    (Math.max(0, at) + delta + results.value.length) % results.value.length;
  processor.selectedResult = results.value[index.value];
  wake();
}
async function fullscreen() {
  if (!document.fullscreenElement)
    await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
}
function key(e: KeyboardEvent) {
  if (e.key === "Escape" && !document.fullscreenElement) navigateTo("/");
  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key.toLowerCase() === "f") fullscreen();
  if (e.key.toLowerCase() === "q") {
    qrLarge.value = !qrLarge.value;
    clearTimeout(qrTimer);
  }
  wake();
}
onMounted(() => {
  settingsStore.hydrate();
  galleryUrl.value = localStorage.getItem("lensflow-gallery-url") || "";
  window.addEventListener("storage", galleryChanged);
  window.addEventListener("keydown", key);
  window.addEventListener("mousemove", wake);
  wake();
  scheduleQr();
});
function galleryChanged(event: StorageEvent) {
  if (event.key === "lensflow-gallery-url") {
    galleryUrl.value = event.newValue || "";
    scheduleQr();
  }
}
watch(() => current.value?.id, scheduleQr);
onBeforeUnmount(() => {
  window.removeEventListener("keydown", key);
  window.removeEventListener("mousemove", wake);
  window.removeEventListener("storage", galleryChanged);
  clearTimeout(timer);
  clearTimeout(qrTimer);
});
</script>
<template>
  <div class="display-page">
    <img
      v-if="current?.objectUrl"
      :src="current.objectUrl"
      :alt="current.fileName"
    />
    <div v-else class="display-empty">
      <span class="brand-mark large"><span /></span>
      <h1>Menunggu foto terbaru</h1>
      <p>Hasil pemrosesan akan tampil otomatis di layar ini.</p>
    </div>
    <Transition name="fade"
      ><div v-if="galleryUrl" :class="['display-qr', { large: qrLarge }]">
        <p>SCAN SOFTFILE ANDA</p>
        <QrCode :value="galleryUrl" :size="qrLarge ? 340 : 190" /><span>{{
          qrLarge ? "Foto terbaru diperbarui otomatis" : "Scan softfile"
        }}</span>
      </div></Transition
    >
    <Transition name="fade"
      ><header v-if="controls" class="display-top">
        <div class="display-brand">
          <span class="brand-mark"><span /></span
          ><strong>{{ settingsStore.settings.branding.appName }}</strong>
        </div>
        <div>
          <button
            class="display-button"
            aria-label="Kembali ke dashboard"
            @click="navigateTo('/')"
          >
            Dashboard</button
          ><button
            class="display-icon"
            aria-label="Layar penuh"
            @click="fullscreen"
          >
            <AppIcon name="fullscreen" />
          </button>
        </div></header></Transition
    ><Transition name="fade"
      ><footer v-if="controls && current" class="display-meta">
        <div>
          <strong>{{ current.fileName }}</strong
          ><small>{{
            new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "medium",
            }).format(new Date(current.createdAt))
          }}</small>
        </div>
        <div class="display-nav">
          <button aria-label="Foto sebelumnya" @click="move(-1)">
            <AppIcon name="chevronLeft" /></button
          ><span
            >{{
              Math.max(
                1,
                results.findIndex((r: any) => r.id === current.id) + 1,
              )
            }}
            / {{ results.length || 1 }}</span
          ><button aria-label="Foto berikutnya" @click="move(1)">
            <AppIcon name="chevronRight" />
          </button>
        </div></footer
    ></Transition>
  </div>
</template>
