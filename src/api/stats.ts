import { apiClient } from './client';
import type { Stats } from '@/types';

export const statsApi = {
  async getStats(year?: number) {
    const res = await apiClient.get<{ data: Stats }>('/stats', { params: { year } });
    return res.data.data;
  },
};
