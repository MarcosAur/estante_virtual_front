import { defineStore } from 'pinia';
import { ref } from 'vue';
import { writingsApi, type WritingFilterParams, type WritingPayload } from '@/api/writings';
import type { WritingEntry, WritingSummary, WritingKind } from '@/types';

export const useWritingsStore = defineStore('writings', () => {
  const entries = ref<WritingEntry[]>([]);
  const summary = ref<WritingSummary | null>(null);
  const currentEntry = ref<WritingEntry | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filterKind = ref<WritingKind | 'all'>('all');
  const searchQuery = ref('');
  const selectedTag = ref<string | null>(null);

  async function loadWritings(params?: WritingFilterParams) {
    loading.value = true;
    error.value = null;
    try {
      const mergedParams: WritingFilterParams = {
        kind: filterKind.value !== 'all' ? (filterKind.value as WritingKind) : undefined,
        q: searchQuery.value.trim() || undefined,
        tag: selectedTag.value || undefined,
        ...params,
      };
      const res = await writingsApi.getWritings(mergedParams);
      entries.value = res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar escritas.';
    } finally {
      loading.value = false;
    }
  }

  async function loadSummary() {
    try {
      summary.value = await writingsApi.getSummary();
    } catch (err: any) {
      console.error('Erro ao carregar resumo de escritas:', err);
    }
  }

  async function fetchWriting(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentEntry.value = await writingsApi.getWriting(id);
      return currentEntry.value;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Escrita não encontrada.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createWriting(payload: WritingPayload) {
    const created = await writingsApi.createWriting(payload);
    entries.value.unshift(created);
    await loadSummary();
    return created;
  }

  async function updateWriting(id: string, payload: Partial<WritingPayload>) {
    const updated = await writingsApi.updateWriting(id, payload);
    const idx = entries.value.findIndex((e) => e.id === id);
    if (idx !== -1) {
      entries.value[idx] = updated;
    }
    if (currentEntry.value?.id === id) {
      currentEntry.value = updated;
    }
    await loadSummary();
    return updated;
  }

  async function deleteWriting(id: string) {
    await writingsApi.deleteWriting(id);
    entries.value = entries.value.filter((e) => e.id !== id);
    if (currentEntry.value?.id === id) {
      currentEntry.value = null;
    }
    await loadSummary();
  }

  function reset() {
    entries.value = [];
    summary.value = null;
    currentEntry.value = null;
    loading.value = false;
    error.value = null;
    filterKind.value = 'all';
    searchQuery.value = '';
    selectedTag.value = null;
  }

  return {
    entries,
    summary,
    currentEntry,
    loading,
    error,
    filterKind,
    searchQuery,
    selectedTag,
    loadWritings,
    loadSummary,
    fetchWriting,
    createWriting,
    updateWriting,
    deleteWriting,
    reset,
  };
});
