import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statsApi } from '@/api/stats';
import type { Stats } from '@/types';

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<Stats | null>(null);
  const loading = ref(false);

  async function fetchStats(year?: number) {
    loading.value = true;
    try {
      const data = await statsApi.getStats(year);
      stats.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    stats.value = null;
    loading.value = false;
  }

  return {
    stats,
    loading,
    fetchStats,
    reset,
  };
});
