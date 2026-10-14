import { apiClient } from './client';
import type { Book, ExternalBookLookup } from '@/types';

export interface BookFilterParams {
  status?: string;
  q?: string;
  tag?: string;
  rating?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const booksApi = {
  async getBooks(params?: BookFilterParams) {
    const res = await apiClient.get<{ data: Book[]; meta?: any; links?: any }>('/books', { params });
    return res.data;
  },

  async getBook(id: string) {
    const res = await apiClient.get<{ data: Book }>(`/books/${id}`);
    return res.data.data;
  },

  async createBook(data: Partial<Book> & { tag_ids?: string[] }) {
    const res = await apiClient.post<{ data: Book }>('/books', data);
    return res.data.data;
  },

  async updateBook(id: string, data: Partial<Book> & { tag_ids?: string[] }) {
    const res = await apiClient.put<{ data: Book }>(`/books/${id}`, data);
    return res.data.data;
  },

  async deleteBook(id: string) {
    const res = await apiClient.delete<{ message: string }>(`/books/${id}`);
    return res.data;
  },

  async updateProgress(id: string, data: { current_page: number; status?: string; finished_at?: string }) {
    const res = await apiClient.patch<{ data: Book }>(`/books/${id}/progress`, data);
    return res.data.data;
  },

  async uploadCover(id: string, file: File) {
    const formData = new FormData();
    formData.append('cover', file);
    const res = await apiClient.post<{ data: Book }>(`/books/${id}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async deleteCover(id: string) {
    const res = await apiClient.delete<{ data: Book }>(`/books/${id}/cover`);
    return res.data.data;
  },

  async lookupBooks(params: { isbn?: string; q?: string }) {
    const res = await apiClient.get<{ data: ExternalBookLookup[] }>('/lookup/books', { params });
    return res.data.data;
  },
};
