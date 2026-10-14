<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Book } from '@/types';
import StarRating from './StarRating.vue';
import ProgressBar from './ProgressBar.vue';

const props = defineProps<{
  book: Book;
}>();

const statusLabels: Record<string, { label: string; class: string }> = {
  reading: {
    label: 'Lendo',
    class: 'bg-[#ecfdf5] text-[#065f46] border-emerald-200 dark:bg-[rgba(16,185,129,0.18)] dark:text-[#34d399] dark:border-emerald-500/30',
  },
  want_to_read: {
    label: 'Quero ler',
    class: 'bg-[#e0f2fe] text-[#0369a1] border-sky-200 dark:bg-[rgba(56,189,248,0.18)] dark:text-[#38bdf8] dark:border-sky-500/30',
  },
  read: {
    label: 'Lido',
    class: 'bg-[#d1fae5] text-[#065f46] border-emerald-300 dark:bg-[rgba(5,150,105,0.25)] dark:text-[#34d399] dark:border-emerald-600/40',
  },
};

const statusInfo = computed(() => {
  return statusLabels[props.book.status] || {
    label: props.book.status,
    class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1e293b] dark:text-slate-300 dark:border-slate-700',
  };
});

const coverSrc = computed(() => {
  if (props.book.cover_url) {
    return props.book.cover_url;
  }
  return null;
});
</script>

<template>
  <RouterLink
    :to="`/livros/${book.id}`"
    class="group flex flex-col bg-white dark:bg-[#131b2e] rounded-xl shadow-xs border border-[#e2e8f0] dark:border-[#1e293b] overflow-hidden hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200"
  >
    <!-- Cover Container -->
    <div class="relative w-full aspect-[2/3] bg-slate-100 dark:bg-[#1e293b] flex items-center justify-center overflow-hidden border-b border-[#e2e8f0] dark:border-[#1e293b]">
      <img
        v-if="coverSrc"
        :src="coverSrc"
        :alt="book.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <!-- Placeholder when no cover exists -->
      <div
        v-else
        class="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#064e3b] via-[#0f172a] to-[#0b1326] text-white text-center select-none"
      >
        <div class="text-[10px] uppercase tracking-wider text-emerald-300 font-medium">BookTrack</div>
        <div class="my-auto">
          <div class="font-bold text-sm line-clamp-3 leading-snug">{{ book.title }}</div>
          <div class="text-xs text-slate-300 mt-1 line-clamp-1">{{ book.author }}</div>
        </div>
        <div class="text-[10px] text-emerald-400">{{ book.year || '' }}</div>
      </div>

      <!-- Status badge overlay -->
      <span
        class="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-semibold rounded-full border shadow-xs backdrop-blur-xs"
        :class="statusInfo.class"
      >
        {{ statusInfo.label }}
      </span>
    </div>

    <!-- Book Info -->
    <div class="p-3.5 flex flex-col flex-1 justify-between gap-2">
      <div>
        <h3 class="font-semibold text-slate-900 dark:text-[#f8fafc] text-sm leading-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {{ book.title }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-1 mt-0.5">{{ book.author }}</p>
      </div>

      <!-- Rating if reviewed -->
      <div v-if="book.review" class="flex items-center">
        <StarRating :model-value="book.review.rating" readonly size="sm" />
      </div>

      <!-- Reading Progress -->
      <div v-if="book.status === 'reading' && book.pages > 0" class="pt-1">
        <ProgressBar :current="book.current_page" :total="book.pages" />
      </div>

      <!-- Tags list -->
      <div v-if="book.tags && book.tags.length > 0" class="flex flex-wrap gap-1 pt-1">
        <span
          v-for="tag in book.tags.slice(0, 2)"
          :key="tag.id"
          class="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300"
        >
          #{{ tag.name }}
        </span>
        <span v-if="book.tags.length > 2" class="text-[10px] text-slate-400 dark:text-slate-500 self-center">
          +{{ book.tags.length - 2 }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
