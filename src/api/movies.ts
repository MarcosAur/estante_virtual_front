import { apiClient } from './client';
import type { Movie, MovieStatus } from '@/types';

export interface MovieFilterParams {
  status?: string;
  q?: string;
  tag?: string;
  rating?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const moviesApi = {
  async getMovies(params?: MovieFilterParams) {
    const res = await apiClient.get<{ data: Movie[]; meta?: any; links?: any }>('/movies', { params });
    return res.data;
  },

  async getMovie(id: string) {
    const res = await apiClient.get<{ data: Movie }>(`/movies/${id}`);
    return res.data.data;
  },

  async createMovie(data: Partial<Movie> & { tag_ids?: string[]; poster?: File; poster_url?: string }) {
    if (data.poster) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'poster' && val instanceof File) {
          formData.append('poster', val);
        } else if (key === 'tag_ids' && Array.isArray(val)) {
          val.forEach((id: any) => formData.append('tag_ids[]', String(id)));
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      const res = await apiClient.post<{ data: Movie }>('/movies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    }

    const res = await apiClient.post<{ data: Movie }>('/movies', data);
    return res.data.data;
  },

  async updateMovie(id: string, data: Partial<Movie> & { tag_ids?: string[]; poster?: File; poster_url?: string }) {
    if (data.poster) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'poster' && val instanceof File) {
          formData.append('poster', val);
        } else if (key === 'tag_ids' && Array.isArray(val)) {
          val.forEach((tid: any) => formData.append('tag_ids[]', String(tid)));
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      formData.append('_method', 'PUT');
      const res = await apiClient.post<{ data: Movie }>(`/movies/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    }

    const res = await apiClient.put<{ data: Movie }>(`/movies/${id}`, data);
    return res.data.data;
  },

  async deleteMovie(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/movies/${id}`);
    return res.data;
  },

  async updateStatus(id: string, data: { status: MovieStatus; watched_at?: string }) {
    const res = await apiClient.patch<{ data: Movie }>(`/movies/${id}/status`, data);
    return res.data.data;
  },

  async uploadPoster(id: string, file: File) {
    const formData = new FormData();
    formData.append('poster', file);
    const res = await apiClient.post<{ data: Movie }>(`/movies/${id}/poster`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async deletePoster(id: string) {
    const res = await apiClient.delete<{ data: Movie }>(`/movies/${id}/poster`);
    return res.data.data;
  },
};
