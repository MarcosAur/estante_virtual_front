<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useWritingsStore } from '@/stores/writings';
import type { WritingKind } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  BookOpen,
  FileText,
  PenLine,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Tag as TagIcon,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const writingsStore = useWritingsStore();

const writingId = computed(() => route.params.id as string);
const entry = computed(() => writingsStore.currentEntry);

const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

onMounted(async () => {
  try {
    await writingsStore.fetchWriting(writingId.value);
  } catch {
    router.push('/escritas');
  }
});

function getKindConfig(kind?: WritingKind) {
  switch (kind) {
    case 'reflection':
      return {
        label: 'Reflexão',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
        icon: Sparkles,
      };
    case 'reading':
      return {
        label: 'Leitura',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
        icon: BookOpen,
      };
    case 'note':
      return {
        label: 'Anotação',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
        icon: FileText,
      };
    case 'free':
    default:
      return {
        label: 'Escrita Livre',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
        icon: PenLine,
      };
  }
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

async function handleDelete() {
  if (!entry.value) return;
  isDeleting.value = true;
  try {
    await writingsStore.deleteWriting(entry.value.id);
    router.push('/escritas');
  } catch (err) {
    console.error('Erro ao excluir escrita:', err);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 pb-12">
    <!-- Top Nav / Actions -->
    <div class="flex items-center justify-between gap-4">
      <RouterLink
        to="/escritas"
        class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        Voltar para Escritas
      </RouterLink>

      <div v-if="entry" class="flex items-center gap-2">
        <RouterLink
          :to="`/escritas/${entry.id}/editar`"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
        >
          <Edit2 class="w-3.5 h-3.5 text-blue-500" />
          Editar
        </RouterLink>

        <button
          type="button"
          @click="isDeleteModalOpen = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Excluir
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="writingsStore.loading" class="text-center py-12 space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
      <p class="text-xs text-slate-500">Carregando escrita...</p>
    </div>

    <!-- Entry Detail View -->
    <article
      v-else-if="entry"
      class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-10 border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-6"
    >
      <!-- Metadata Row -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1e293b] pb-4">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border"
            :class="getKindConfig(entry.kind).badge"
          >
            <component :is="getKindConfig(entry.kind).icon" class="w-3.5 h-3.5" />
            {{ getKindConfig(entry.kind).label }}
          </span>

          <span
            v-if="entry.mood"
            class="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300"
          >
            Sentimento: {{ entry.mood }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94a3b8] font-medium">
          <Calendar class="w-4 h-4 text-slate-400" />
          <span>{{ formatDate(entry.entry_date) }}</span>
        </div>
      </div>

      <!-- Title & Inspiration -->
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#f8fafc] tracking-tight leading-tight">
          {{ entry.title || `Escrita de ${formatDate(entry.entry_date)}` }}
        </h1>

        <div v-if="entry.source_label" class="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-[#1e293b]/70 px-3 py-1 rounded-lg border border-slate-100 dark:border-[#31394d]">
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">Inspirado em:</span>
          <span>{{ entry.source_label }}</span>
        </div>
      </div>

      <!-- Body with preserved whitespace -->
      <div class="text-slate-800 dark:text-[#f1f5f9] text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
        {{ entry.body }}
      </div>

      <!-- Tags Footer -->
      <div v-if="entry.tags && entry.tags.length > 0" class="pt-4 border-t border-slate-100 dark:border-[#1e293b] flex flex-wrap gap-1.5">
        <span
          v-for="tag in entry.tags"
          :key="tag.id"
          class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          <TagIcon class="w-3 h-3 text-slate-400" />
          #{{ tag.name }}
        </span>
      </div>
    </article>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      @click.self="isDeleteModalOpen = false"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-[#131b2e] rounded-2xl shadow-xl border border-slate-200 dark:border-[#31394d] overflow-hidden p-6 space-y-4"
      >
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc] leading-snug">
              Excluir escrita?
            </h3>
            <p class="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
              Tem certeza que deseja remover esta entrada? Ela deixará de constar no seu histórico de leituras e reflexões.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
          <button
            type="button"
            @click="isDeleteModalOpen = false"
            :disabled="isDeleting"
            class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="isDeleting"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5" />
            <span>{{ isDeleting ? 'Excluindo...' : 'Confirmar Exclusão' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
