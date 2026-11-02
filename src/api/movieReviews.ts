import { apiClient } from './client';
import type { MovieReview } from '@/types';

export const movieReviewsApi = {
  async getReviews(params?: { page?: number; per_page?: number }) {
    const res = await apiClient.get<{ data: MovieReview[]; meta?: any }>('/movie-reviews', { params });
    return res.data;
  },

  async getMovieReview(movieId: string) {
    const res = await apiClient.get<{ data: MovieReview }>(`/movies/${movieId}/review`);
    return res.data.data;
  },

  async saveMovieReview(
    movieId: string,
    data: { rating: number; title?: string; body: string; has_spoiler?: boolean }
  ) {
    const res = await apiClient.post<{ data: MovieReview }>(`/movies/${movieId}/review`, data);
    return res.data.data;
  },

  async deleteMovieReview(movieId: string) {
    const res = await apiClient.delete<{ message: string }>(`/movies/${movieId}/review`);
    return res.data;
  },
};
