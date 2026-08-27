import { computed, readonly, ref } from "vue";
import { idbGet, idbSet } from "../utils/indexedDb";
import { useApiClient } from "../services/apiClient";

interface GalleryEvent {
  id: string;
  name: string;
  token: string;
  sharingEnabled: boolean;
  retentionDays: number;
  createdAt: string;
  expiresAt: string;
}
interface UploadJob {
  id: string;
  eventId: string;
  fileName: string;
  blob: Blob;
  status: "pending" | "uploading" | "failed";
  attempts: number;
  error?: string;
}
const STORAGE_KEY = "lensflow-gallery-event";
const QUEUE_KEY = "cloud-upload-queue";
const event = ref<GalleryEvent>();
const jobs = ref<UploadJob[]>([]);
const initialized = ref(false);
const busy = ref(false);

async function galleryBlob(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const ratio = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio),
    height = Math.round(bitmap.height * ratio);
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d") as
    CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas galeri tidak tersedia.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  if ("convertToBlob" in canvas)
    return canvas.convertToBlob({ type: "image/jpeg", quality: 0.87 });
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Gagal membuat foto galeri.")),
      "image/jpeg",
      0.87,
    ),
  );
}
async function saveQueue() {
  await idbSet(
    "jobs",
    QUEUE_KEY,
    jobs.value.map((job) => ({
      ...job,
      status: job.status === "uploading" ? "pending" : job.status,
    })),
  );
}

export function useCloudGallery() {
  const api = useApiClient();
  const pending = computed(
    () => jobs.value.filter((job) => job.status !== "uploading").length,
  );
  const failed = computed(
    () => jobs.value.filter((job) => job.status === "failed").length,
  );
  const galleryUrl = computed(() =>
    event.value && import.meta.client
      ? `${location.origin}/gallery/${event.value.id}?token=${encodeURIComponent(event.value.token)}`
      : "",
  );
  async function initialize() {
    if (!import.meta.client || initialized.value) return;
    initialized.value = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) event.value = JSON.parse(raw) as GalleryEvent;
      jobs.value = (await idbGet<UploadJob[]>("jobs", QUEUE_KEY)) ?? [];
      window.addEventListener("online", processQueue);
      void processQueue();
    } catch {
      jobs.value = [];
    }
  }
  async function createEvent(name: string, retentionDays = 30) {
    const created = await api.post<GalleryEvent>("/api/gallery/events", {
      name,
      retentionDays,
    });
    event.value = created;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
    localStorage.setItem("lensflow-gallery-url", galleryUrl.value);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "lensflow-gallery-url",
        newValue: galleryUrl.value,
      }),
    );
    return created;
  }
  async function setSharing(enabled: boolean) {
    if (!event.value) return;
    await api.put(`/api/gallery/events/${event.value.id}/sharing`, { enabled });
    event.value = { ...event.value, sharingEnabled: enabled };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event.value));
  }
  function clearEvent() {
    event.value = undefined;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("lensflow-gallery-url");
  }
  async function enqueue(source: Blob, fileName: string) {
    if (!event.value) return;
    const blob = await galleryBlob(source);
    jobs.value.push({
      id: crypto.randomUUID(),
      eventId: event.value.id,
      fileName: fileName.replace(/\.[^.]+$/, ".jpg"),
      blob,
      status: "pending",
      attempts: 0,
    });
    await saveQueue();
    void processQueue();
  }
  async function processQueue() {
    if (busy.value || !navigator.onLine) return;
    busy.value = true;
    try {
      for (const job of jobs.value) {
        if (job.status === "uploading") continue;
        job.status = "uploading";
        job.attempts++;
        await saveQueue();
        try {
          await api.upload(
            `/api/gallery/events/${job.eventId}/photos`,
            job.blob,
            job.fileName,
          );
          jobs.value = jobs.value.filter((item) => item.id !== job.id);
        } catch (error) {
          job.status = "failed";
          job.error = error instanceof Error ? error.message : "Upload gagal";
          if (job.attempts >= 5) continue;
        }
        await saveQueue();
      }
    } finally {
      busy.value = false;
    }
  }
  function retry() {
    for (const job of jobs.value) job.status = "pending";
    void processQueue();
  }
  return {
    event: readonly(event),
    jobs: readonly(jobs),
    initialized: readonly(initialized),
    busy: readonly(busy),
    pending,
    failed,
    galleryUrl,
    initialize,
    createEvent,
    setSharing,
    clearEvent,
    enqueue,
    retry,
    processQueue,
  };
}
