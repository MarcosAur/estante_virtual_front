import { apiClient } from './client';
import type { Review } from '@/types';

export const reviewsApi = {
  async getReviews(params?: { page?: number; per_page?: number }) {
    const res = await apiClient.get<{ data: Review[]; meta?: any }>('/reviews', { params });
    return res.data;
  },

  async getBookReview(bookId: string) {
    const res = await apiClient.get<{ data: Review }>(`/books/${bookId}/review`);
    return res.data.data;
  },

  async saveBookReview(bookId: string, data: { rating: number; title?: string; body: string; has_spoiler?: boolean }) {
    const res = await apiClient.post<{ data: Review }>(`/books/${bookId}/review`, data);
    return res.data.data;
  },

  async deleteBookReview(bookId: string) {
    const res = await apiClient.delete<{ message: string }>(`/books/${bookId}/review`);
    return res.data;
  },
};
