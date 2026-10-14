<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { BookOpen } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const allowRegistration = import.meta.env.VITE_ENABLE_REGISTER !== 'false';

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const error = ref('');

async function handleSubmit() {
  error.value = '';
  if (password.value !== passwordConfirmation.value) {
    error.value = 'A confirmação de senha não coincide com a senha informada.';
    return;
  }

  if (password.value.length < 10) {
    error.value = 'A senha deve conter no mínimo 10 caracteres.';
    return;
  }

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    router.push('/');
  } catch (err: any) {
    if (err.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat();
      error.value = messages.join(' ');
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = 'Falha ao registrar a conta. Verifique os dados informados.';
    }
  }
}
</script>

<template>
  <div class="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex items-center justify-center bg-emerald-500 text-white p-3 rounded-2xl shadow-md mb-3">
        <BookOpen class="w-8 h-8" />
      </div>
      <h2 class="text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">Crie sua Conta</h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">Organize seus livros e resenhas com total privacidade no BookTrack</p>
    </div>

    <div v-if="!allowRegistration" class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-[#131b2e] py-8 px-6 shadow-md rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-4 sm:px-10 transition-colors duration-200">
        <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Cadastros Desativados</h3>
        <p class="text-sm text-slate-600 dark:text-[#94a3b8] leading-relaxed">
          Novos cadastros de usuários estão temporariamente desativados no sistema.
        </p>
        <div class="pt-2">
          <RouterLink
            to="/login"
            class="inline-flex justify-center w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
          >
            Ir para o Login
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-else class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-[#131b2e] py-8 px-6 shadow-md rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] sm:px-10 transition-colors duration-200">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm rounded-lg">
            {{ error }}
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Seu Nome</label>
            <div class="mt-1">
              <input
                id="name"
                v-model="name"
                type="text"
                required
                autocomplete="name"
                placeholder="Como prefere ser chamado"
                class="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg shadow-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
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
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha (mínimo 10 caracteres)</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                required
                autocomplete="new-password"
                placeholder="••••••••••"
                class="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg shadow-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label for="passwordConfirmation" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Senha</label>
            <div class="mt-1">
              <input
                id="passwordConfirmation"
                v-model="passwordConfirmation"
                type="password"
                required
                autocomplete="new-password"
                placeholder="••••••••••"
                class="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg shadow-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <span v-if="authStore.loading">Cadastrando...</span>
              <span v-else>Criar Minha Conta</span>
            </button>
          </div>
        </form>

        <div class="mt-6 text-center text-sm">
          <span class="text-slate-500 dark:text-[#94a3b8]">Já tem uma conta? </span>
          <RouterLink to="/login" class="font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            Fazer login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
