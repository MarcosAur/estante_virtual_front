<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBooksStore } from '@/stores/books';
import { useStatsStore } from '@/stores/stats';
import { useTheme } from '@/composables/useTheme';
import { BookOpen, Library, User, LogOut, Menu, X, Sun, Moon } from 'lucide-vue-next';

const authStore = useAuthStore();
const booksStore = useBooksStore();
const statsStore = useStatsStore();
const router = useRouter();
const { theme, toggleTheme } = useTheme();

const isMobileMenuOpen = ref(false);

async function handleLogout() {
  await authStore.logout();
  booksStore.reset();
  statsStore.reset();
  router.push('/login');
}
</script>

<template>
  <header class="bg-white dark:bg-[#131b2e] border-b border-[#e2e8f0] dark:border-[#1e293b] sticky top-0 z-30 shadow-xs transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo and Left Nav -->
        <div class="flex items-center space-x-8">
          <RouterLink to="/" class="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-[#f8fafc] hover:opacity-90 transition-opacity">
            <div class="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm">
              <BookOpen class="w-5 h-5" />
            </div>
            <span class="tracking-tight">Book<span class="text-emerald-500">Track</span></span>
          </RouterLink>

          <!-- Desktop Navigation -->
          <nav v-if="authStore.isAuthenticated" class="hidden md:flex items-center space-x-1">
            <RouterLink
              to="/"
              class="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
              active-class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
            >
              Dashboard
            </RouterLink>
            <RouterLink
              to="/estante"
              class="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
              active-class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
            >
              <span class="flex items-center gap-1.5">
                <Library class="w-4 h-4" />
                Estante
              </span>
            </RouterLink>
          </nav>
        </div>

        <!-- Right action buttons -->
        <div class="hidden md:flex items-center space-x-3">
          <!-- Theme Switcher -->
          <button
            @click="toggleTheme"
            class="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors"
            :title="theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'"
            aria-label="Alternar tema"
          >
            <Sun v-if="theme === 'dark'" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <template v-if="authStore.isAuthenticated">
            <RouterLink
              to="/perfil"
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
              title="Meu perfil"
            >
              <div class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase border border-emerald-200 dark:border-emerald-800/50">
                {{ authStore.user?.name?.charAt(0) || 'U' }}
              </div>
              <span class="max-w-[120px] truncate">{{ authStore.user?.name }}</span>
            </RouterLink>

            <button
              @click="handleLogout"
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </template>
        </div>

        <!-- Mobile controls (theme + hamburger) -->
        <div class="flex items-center gap-2 md:hidden">
          <button
            @click="toggleTheme"
            class="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e293b]"
            :title="theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'"
          >
            <Sun v-if="theme === 'dark'" class="w-5 h-5 text-amber-400" />
            <Moon v-else class="w-5 h-5 text-slate-600" />
          </button>
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e293b]"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="isMobileMenuOpen && authStore.isAuthenticated" class="md:hidden border-t border-[#e2e8f0] dark:border-[#1e293b] px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-[#131b2e]">
      <RouterLink
        to="/"
        @click="isMobileMenuOpen = false"
        class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
      >
        Dashboard
      </RouterLink>
      <RouterLink
        to="/estante"
        @click="isMobileMenuOpen = false"
        class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
      >
        Estante
      </RouterLink>
      <RouterLink
        to="/livros/novo"
        @click="isMobileMenuOpen = false"
        class="block px-3 py-2 rounded-md text-base font-medium text-emerald-600 dark:text-emerald-400 font-semibold"
      >
        + Adicionar Livro
      </RouterLink>
      <div class="border-t border-[#e2e8f0] dark:border-[#1e293b] pt-2 mt-2 flex justify-between items-center">
        <RouterLink
          to="/perfil"
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <User class="w-4 h-4" />
          <span>{{ authStore.user?.name }}</span>
        </RouterLink>
        <button
          @click="handleLogout"
          class="text-sm font-medium text-rose-600 flex items-center gap-1"
        >
          <LogOut class="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  </header>
</template>
