<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useMoviesStore } from '@/stores/movies';
import { movieReviewsApi } from '@/api/movieReviews';
import StarRating from '@/components/StarRating.vue';
import AuthImage from '@/components/AuthImage.vue';
import type { MovieStatus } from '@/types';
import {
  Upload,
  Edit2,
  Trash2,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  Film,
} from 'lucide-vue-next';

const moviesStore = useMoviesStore();
const route = useRoute();
const router = useRouter();

const movieId = route.params.id as string;
const movie = computed(() => moviesStore.currentMovie);

// Status editing
const editStatus = ref<MovieStatus>('want_to_watch');
const editWatchedAt = ref('');

// Review editing state
const isWritingReview = ref(false);
const reviewRating = ref(5.0);
const reviewTitle = ref('');
const reviewBody = ref('');
const reviewSpoiler = ref(false);
const savingReview = ref(false);
const showSpoiler = ref(false);

// Poster upload state
const fileInput = ref<HTMLInputElement | null>(null);
const uploadingPoster = ref(false);

const statusOptions: { value: MovieStatus; label: string }[] = [
  { value: 'want_to_watch', label: 'Quero assistir' },
  { value: 'watching', label: 'Assistindo' },
  { value: 'watched', label: 'Assistido' },
];

onMounted(async () => {
  await loadMovie();
});

async function loadMovie() {
  const loaded = await moviesStore.fetchMovie(movieId);
  if (loaded) {
    editStatus.value = loaded.status;
    editWatchedAt.value = loaded.watched_at || '';
    if (loaded.review) {
      reviewRating.value = loaded.review.rating;
      reviewTitle.value = loaded.review.title || '';
      reviewBody.value = loaded.review.body;
      reviewSpoiler.value = loaded.review.has_spoiler;
    }
  }
}

async function handleQuickStatusChange(newStatus: MovieStatus) {
  editStatus.value = newStatus;
  await moviesStore.updateStatus(movieId, {
    status: newStatus,
    watched_at: newStatus === 'watched' ? (editWatchedAt.value || new Date().toISOString().split('T')[0]) : undefined,
  });
  await loadMovie();
}

function triggerPosterUpload() {
  fileInput.value?.click();
}

async function onFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  const file = files[0];
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const validExtensions = /\.(png|jpe?g)$/i;

  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    alert('Formato inválido. Apenas fotos em PNG, JPG ou JPEG são permitidas.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('A foto deve ter tamanho máximo de 5 MB.');
    return;
  }
  uploadingPoster.value = true;
  try {
    await moviesStore.uploadPoster(movieId, file);
    await loadMovie();
  } finally {
    uploadingPoster.value = false;
  }
}

async function handleSaveReview() {
  if (!reviewBody.value.trim()) return;
  savingReview.value = true;
  try {
    await movieReviewsApi.saveMovieReview(movieId, {
      rating: reviewRating.value,
      title: reviewTitle.value || undefined,
      body: reviewBody.value,
      has_spoiler: reviewSpoiler.value,
    });
    isWritingReview.value = false;
    await loadMovie();
  } finally {
    savingReview.value = false;
  }
}

async function handleDeleteReview() {
  if (!confirm('Deseja realmente excluir sua resenha deste filme?')) return;
  await movieReviewsApi.deleteMovieReview(movieId);
  await loadMovie();
}

async function handleDeleteMovie() {
  if (!confirm('Tem certeza de que deseja remover este filme da sua cineclube?')) return;
  await moviesStore.deleteMovie(movieId);
  router.push('/filmes');
}

