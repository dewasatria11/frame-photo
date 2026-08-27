<script setup lang="ts">
import type { OverlayLayer, ProcessedResult } from "../types";
import JSZip from "jszip";

const settingsStore = useSettingsStore();
const processorStore = useProcessorStore();
const folders = useFolderAccess();
const { processImage } = useImageProcessor();
const { writeOutput } = useOutputWriter();
const cloudGallery = useCloudGallery();

const settingsOpen = ref(false);
const selectedLayerId = ref<string>();
const sourceFile = shallowRef<File>();
const originalUrl = ref("");
const previewUrl = ref("");
const previewName = ref("");
const previewDimensions = ref("");
const processing = ref(false);
const toasts = ref<{ id: string; message: string; type?: string }[]>([]);

const settings = computed<any>(() => settingsStore.settings);
const branding = computed(() => settings.value.branding || {});
const watermark = computed(
  () =>
    settings.value.watermark || { layers: [], output: settings.value.output },
);
const layers = computed<any[]>(() => watermark.value.layers || []);
const watcherStatus = computed(() => processorStore.state || "idle");

function outputNameFor(file: File) {
  const format = settings.value.output.format as "jpeg" | "png" | "webp";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${settings.value.output.prefix || "wm_"}${file.name.replace(/\.[^.]+$/, "")}.${extension}`;
}
async function processWatchedFile(file: File) {
  processorStore.addLog("FOUND", file.name);
  const item = processorStore.enqueue(file);
  processorStore.updateQueue(item.id, "applying-overlay");
  processorStore.setState("processing");
  try {
    const blob = await processImage(file, {
      ...watermark.value,
      output: settings.value.output,
    });
    const directory = folders.outputHandle.value;
    if (!directory) throw new Error("Folder output belum dipilih.");
    const writtenName = await writeOutput(
      directory,
      outputNameFor(file),
      blob,
      settings.value.output.collision,
    );
    if (!writtenName) {
      processorStore.addLog(
        "WARNING",
        `${file.name} dilewati karena output sudah ada`,
      );
      return;
    }
    const result: ProcessedResult = {
      id: crypto.randomUUID(),
      fileName: writtenName,
      blob,
      objectUrl: URL.createObjectURL(blob),
      createdAt: Date.now(),
      status: "success",
      sourceName: file.name,
    };
    processorStore.addResult(result);
    void cloudGallery.enqueue(blob, writtenName);
    processorStore.updateQueue(item.id, "success");
    processorStore.addLog("SUCCESS", writtenName);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pemrosesan gagal.";
    processorStore.updateQueue(item.id, "error", message);
    processorStore.addLog("ERROR", message);
  } finally {
    if (watcher.state.value === "watching") processorStore.setState("watching");
  }
}
const watcher = useFolderWatcher({
  inputHandle: folders.inputHandle,
  getSettings: () => ({
    ...settings.value.watcher,
    outputPrefix: settings.value.output.prefix,
  }),
  onFile: processWatchedFile,
});
const nextScan = computed(() => watcher.nextScanInMs.value);
watch(
  () => processorStore.state,
  (state) => {
    if (state === "paused") watcher.pause();
    else if (state === "idle") watcher.stop();
    else if (state === "watching" && watcher.state.value === "paused")
      void watcher.resume();
  },
);
watch(watcher.state, (state) => {
  if (processorStore.state !== "processing") processorStore.setState(state);
});

function toast(message: string, type = "success") {
  if (message.startsWith("ZIP akan")) {
    void zipResults();
    return;
  }
  const id = crypto.randomUUID();
  toasts.value.push({ id, message, type });
  window.setTimeout(() => dismiss(id), 3600);
}
function dismiss(id: string) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}
async function patch(p: Record<string, any>) {
  await settingsStore.patchSettings(p);
}
async function pick(kind: "input" | "output") {
  try {
    kind === "input" ? await folders.pickInput() : await folders.pickOutput();
    toast(`Folder ${kind === "input" ? "input" : "output"} berhasil dipilih`);
  } catch (e: any) {
    toast(e?.message || "Akses folder ditolak", "error");
  }
}
async function startWatch() {
  if (!folders.inputHandle.value || !folders.outputHandle.value)
    return toast("Pilih folder input dan output terlebih dahulu.", "error");
  if (!(await folders.validateDistinct()))
    return toast("Folder Input dan Output tidak boleh sama.", "error");
  if (
    !(await folders.ensurePermission(folders.inputHandle.value, "read")) ||
    !(await folders.ensurePermission(folders.outputHandle.value, "readwrite"))
  )
    return toast("Akses folder perlu diberikan kembali.", "error");
  if (watcher.state.value === "paused") await watcher.resume();
  else await watcher.start();
  processorStore.setState("watching");
  processorStore.addLog("WATCH", "Auto-Watch aktif");
  toast("Auto-Watch aktif");
}
function pauseWatch() {
  watcher.pause();
  processorStore.setState("paused");
  processorStore.addLog("WATCH", "Auto-Watch dijeda");
}
function stopWatch() {
  watcher.stop();
  processorStore.setState("idle");
  processorStore.addLog("WATCH", "Auto-Watch dihentikan");
}
async function zipResults() {
  if (!processorStore.recentResults.length)
    return toast("Belum ada hasil untuk diunduh.", "error");
  const zip = new JSZip();
  for (const result of processorStore.recentResults)
    zip.file(result.fileName, result.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lensflow-output-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function addImage(file: File, _kind: "frame") {
  const item: any = {
    id: crypto.randomUUID(),
    type: "frame",
    name: file.name,
    source: file,
    previewUrl: URL.createObjectURL(file),
    enabled: true,
    zIndex: layers.value.length + 1,
    opacity: 1,
    position: "center",
    rotation: 0,
    fit: "fit",
  };
  await updateLayers([...layers.value, item]);
  selectedLayerId.value = item.id;
  toast("Frame tersimpan di perangkat");
}
function updateLayers(value: any[]) {
  return patch({ watermark: { ...watermark.value, layers: value } });
}
function updateLayer(id: string, value: Record<string, any>) {
  updateLayers(layers.value.map((l) => (l.id === id ? { ...l, ...value } : l)));
  queuePreview();
}
function removeLayer(id: string) {
  const layer = layers.value.find((l) => l.id === id);
  if (layer?.previewUrl) URL.revokeObjectURL(layer.previewUrl);
  updateLayers(layers.value.filter((l) => l.id !== id));
  selectedLayerId.value = layers.value.find((l) => l.id !== id)?.id;
}
function updateOutput(value: Record<string, any>) {
  const output = { ...(settings.value.output || {}), ...value };
  patch({ output, watermark: { ...watermark.value, output } });
  queuePreview();
}
let previewTimer: number | undefined;
function queuePreview() {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    if (sourceFile.value) runProcess(false);
  }, 180);
}
async function acceptFiles(files: File[]) {
  if (!files[0]) return;
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
  sourceFile.value = files[0];
  originalUrl.value = URL.createObjectURL(files[0]);
  previewName.value = files[0].name;
  const img = new Image();
  img.onload = () =>
    (previewDimensions.value = `${img.naturalWidth} × ${img.naturalHeight}`);
  img.src = originalUrl.value;
  await runProcess(false);
}
async function runProcess(publish = true) {
  if (!sourceFile.value) return;
  processing.value = true;
  processorStore.setState("processing");
  try {
    const blob = await processImage(sourceFile.value, {
      ...watermark.value,
      output: settings.value.output,
    });
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = URL.createObjectURL(blob);
    if (publish) {
      const ext =
        settings.value.output.format === "jpeg"
          ? "jpg"
          : settings.value.output.format;
      const base = sourceFile.value.name.replace(/\.[^.]+$/, "");
      const result: ProcessedResult = {
        id: crypto.randomUUID(),
        fileName: `${settings.value.output.prefix || "wm_"}${base}.${ext}`,
        blob,
        objectUrl: previewUrl.value,
        createdAt: Date.now(),
        status: "success",
        sourceName: sourceFile.value.name,
      };
      processorStore.addResult(result);
      void cloudGallery.enqueue(blob, result.fileName);
      processorStore.addLog("SUCCESS", result.fileName);
      toast("Foto berhasil diproses");
    }
  } catch (e: any) {
    processorStore.addLog("ERROR", e?.message || "Gagal memproses foto");
    toast(e?.message || "Gagal memproses foto", "error");
  } finally {
    processing.value = false;
    processorStore.setState(
      watcher.state.value === "watching"
        ? "watching"
        : watcher.state.value === "paused"
          ? "paused"
          : "ready",
    );
  }
}
function downloadResult(item?: any) {
  const target =
    item ||
    processorStore.latestResult ||
    (previewUrl.value
      ? { objectUrl: previewUrl.value, fileName: previewName.value }
      : null);
  if (!target) return;
  const a = document.createElement("a");
  a.href = target.objectUrl;
  a.download = target.fileName || "lensflow-output.jpg";
  a.click();
}
function showFullscreen(item?: any) {
  if (item) processorStore.selectedResult = item;
  navigateTo("/display");
}
async function sample() {
  const response = await fetch("/sample/test-event.svg");
  const blob = await response.blob();
  await acceptFiles([
    new File([blob], "contoh-event.svg", { type: "image/svg+xml" }),
  ]);
}
function keyboard(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
    t.isContentEditable
  )
    return;
  if (e.key.toLowerCase() === "f") {
    e.preventDefault();
    showFullscreen();
  }
  if (e.key.toLowerCase() === "p") {
    e.preventDefault();
    runProcess();
  }
  if (e.key.toLowerCase() === "c") {
    processorStore.clearLogs();
  }
  if (e.code === "Space") {
    e.preventDefault();
    watcherStatus.value === "watching"
      ? processorStore.setState("paused")
      : watcherStatus.value === "paused" && processorStore.setState("watching");
  }
}
onMounted(async () => {
  await settingsStore.hydrate();
  await folders.restore();
  await cloudGallery.initialize();
  window.addEventListener("keydown", keyboard);
  if (layers.value[0]) selectedLayerId.value = layers.value[0].id;
  processorStore.addLog("INFO", "Sistem siap — pemrosesan lokal aktif");
});
onBeforeUnmount(() => {
  watcher.stop();
  window.removeEventListener("keydown", keyboard);
});
</script>

<template>
  <div>
    <AppHeader
      :app-name="branding.appName || 'LensFlow Watermark Pro'"
      :tagline="branding.tagline || 'Event Photo Processor'"
      :status="watcherStatus"
      @settings="settingsOpen = true"
      @fullscreen="showFullscreen()"
    />
    <main class="main-content">
      <div class="welcome-strip">
        <div>
          <h1>Workspace Pemrosesan</h1>
          <p>Siapkan folder dan watermark untuk memulai sesi event.</p>
        </div>
        <ol>
          <li :class="{ done: folders.inputName.value }">
            <span>1</span>Input
          </li>
          <li :class="{ done: folders.outputName.value }">
            <span>2</span>Output
          </li>
          <li :class="{ done: layers.length }"><span>3</span>Watermark</li>
        </ol>
      </div>
      <FolderAutomation
        :input-name="folders.inputName.value"
        :output-name="folders.outputName.value"
        :prefix="settings.output?.prefix || 'wm_'"
        :status="watcherStatus"
        :supported="folders.supported.value"
        :next-scan="nextScan"
        @pick-input="pick('input')"
        @pick-output="pick('output')"
        @update-prefix="
          patch({
            output: { ...settings.output, prefix: $event },
            watermark: {
              ...watermark,
              output: { ...settings.output, prefix: $event },
            },
          })
        "
        @start="startWatch"
        @pause="pauseWatch"
        @stop="stopWatch"
      />
      <div class="workspace-grid">
        <WatermarkDesigner
          :layers="layers"
          :selected-id="selectedLayerId"
          :output="settings.output || {}"
          @select="selectedLayerId = $event"
          @add-image="addImage"
          @update-layer="updateLayer"
          @remove="removeLayer"
          @update-output="updateOutput"
        /><PreviewPanel
          :preview-url="previewUrl || processorStore.latestResult?.objectUrl"
          :original-url="originalUrl"
          :file-name="previewName || processorStore.latestResult?.fileName"
          :dimensions="previewDimensions"
          :processing="processing"
          @files="acceptFiles"
          @sample="sample"
          @process="runProcess()"
          @download="downloadResult()"
          @fullscreen="showFullscreen()"
        />
      </div>
      <CloudGalleryCard />
      <div class="lower-grid">
        <ProcessingConsole
          :logs="processorStore.logs"
          :count="processorStore.processedCount"
          @clear="processorStore.clearLogs()"
        /><RecentGallery
          :results="processorStore.recentResults"
          @select="processorStore.selectedResult = $event"
          @download="downloadResult"
          @fullscreen="showFullscreen"
          @zip="toast('ZIP akan berisi hasil sesi yang tersedia')"
        />
      </div>
      <footer class="app-footer">
        <span><i /> Pemrosesan foto berlangsung lokal di browser</span
        ><span>Tanpa login · Tanpa AI · Privat secara default</span>
      </footer>
    </main>
    <SettingsModal
      :open="settingsOpen"
      :branding="branding"
      :settings="settings"
      @close="settingsOpen = false"
      @save-branding="
        patch({ branding: $event });
        toast('Branding berhasil disimpan');
      "
      @reset="
        settingsStore.reset();
        toast('Pengaturan dikembalikan ke default');
      "
    /><ToastStack :items="toasts" @dismiss="dismiss" />
  </div>
</template>
