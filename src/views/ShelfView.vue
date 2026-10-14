<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useBooksStore } from '@/stores/books';
import { useStatsStore } from '@/stores/stats';
import { tagsApi } from '@/api/tags';
import type { Tag } from '@/types';
import BookCard from '@/components/BookCard.vue';
import ShelfTabs from '@/components/ShelfTabs.vue';
import { Search, Plus, BookOpen } from 'lucide-vue-next';

const booksStore = useBooksStore();
const statsStore = useStatsStore();
const route = useRoute();
const router = useRouter();

const activeTab = ref((route.query.status as string) || '');
const searchQuery = ref((route.query.q as string) || '');
const selectedTag = ref((route.query.tag as string) || '');
const sortOrder = ref((route.query.sort as string) || 'recent');
const availableTags = ref<Tag[]>([]);

let debounceTimer: any = null;

async function loadBooks() {
  await booksStore.fetchBooks({
    status: activeTab.value || undefined,
    q: searchQuery.value || undefined,
    tag: selectedTag.value || undefined,
    sort: sortOrder.value || undefined,
    per_page: 36,
  });
}

onMounted(async () => {
  await Promise.all([
    loadBooks(),
    statsStore.fetchStats(),
    tagsApi.getTags().then(tags => availableTags.value = tags).catch(() => {}),
  ]);
});

watch(activeTab, (newStatus) => {
  router.replace({ query: { ...route.query, status: newStatus || undefined } });
  loadBooks();
});

watch([selectedTag, sortOrder], () => {
  loadBooks();
});

function handleSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadBooks();
  }, 350);
}

function clearFilters() {
  activeTab.value = '';
  searchQuery.value = '';
  selectedTag.value = '';
  sortOrder.value = 'recent';
  loadBooks();
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Header with title & Add button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">Minha Estante</h1>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8]">Todos os seus livros organizados em um só lugar</p>
      </div>

      <RouterLink
        to="/livros/novo"
        class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
      >
        <Plus class="w-4 h-4" />
        Adicionar Livro
      </RouterLink>
    </div>

    <!-- Shelf Tabs -->
    <ShelfTabs
      v-model:active-tab="activeTab"
      :counts="{
        total: statsStore.stats?.total_books,
        reading: statsStore.stats?.status_counts?.reading,
        want_to_read: statsStore.stats?.status_counts?.want_to_read,
        read: statsStore.stats?.status_counts?.read,
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
          placeholder="Buscar por título, autor ou ISBN..."
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
            #{{ tag.name }} ({{ tag.books_count || 0 }})
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
          <option value="author">Autor</option>
          <option value="year">Ano de publicação</option>
          <option value="pages">Nº de páginas</option>
        </select>
      </div>
    </div>

    <!-- Books Grid -->
    <div v-if="booksStore.loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      <div v-for="i in 12" :key="i" class="animate-pulse bg-slate-200 dark:bg-[#1e293b] rounded-xl aspect-[2/3]"></div>
    </div>

    <div v-else-if="booksStore.books.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      <BookCard v-for="book in booksStore.books" :key="book.id" :book="book" />
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-[#131b2e] rounded-2xl p-12 border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-4 max-w-md mx-auto my-8 transition-colors duration-200">
      <div class="inline-flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
        <BookOpen class="w-10 h-10" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Nenhum livro encontrado</h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
          <span v-if="searchQuery || selectedTag || activeTab">
            Não encontramos livros com os filtros aplicados.
          </span>
          <span v-else>
            Sua estante ainda está vazia! Comece adicionando seu primeiro livro.
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
          to="/livros/novo"
          class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          <Plus class="w-4 h-4" />
          Adicionar Livro
        </RouterLink>
      </div>
    </div>
  </div>
</template>
