<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useSuggestionsStore } from '@/stores/suggestions';
import AddToShelfModal from '@/components/AddToShelfModal.vue';
import type { SuggestedMedia } from '@/types';
import {
  Sparkles,
  BookOpen,
  Film,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  CheckSquare,
  Square,
  Info,
} from 'lucide-vue-next';

const suggestionsStore = useSuggestionsStore();

const selectedType = ref<'book' | 'movie'>('book');
const promptText = ref('');
const useHistory = ref(true);
const selectedIds = ref<string[]>([]);
const toastMessage = ref<{ type: 'success' | 'error'; text: string; link?: string; linkText?: string } | null>(null);

// Modal state
const isModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const modalTargetItem = ref<SuggestedMedia | null>(null); // null means batch import

const currentSuggestion = computed(() => suggestionsStore.currentSuggestion);

// Available items that haven't been added to shelf yet
const availableItems = computed(() => {
  return currentSuggestion.value?.media.filter((item) => item.status === 'suggested') || [];
});

const isAllAvailableSelected = computed(() => {
  if (availableItems.value.length === 0) return false;
  return availableItems.value.every((item) => selectedIds.value.includes(item.id));
});

onMounted(async () => {
  await suggestionsStore.loadLatest(selectedType.value);
});

// Changing type switches view and reloads
watch(selectedType, async (newType) => {
  selectedIds.value = [];
  toastMessage.value = null;
  await suggestionsStore.loadLatest(newType);
});

