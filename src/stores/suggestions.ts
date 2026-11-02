import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { suggestionsApi } from '@/api/suggestions';
import type { Suggestion, SuggestedMedia } from '@/types';

export const useSuggestionsStore = defineStore('suggestions', () => {
  const currentType = ref<'book' | 'movie'>('book');
  const bookSuggestion = ref<Suggestion | null>(null);
  const movieSuggestion = ref<Suggestion | null>(null);

  const loading = ref(false);
  const generating = ref(false);
  const importing = ref(false);
  const error = ref<string | null>(null);

  const currentSuggestion = computed(() => {
    return currentType.value === 'book' ? bookSuggestion.value : movieSuggestion.value;
  });

  async function loadLatest(type: 'book' | 'movie', force = false) {
    currentType.value = type;
    const existing = type === 'book' ? bookSuggestion.value : movieSuggestion.value;
    if (existing && !force) return;

    loading.value = true;
    error.value = null;
    try {
      const data = await suggestionsApi.getLatest(type);
      if (type === 'book') {
        bookSuggestion.value = data;
      } else {
        movieSuggestion.value = data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar sugestões.';
    } finally {
      loading.value = false;
    }
  }

  async function generate(type: 'book' | 'movie', prompt: string, useHistory = true) {
    generating.value = true;
    error.value = null;
    try {
      const data = await suggestionsApi.generate({
        type,
        prompt,
        use_history: useHistory,
      });
      if (type === 'book') {
        bookSuggestion.value = data;
      } else {
        movieSuggestion.value = data;
      }
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao gerar sugestões com a IA.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      generating.value = false;
    }
  }

  async function importSingleItem(id: string, status: string) {
    importing.value = true;
    error.value = null;
    try {
      const updatedItem = await suggestionsApi.importItem(id, status);
      updateItemInState(updatedItem);
      return updatedItem;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao importar item para a estante.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      importing.value = false;
    }
  }

  async function importBatch(suggestionId: string, itemIds: string[], status: string) {
    importing.value = true;
    error.value = null;
    try {
      const result = await suggestionsApi.batchImport(suggestionId, {
        status,
        item_ids: itemIds,
      });

      // Update in-place all created and skipped items
      result.created.forEach(updateItemInState);
      result.skipped.forEach(updateItemInState);

      return result;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao importar itens em lote.';
      error.value = msg;
      throw new Error(msg);
    } finally {
      importing.value = false;
    }
  }

  function updateItemInState(updated: SuggestedMedia) {
    const targetSuggestion = currentType.value === 'book' ? bookSuggestion.value : movieSuggestion.value;
    if (!targetSuggestion || !targetSuggestion.media) return;

    const idx = targetSuggestion.media.findIndex((m) => m.id === updated.id);
    if (idx !== -1) {
      targetSuggestion.media[idx] = {
        ...targetSuggestion.media[idx],
        ...updated,
      };
    }
  }

  function reset() {
    bookSuggestion.value = null;
    movieSuggestion.value = null;
    currentType.value = 'book';
    loading.value = false;
    generating.value = false;
    importing.value = false;
    error.value = null;
  }

  return {
    currentType,
    bookSuggestion,
    movieSuggestion,
    currentSuggestion,
    loading,
    generating,
    importing,
    error,
    loadLatest,
    generate,
    importSingleItem,
    importBatch,
    reset,
  };
});
