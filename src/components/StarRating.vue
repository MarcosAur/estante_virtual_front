<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    modelValue: 0,
    readonly: false,
    size: 'md',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const starSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-4 h-4 text-xs';
    case 'lg':
      return 'w-7 h-7 text-lg';
    case 'md':
    default:
      return 'w-5 h-5 text-sm';
  }
});

function setRating(val: number) {
  if (props.readonly) return;
  emit('update:modelValue', val);
}
</script>

<template>
  <div class="flex items-center gap-1 select-none" :class="{ 'cursor-pointer': !readonly }">
    <div
      v-for="star in 5"
      :key="star"
      class="relative"
      @click="setRating(star)"
    >
      <!-- Base empty star -->
      <svg
        class="transition-colors duration-150"
        :class="[
          starSizeClasses,
          star <= modelValue
            ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400'
            : star - 0.5 <= modelValue
            ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400 opacity-60'
            : 'text-slate-300 dark:text-slate-600 fill-none stroke-slate-300 dark:stroke-slate-600 stroke-2'
        ]"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </div>
    <span v-if="modelValue > 0" class="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">
      {{ Number(modelValue).toFixed(1) }}
    </span>
  </div>
</template>
