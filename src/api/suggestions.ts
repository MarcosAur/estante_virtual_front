import { apiClient } from './client';
import type { Suggestion, SuggestedMedia, BatchImportResult } from '@/types';

export const suggestionsApi = {
  async getLatest(type: 'book' | 'movie'): Promise<Suggestion | null> {
    const res = await apiClient.get<{ data: Suggestion | null }>('/suggestions', {
      params: { type },
    });
    return res.data.data;
  },

  async generate(payload: {
    type: 'book' | 'movie';
    prompt: string;
    use_history?: boolean;
  }): Promise<Suggestion> {
    const res = await apiClient.post<{ data: Suggestion }>('/suggestions', payload);
    return res.data.data;
  },

  async importItem(id: string, status: string): Promise<SuggestedMedia> {
    const res = await apiClient.post<{ data: SuggestedMedia }>(`/suggested-media/${id}/import`, {
      status,
    });
    return res.data.data;
  },

  async batchImport(
    suggestionId: string,
    payload: { status: string; item_ids: string[] }
  ): Promise<BatchImportResult> {
    const res = await apiClient.post<{ data: BatchImportResult }>(
      `/suggestions/${suggestionId}/import`,
      payload
    );
    return res.data.data;
  },
};
