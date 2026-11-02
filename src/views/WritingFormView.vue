<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useWritingsStore } from '@/stores/writings';
import { tagsApi } from '@/api/tags';
import type { WritingKind, Tag } from '@/types';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  FileText,
  PenLine,
  Check,
  Plus,
  Loader2,
  Calendar,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const writingsStore = useWritingsStore();

const isEditing = computed(() => !!route.params.id);
const writingId = computed(() => route.params.id as string);

// Form fields
const kind = ref<WritingKind>('reflection');
const title = ref('');
const body = ref('');
const entryDate = ref(new Date().toISOString().split('T')[0]);
const sourceLabel = ref('');
const mood = ref('');
const selectedTagIds = ref<string[]>([]);

// Tags state
const availableTags = ref<Tag[]>([]);
const newTagName = ref('');
const creatingTag = ref(false);

const saving = ref(false);
const error = ref('');

const kindOptions: { value: WritingKind; label: string; desc: string; icon: any }[] = [
  { value: 'reflection', label: 'Reflexão', desc: 'Pensamento ou aprendizado do dia', icon: Sparkles },
  { value: 'reading', label: 'Leitura', desc: 'Capítulo da Bíblia, trecho de artigo ou texto', icon: BookOpen },
  { value: 'note', label: 'Anotação', desc: 'Ideia solta, citação ou resumo rápido', icon: FileText },
  { value: 'free', label: 'Escrita Livre', desc: 'Poema, desabafo ou fluxo de consciência', icon: PenLine },
];

onMounted(async () => {
  try {
    availableTags.value = await tagsApi.getTags();
  } catch {}

  if (isEditing.value) {
    try {
      const entry = await writingsStore.fetchWriting(writingId.value);
      if (entry) {
        kind.value = entry.kind;
        title.value = entry.title || '';
        body.value = entry.body;
        entryDate.value = entry.entry_date;
        sourceLabel.value = entry.source_label || '';
        mood.value = entry.mood || '';
        selectedTagIds.value = entry.tags?.map((t) => t.id) || [];
      }
    } catch {
      router.push('/escritas');
    }
  }
});

function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId);
  if (idx === -1) {
    selectedTagIds.value.push(tagId);
  } else {
    selectedTagIds.value.splice(idx, 1);
  }
}

async function handleCreateTag() {
  if (!newTagName.value.trim() || creatingTag.value) return;
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

async function handleSubmit() {
  if (!body.value.trim()) {
    error.value = 'O texto da escrita é obrigatório.';
    return;
  }

  error.value = '';
  saving.value = true;

  const payload = {
    kind: kind.value,
    title: title.value.trim() || null,
    body: body.value,
    entry_date: entryDate.value,
    source_label: sourceLabel.value.trim() || null,
    mood: mood.value.trim() || null,
    tag_ids: selectedTagIds.value,
  };

  try {
    if (isEditing.value) {
      await writingsStore.updateWriting(writingId.value, payload);
      router.push(`/escritas/${writingId.value}`);
    } else {
      const created = await writingsStore.createWriting(payload);
      router.push(`/escritas/${created.id}`);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao salvar escrita.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 pb-12">
    <!-- Top Back bar -->
    <div class="flex items-center gap-3">
      <RouterLink
        to="/escritas"
        class="p-2 rounded-xl border border-slate-200 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
      </RouterLink>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#f8fafc] tracking-tight">
          {{ isEditing ? 'Editar Escrita' : 'Nova Escrita' }}
        </h1>
        <p class="text-xs text-slate-500 dark:text-[#94a3b8]">
          {{ isEditing ? 'Atualize sua reflexão ou anotação' : 'Registre suas reflexões, leituras ou pensamentos do dia' }}
        </p>
      </div>
    </div>

    <!-- Error notice -->
    <div
      v-if="error"
      class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-xl"
    >
      {{ error }}
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white dark:bg-[#131b2e] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-5">
        <!-- Kind Selector Buttons -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tipo de Escrita <span class="text-rose-500">*</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="opt in kindOptions"
              :key="opt.value"
              type="button"
              @click="kind = opt.value"
              class="p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                kind === opt.value
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-[#31394d] hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <div class="flex items-center justify-between mb-1">
                <component
                  :is="opt.icon"
                  class="w-4 h-4"
                  :class="kind === opt.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
                />
                <div
                  v-if="kind === opt.value"
                  class="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
                ></div>
              </div>
              <div>
                <div
                  class="text-xs sm:text-sm font-bold"
                  :class="kind === opt.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-[#f8fafc]'"
                >
                  {{ opt.label }}
                </div>
                <div class="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                  {{ opt.desc }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Date & Title Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data da Escrita <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="entryDate"
                type="date"
                required
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Title (optional) -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título <span class="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="Ex: Aprendizados de hoje, Reflexão sobre a paz..."
              maxlength="255"
              class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <!-- Source Label & Mood Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Source (Inspiration) -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inspirado em <span class="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              v-model="sourceLabel"
              type="text"
              placeholder="Ex: Salmos 23, Artigo da Wired, Conversa..."
              maxlength="255"
              class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
            />
          </div>

          <!-- Mood / Feeling -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sentimento / Humor <span class="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              v-model="mood"
              type="text"
              placeholder="Ex: gratidão, paz, inquietação, foco..."
              maxlength="50"
              class="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <!-- Body Textarea -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Texto da Escrita <span class="text-rose-500">*</span>
            </label>
            <span class="text-[11px] text-slate-400">
              {{ body.length }} / 20.000 caracteres
            </span>
          </div>
          <textarea
            v-model="body"
            required
            rows="10"
            maxlength="20000"
            placeholder="Escreva livremente aqui sua reflexão, versículo, anotação ou pensamento..."
            class="w-full px-3.5 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#31394d] bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400 leading-relaxed font-sans"
          ></textarea>
        </div>

        <!-- Tags -->
        <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tags / Marcadores
          </label>
          <div v-if="availableTags.length > 0" class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in availableTags"
              :key="tag.id"
              type="button"
              @click="toggleTag(tag.id)"
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              :class="[
                selectedTagIds.includes(tag.id)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#31394d]'
              ]"
            >
              <Check v-if="selectedTagIds.includes(tag.id)" class="w-3 h-3" />
              #{{ tag.name }}
            </button>
          </div>

          <!-- Inline new tag input -->
          <div class="flex items-center gap-2 pt-1 max-w-xs">
            <input
              v-model="newTagName"
              @keyup.enter.prevent="handleCreateTag"
              type="text"
              placeholder="Criar nova tag..."
              class="px-2.5 py-1 text-xs border border-slate-300 dark:border-[#31394d] rounded-lg flex-1 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#f8fafc] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              @click="handleCreateTag"
              :disabled="creatingTag || !newTagName.trim()"
              class="px-3 py-1 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-[#31394d] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
          <RouterLink
            to="/escritas"
            class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </RouterLink>
          <button
            type="submit"
            :disabled="saving || !body.trim()"
            class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Check v-else class="w-4 h-4" />
            <span>{{ saving ? 'Salvando...' : (isEditing ? 'Atualizar Escrita' : 'Salvar Escrita') }}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
