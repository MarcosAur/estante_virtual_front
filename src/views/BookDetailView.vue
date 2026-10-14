<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useBooksStore } from '@/stores/books';
import { reviewsApi } from '@/api/reviews';
import StarRating from '@/components/StarRating.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import type { BookStatus } from '@/types';
import {
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-vue-next';

const booksStore = useBooksStore();
const route = useRoute();
const router = useRouter();

const bookId = route.params.id as string;
const book = computed(() => booksStore.currentBook);

// Reading progress editing state
const isUpdatingProgress = ref(false);
const editCurrentPage = ref(0);
const editStatus = ref<BookStatus>('want_to_read');
const editFinishedAt = ref('');

// Review editing state
const isWritingReview = ref(false);
const reviewRating = ref(5.0);
const reviewTitle = ref('');
const reviewBody = ref('');
const reviewSpoiler = ref(false);
const savingReview = ref(false);
const showSpoiler = ref(false);

// Cover upload state
const fileInput = ref<HTMLInputElement | null>(null);
const uploadingCover = ref(false);

const statusOptions: { value: BookStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Quero ler' },
  { value: 'reading', label: 'Lendo' },
  { value: 'read', label: 'Lido' },
];

onMounted(async () => {
  await loadBook();
});

async function loadBook() {
  const loaded = await booksStore.fetchBook(bookId);
  if (loaded) {
    editCurrentPage.value = loaded.current_page;
    editStatus.value = loaded.status;
    editFinishedAt.value = loaded.finished_at || '';
    if (loaded.review) {
      reviewRating.value = loaded.review.rating;
      reviewTitle.value = loaded.review.title || '';
      reviewBody.value = loaded.review.body;
      reviewSpoiler.value = loaded.review.has_spoiler;
    }
  }
}

async function handleQuickStatusChange(newStatus: BookStatus) {
  editStatus.value = newStatus;
  await booksStore.updateProgress(bookId, {
    current_page: editCurrentPage.value,
    status: newStatus,
  });
}

async function saveProgress() {
  await booksStore.updateProgress(bookId, {
    current_page: editCurrentPage.value,
    status: editStatus.value,
    finished_at: editFinishedAt.value || undefined,
  });
  isUpdatingProgress.value = false;
  await loadBook();
}

function triggerCoverUpload() {
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
  uploadingCover.value = true;
  try {
    await booksStore.uploadCover(bookId, file);
    await loadBook();
  } finally {
    uploadingCover.value = false;
  }
}

async function handleSaveReview() {
  if (!reviewBody.value.trim()) return;
  savingReview.value = true;
  try {
    await reviewsApi.saveBookReview(bookId, {
      rating: reviewRating.value,
      title: reviewTitle.value || undefined,
      body: reviewBody.value,
      has_spoiler: reviewSpoiler.value,
    });
    isWritingReview.value = false;
    await loadBook();
  } finally {
    savingReview.value = false;
  }
}

async function handleDeleteReview() {
  if (!confirm('Deseja realmente excluir sua resenha?')) return;
  await reviewsApi.deleteBookReview(bookId);
  await loadBook();
}

async function handleDeleteBook() {
  if (!confirm('Tem certeza de que deseja remover este livro da sua estante?')) return;
  await booksStore.deleteBook(bookId);
  router.push('/estante');
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Back button -->
    <RouterLink
      to="/estante"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-[#94a3b8] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Voltar para a Estante
    </RouterLink>

    <div v-if="booksStore.loading && !book" class="animate-pulse bg-white dark:bg-[#131b2e] p-8 rounded-2xl h-96"></div>

    <div v-else-if="book" class="space-y-8">
      <!-- Main Book Banner -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs flex flex-col md:flex-row gap-8 transition-colors duration-200">
        <!-- Left: Cover + Upload -->
        <div class="w-full md:w-56 shrink-0 flex flex-col items-center">
          <div class="relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-slate-100 dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#1e293b]">
            <img
              v-if="book.cover_url"
              :src="book.cover_url"
              :alt="book.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#064e3b] via-[#0f172a] to-[#0b1326] text-white text-center"
            >
              <div class="text-[10px] uppercase tracking-wider text-emerald-300 font-medium">BookTrack</div>
              <div>
                <div class="font-bold text-base leading-snug line-clamp-4">{{ book.title }}</div>
                <div class="text-xs text-slate-300 mt-1 line-clamp-2">{{ book.author }}</div>
              </div>
              <div class="text-[10px] text-emerald-400">{{ book.year || '' }}</div>
            </div>
          </div>

          <!-- Cover upload button -->
          <input
            ref="fileInput"
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            class="hidden"
            @change="onFileSelected"
          />
          <button
            @click="triggerCoverUpload"
            :disabled="uploadingCover"
            class="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
          >
            <Upload class="w-3.5 h-3.5" />
            <span v-if="uploadingCover">Enviando foto...</span>
            <span v-else>Alterar foto (≤ 5MB)</span>
          </button>
        </div>

        <!-- Center & Right: Book Info & Shelf Progress -->
        <div class="flex-1 flex flex-col justify-between space-y-6">
          <div>
            <div class="flex justify-between items-start gap-4">
              <div>
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#f8fafc] tracking-tight leading-tight">
                  {{ book.title }}
                </h1>
                <p class="text-base text-slate-600 dark:text-[#94a3b8] font-medium mt-1">por {{ book.author }}</p>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-2">
                <RouterLink
                  :to="`/livros/${book.id}/editar`"
                  class="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-lg transition-colors"
                  title="Editar livro"
                >
                  <Edit2 class="w-4 h-4" />
                </RouterLink>
                <button
                  @click="handleDeleteBook"
                  class="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Remover da estante"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="book.tags && book.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="tag in book.tags"
                :key="tag.id"
                class="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40"
              >
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Shelf Status & Reading Progress Card -->
          <div class="bg-slate-50 dark:bg-[#1e293b]/70 rounded-xl p-4 border border-slate-200 dark:border-[#31394d] space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Status na Estante:</span>
                <select
                  :value="book.status"
                  @change="(e: any) => handleQuickStatusChange(e.target.value)"
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-800 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
                >
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <button
                @click="isUpdatingProgress = !isUpdatingProgress"
                class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {{ isUpdatingProgress ? 'Fechar progresso' : 'Atualizar página / datas' }}
              </button>
            </div>

            <!-- Progress Bar -->
            <div v-if="book.pages > 0">
              <ProgressBar :current="book.current_page" :total="book.pages" />
            </div>

            <!-- Expandable Progress form -->
            <div v-if="isUpdatingProgress" class="pt-3 border-t border-slate-200 dark:border-[#31394d] space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-300">Página atual</label>
                  <input
                    v-model.number="editCurrentPage"
                    type="number"
                    min="0"
                    :max="book.pages || 9999"
                    class="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                  <select
                    v-model="editStatus"
                    class="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
                  >
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-300">Data de conclusão</label>
                  <input
                    v-model="editFinishedAt"
                    type="date"
                    class="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  @click="saveProgress"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salvar Progresso
                </button>
              </div>
            </div>
          </div>

          <!-- Metadata details list -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 dark:text-[#94a3b8] pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <div v-if="book.pages">
              <span class="text-slate-400 dark:text-[#64748b] block">Páginas:</span>
              <span class="font-medium text-slate-800 dark:text-[#f8fafc]">{{ book.pages }}</span>
            </div>
            <div v-if="book.year">
              <span class="text-slate-400 dark:text-[#64748b] block">Ano:</span>
              <span class="font-medium text-slate-800 dark:text-[#f8fafc]">{{ book.year }}</span>
            </div>
            <div v-if="book.publisher">
              <span class="text-slate-400 dark:text-[#64748b] block">Editora:</span>
              <span class="font-medium text-slate-800 dark:text-[#f8fafc]">{{ book.publisher }}</span>
            </div>
            <div v-if="book.isbn">
              <span class="text-slate-400 dark:text-[#64748b] block">ISBN:</span>
              <span class="font-medium text-slate-800 dark:text-[#f8fafc]">{{ book.isbn }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Synopsis Section -->
      <div v-if="book.synopsis" class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-3 transition-colors duration-200">
        <h2 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Sinopse</h2>
        <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ book.synopsis }}</p>
      </div>

      <!-- Review Section (Skoob style private review) -->
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-6 transition-colors duration-200">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-[#f8fafc]">Minha Resenha Particular</h2>
            <p class="text-xs text-slate-500 dark:text-[#94a3b8]">100% privada e visível apenas para você</p>
          </div>

          <div v-if="book.review && !isWritingReview" class="flex items-center gap-2">
            <button
              @click="isWritingReview = true"
              class="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
            >
              Editar Resenha
            </button>
            <button
              @click="handleDeleteReview"
              class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="Excluir resenha"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Review Form when writing / editing -->
        <div v-if="isWritingReview || !book.review" class="space-y-4 bg-slate-50 dark:bg-[#1e293b]/70 p-5 rounded-xl border border-slate-200 dark:border-[#31394d]">
          <h3 class="text-sm font-bold text-slate-800 dark:text-[#f8fafc]">
            {{ book.review ? 'Editar Resenha' : 'Escrever Resenha' }}
          </h3>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sua Avaliação (1 a 5 estrelas)</label>
            <StarRating v-model="reviewRating" size="lg" />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Título da resenha (opcional)</label>
            <input
              v-model="reviewTitle"
              type="text"
              placeholder="Ex: Uma reflexão marcante..."
              class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Texto da resenha *</label>
            <textarea
              v-model="reviewBody"
              rows="4"
              required
              placeholder="Escreva suas impressões, passagens favoritas, sentimentos sobre a obra..."
              class="w-full px-3 py-2 text-sm border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="spoiler"
              v-model="reviewSpoiler"
              type="checkbox"
              class="rounded border-slate-300 dark:border-[#31394d] text-emerald-600 focus:ring-emerald-500"
            />
            <label for="spoiler" class="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
              Contém spoilers
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              v-if="book.review"
              @click="isWritingReview = false"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#131b2e] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="handleSaveReview"
              :disabled="savingReview || !reviewBody.trim()"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <span v-if="savingReview">Salvando...</span>
              <span v-else>Salvar Resenha</span>
            </button>
          </div>
        </div>

        <!-- Render existing review -->
        <div v-else-if="book.review" class="space-y-4">
          <div class="flex items-center gap-3">
            <StarRating :model-value="book.review.rating" readonly size="md" />
            <span
              v-if="book.review.has_spoiler"
              class="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1"
            >
              <AlertTriangle class="w-3 h-3" />
              Contém Spoiler
            </span>
          </div>

          <h3 v-if="book.review.title" class="font-bold text-slate-900 dark:text-[#f8fafc] text-base">
            {{ book.review.title }}
          </h3>

          <!-- Spoiler blur toggle -->
          <div v-if="book.review.has_spoiler && !showSpoiler" class="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-center space-y-2">
            <p class="text-xs text-amber-800 dark:text-amber-300 font-medium">Esta resenha contém spoilers ocultos para sua proteção.</p>
            <button
              @click="showSpoiler = true"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5" />
              Exibir resenha com spoilers
            </button>
          </div>

          <div v-else class="space-y-2">
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {{ book.review.body }}
            </p>
            <button
              v-if="book.review.has_spoiler"
              @click="showSpoiler = false"
              class="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 pt-1 cursor-pointer"
            >
              <EyeOff class="w-3 h-3" />
              Ocultar spoiler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
