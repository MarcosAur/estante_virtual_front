<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    current: number;
    total: number;
    showLabel?: boolean;
    color?: string;
  }>(),
  {
    showLabel: true,
    color: 'bg-emerald-500',
  }
);

const percentage = computed(() => {
  if (props.total <= 0) return 0;
  return Math.min(100, Math.round((props.current / props.total) * 100));
});
</script>

<template>
  <div class="w-full">
    <div class="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
      <div
        class="h-2 rounded-full transition-all duration-300"
        :class="color"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <div v-if="showLabel" class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
      <span>{{ current }} de {{ total }} págs</span>
      <span class="font-medium text-slate-700 dark:text-slate-300">{{ percentage }}%</span>
    </div>
  </div>
</template>
