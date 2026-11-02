<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { apiClient } from '@/api/client';

/**
 * Imagem protegida por autenticação. Tags <img> não enviam o header
 * Authorization (Bearer), então a imagem é baixada via axios como blob.
 */
const props = defineProps<{
  src: string | null | undefined;
  alt?: string;
}>();

const objectUrl = ref<string | null>(null);
const failed = ref(false);
let requestId = 0;

function revoke() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
}

watch(
  () => props.src,
  async (src) => {
    const current = ++requestId;
    failed.value = false;
    revoke();
    if (!src) return;

    // URLs locais (prévia de upload) ou externas não precisam de autenticação
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      objectUrl.value = src;
      return;
    }

    try {
      // Remove origem e prefixo /api/v1: o apiClient já aplica o baseURL
      const path = new URL(src, window.location.origin);
      const relative = (path.pathname + path.search).replace(/^\/api\/v1/, '');
      const res = await apiClient.get(relative, { responseType: 'blob' });
      if (current !== requestId) return;
      objectUrl.value = URL.createObjectURL(res.data);
    } catch {
      if (current === requestId) failed.value = true;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  requestId++;
  if (objectUrl.value && !props.src?.startsWith('blob:')) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>

<template>
  <img v-if="objectUrl && !failed" :src="objectUrl" :alt="alt" v-bind="$attrs" />
  <slot v-else-if="failed" name="fallback" />
</template>
