<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { X, Check, Loader2 } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  mediaType: 'book' | 'movie';
  targetTitle?: string;
  count?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  targetTitle: '',
  count: 1,
  loading: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', status: string): void;
}>();

const selectedStatus = ref<string | null>(null);

const bookOptions = [
  { value: 'want_to_read', label: 'Quero ler' },
  { value: 'reading', label: 'Lendo' },
  { value: 'read', label: 'Lido' },
];

const movieOptions = [
  { value: 'want_to_watch', label: 'Quero assistir' },
  { value: 'watching', label: 'Assistindo' },
  { value: 'watched', label: 'Assistido' },
];

const statusOptions = computed(() => {
  return props.mediaType === 'book' ? bookOptions : movieOptions;
});

const modalTitle = computed(() => {
  if (props.count && props.count > 1) {
    return `Adicionar ${props.count} ${props.mediaType === 'book' ? 'livros' : 'filmes'} à estante`;
  }
  return props.targetTitle
    ? `Adicionar «${props.targetTitle}» à estante`
    : `Adicionar à estante`;
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedStatus.value = null;
    }
  }
);

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen && !props.loading) {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function handleConfirm() {
  if (selectedStatus.value && !props.loading) {
    emit('confirm', selectedStatus.value);
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="!loading && emit('close')"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-[#131b2e] rounded-2xl shadow-xl border border-slate-200 dark:border-[#31394d] overflow-hidden transform transition-all p-6 space-y-5"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc] leading-snug">
            {{ modalTitle }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
            Escolha o status desejado para {{ count > 1 ? 'todos os itens selecionados' : 'este item' }}.
          </p>
        </div>
        <button
          @click="!loading && emit('close')"
          :disabled="loading"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Status Selection Buttons (No pre-selected status) -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Selecione o status inicial <span class="text-rose-500">*</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            @click="selectedStatus = opt.value"
            :disabled="loading"
            class="py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all text-center cursor-pointer disabled:opacity-50"
            :class="[
              selectedStatus === opt.value
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#31394d] hover:border-slate-300 dark:hover:border-slate-600'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
        <button
          type="button"
          @click="emit('close')"
          :disabled="loading"
          class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!selectedStatus || loading"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <Check v-else class="w-3.5 h-3.5" />
          <span>{{ loading ? 'Adicionando...' : 'Confirmar e Adicionar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
