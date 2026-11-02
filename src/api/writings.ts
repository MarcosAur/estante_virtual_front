import { apiClient } from './client';
import type { WritingEntry, WritingSummary, WritingKind } from '@/types';

export interface WritingFilterParams {
  kind?: WritingKind;
  tag?: string;
  q?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface WritingPayload {
  kind: WritingKind;
  title?: string | null;
  body: string;
  entry_date: string;
  source_label?: string | null;
  mood?: string | null;
  tag_ids?: string[];
}

export const writingsApi = {
  async getWritings(params?: WritingFilterParams) {
    const res = await apiClient.get<{ data: WritingEntry[]; meta?: any }>('/writings', { params });
    return res.data;
  },

  async getSummary(): Promise<WritingSummary> {
    const res = await apiClient.get<{ data: WritingSummary }>('/writings/summary');
    return res.data.data;
  },

  async getWriting(id: string): Promise<WritingEntry> {
    const res = await apiClient.get<{ data: WritingEntry }>(`/writings/${id}`);
    return res.data.data;
  },

  async createWriting(payload: WritingPayload): Promise<WritingEntry> {
    const res = await apiClient.post<{ data: WritingEntry }>('/writings', payload);
    return res.data.data;
  },

  async updateWriting(id: string, payload: Partial<WritingPayload>): Promise<WritingEntry> {
    const res = await apiClient.put<{ data: WritingEntry }>(`/writings/${id}`, payload);
    return res.data.data;
  },

  async deleteWriting(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/writings/${id}`);
    return res.data;
  },
};
