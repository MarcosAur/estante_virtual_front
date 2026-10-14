import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const cachedUser = localStorage.getItem('auth_user');
  const user = ref<User | null>(cachedUser ? JSON.parse(cachedUser) : null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  function setAuthData(newUser: User, newToken: string) {
    user.value = newUser;
    token.value = newToken;
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    localStorage.setItem('auth_token', newToken);
  }

  function clearAuthData() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  async function login(credentials: { email: string; password: string }) {
    loading.value = true;
    try {
      const data = await authApi.login(credentials);
      setAuthData(data.user, data.token);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload: { name: string; email: string; password: string; password_confirmation: string }) {
    loading.value = true;
    try {
      const data = await authApi.register(payload);
      setAuthData(data.user, data.token);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await authApi.logout();
      }
    } catch {
      // ignore network errors on logout
    } finally {
      clearAuthData();
    }
  }

  async function fetchMe() {
    if (!token.value) return null;
    try {
      const userData = await authApi.me();
      user.value = userData;
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    } catch {
      clearAuthData();
      return null;
    }
  }

  async function updateProfile(data: { name: string; email: string; current_password?: string; new_password?: string }) {
    loading.value = true;
    try {
      const res = await authApi.updateProfile(data);
      user.value = res.user;
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccount() {
    loading.value = true;
    try {
      const res = await authApi.deleteAccount();
      clearAuthData();
      return res;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    clearAuthData();
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    deleteAccount,
    reset,
  };
});
