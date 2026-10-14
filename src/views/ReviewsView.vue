<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { reviewsApi } from '@/api/reviews';
import type { Review } from '@/types';
import StarRating from '@/components/StarRating.vue';
import { Star, AlertTriangle, ArrowRight } from 'lucide-vue-next';

const reviews = ref<Review[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await reviewsApi.getReviews();
    reviews.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] tracking-tight">Minhas Resenhas</h1>
      <p class="text-sm text-slate-500 dark:text-[#94a3b8]">Todas as suas opiniões e notas registradas de forma privada</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-white dark:bg-[#131b2e] p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] h-36"></div>
    </div>

    <div v-else-if="reviews.length > 0" class="space-y-4">
      <div
        v-for="review in reviews"
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

        <!-- Book reference side box -->
        <div v-if="review.book" class="w-full md:w-56 shrink-0 bg-slate-50 dark:bg-[#1e293b]/70 p-4 rounded-xl border border-slate-200 dark:border-[#31394d] flex flex-col justify-between gap-3">
          <div>
            <div class="text-[10px] font-bold text-slate-400 dark:text-[#64748b] uppercase tracking-wider">Livro avaliado</div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-[#f8fafc] line-clamp-2 mt-1">{{ review.book.title }}</h4>
            <p class="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-1">{{ review.book.author }}</p>
          </div>

          <RouterLink
            :to="`/livros/${review.book.id}`"
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
        <h3 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Nenhuma resenha ainda</h3>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
          Ao terminar de ler ou durante a leitura, adicione suas impressões nos livros da sua estante.
        </p>
      </div>
      <div class="pt-2">
        <RouterLink
          to="/estante"
          class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          Ir para Minha Estante
        </RouterLink>
      </div>
    </div>
  </div>
</template>
