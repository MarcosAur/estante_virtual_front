<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useStatsStore } from '@/stores/stats';
import { useBooksStore } from '@/stores/books';
import { useAuthStore } from '@/stores/auth';
import BookCard from '@/components/BookCard.vue';
import {
  BookOpen,
  CheckCircle,
  FileText,
  Star,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-vue-next';

const statsStore = useStatsStore();
const booksStore = useBooksStore();
const authStore = useAuthStore();

const currentYear = new Date().getFullYear();

onMounted(async () => {
  await Promise.all([
    statsStore.fetchStats(currentYear),
    booksStore.fetchBooks({ status: 'reading', per_page: 6 }),
  ]);
});

const stats = computed(() => statsStore.stats);
const readingBooks = computed(() => booksStore.books);

async function quickUpdateProgress(bookId: string, page: number) {
  await booksStore.updateProgress(bookId, { current_page: page });
  await statsStore.fetchStats(currentYear);
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Welcome Banner with Brand Emerald/Nocturne Gradient -->
    <div class="bg-gradient-to-r from-emerald-800 via-teal-900 to-[#0b1326] border border-emerald-700/30 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Olá, {{ authStore.user?.name || 'Leitor' }}! 📚
        </h1>
        <p class="text-emerald-100/90 text-sm sm:text-base max-w-xl">
          Bem-vindo ao BookTrack. Acompanhe suas leituras, registre resenhas privadas e organize sua estante virtual.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink
          to="/livros/novo"
          class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          Novo Livro
        </RouterLink>
        <RouterLink
          to="/estante"
          class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-white/20 transition-all"
        >
          Ver Estante
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>

    <!-- Annual Summary Metrics Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Lidos no ano -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl w-fit">
          <CheckCircle class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">{{ stats?.read_this_year || 0 }}</div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Lidos em {{ currentYear }}</div>
        </div>
      </div>

      <!-- Páginas no ano -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl w-fit">
          <FileText class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">{{ stats?.pages_read_this_year?.toLocaleString('pt-BR') || 0 }}</div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Páginas lidas</div>
        </div>
      </div>

      <!-- Média de Notas -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl w-fit">
          <Star class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">
            {{ stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '-' }}
          </div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Média das notas</div>
        </div>
      </div>

      <!-- Total na Estante -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 rounded-xl w-fit">
          <BookOpen class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">{{ stats?.total_books || 0 }}</div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Total na estante</div>
        </div>
      </div>
    </div>

    <!-- Currently Reading ("Lendo Agora") Section -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Lendo Agora</h2>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
            {{ readingBooks.length }}
          </span>
        </div>
        <RouterLink
          to="/estante?status=reading"
          class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <div v-if="readingBooks.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="book in readingBooks" :key="book.id" class="space-y-2">
          <BookCard :book="book" />
          <div class="flex items-center gap-1.5 px-1">
            <input
              type="number"
              :value="book.current_page"
              min="0"
              :max="book.pages || 9999"
              @change="(e: any) => quickUpdateProgress(book.id, parseInt(e.target.value) || 0)"
              class="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-[#31394d] rounded bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 text-center"
              title="Atualizar página atual"
            />
            <span class="text-[11px] text-slate-500 dark:text-[#94a3b8]">/ {{ book.pages }} pág.</span>
          </div>
        </div>
      </div>

      <div v-else class="bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-3 transition-colors duration-200">
        <p class="text-slate-500 dark:text-[#94a3b8] text-sm">Você não tem nenhum livro com status "Lendo" no momento.</p>
        <RouterLink
          to="/estante"
          class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline"
        >
          Escolha um livro da sua estante para começar a ler
        </RouterLink>
      </div>
    </div>
  </div>
</template>
