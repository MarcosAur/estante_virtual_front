<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useStatsStore } from '@/stores/stats';
import { useBooksStore } from '@/stores/books';
import { useAuthStore } from '@/stores/auth';
import { moviesApi } from '@/api/movies';
import type { Movie } from '@/types';
import BookCard from '@/components/BookCard.vue';
import MovieCard from '@/components/MovieCard.vue';
import {
  BookOpen,
  Film,
  CheckCircle,
  Star,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-vue-next';

const statsStore = useStatsStore();
const booksStore = useBooksStore();
const authStore = useAuthStore();

const watchingMovies = ref<Movie[]>([]);
const currentYear = new Date().getFullYear();

onMounted(async () => {
  await Promise.all([
    statsStore.fetchStats(currentYear),
    booksStore.fetchBooks({ status: 'reading', per_page: 6 }),
    moviesApi.getMovies({ status: 'watching', per_page: 6 }).then((res) => {
      watchingMovies.value = res.data;
    }).catch(() => {}),
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
          Olá, {{ authStore.user?.name || 'Leitor' }}! 📚🎬
        </h1>
        <p class="text-emerald-100/90 text-sm sm:text-base max-w-xl">
          Bem-vindo à sua Estante Virtual. Acompanhe suas leituras, filmes assistidos, resenhas privadas e estatísticas em um só lugar.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <RouterLink
          to="/livros/novo"
          class="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          Livro
        </RouterLink>
        <RouterLink
          to="/filmes/novo"
          class="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          Filme
        </RouterLink>
        <RouterLink
          to="/estante"
          class="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-all"
        >
          Estante
          <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>
    </div>

    <!-- Annual Summary Metrics Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Livros Lidos no ano -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl w-fit">
          <CheckCircle class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">{{ stats?.read_this_year || 0 }}</div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Livros lidos em {{ currentYear }}</div>
        </div>
      </div>

      <!-- Filmes Assistidos no ano -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl w-fit">
          <Film class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">{{ stats?.movies_watched_this_year || 0 }}</div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">Filmes vistos em {{ currentYear }}</div>
        </div>
      </div>

      <!-- Média Geral de Avaliações -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl w-fit">
          <Star class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">
            {{ stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '-' }}
          </div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">
            Média livros (filmes: {{ stats?.movies_average_rating ? Number(stats.movies_average_rating).toFixed(1) : '-' }})
          </div>
        </div>
      </div>

      <!-- Total na Coleção -->
      <div class="bg-white dark:bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col justify-between transition-colors duration-200">
        <div class="p-2.5 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 rounded-xl w-fit">
          <BookOpen class="w-5 h-5" />
        </div>
        <div class="mt-4">
          <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc]">
            {{ (stats?.total_books || 0) + (stats?.total_movies || 0) }}
          </div>
          <div class="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mt-1">
            Total na estante ({{ stats?.total_books || 0 }} l. / {{ stats?.total_movies || 0 }} f.)
          </div>
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

    <!-- Currently Watching ("Assistindo Agora") Section -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <Film class="w-5 h-5 text-teal-500" />
          <h2 class="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Assistindo Agora</h2>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
            {{ watchingMovies.length }}
          </span>
        </div>
        <RouterLink
          to="/filmes?status=watching"
          class="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <div v-if="watchingMovies.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="movie in watchingMovies" :key="movie.id">
          <MovieCard :movie="movie" />
        </div>
      </div>

      <div v-else class="bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-3 transition-colors duration-200">
        <p class="text-slate-500 dark:text-[#94a3b8] text-sm">Nenhum filme com status "Assistindo" no momento.</p>
        <RouterLink
          to="/filmes"
          class="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold text-sm hover:underline"
        >
          Ver seu catálogo de filmes
        </RouterLink>
      </div>
    </div>

    <!-- TMDB API Attribution Footer -->
    <footer class="pt-6 border-t border-[#e2e8f0] dark:border-[#1e293b] text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
      <p>Estante Virtual • Gerenciamento particular de livros e filmes</p>
      <p class="text-[11px]">
        Este produto utiliza a API do TMDB para consulta de metadados cinematográficos, mas não é endossado nem certificado pelo TMDB.
      </p>
    </footer>
  </div>
</template>
