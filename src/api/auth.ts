import { apiClient } from './client';
import type { User } from '@/types';

export const authApi = {
  async register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    const res = await apiClient.post<{ user: User; token: string }>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiClient.post<{ user: User; token: string }>('/auth/login', data);
    return res.data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async me() {
    const res = await apiClient.get<{ user: User }>('/me');
    return res.data.user;
  },

  async updateProfile(data: { name: string; email: string; current_password?: string; new_password?: string }) {
    const res = await apiClient.put<{ user: User; message: string }>('/me', data);
    return res.data;
  },

  async deleteAccount() {
    const res = await apiClient.delete<{ message: string }>('/me');
    return res.data;
  },
};
