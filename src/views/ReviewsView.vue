<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { reviewsApi } from '@/api/reviews';
import { movieReviewsApi } from '@/api/movieReviews';
import type { Review, MovieReview } from '@/types';
import StarRating from '@/components/StarRating.vue';
import { Star, AlertTriangle, ArrowRight, BookOpen, Film } from 'lucide-vue-next';

type CombinedReview = {
  type: 'book' | 'movie';
  id: string;
  rating: number;
  title: string | null;
  body: string;
  has_spoiler: boolean;
  created_at: string;
  targetId: string;
  targetTitle: string;
  targetSubtitle?: string | null;
};

const bookReviews = ref<Review[]>([]);
const movieReviews = ref<MovieReview[]>([]);
const activeFilter = ref<'all' | 'books' | 'movies'>('all');
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const [bRes, mRes] = await Promise.all([
      reviewsApi.getReviews().catch(() => ({ data: [] })),
      movieReviewsApi.getReviews().catch(() => ({ data: [] })),
    ]);
    bookReviews.value = bRes.data || [];
    movieReviews.value = mRes.data || [];
  } finally {
    loading.value = false;
  }
});

const combinedReviews = computed<CombinedReview[]>(() => {
  const list: CombinedReview[] = [];

  if (activeFilter.value === 'all' || activeFilter.value === 'books') {
    bookReviews.value.forEach((r) => {
      list.push({
        type: 'book',
        id: `book-${r.id}`,
        rating: r.rating,
        title: r.title,
        body: r.body,
        has_spoiler: r.has_spoiler,
        created_at: r.created_at,
        targetId: r.book?.id || r.book_id,
        targetTitle: r.book?.title || 'Livro',
        targetSubtitle: r.book?.author,
      });
    });
  }

  if (activeFilter.value === 'all' || activeFilter.value === 'movies') {
    movieReviews.value.forEach((r) => {
      list.push({
        type: 'movie',
        id: `movie-${r.id}`,
        rating: r.rating,
        title: r.title,
        body: r.body,
        has_spoiler: r.has_spoiler,
        created_at: r.created_at,
        targetId: r.movie?.id || r.movie_id,
        targetTitle: r.movie?.title || 'Filme',
        targetSubtitle: r.movie?.director,
      });
    });
  }

  // Ordenar por data decrescente
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">Minhas Resenhas</h1>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8]">Todas as suas opiniões e notas registradas de forma privada</p>
      </div>

      <!-- Filter tabs (Todos / Livros / Filmes) -->
      <div class="flex p-1 bg-slate-100 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-[#31394d]">
        <button
          @click="activeFilter = 'all'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          :class="activeFilter === 'all' ? 'bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
        >
          Todos ({{ bookReviews.length + movieReviews.length }})
        </button>
        <button
          @click="activeFilter = 'books'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          :class="activeFilter === 'books' ? 'bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
        >
          <BookOpen class="w-3.5 h-3.5" />
          Livros ({{ bookReviews.length }})
        </button>
        <button
          @click="activeFilter = 'movies'"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          :class="activeFilter === 'movies' ? 'bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'"
        >
          <Film class="w-3.5 h-3.5" />
          Filmes ({{ movieReviews.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-white dark:bg-[#131b2e] p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] h-36"></div>
    </div>

    <div v-else-if="combinedReviews.length > 0" class="space-y-4">
      <div
        v-for="review in combinedReviews"
        :key="review.id"
        class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col md:flex-row justify-between gap-6 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors duration-200"
      >
        <div class="space-y-3 flex-1">
          <div class="flex items-center gap-3">
            <StarRating :model-value="review.rating" readonly size="md" />
            <span
              v-if="review.has_spoiler"
              class="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1"
            >
              <AlertTriangle class="w-3 h-3" />
              Contém Spoiler
            </span>
            <span class="text-xs text-slate-400 dark:text-[#64748b]">
              {{ new Date(review.created_at).toLocaleDateString('pt-BR') }}
            </span>
          </div>

          <h3 v-if="review.title" class="font-bold text-slate-900 dark:text-[#f8fafc] text-base">
            {{ review.title }}
          </h3>

          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
            {{ review.body }}
          </p>
        </div>

        <!-- Reference side box -->
        <div class="w-full md:w-56 shrink-0 bg-slate-50 dark:bg-[#1e293b]/70 p-4 rounded-xl border border-slate-200 dark:border-[#31394d] flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-[#64748b] uppercase tracking-wider">
              <BookOpen v-if="review.type === 'book'" class="w-3.5 h-3.5 text-emerald-500" />
              <Film v-else class="w-3.5 h-3.5 text-sky-500" />
              <span>{{ review.type === 'book' ? 'Livro avaliado' : 'Filme avaliado' }}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-[#f8fafc] line-clamp-2 mt-1">{{ review.targetTitle }}</h4>
            <p v-if="review.targetSubtitle" class="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-1">{{ review.targetSubtitle }}</p>
          </div>

          <RouterLink
            :to="review.type === 'book' ? `/livros/${review.targetId}` : `/filmes/${review.targetId}`"
            class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Ver detalhes
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white dark:bg-[#131b2e] rounded-2xl p-12 border border-[#e2e8f0] dark:border-[#1e293b] text-center space-y-4 max-w-md mx-auto my-8 transition-colors duration-200">
      <div class="inline-flex items-center justify-center p-4 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
        <Star class="w-10 h-10" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Nenhuma resenha encontrada</h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
          Ao terminar de ler um livro ou assistir um filme, registre suas avaliações e impressões.
        </p>
      </div>
      <div class="pt-2 flex justify-center gap-2">
        <RouterLink
          to="/estante"
          class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          Livros
        </RouterLink>
        <RouterLink
          to="/filmes"
          class="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          Filmes
        </RouterLink>
      </div>
    </div>
  </div>
</template>
