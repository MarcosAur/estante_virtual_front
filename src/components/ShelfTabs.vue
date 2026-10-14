<script setup lang="ts">
const props = defineProps<{
  activeTab: string;
  counts?: {
    total?: number;
    reading?: number;
    want_to_read?: number;
    read?: number;
  };
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', val: string): void;
}>();

const tabs = [
  { key: '', label: 'Todos' },
  { key: 'reading', label: 'Lendo' },
  { key: 'want_to_read', label: 'Quero ler' },
  { key: 'read', label: 'Lidos' },
];

function getCount(key: string) {
  if (!props.counts) return null;
  if (!key) return props.counts.total ?? null;
  return (props.counts as any)[key] ?? null;
}
</script>

<template>
  <div class="border-b border-[#e2e8f0] dark:border-[#1e293b]">
    <nav class="flex space-x-2 sm:space-x-6 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="emit('update:activeTab', tab.key)"
        class="whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        :class="[
          activeTab === tab.key
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'border-transparent text-slate-500 dark:text-[#94a3b8] hover:text-slate-800 dark:hover:text-[#f8fafc] hover:border-slate-300 dark:hover:border-slate-600'
        ]"
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="getCount(tab.key) !== null"
          class="px-2 py-0.5 text-xs rounded-full font-semibold transition-colors"
          :class="[
            activeTab === tab.key
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400'
          ]"
        >
          {{ getCount(tab.key) }}
        </span>
      </button>
    </nav>
  </div>
</template>
