<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useMoviesStore } from '@/stores/movies';
import { useStatsStore } from '@/stores/stats';
import { tagsApi } from '@/api/tags';
import type { Tag } from '@/types';
import MovieCard from '@/components/MovieCard.vue';
import ShelfTabs from '@/components/ShelfTabs.vue';
import { Search, Plus, Film } from 'lucide-vue-next';

const moviesStore = useMoviesStore();
const statsStore = useStatsStore();
const route = useRoute();
const router = useRouter();

const activeTab = ref((route.query.status as string) || '');
const searchQuery = ref((route.query.q as string) || '');
const selectedTag = ref((route.query.tag as string) || '');
const sortOrder = ref((route.query.sort as string) || 'recent');
const availableTags = ref<Tag[]>([]);

const movieTabs = [
  { key: '', label: 'Todos' },
  { key: 'watching', label: 'Assistindo' },
  { key: 'want_to_watch', label: 'Quero assistir' },
  { key: 'watched', label: 'Assistidos' },
];

let debounceTimer: any = null;

async function loadMovies() {
  await moviesStore.fetchMovies({
    status: activeTab.value || undefined,
    q: searchQuery.value || undefined,
    tag: selectedTag.value || undefined,
    sort: sortOrder.value || undefined,
    per_page: 36,
  });
}

onMounted(async () => {
  await Promise.all([
    loadMovies(),
    statsStore.fetchStats(),
    tagsApi.getTags().then(tags => (availableTags.value = tags)).catch(() => {}),
  ]);
});

watch(activeTab, (newStatus) => {
  router.replace({ query: { ...route.query, status: newStatus || undefined } });
  loadMovies();
});

watch([selectedTag, sortOrder], () => {
  loadMovies();
});

function handleSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadMovies();
  }, 350);
}

function clearFilters() {
  activeTab.value = '';
  searchQuery.value = '';
  selectedTag.value = '';
  sortOrder.value = 'recent';
  loadMovies();
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Header with title & Add button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">
          Minha Cineclube
        </h1>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8]">
          Seus filmes catalogados e avaliados privadamente
        </p>
      </div>

      <RouterLink
        to="/filmes/novo"
        class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
      >
        <Plus class="w-4 h-4" />
        Adicionar Filme
      </RouterLink>
    </div>

    <!-- Shelf Tabs for Movies -->
    <ShelfTabs
      v-model:active-tab="activeTab"
      :tabs="movieTabs"
      :counts="{
        total: statsStore.stats?.total_movies,
        watching: statsStore.stats?.movie_status_counts?.watching,
        want_to_watch: statsStore.stats?.movie_status_counts?.want_to_watch,
        watched: statsStore.stats?.movie_status_counts?.watched,
      }"
    />

    <!-- Filters & Search Bar -->
    <div class="bg-white dark:bg-[#131b2e] p-4 rounded-xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col md:flex-row items-center gap-3 transition-colors duration-200">
      <!-- Search input -->
      <div class="relative flex-1 w-full">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          v-model="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="Buscar filme por título, diretor ou gênero..."
          class="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <!-- Tag filter -->
      <div v-if="availableTags.length > 0" class="w-full md:w-48">
        <select
          v-model="selectedTag"
          class="w-full px-3 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas as tags</option>
          <option v-for="tag in availableTags" :key="tag.id" :value="tag.id">
            #{{ tag.name }}
          </option>
        </select>
      </div>

      <!-- Sort order -->
      <div class="w-full md:w-48">
        <select
          v-model="sortOrder"
          class="w-full px-3 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="recent">Mais recentes</option>
          <option value="title_asc">Título (A-Z)</option>
          <option value="title_desc">Título (Z-A)</option>
          <option value="director">Diretor</option>
          <option value="year">Ano de lançamento</option>
          <option value="runtime">Duração</option>
        </select>
      </div>
    </div>

    <!-- Movies Grid -->
    <div v-if="moviesStore.loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      <div v-for="i in 12" :key="i" class="animate-pulse bg-slate-200 dark:bg-[#1e293b] rounded-xl aspect-[2/3]"></div>
    </div>

    <div v-else-if="moviesStore.movies.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      <MovieCard v-for="movie in moviesStore.movies" :key="movie.id" :movie="movie" />
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-[#131b2e] rounded-2xl p-12 border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-4 max-w-md mx-auto my-8 transition-colors duration-200">
      <div class="inline-flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
        <Film class="w-10 h-10" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Nenhum filme encontrado</h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
          <span v-if="searchQuery || selectedTag || activeTab">
            Não encontramos filmes com os filtros aplicados.
          </span>
          <span v-else>
            Sua estante de filmes ainda está vazia! Adicione seu primeiro filme para avaliar.
          </span>
        </p>
      </div>
      <div class="pt-2 flex justify-center gap-3">
        <button
          v-if="searchQuery || selectedTag || activeTab"
          @click="clearFilters"
          class="px-4 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
        >
          Limpar Filtros
        </button>
        <RouterLink
          to="/filmes/novo"
          class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          <Plus class="w-4 h-4" />
          Adicionar Filme
        </RouterLink>
      </div>
    </div>
  </div>
</template>
