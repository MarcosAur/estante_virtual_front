<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { booksApi } from '@/api/books';
import { tagsApi } from '@/api/tags';
import { useBooksStore } from '@/stores/books';
import type { BookStatus, ExternalBookLookup, Tag } from '@/types';
import { Search, Sparkles, ArrowLeft, Check, Upload, Trash2 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const booksStore = useBooksStore();

const isEditing = computed(() => !!route.params.id);
const bookId = computed(() => route.params.id as string);

// Form fields
const title = ref('');
const author = ref('');
const isbn = ref('');
const publisher = ref('');
const year = ref<number | null>(null);
const pages = ref<number>(0);
const status = ref<BookStatus>('want_to_read');
const synopsis = ref('');
const selectedTagIds = ref<string[]>([]);

// Photo / Cover upload state
const coverFile = ref<File | null>(null);
const coverPreviewUrl = ref<string | null>(null);
const existingCoverUrl = ref<string | null>(null);
const removeCoverRequested = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const coverError = ref('');
const isDragging = ref(false);

// Lookup state
const lookupQuery = ref('');
const lookupResults = ref<ExternalBookLookup[]>([]);
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
    const book = await booksStore.fetchBook(bookId.value);
    if (book) {
      title.value = book.title;
      author.value = book.author;
      isbn.value = book.isbn || '';
      publisher.value = book.publisher || '';
      year.value = book.year;
      pages.value = book.pages || 0;
      status.value = book.status;
      synopsis.value = book.synopsis || '';
      selectedTagIds.value = book.tags?.map(t => t.id) || [];
      if (book.cover_url) {
        existingCoverUrl.value = book.cover_url;
      }
    }
  }
});

onUnmounted(() => {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }
});

function handleCoverFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    validateAndSetCoverFile(file);
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    validateAndSetCoverFile(file);
  }
}

function validateAndSetCoverFile(file: File) {
  coverError.value = '';
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const validExtensions = /\.(png|jpe?g)$/i;

  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    coverError.value = 'Formato inválido. Apenas fotos em formato PNG, JPG ou JPEG são permitidas.';
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    coverError.value = 'O arquivo selecionado excede o limite de 5 MB. Escolha uma foto de até 5 MB.';
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }

  coverFile.value = file;
  coverPreviewUrl.value = URL.createObjectURL(file);
  removeCoverRequested.value = false;
}

function removeSelectedCover() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
    coverPreviewUrl.value = null;
  }
  coverFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  if (existingCoverUrl.value) {
    removeCoverRequested.value = true;
    existingCoverUrl.value = null;
  }
  coverError.value = '';
}

async function handleSearchLookup() {
  if (!lookupQuery.value.trim()) return;
  isSearchingLookup.value = true;
  showLookupResults.value = true;
  try {
    const isIsbn = /^[0-9X-]{9,}$/i.test(lookupQuery.value.trim());
    lookupResults.value = await booksApi.lookupBooks({
      isbn: isIsbn ? lookupQuery.value.trim() : undefined,
      q: !isIsbn ? lookupQuery.value.trim() : undefined,
    });
  } finally {
    isSearchingLookup.value = false;
  }
}