const formattedRuntime = computed(() => {
  if (!movie.value?.runtime_minutes) return null;
  const hours = Math.floor(movie.value.runtime_minutes / 60);
  const minutes = movie.value.runtime_minutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''} (${movie.value.runtime_minutes} min)`;
  }
  return `${minutes} min`;
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Back button -->
    <RouterLink
      to="/filmes"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-[#94a3b8] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Voltar para Filmes
    </RouterLink>

    <div v-if="moviesStore.loading && !movie" class="animate-pulse bg-white dark:bg-[#131b2e] p-8 rounded-2xl h-96"></div>

    <div v-else-if="movie" class="space-y-8">
      <!-- Main Movie Banner -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col md:flex-row gap-8 transition-colors duration-200">
        <!-- Left: Poster + Upload -->
        <div class="w-full md:w-56 shrink-0 flex flex-col items-center">
          <div class="relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#1e293b]">
            <AuthImage
              v-if="movie.poster_url"
              :src="movie.poster_url"
              :alt="movie.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#090d16] text-white text-center"
            >
              <div class="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">Cinema</div>
              <div>
                <div class="font-bold text-base leading-snug line-clamp-4">{{ movie.title }}</div>
                <div class="text-xs text-slate-300 mt-1 line-clamp-2">{{ movie.director }}</div>
              </div>
              <div class="text-[10px] text-emerald-400">{{ movie.year || '' }}</div>
            </div>
          </div>

          <!-- Poster upload button -->
          <div class="mt-4 flex flex-col items-center gap-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              class="hidden"
              @change="onFileSelected"
            />
            <button
              @click="triggerPosterUpload"
              :disabled="uploadingPoster"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#31394d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
            >
              <Upload class="w-3.5 h-3.5" />
              {{ uploadingPoster ? 'Enviando...' : (movie.poster_path ? 'Trocar Pôster' : 'Adicionar Pôster') }}
            </button>
          </div>
        </div>

        <!-- Right: Movie Details -->
        <div class="flex-1 flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <!-- Header title + actions -->
            <div class="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#f8fafc] leading-tight">
                  {{ movie.title }}
                </h1>
                <p v-if="movie.director" class="text-base text-slate-600 dark:text-[#94a3b8] font-medium mt-1">
                  Direção por <span class="text-slate-900 dark:text-[#f8fafc]">{{ movie.director }}</span>
                </p>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-2 shrink-0">
                <RouterLink
                  :to="`/filmes/${movie.id}/editar`"
                  class="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg transition-colors"
                  title="Editar filme"
                >
                  <Edit2 class="w-4 h-4" />
                </RouterLink>
                <button
                  @click="handleDeleteMovie"
                  class="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="Excluir filme"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Meta details (year, runtime, genre) -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span v-if="movie.year" class="flex items-center gap-1 font-medium">
                <Calendar class="w-4 h-4 text-emerald-500" />
                {{ movie.year }}
              </span>
              <span v-if="formattedRuntime" class="flex items-center gap-1 font-medium">
                <Clock class="w-4 h-4 text-emerald-500" />
                {{ formattedRuntime }}
              </span>
              <span v-if="movie.genre" class="flex items-center gap-1 font-medium">
                <Film class="w-4 h-4 text-emerald-500" />
                {{ movie.genre }}
              </span>
            </div>

            <!-- Tags -->
            <div v-if="movie.tags && movie.tags.length > 0" class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tag in movie.tags"
                :key="tag.id"
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
              >
                #{{ tag.name }}
              </span>
            </div>

            <!-- Synopsis -->
            <div v-if="movie.synopsis" class="pt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Sinopse</h3>
              <p class="whitespace-pre-line">{{ movie.synopsis }}</p>
            </div>
          </div>

          <!-- Status Selector Bar -->
          <div class="border-t border-[#e2e8f0] dark:border-[#1e293b] pt-5 space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status do Filme
              </label>
              <span v-if="movie.status === 'watched' && movie.watched_at" class="text-xs text-slate-500 dark:text-slate-400">
                Assistido em: <strong>{{ movie.watched_at }}</strong>
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                @click="handleQuickStatusChange(opt.value)"
                type="button"
                class="py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all text-center"
                :class="[
                  movie.status === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#31394d] hover:border-slate-300 dark:hover:border-slate-600'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Private Review Section -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-6 transition-colors duration-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Minha Avaliação & Resenha Privada</h2>
            <p class="text-xs text-slate-500 dark:text-[#94a3b8]">Apenas você tem acesso a estas anotações e resenhas</p>
          </div>

          <!-- Toggle write review if not editing and already has review -->
          <div v-if="movie.review && !isWritingReview" class="flex items-center gap-2">
            <button
              @click="isWritingReview = true"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#31394d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
            >
              <Edit2 class="w-3.5 h-3.5" />
              Editar Resenha
            </button>
            <button
              @click="handleDeleteReview"
              class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Excluir resenha"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Display Existing Review -->
        <div v-if="movie.review && !isWritingReview" class="space-y-4">
          <div class="flex items-center gap-3">
            <StarRating :model-value="movie.review.rating" readonly size="lg" />
            <span class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">
              {{ movie.review.rating.toFixed(1) }} <span class="text-sm font-normal text-slate-400">/ 5.0</span>
            </span>
            <span
              v-if="movie.review.has_spoiler"
              class="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
            >
              Contém Spoilers
            </span>
          </div>

          <div v-if="movie.review.title" class="font-bold text-base text-slate-900 dark:text-[#f8fafc]">
            {{ movie.review.title }}
          </div>

          <!-- Spoiler alert toggle -->
          <div v-if="movie.review.has_spoiler && !showSpoiler" class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
            <span class="text-xs text-amber-800 dark:text-amber-300 font-medium">Esta resenha contém spoilers do enredo.</span>
            <button
              @click="showSpoiler = true"
              class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
            >
              <Eye class="w-3.5 h-3.5" />
              Ver mesmo assim
            </button>
          </div>

          <!-- Review Body text -->
          <div
            v-if="!movie.review.has_spoiler || showSpoiler"
            class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed"
          >
            {{ movie.review.body }}
          </div>
          <button
            v-if="movie.review.has_spoiler && showSpoiler"
            @click="showSpoiler = false"
            class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <EyeOff class="w-3.5 h-3.5" />
            Ocultar spoilers
          </button>
        </div>

        <!-- Review Form (Creating or Editing) -->
        <div v-else class="space-y-4 pt-2">
          <!-- Star Rating Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sua Nota</label>
            <div class="flex items-center gap-3">
              <StarRating v-model="reviewRating" size="lg" />
              <span class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">{{ reviewRating.toFixed(1) }}</span>
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título da resenha (opcional)</label>
            <input
              v-model="reviewTitle"
              type="text"
              placeholder="Ex: Obra-prima do cinema moderno"
              class="w-full px-3 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Texto da resenha <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="reviewBody"
              rows="4"
              placeholder="Escreva suas impressões sobre o filme, atuações, direção, etc..."
              class="w-full px-3 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            ></textarea>
          </div>

          <!-- Spoiler checkbox -->
          <div class="flex items-center gap-2">
            <input
              id="spoiler-check"
              v-model="reviewSpoiler"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 dark:border-[#31394d] focus:ring-emerald-500"
            />
            <label for="spoiler-check" class="text-xs text-slate-700 dark:text-slate-300 select-none">
              Esta resenha contém revelações importantes do filme (Spoilers)
            </label>
          </div>

          <!-- Form actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              @click="handleSaveReview"
              :disabled="savingReview || !reviewBody.trim()"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {{ savingReview ? 'Salvando...' : 'Salvar Resenha' }}
            </button>
            <button
              v-if="movie.review"
              @click="isWritingReview = false"
              type="button"
              class="px-4 py-2 border border-slate-300 dark:border-[#31394d] text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
