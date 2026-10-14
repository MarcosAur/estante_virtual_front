<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { BookOpen } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');

async function handleSubmit() {
  error.value = '';
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/');
  } catch (err: any) {
    if (err.response?.data?.errors?.email) {
      error.value = err.response.data.errors.email[0];
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = 'Falha ao autenticar. Verifique suas credenciais.';
    }
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex items-center justify-center bg-emerald-500 text-white p-3 rounded-2xl shadow-md mb-3">
        <BookOpen class="w-8 h-8" />
      </div>
      <h2 class="text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">BookTrack</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">Sua estante particular de livros e resenhas</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-[#131b2e] py-8 px-6 shadow-md rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] sm:px-10 transition-colors duration-200">
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div v-if="error" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm rounded-lg">
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="seu@email.com"
                class="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg shadow-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••••"
                class="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg shadow-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span v-if="authStore.loading">Entrando...</span>
              <span v-else>Entrar</span>
            </button>
          </div>
        </form>

        <div class="mt-6 text-center text-sm">
          <span class="text-slate-500 dark:text-[#94a3b8]">Ainda não tem conta? </span>
          <RouterLink to="/registro" class="font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            Cadastre-se gratuitamente
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
