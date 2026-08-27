<script setup lang="ts">
import QRCode from "qrcode";
const props = withDefaults(defineProps<{ value: string; size?: number }>(), {
  size: 220,
});
const canvas = ref<HTMLCanvasElement>();
async function draw() {
  if (canvas.value && props.value)
    await QRCode.toCanvas(canvas.value, props.value, {
      width: props.size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#ffffff" },
    });
}
watch(() => [props.value, props.size], draw);
onMounted(draw);
</script>
<template>
  <canvas
    ref="canvas"
    class="qr-canvas"
    role="img"
    aria-label="QR galeri foto"
  />
</template>
