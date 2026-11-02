<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Movie } from '@/types';
import StarRating from './StarRating.vue';
import AuthImage from './AuthImage.vue';

const props = defineProps<{
  movie: Movie;
}>();

const statusLabels: Record<string, { label: string; class: string }> = {
  watching: {
    label: 'Assistindo',
    class: 'bg-[#ecfdf5] text-[#065f46] border-emerald-200 dark:bg-[rgba(16,185,129,0.18)] dark:text-[#34d399] dark:border-emerald-500/30',
  },
  want_to_watch: {
    label: 'Quero assistir',
    class: 'bg-[#e0f2fe] text-[#0369a1] border-sky-200 dark:bg-[rgba(56,189,248,0.18)] dark:text-[#38bdf8] dark:border-sky-500/30',
  },
  watched: {
    label: 'Assistido',
    class: 'bg-[#d1fae5] text-[#065f46] border-emerald-300 dark:bg-[rgba(5,150,105,0.25)] dark:text-[#34d399] dark:border-emerald-600/40',
  },
};

const statusInfo = computed(() => {
  return statusLabels[props.movie.status] || {
    label: props.movie.status,
    class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700',
  };
});

const posterSrc = computed(() => {
  return props.movie.poster_url || null;
});

const formattedRuntime = computed(() => {
  if (!props.movie.runtime_minutes) return null;
  const hours = Math.floor(props.movie.runtime_minutes / 60);
  const minutes = props.movie.runtime_minutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
  }
  return `${minutes} min`;
});
</script>

<template>
  <RouterLink
    :to="`/filmes/${movie.id}`"
    class="group flex flex-col bg-white dark:bg-[#131b2e] rounded-xl shadow-xs border border-[#e2e8f0] dark:border-[#1e293b] overflow-hidden hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200"
  >
    <!-- Poster Container -->
    <div class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-[#1e293b] flex items-center justify-center overflow-hidden border-b border-[#e2e8f0] dark:border-[#1e293b]">
      <AuthImage
        v-if="posterSrc"
        :src="posterSrc"
        :alt="movie.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <!-- Placeholder when no poster exists -->
      <div
        v-else
        class="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#090d16] text-white text-center select-none"
      >
        <div class="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">Cinema</div>
        <div class="my-auto">
          <div class="font-bold text-sm line-clamp-3 leading-snug">{{ movie.title }}</div>
          <div class="text-xs text-slate-300 mt-1 line-clamp-1">{{ movie.director || movie.genre || '' }}</div>
        </div>
        <div class="text-[10px] text-emerald-400">{{ movie.year || '' }}</div>
      </div>

      <!-- Status badge overlay -->
      <span
        class="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-semibold rounded-full border shadow-xs backdrop-blur-xs"
        :class="statusInfo.class"
      >
        {{ statusInfo.label }}
      </span>
    </div>

    <!-- Movie Info -->
    <div class="p-3.5 flex flex-col flex-1 justify-between gap-2">
      <div>
        <h3 class="font-semibold text-slate-900 dark:text-[#f8fafc] text-sm leading-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ movie.title }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-1 mt-0.5">
          {{ [movie.director, movie.year].filter(Boolean).join(' • ') }}
        </p>
      </div>

      <!-- Rating and runtime -->
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div v-if="movie.review" class="flex items-center">
          <StarRating :model-value="movie.review.rating" readonly size="sm" />
        </div>
        <span v-else class="text-[11px] text-slate-400">Sem resenha</span>

        <span v-if="formattedRuntime" class="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {{ formattedRuntime }}
        </span>
      </div>

      <!-- Tags preview if any -->
      <div v-if="movie.tags && movie.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
        <span
          v-for="t in movie.tags.slice(0, 2)"
          :key="t.id"
          class="text-[10px] px-1.5 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
        >
          {{ t.name }}
        </span>
        <span v-if="movie.tags.length > 2" class="text-[10px] text-slate-400 self-center">
          +{{ movie.tags.length - 2 }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
