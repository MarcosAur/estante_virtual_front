<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBooksStore } from '@/stores/books';
import { useStatsStore } from '@/stores/stats';
import { User, Shield, Trash2, Key, AlertTriangle, Check } from 'lucide-vue-next';

const authStore = useAuthStore();
const booksStore = useBooksStore();
const statsStore = useStatsStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirmation = ref('');

const message = ref('');
const error = ref('');
const saving = ref(false);

const showDeleteModal = ref(false);
const deleteConfirmText = ref('');
const deleting = ref(false);

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name;
    email.value = authStore.user.email;
  }
});

async function handleUpdateProfile() {
  message.value = '';
  error.value = '';

  if (newPassword.value) {
    if (newPassword.value.length < 10) {
      error.value = 'A nova senha deve ter no mínimo 10 caracteres.';
      return;
    }
    if (newPassword.value !== newPasswordConfirmation.value) {
      error.value = 'A confirmação da nova senha não confere.';
      return;
    }
    if (!currentPassword.value) {
      error.value = 'Informe sua senha atual para alterar a senha.';
      return;
    }
  }

  saving.value = true;
  try {
    const res = await authStore.updateProfile({
      name: name.value,
      email: email.value,
      current_password: currentPassword.value || undefined,
      new_password: newPassword.value || undefined,
    });
    message.value = res.message || 'Perfil atualizado com sucesso!';
    currentPassword.value = '';
    newPassword.value = '';
    newPasswordConfirmation.value = '';
  } catch (err: any) {
    if (err.response?.data?.errors) {
      error.value = Object.values(err.response.data.errors).flat().join(' ');
    } else {
      error.value = err.response?.data?.message || 'Erro ao atualizar perfil.';
    }
  } finally {
    saving.value = false;
  }
}

async function handleDeleteAccount() {
  if (deleteConfirmText.value !== 'EXCLUIR') return;
  deleting.value = true;
  try {
    await authStore.deleteAccount();
    booksStore.reset();
    statsStore.reset();
    router.push('/login');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao excluir conta.');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">Meu Perfil</h1>
      <p class="text-sm text-slate-500 dark:text-[#94a3b8]">Gerencie seus dados de acesso e preferências</p>
    </div>

    <div v-if="message" class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-sm rounded-xl flex items-center gap-2">
      <Check class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      {{ message }}
    </div>

    <div v-if="error" class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm rounded-xl flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-rose-600 dark:text-rose-400" />
      {{ error }}
    </div>

    <!-- Personal Info & Password Form -->
    <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-6 transition-colors duration-200">
      <form class="space-y-6" @submit.prevent="handleUpdateProfile">
        <!-- Personal info section -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
            <User class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Dados Básicos
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input
                v-model="name"
                type="text"
                required
                class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                v-model="email"
                type="email"
                required
                class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 dark:border-[#1e293b]"></div>

        <!-- Password section -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc] flex items-center gap-2">
            <Key class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Alterar Senha (opcional)
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
              <input
                v-model="currentPassword"
                type="password"
                placeholder="••••••••••"
                class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nova Senha (≥ 10 chars)</label>
              <input
                v-model="newPassword"
                type="password"
                placeholder="••••••••••"
                class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
              <input
                v-model="newPasswordConfirmation"
                type="password"
                placeholder="••••••••••"
                class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            <span v-if="saving">Salvando...</span>
            <span v-else>Salvar Alterações</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Danger Zone (LGPD RF09) -->
    <div class="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-6 sm:p-8 border border-rose-200 dark:border-rose-900/30 space-y-4">
      <div class="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-base">
        <Shield class="w-5 h-5 text-rose-600 dark:text-rose-400" />
        <span>Zona de Privacidade e LGPD</span>
      </div>
      <p class="text-xs text-rose-700 dark:text-rose-300/80 leading-relaxed max-w-2xl">
        Conforme a LGPD, você tem total controle e propriedade sobre seus dados. Ao excluir sua conta, todos os seus livros, resenhas, capas salvas e histórico serão excluídos imediatamente e de forma irreversível.
      </p>

      <button
        @click="showDeleteModal = true"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Excluir Minha Conta Permanentemente
      </button>
    </div>

    <!-- Modal for Account Deletion -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-[#1e293b] shadow-xl space-y-4">
        <div class="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div class="p-2 bg-rose-100 dark:bg-rose-950/50 rounded-xl">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Excluir Conta Definitivamente?</h3>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Esta ação não pode ser desfeita. Para confirmar a exclusão de todos os seus dados e livros, digite a palavra <strong class="text-rose-600 dark:text-rose-400">EXCLUIR</strong> abaixo:
        </p>

        <input
          v-model="deleteConfirmText"
          type="text"
          placeholder="Digite EXCLUIR"
          class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm text-center font-bold uppercase tracking-wider bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-rose-500"
        />

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="handleDeleteAccount"
            :disabled="deleteConfirmText !== 'EXCLUIR' || deleting"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 cursor-pointer"
          >
            <span v-if="deleting">Excluindo tudo...</span>
            <span v-else>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
