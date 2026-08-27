<script setup lang="ts">
const cloud = useCloudGallery();
const name = ref("");
const retention = ref(30);
const qrOpen = ref(false);
const creating = ref(false);
const message = ref("");
onMounted(() => cloud.initialize());
async function create() {
  if (name.value.trim().length < 2) return;
  creating.value = true;
  message.value = "";
  try {
    await cloud.createEvent(name.value.trim(), retention.value);
    message.value = "Event cloud siap.";
  } catch (e) {
    message.value = e instanceof Error ? e.message : "Gagal membuat event.";
  } finally {
    creating.value = false;
  }
}
function openGallery() {
  if (cloud.galleryUrl.value)
    window.open(cloud.galleryUrl.value, "_blank", "noopener");
}
</script>
<template>
  <section class="card cloud-card">
    <div class="card-heading compact">
      <div>
        <h2>Cloud Gallery & QR</h2>
        <p>Upload otomatis hanya untuk foto output yang sudah ber-frame.</p>
      </div>
      <span :class="['status-badge', cloud.event.value ? 'online' : '']"
        ><i />{{ cloud.event.value ? "Aktif" : "Belum aktif" }}</span
      >
    </div>
    <div v-if="!cloud.event.value" class="cloud-setup">
      <div class="field-group">
        <label for="event-name">Nama event</label
        ><input
          id="event-name"
          v-model="name"
          maxlength="100"
          placeholder="Wedding Andi & Sinta"
          @keydown.enter="create"
        />
      </div>
      <div class="field-group compact-field">
        <label for="retention">Masa aktif</label
        ><select id="retention" v-model="retention">
          <option :value="7">7 hari</option>
          <option :value="30">30 hari</option>
          <option :value="60">60 hari</option>
          <option :value="90">90 hari</option>
        </select>
      </div>
      <button
        class="btn btn-primary"
        :disabled="creating || name.trim().length < 2"
        @click="create"
      >
        {{ creating ? "Membuat…" : "Buat Event & QR" }}
      </button>
    </div>
    <div v-else class="cloud-active">
      <div>
        <strong>{{ cloud.event.value.name }}</strong
        ><small
          >Berakhir
          {{
            new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
              new Date(cloud.event.value.expiresAt),
            )
          }}</small
        >
      </div>
      <div class="cloud-stats">
        <span
          ><b>{{ cloud.jobs.value.length }}</b> antrean</span
        ><span
          ><b>{{ cloud.failed.value }}</b> gagal</span
        >
      </div>
      <div class="cloud-actions">
        <button class="btn btn-secondary" @click="openGallery">
          Buka Galeri</button
        ><button class="btn btn-primary" @click="qrOpen = true">
          Tampilkan QR</button
        ><button
          v-if="cloud.failed.value"
          class="btn btn-secondary"
          @click="cloud.retry"
        >
          Coba Lagi
        </button>
      </div>
    </div>
    <p v-if="message" class="form-message">{{ message }}</p>
    <Teleport to="body"
      ><div
        v-if="qrOpen && cloud.event.value"
        class="qr-modal"
        @click.self="qrOpen = false"
      >
        <div class="qr-panel">
          <button
            class="qr-close"
            aria-label="Tutup QR"
            @click="qrOpen = false"
          >
            ×
          </button>
          <p>SCAN SOFTFILE ANDA</p>
          <QrCode :value="cloud.galleryUrl.value" :size="320" />
          <h2>{{ cloud.event.value.name }}</h2>
          <span>Foto terbaru akan muncul otomatis.</span>
        </div>
      </div></Teleport
    >
  </section>
</template>
