<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { moviesApi } from '@/api/movies';
import { tagsApi } from '@/api/tags';
import { useMoviesStore } from '@/stores/movies';
import type { MovieStatus, ExternalMovieLookup, Tag } from '@/types';
import { Search, Sparkles, ArrowLeft, Check, Upload, Trash2, Film } from 'lucide-vue-next';
import AuthImage from '@/components/AuthImage.vue';

const route = useRoute();
const router = useRouter();
const moviesStore = useMoviesStore();

const isEditing = computed(() => !!route.params.id);
const movieId = computed(() => route.params.id as string);

// Form fields
const title = ref('');
const director = ref('');
const year = ref<number | null>(null);
const runtimeMinutes = ref<number>(0);
const genre = ref('');
const status = ref<MovieStatus>('want_to_watch');
const synopsis = ref('');
const tmdbId = ref<string | null>(null);
const selectedTagIds = ref<string[]>([]);

// Poster upload state
const posterFile = ref<File | null>(null);
const posterPreviewUrl = ref<string | null>(null);
const existingPosterUrl = ref<string | null>(null);
const externalPosterUrl = ref<string | null>(null);
const removePosterRequested = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const posterError = ref('');
const isDragging = ref(false);

// Lookup state
const lookupQuery = ref('');
const lookupResults = ref<ExternalMovieLookup[]>([]);
const isSearchingLookup = ref(false);
const showLookupResults = ref(false);

// Tags
const availableTags = ref<Tag[]>([]);
const newTagName = ref('');
const creatingTag = ref(false);

const saving = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    availableTags.value = await tagsApi.getTags();
  } catch {}

  if (isEditing.value) {
    const movie = await moviesStore.fetchMovie(movieId.value);
    if (movie) {
      title.value = movie.title;
      director.value = movie.director || '';
      year.value = movie.year;
      runtimeMinutes.value = movie.runtime_minutes || 0;
      genre.value = movie.genre || '';
      status.value = movie.status;
      synopsis.value = movie.synopsis || '';
      tmdbId.value = movie.tmdb_id;
      selectedTagIds.value = movie.tags?.map(t => t.id) || [];
      if (movie.poster_url) {
        existingPosterUrl.value = movie.poster_url;
      }
    }
  }
});

onUnmounted(() => {
  if (posterPreviewUrl.value) {
    URL.revokeObjectURL(posterPreviewUrl.value);
  }
});

function handlePosterFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    validateAndSetPosterFile(file);
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    validateAndSetPosterFile(file);
  }
}

function validateAndSetPosterFile(file: File) {
  posterError.value = '';
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const validExtensions = /\.(png|jpe?g)$/i;

  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    posterError.value = 'Formato inválido. Apenas fotos em formato PNG, JPG ou JPEG são permitidas.';
    if (fileInputRef.value) fileInputRef.value.value = '';
    posterFile.value = null;
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    posterError.value = 'O arquivo selecionado excede o limite de 5 MB. Escolha uma foto de até 5 MB.';
    if (fileInputRef.value) fileInputRef.value.value = '';
    posterFile.value = null;
    return;
  }

  if (posterPreviewUrl.value) {
    URL.revokeObjectURL(posterPreviewUrl.value);
  }

  posterFile.value = file;
  posterPreviewUrl.value = URL.createObjectURL(file);
  externalPosterUrl.value = null;
  removePosterRequested.value = false;
}

function removePoster() {
  if (posterPreviewUrl.value) {
    URL.revokeObjectURL(posterPreviewUrl.value);
    posterPreviewUrl.value = null;
  }
  posterFile.value = null;
  externalPosterUrl.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  if (existingPosterUrl.value) {
    removePosterRequested.value = true;
    existingPosterUrl.value = null;
  }
  posterError.value = '';
}

async function handleSearchLookup() {
  if (!lookupQuery.value.trim()) return;
  isSearchingLookup.value = true;
  showLookupResults.value = true;
  try {
    lookupResults.value = await moviesApi.lookupMovies({
      q: lookupQuery.value.trim(),
    });
  } catch {
    lookupResults.value = [];
  } finally {
    isSearchingLookup.value = false;
  }
}

function applyLookupData(item: ExternalMovieLookup) {
  title.value = item.title;
  if (item.director) director.value = item.director;
  if (item.year) year.value = item.year;
  if (item.runtime_minutes) runtimeMinutes.value = item.runtime_minutes;
  if (item.genre) genre.value = item.genre;
  if (item.synopsis) synopsis.value = item.synopsis;
  if (item.tmdb_id) tmdbId.value = item.tmdb_id;
  if (item.poster_url && !posterFile.value) {
    externalPosterUrl.value = item.poster_url;
  }
  showLookupResults.value = false;
}

