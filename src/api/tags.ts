import { apiClient } from './client';
import type { Tag } from '@/types';

export const tagsApi = {
  async getTags() {
    const res = await apiClient.get<{ data: Tag[] }>('/tags');
    return res.data.data;
  },

  async createTag(data: { name: string; color?: string }) {
    const res = await apiClient.post<{ data: Tag }>('/tags', data);
    return res.data.data;
  },

  async deleteTag(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/tags/${id}`);
    return res.data;
  },
};