function toggleSelectItem(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function selectAllAvailable() {
  if (isAllAvailableSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = availableItems.value.map((item) => item.id);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

function onFormSubmit() {
  if (!promptText.value.trim() || suggestionsStore.generating) return;

  if (currentSuggestion.value && currentSuggestion.value.media.length > 0) {
    isConfirmModalOpen.value = true;
    return;
  }

  executeGenerate();
}

async function executeGenerate() {
  selectedIds.value = [];
  toastMessage.value = null;

  try {
    await suggestionsStore.generate(selectedType.value, promptText.value.trim(), useHistory.value);
    promptText.value = '';
    toastMessage.value = {
      type: 'success',
      text: 'Novas sugestões geradas com sucesso pela IA!',
    };
  } catch (err: any) {
    toastMessage.value = {
      type: 'error',
      text: err.message || 'Erro ao gerar sugestões.',
    };
  }
}

function openSingleItemModal(item: SuggestedMedia) {
  modalTargetItem.value = item;
  isModalOpen.value = true;
}

function openBatchModal() {
  if (selectedIds.value.length === 0) return;
  modalTargetItem.value = null;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  modalTargetItem.value = null;
}

async function handleConfirmModal(status: string) {
  if (modalTargetItem.value) {
    // Individual import
    const item = modalTargetItem.value;
    try {
      const updated = await suggestionsStore.importSingleItem(item.id, status);
      closeModal();
      const shelfPath = selectedType.value === 'book' ? `/livros/${updated.mediable_id}` : `/filmes/${updated.mediable_id}`;
      toastMessage.value = {
        type: 'success',
        text: `«${item.title}» adicionado à estante com sucesso!`,
        link: shelfPath,
        linkText: 'Ver na Estante',
      };
      // Remove from batch selection if it was selected
      const idx = selectedIds.value.indexOf(item.id);
      if (idx > -1) selectedIds.value.splice(idx, 1);
    } catch (err: any) {
      toastMessage.value = {
        type: 'error',
        text: err.message || 'Falha ao adicionar item.',
      };
    }
  } else {
    // Batch import
    if (!currentSuggestion.value) return;
    const idsToImport = [...selectedIds.value];
    try {
      const res = await suggestionsStore.importBatch(currentSuggestion.value.id, idsToImport, status);
      closeModal();
      clearSelection();

      let msg = `${res.created_count} ${selectedType.value === 'book' ? 'livro(s)' : 'filme(s)'} adicionado(s) à estante!`;
      if (res.skipped_count > 0) {
        msg += ` (${res.skipped_count} já estavam na estante e foram ignorados).`;
      }

      toastMessage.value = {
        type: 'success',
        text: msg,
        link: selectedType.value === 'book' ? '/estante' : '/filmes',
        linkText: 'Abrir Estante',
      };
    } catch (err: any) {
      toastMessage.value = {
        type: 'error',
        text: err.message || 'Falha ao importar itens em lote.',
      };
    }
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'read':
    case 'watched':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
    case 'reading':
    case 'watching':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
    case 'want_to_read':
    case 'want_to_watch':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'read':
      return 'Lido';
    case 'reading':
      return 'Lendo';
    case 'want_to_read':
      return 'Quero ler';
    case 'watched':
      return 'Assistido';
    case 'watching':
      return 'Assistindo';
    case 'want_to_watch':
      return 'Quero assistir';
    case 'suggested':
    default:
      return 'Sugerido';
  }
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 pb-12">
    <!-- Sticky Batch Action Bar (appears when >= 1 item selected) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-6 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-6 opacity-0"
    >
      <div
        v-if="selectedIds.length > 0"
        class="sticky top-20 z-40 bg-white/95 dark:bg-[#131b2e]/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <div class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full">
            {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'item selecionado' : 'itens selecionados' }}
          </div>
          <button
            type="button"
            @click="selectAllAvailable"
            class="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
          >
            {{ isAllAvailableSelected ? 'Desmarcar todos' : 'Selecionar todos os disponíveis' }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="clearSelection"
            class="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors cursor-pointer"
          >
            Limpar seleção
          </button>
          <button
            type="button"
            @click="openBatchModal"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <CheckSquare class="w-4 h-4" />
            Adicionar à estante
          </button>
        </div>
      </div>
    </Transition>

    <!-- Header & Generator Panel -->
    <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles class="w-5 h-5" />
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] tracking-tight">
              Sugestões com IA
            </h1>
          </div>
          <p class="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
            Recomendações inteligentes baseadas nas suas avaliações e lista de desejos.
          </p>
        </div>

        <!-- Type Selector (Livros / Filmes) -->
        <div class="flex items-center bg-slate-100 dark:bg-[#1e293b] p-1 rounded-xl">
          <button
            type="button"
            @click="selectedType = 'book'"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="[
              selectedType === 'book'
                ? 'bg-white dark:bg-[#131b2e] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <BookOpen class="w-4 h-4" />
            Livros
          </button>
          <button
            type="button"
            @click="selectedType = 'movie'"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="[
              selectedType === 'movie'
                ? 'bg-white dark:bg-[#131b2e] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            ]"
          >
            <Film class="w-4 h-4" />
            Filmes
          </button>
        </div>
      </div>

      <!-- Prompt Input Form -->
      <form @submit.prevent="onFormSubmit" class="space-y-4">
        <!-- History Context Selection (biased vs new) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Contexto das recomendações
          </label>
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              v-model="useHistory"
              class="w-full sm:w-auto px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option :value="true">
                Personalizado: levar em conta meu histórico de avaliações (no meu gosto)
              </option>
              <option :value="false">
                Descobrir coisas novas: não usar histórico (sem viés, explorar novidades)
              </option>
            </select>
            <span class="text-[11px] text-slate-500 dark:text-[#94a3b8]">
              {{ useHistory
                ? 'A IA prioriza estilos, notas e criadores que você mais gostou na sua estante.'
                : 'A IA traz recomendações inovadoras e diversificadas sem viés do seu perfil anterior.'
              }}
            </span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            O que você gostaria de {{ selectedType === 'book' ? 'ler' : 'assistir' }}?
            <span class="text-slate-400 dark:text-slate-500 font-normal">
              (pode ser específico ou vago, ex: "ficção científica instigante" ou "um romance leve de fim de semana")
            </span>
          </label>
          <textarea
            v-model="promptText"
            rows="3"
            maxlength="1000"
            :placeholder="selectedType === 'book' ? 'Ex: Quero um suspense psicológico intrigante com reviravoltas ou fantasia medieval sombria...' : 'Ex: Quero um filme de investigação criminal envolvente ou uma comédia dramática para relaxar...'"
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
          ></textarea>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94a3b8]">
            <Info class="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {{ useHistory
                ? 'O histórico da sua estante é usado para personalizar as recomendações.'
                : 'Modo exploração: gerando sugestões livres sem viés das suas avaliações.'
              }}
            </span>
          </div>

          <button
            type="submit"
            :disabled="!promptText.trim() || suggestionsStore.generating"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Loader2 v-if="suggestionsStore.generating" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            <span>{{ suggestionsStore.generating ? 'Consultando IA...' : 'Gerar sugestões' }}</span>
          </button>
        </div>
      </form>

      <!-- Toast / Feedback alert -->
      <div
        v-if="toastMessage"
        class="p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 border"
        :class="[
          toastMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/40'
        ]"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <AlertCircle v-else class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <span>{{ toastMessage.text }}</span>
            <RouterLink
              v-if="toastMessage.link"
              :to="toastMessage.link"
              class="ml-2 font-bold underline hover:opacity-80"
            >
              {{ toastMessage.linkText || 'Ver recurso' }} &rarr;
            </RouterLink>
          </div>
        </div>
        <button
          type="button"
          @click="toastMessage = null"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="suggestionsStore.loading" class="text-center py-12 space-y-3">
      <Loader2 class="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
      <p class="text-xs text-slate-500">Carregando sugestões salvas...</p>
    </div>

    <!-- Suggestions Results Section -->
    <div v-else-if="currentSuggestion && currentSuggestion.media.length > 0" class="space-y-4">
      <!-- Metadata banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-[#94a3b8] px-1 gap-2">
        <div>
          <span>Última sugestão gerada em <strong>{{ formatDate(currentSuggestion.created_at) }}</strong></span>
          <span class="mx-1">•</span>
          <span>Pedido: <em class="text-slate-700 dark:text-slate-300">«{{ currentSuggestion.prompt }}»</em></span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="selectAllAvailable"
            :disabled="availableItems.length === 0"
            class="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {{ isAllAvailableSelected ? 'Desmarcar todos' : 'Selecionar todos os disponíveis' }}
          </button>
        </div>
      </div>

      <!-- Media Cards Grid -->
      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="item in currentSuggestion.media"
          :key="item.id"
          class="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border transition-all"
          :class="[
            selectedIds.includes(item.id)
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-[#1e293b]'
          ]"
        >
          <div class="flex items-start gap-3 sm:gap-4">
            <!-- Checkbox (disabled if already in shelf) -->
            <div class="pt-1">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                :disabled="item.status !== 'suggested'"
                @change="toggleSelectItem(item.id)"
                class="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc] leading-tight">
                    {{ item.title }}
                  </h3>
                  <div class="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                    <span v-if="item.creator" class="font-medium text-slate-700 dark:text-slate-300">
                      {{ item.creator }}
                    </span>
                    <span v-if="item.creator && item.year"> • </span>
                    <span v-if="item.year">{{ item.year }}</span>
                  </div>
                </div>

                <!-- Status Badge & Action -->
                <div class="flex items-center gap-2">
                  <span
                    class="px-2.5 py-1 text-xs font-semibold rounded-full border"
                    :class="getStatusBadgeClass(item.status)"
                  >
                    {{ getStatusLabel(item.status) }}
                  </span>

                  <!-- Link if already in shelf -->
                  <RouterLink
                    v-if="item.status !== 'suggested' && item.mediable_id"
                    :to="selectedType === 'book' ? `/livros/${item.mediable_id}` : `/filmes/${item.mediable_id}`"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Ver na Estante</span>
                    <ExternalLink class="w-3.5 h-3.5" />
                  </RouterLink>

                  <!-- Individual Add Button if still suggested -->
                  <button
                    v-else-if="item.status === 'suggested'"
                    type="button"
                    @click="openSingleItemModal(item)"
                    class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Adicionar à estante
                  </button>
                </div>
              </div>

              <!-- Synopsis -->
              <p v-if="item.synopsis" class="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed">
                {{ item.synopsis }}
              </p>

              <!-- Reason Box -->
              <div
                v-if="item.reason"
                class="p-3 bg-slate-50 dark:bg-[#1e293b]/70 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-[#31394d]"
              >
                <strong class="text-emerald-600 dark:text-emerald-400">Por que recomendamos:</strong>
                {{ item.reason }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="bg-white dark:bg-[#131b2e] rounded-2xl p-12 border border-slate-200 dark:border-[#1e293b] text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <Sparkles class="w-6 h-6" />
      </div>
      <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc]">
        Nenhuma sugestão de {{ selectedType === 'book' ? 'livros' : 'filmes' }} encontrada
      </h3>
      <p class="text-xs text-slate-500 dark:text-[#94a3b8] max-w-md mx-auto">
        Digite o que você tem interesse em ler ou assistir no campo acima e clique em "Gerar sugestões". A IA analisará suas avaliações anteriores para sugerir obras sob medida!
      </p>
    </div>

    <!-- Reusable AddToShelfModal -->
    <AddToShelfModal
      :is-open="isModalOpen"
      :media-type="selectedType"
      :target-title="modalTargetItem?.title || ''"
      :count="modalTargetItem ? 1 : selectedIds.length"
      :loading="suggestionsStore.importing"
      @close="closeModal"
      @confirm="handleConfirmModal"
    />

    <!-- Confirmation Modal for Replacing Current Suggestions -->
    <div
      v-if="isConfirmModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      @click.self="isConfirmModalOpen = false"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-[#131b2e] rounded-2xl shadow-xl border border-slate-200 dark:border-[#31394d] overflow-hidden p-6 space-y-4"
      >
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle class="w-6 h-6" />
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-slate-900 dark:text-[#f8fafc] leading-snug">
              Substituir sugestões atuais?
            </h3>
            <p class="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
              Você já possui uma lista de sugestões de {{ selectedType === 'book' ? 'livros' : 'filmes' }}. Ao confirmar, a lista anterior será substituída pelas novas recomendações da IA.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
          <button
            type="button"
            @click="isConfirmModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="isConfirmModalOpen = false; executeGenerate()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Sim, gerar novas sugestões
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