async function handleCreateTag() {
  if (!newTagName.value.trim()) return;
  creatingTag.value = true;
  try {
    const created = await tagsApi.createTag({ name: newTagName.value.trim() });
    availableTags.value.push(created);
    selectedTagIds.value.push(created.id);
    newTagName.value = '';
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao criar tag');
  } finally {
    creatingTag.value = false;
  }
}

function toggleTag(tagId: string) {
  const index = selectedTagIds.value.indexOf(tagId);
  if (index === -1) {
    selectedTagIds.value.push(tagId);
  } else {
    selectedTagIds.value.splice(index, 1);
  }
}

async function handleSubmit() {
  if (posterError.value) {
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    const payload: any = {
      title: title.value,
      director: director.value || null,
      year: year.value || null,
      runtime_minutes: runtimeMinutes.value || 0,
      genre: genre.value || null,
      status: status.value,
      synopsis: synopsis.value || null,
      tmdb_id: tmdbId.value || null,
      tag_ids: selectedTagIds.value,
    };

    if (posterFile.value) {
      payload.poster = posterFile.value;
    } else if (externalPosterUrl.value) {
      payload.poster_url = externalPosterUrl.value;
    }

    if (isEditing.value) {
      if (removePosterRequested.value && !posterFile.value && !externalPosterUrl.value) {
        await moviesStore.deletePoster(movieId.value);
      }
      await moviesStore.updateMovie(movieId.value, payload);
      router.push(`/filmes/${movieId.value}`);
    } else {
      const created = await moviesStore.createMovie(payload);
      router.push(`/filmes/${created.id}`);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ocorreu um erro ao salvar o filme. Verifique os dados informados.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <RouterLink
        :to="isEditing ? `/filmes/${movieId}` : '/filmes'"
        class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-[#f8fafc] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
      </RouterLink>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">
          {{ isEditing ? 'Editar Filme' : 'Adicionar Filme' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8]">
          {{ isEditing ? 'Atualize as informações do filme' : 'Cadastre um filme manualmente ou busque via TMDB' }}
        </p>
      </div>
    </div>

    <!-- Smart TMDB Lookup Box (only when creating) -->
    <div v-if="!isEditing" class="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 space-y-3">
      <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
        <Sparkles class="w-4 h-4" />
        Preenchimento Automático via TMDB
      </div>
      <p class="text-xs text-slate-600 dark:text-slate-300">
        Digite o nome do filme para preencher automaticamente título, ano, sinopse, gênero e pôster.
      </p>

      <div class="flex gap-2">
        <div class="relative flex-1">
          <input
            v-model="lookupQuery"
            @keydown.enter.prevent="handleSearchLookup"
            type="text"
            placeholder="Ex: Interestelar, Matrix, O Poderoso Chefão..."
            class="w-full px-3.5 py-2.5 bg-white dark:bg-[#131b2e] border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="button"
          @click="handleSearchLookup"
          :disabled="isSearchingLookup || !lookupQuery.trim()"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          <Search class="w-4 h-4" />
          {{ isSearchingLookup ? 'Buscando...' : 'Buscar' }}
        </button>
      </div>

      <!-- Lookup Results dropdown/cards -->
      <div v-if="showLookupResults && lookupResults.length > 0" class="mt-3 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#1e293b] p-2 max-h-72 overflow-y-auto space-y-1 shadow-md">
        <div
          v-for="res in lookupResults"
          :key="res.tmdb_id"
          @click="applyLookupData(res)"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e293b] cursor-pointer transition-colors"
        >
          <img
            v-if="res.poster_url"
            :src="res.poster_url"
            alt="Capa"
            class="w-10 h-14 object-cover rounded-md bg-slate-100 shrink-0"
          />
          <div v-else class="w-10 h-14 bg-slate-200 dark:bg-[#1e293b] rounded-md flex items-center justify-center shrink-0">
            <Film class="w-5 h-5 text-slate-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-slate-900 dark:text-[#f8fafc] truncate">{{ res.title }}</div>
            <div class="text-xs text-slate-500 dark:text-[#94a3b8] truncate">
              {{ [res.year, res.genre].filter(Boolean).join(' • ') }}
            </div>
          </div>
          <button
            type="button"
            class="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold rounded-md shrink-0"
          >
            Usar
          </button>
        </div>
      </div>
      <div v-else-if="showLookupResults && !isSearchingLookup" class="text-xs text-slate-500 italic mt-2">
        Nenhum filme encontrado. Você pode preencher os campos abaixo manualmente.
      </div>
    </div>

    <!-- Error notice -->
    <div v-if="error" class="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium border border-rose-200">
      {{ error }}
    </div>

    <!-- Main Form -->
    <form @submit.prevent="handleSubmit" class="bg-white dark:bg-[#131b2e] p-6 sm:p-8 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-6 transition-colors duration-200">
      <div class="space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Título do Filme <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            required
            placeholder="Ex: O Poderoso Chefão"
            class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <!-- Director & Year -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Diretor
            </label>
            <input
              v-model="director"
              type="text"
              placeholder="Ex: Francis Ford Coppola"
              class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Ano de Lançamento
            </label>
            <input
              v-model.number="year"
              type="number"
              placeholder="Ex: 1972"
              class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Runtime & Genre -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Duração (em minutos)
            </label>
            <input
              v-model.number="runtimeMinutes"
              type="number"
              min="0"
              placeholder="Ex: 175"
              class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Gênero
            </label>
            <input
              v-model="genre"
              type="text"
              placeholder="Ex: Crime, Drama"
              class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <select
            v-model="status"
            class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="want_to_watch">Quero assistir</option>
            <option value="watching">Assistindo</option>
            <option value="watched">Assistido</option>
          </select>
        </div>

        <!-- Poster Upload / Preview -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Pôster do Filme (máx. 5 MB - PNG, JPG, JPEG)
          </label>

          <!-- Preview if photo is selected, exists, or comes from external lookup -->
          <div v-if="posterPreviewUrl || existingPosterUrl || externalPosterUrl" class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border border-slate-200 dark:border-[#31394d] rounded-xl bg-slate-50 dark:bg-[#182338]">
            <div class="relative w-24 aspect-[2/3] rounded-lg overflow-hidden shadow-xs border border-slate-200 dark:border-[#31394d] bg-slate-100 dark:bg-[#131b2e] shrink-0">
              <img
                v-if="posterPreviewUrl"
                :src="posterPreviewUrl"
                alt="Prévia do pôster"
                class="w-full h-full object-cover"
              />
              <img
                v-else-if="externalPosterUrl"
                :src="externalPosterUrl"
                alt="Pôster TMDB"
                class="w-full h-full object-cover"
              />
              <AuthImage
                v-else-if="existingPosterUrl"
                :src="existingPosterUrl"
                alt="Pôster existente"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {{ posterFile ? posterFile.name : (externalPosterUrl ? 'Pôster importado do TMDB' : 'Pôster salvo atualmente') }}
                </p>
                <p v-if="posterFile" class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ (posterFile.size / 1024 / 1024).toFixed(2) }} MB
                </p>
              </div>
              <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-[#31394d] rounded-lg hover:bg-slate-50 dark:hover:bg-[#253248] transition-colors"
                >
                  Substituir
                </button>
                <button
                  type="button"
                  @click="removePoster"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            </div>
          </div>

          <!-- Drag and drop upload zone -->
          <div
            v-else
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
            :class="[
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-[#31394d] hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-[#182338]/50'
            ]"
          >
            <Upload class="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Clique para selecionar ou arraste o pôster aqui
            </p>
            <p class="text-[11px] text-slate-400 mt-0.5">PNG, JPG ou JPEG de até 5 MB</p>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            class="hidden"
            @change="handlePosterFileSelect"
          />

          <p v-if="posterError" class="text-xs text-rose-600 font-medium mt-1">
            {{ posterError }}
          </p>
        </div>

        <!-- Synopsis -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Sinopse
          </label>
          <textarea
            v-model="synopsis"
            rows="3"
            placeholder="Breve resumo da trama..."
            class="w-full px-3.5 py-2 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Tags Selection -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Tags Pessoais
          </label>
          <div v-if="availableTags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <button
              v-for="t in availableTags"
              :key="t.id"
              type="button"
              @click="toggleTag(t.id)"
              class="px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1"
              :class="[
                selectedTagIds.includes(t.id)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#31394d] hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <span>#{{ t.name }}</span>
              <Check v-if="selectedTagIds.includes(t.id)" class="w-3 h-3" />
            </button>
          </div>

          <!-- Add new tag inline -->
          <div class="flex gap-2 max-w-sm">
            <input
              v-model="newTagName"
              @keydown.enter.prevent="handleCreateTag"
              type="text"
              placeholder="Criar nova tag..."
              class="flex-1 px-3 py-1.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-xs bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              @click="handleCreateTag"
              :disabled="creatingTag || !newTagName.trim()"
              class="px-3 py-1.5 bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0] dark:border-[#1e293b]">
        <RouterLink
          :to="isEditing ? `/filmes/${movieId}` : '/filmes'"
          class="px-4 py-2 border border-slate-300 dark:border-[#31394d] text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {{ saving ? 'Salvando...' : (isEditing ? 'Atualizar Filme' : 'Salvar Filme') }}
        </button>
      </div>
    </form>
  </div>
</template>