function applyLookupData(item: ExternalBookLookup) {
  title.value = item.title;
  author.value = item.author;
  if (item.isbn) isbn.value = item.isbn;
  if (item.publisher) publisher.value = item.publisher;
  if (item.year) year.value = item.year;
  if (item.pages) pages.value = item.pages;
  if (item.synopsis) synopsis.value = item.synopsis;
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
  if (coverError.value) {
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    const payload = {
      title: title.value,
      author: author.value,
      isbn: isbn.value || undefined,
      publisher: publisher.value || undefined,
      year: year.value || undefined,
      pages: pages.value || 0,
      status: status.value,
      synopsis: synopsis.value || undefined,
      tag_ids: selectedTagIds.value,
    };

    let targetBookId: string;
    if (isEditing.value) {
      const updated = await booksStore.updateBook(bookId.value, payload);
      targetBookId = updated.id;
      if (removeCoverRequested.value) {
        await booksStore.deleteCover(targetBookId);
      }
    } else {
      const created = await booksStore.createBook(payload);
      targetBookId = created.id;
    }

    if (coverFile.value) {
      await booksStore.uploadCover(targetBookId, coverFile.value);
    }

    router.push(`/livros/${targetBookId}`);
  } catch (err: any) {
    if (err.response?.data?.errors) {
      error.value = Object.values(err.response.data.errors).flat().join(' ');
    } else {
      error.value = err.response?.data?.message || 'Erro ao salvar livro.';
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <RouterLink
      to="/estante"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-[#94a3b8] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Voltar para a Estante
    </RouterLink>

    <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] dark:border-[#1e293b] shadow-xs space-y-6 transition-colors duration-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-[#f8fafc] tracking-tight">
          {{ isEditing ? 'Editar Livro' : 'Cadastrar Novo Livro' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-[#94a3b8]">
          Preencha os dados do livro ou busque automaticamente pelo Google Books
        </p>
      </div>

      <!-- Google Books API Auto-Lookup box -->
      <div v-if="!isEditing" class="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
        <div class="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-semibold text-xs">
          <Sparkles class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Preenchimento Automático via Google Books</span>
        </div>

        <div class="flex gap-2">
          <input
            v-model="lookupQuery"
            @keyup.enter="handleSearchLookup"
            type="text"
            placeholder="Digite o título do livro ou o código ISBN..."
            class="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-[#31394d] rounded-lg bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
          />
          <button
            @click="handleSearchLookup"
            :disabled="isSearchingLookup || !lookupQuery.trim()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Search class="w-4 h-4" />
            <span v-if="isSearchingLookup">Buscando...</span>
            <span v-else>Buscar</span>
          </button>
        </div>

        <!-- Lookup Results Dropdown -->
        <div v-if="showLookupResults && lookupResults.length > 0" class="mt-2 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-[#31394d] divide-y divide-slate-100 dark:divide-[#31394d] max-h-60 overflow-y-auto shadow-md">
          <div
            v-for="(item, idx) in lookupResults"
            :key="idx"
            @click="applyLookupData(item)"
            class="p-3 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                class="w-8 h-12 object-cover rounded shadow-xs"
              />
              <div class="text-left">
                <div class="font-semibold text-xs text-slate-900 dark:text-[#f8fafc]">{{ item.title }}</div>
                <div class="text-[11px] text-slate-500 dark:text-[#94a3b8]">{{ item.author }} ({{ item.year || 's/ano' }}) - {{ item.pages }} págs</div>
              </div>
            </div>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Preencher</span>
          </div>
        </div>

        <p v-else-if="showLookupResults && !isSearchingLookup" class="text-xs text-slate-500 dark:text-[#94a3b8] italic">
          Nenhum resultado encontrado. Você pode preencher os campos manualmente abaixo.
        </p>
      </div>

      <div v-if="error" class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm rounded-lg">
        {{ error }}
      </div>

      <!-- Main Form -->
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Photo / Cover Upload Field -->
        <div class="p-4 rounded-xl border border-dashed border-slate-300 dark:border-[#31394d] bg-slate-50/50 dark:bg-[#1e293b]/50">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Foto da Capa do Livro
            <span class="text-xs font-normal text-slate-500 dark:text-[#94a3b8]">(Opcional - PNG, JPG ou JPEG até 5 MB)</span>
          </label>

          <!-- Hidden File Input -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            class="hidden"
            @change="handleCoverFileSelect"
          />

          <!-- Preview if photo is selected or exists -->
          <div v-if="coverPreviewUrl || existingCoverUrl" class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div class="relative w-28 aspect-[2/3] rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-[#31394d] bg-slate-100 dark:bg-[#131b2e] shrink-0">
              <img
                :src="coverPreviewUrl || existingCoverUrl!"
                alt="Prévia da foto"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {{ coverFile ? coverFile.name : 'Foto atual da capa' }}
                </p>
                <p v-if="coverFile" class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ (coverFile.size / (1024 * 1024)).toFixed(2) }} MB • {{ coverFile.type || 'Imagem' }}
                </p>
              </div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-[#31394d] hover:border-emerald-500 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload class="w-3.5 h-3.5" />
                  Trocar foto
                </button>
                <button
                  type="button"
                  @click="removeSelectedCover"
                  class="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Remover foto
                </button>
              </div>
            </div>
          </div>

          <!-- Dropzone if no photo is selected -->
          <div
            v-else
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
            :class="[
              'cursor-pointer py-6 px-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors',
              isDragging
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500'
                : 'hover:bg-slate-100 dark:hover:bg-[#1e293b]'
            ]"
          >
            <div class="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full mb-2">
              <Upload class="w-5 h-5" />
            </div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Clique para selecionar ou arraste uma foto aqui
            </p>
            <p class="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-1">
              Formatos aceitos: PNG, JPG ou JPEG (máximo 5 MB)
            </p>
          </div>

          <!-- Local error feedback for cover -->
          <p v-if="coverError" class="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {{ coverError }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do Livro *</label>
            <input
              v-model="title"
              type="text"
              required
              placeholder="Ex: Cem Anos de Solidão"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Autor *</label>
            <input
              v-model="author"
              type="text"
              required
              placeholder="Ex: Gabriel García Márquez"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status na Estante *</label>
            <select
              v-model="status"
              required
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            >
              <option value="want_to_read">Quero ler</option>
              <option value="reading">Lendo</option>
              <option value="read">Lido</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número de Páginas</label>
            <input
              v-model.number="pages"
              type="number"
              min="0"
              placeholder="Ex: 448"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ano de Publicação</label>
            <input
              v-model.number="year"
              type="number"
              min="1000"
              placeholder="Ex: 1967"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Editora</label>
            <input
              v-model="publisher"
              type="text"
              placeholder="Ex: Record"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ISBN</label>
            <input
              v-model="isbn"
              type="text"
              placeholder="Ex: 9788501012074"
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sinopse</label>
            <textarea
              v-model="synopsis"
              rows="3"
              placeholder="Resumo ou descrição do livro..."
              class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-lg text-sm bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>
        </div>

        <!-- Tags Selection & Creation -->
        <div class="pt-2 border-t border-slate-100 dark:border-[#1e293b] space-y-3">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Tags / Gêneros Pessoais</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in availableTags"
              :key="tag.id"
              type="button"
              @click="toggleTag(tag.id)"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              :class="[
                selectedTagIds.includes(tag.id)
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#31394d]'
              ]"
            >
              <Check v-if="selectedTagIds.includes(tag.id)" class="w-3 h-3" />
              #{{ tag.name }}
            </button>
          </div>

          <!-- Add new tag input inline -->
          <div class="flex items-center gap-2 pt-1 max-w-xs">
            <input
              v-model="newTagName"
              @keyup.enter.prevent="handleCreateTag"
              type="text"
              placeholder="Nova tag..."
              class="px-2.5 py-1 text-xs border border-slate-300 dark:border-[#31394d] rounded-lg flex-1 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-[#f8fafc] focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              @click="handleCreateTag"
              :disabled="creatingTag || !newTagName.trim()"
              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs rounded-lg font-medium disabled:opacity-50 cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 flex justify-end gap-3">
          <RouterLink
            to="/estante"
            class="px-5 py-2.5 border border-slate-300 dark:border-[#31394d] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
          >
            Cancelar
          </RouterLink>
          <button
            type="submit"
            :disabled="saving"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            <span v-if="saving">Salvando...</span>
            <span v-else>{{ isEditing ? 'Atualizar Livro' : 'Salvar Livro' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
