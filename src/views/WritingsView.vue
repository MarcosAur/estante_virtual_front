<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useWritingsStore } from '@/stores/writings';
import type { WritingEntry, WritingKind } from '@/types';
import {
  PenLine,
  Plus,
  Search,
  Flame,
  Calendar,
  BookOpen,
  Sparkles,
  FileText,
  Feather,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  Loader2,
  X,
  Tag as TagIcon,
} from 'lucide-vue-next';

const writingsStore = useWritingsStore();

const kindOptions: { value: WritingKind | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: 'Todas', icon: Feather },
  { value: 'reflection', label: 'Reflexões', icon: Sparkles },
  { value: 'reading', label: 'Leituras', icon: BookOpen },
  { value: 'note', label: 'Anotações', icon: FileText },
  { value: 'free', label: 'Escrita Livre', icon: PenLine },
];

// Delete confirmation modal state
const itemToDelete = ref<WritingEntry | null>(null);
const isDeleting = ref(false);

const summary = computed(() => writingsStore.summary);
const entries = computed(() => writingsStore.entries);

let searchTimeout: any = null;
function handleSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    writingsStore.loadWritings();
  }, 300);
}

watch(
  () => writingsStore.filterKind,
  () => {
    writingsStore.loadWritings();
  }
);

onMounted(async () => {
  await Promise.all([writingsStore.loadSummary(), writingsStore.loadWritings()]);
});

function confirmDelete(entry: WritingEntry) {
  itemToDelete.value = entry;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  try {
    await writingsStore.deleteWriting(itemToDelete.value.id);
    itemToDelete.value = null;
  } catch (err) {
    console.error('Erro ao excluir escrita:', err);
  } finally {
    isDeleting.value = false;
  }
}

function getKindConfig(kind: WritingKind) {
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

function formatDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Feather class="w-5 h-5" />
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] tracking-tight">
            Escritas Pessoais
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
          Seu diário para reflexões, capítulos bíblicos, anotações de artigos e pensamentos do dia a dia.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/escritas/nova"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          Nova Escrita
        </RouterLink>
      </div>
    </div>

    <!-- Summary Metrics Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1e293b] shadow-xs">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Total de Escritas
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] mt-1">
          {{ summary?.total ?? 0 }}
        </div>
      </div>

      <!-- Month -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1e293b] shadow-xs">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5" />
          Neste Mês
        </div>
        <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {{ summary?.entries_this_month ?? 0 }}
        </div>
      </div>

      <!-- Current Streak -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1e293b] shadow-xs">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Flame class="w-3.5 h-3.5 text-amber-500" />
          Sequência Atual
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] mt-1 flex items-baseline gap-1.5">
          <span>{{ summary?.current_streak ?? 0 }}</span>
          <span class="text-xs font-normal text-slate-400">{{ (summary?.current_streak ?? 0) === 1 ? 'dia' : 'dias' }}</span>
        </div>
      </div>

      <!-- Longest Streak -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1e293b] shadow-xs">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Maior Sequência
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] mt-1 flex items-baseline gap-1.5">
          <span>{{ summary?.longest_streak ?? 0 }}</span>
          <span class="text-xs font-normal text-slate-400">{{ (summary?.longest_streak ?? 0) === 1 ? 'dia' : 'dias' }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Strip (Type buttons + Search) -->
    <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Kind Filter Buttons -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto">
          <button
            v-for="opt in kindOptions"
            :key="opt.value"
            type="button"
            @click="writingsStore.filterKind = opt.value"
            class="py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
            :class="[
              writingsStore.filterKind === opt.value
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#31394d] hover:border-slate-300 dark:hover:border-slate-600'
            ]"
          >
            <component :is="opt.icon" class="w-3.5 h-3.5" />
            <span>{{ opt.label }}</span>
          </button>
        </div>

        <!-- Search input -->
        <div class="relative w-full md:w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="writingsStore.searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Buscar por título, texto ou fonte..."
            class="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="writingsStore.loading" class="text-center py-12 space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
      <p class="text-xs text-slate-500">Carregando suas escritas...</p>
    </div>

    <!-- Entries List -->
    <div v-else-if="entries.length > 0" class="space-y-3">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border border-slate-200 dark:border-[#1e293b] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-3"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Kind Badge -->
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border"
              :class="getKindConfig(entry.kind).badge"
            >
              <component :is="getKindConfig(entry.kind).icon" class="w-3 h-3" />
              {{ getKindConfig(entry.kind).label }}
            </span>

            <!-- Date -->
            <span class="text-xs text-slate-500 dark:text-[#94a3b8] flex items-center gap-1 font-medium">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              {{ formatDate(entry.entry_date) }}
            </span>

            <!-- Mood Badge -->
            <span
              v-if="entry.mood"
              class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300"
            >
              Sentimento: {{ entry.mood }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <RouterLink
              :to="`/escritas/${entry.id}`"
              class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer"
              title="Ler escrita"
            >
              <Eye class="w-4 h-4" />
            </RouterLink>
            <RouterLink
              :to="`/escritas/${entry.id}/editar`"
              class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit2 class="w-4 h-4" />
            </RouterLink>
            <button
              type="button"
              @click="confirmDelete(entry)"
              class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Title -->
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc] leading-snug">
          <RouterLink :to="`/escritas/${entry.id}`" class="hover:underline">
            {{ entry.title || `Escrita de ${formatDate(entry.entry_date)}` }}
          </RouterLink>
        </h3>

        <!-- Inspiration / Source -->
        <div v-if="entry.source_label" class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Inspirado em:</span>
          <span>{{ entry.source_label }}</span>
        </div>

        <!-- Body Snippet -->
        <p class="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8] line-clamp-3 whitespace-pre-line leading-relaxed">
          {{ entry.body }}
        </p>

        <!-- Tags -->
        <div v-if="entry.tags && entry.tags.length > 0" class="flex flex-wrap items-center gap-1.5 pt-1">
          <span
            v-for="tag in entry.tags"
            :key="tag.id"
            class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            <TagIcon class="w-2.5 h-2.5" />
            {{ tag.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-white dark:bg-[#131b2e] rounded-2xl p-12 border border-slate-200 dark:border-[#1e293b] text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <PenLine class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc]">
          Nenhuma escrita encontrada
        </h3>
        <p class="text-xs text-slate-500 dark:text-[#94a3b8] max-w-sm mx-auto mt-1">
          Comece registrando o que leu ou refletiu hoje. Pode ser um versículo, um capítulo ou um pensamento solto.
        </p>
      </div>
      <RouterLink
        to="/escritas/nova"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        Escrever agora
      </RouterLink>
    </div>

    <!-- Custom Delete Confirmation Modal -->
    <div
      v-if="itemToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      @click.self="itemToDelete = null"
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
            @click="itemToDelete = null"
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
