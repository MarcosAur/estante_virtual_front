import { ref, watchEffect } from 'vue';

const storedTheme = localStorage.getItem('booktrack_theme') as 'light' | 'dark' | null;
const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = ref<'light' | 'dark'>(storedTheme || (prefersDark ? 'dark' : 'light'));

// Apply initially
if (typeof document !== 'undefined') {
  if (theme.value === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function setTheme(val: 'light' | 'dark') {
    theme.value = val;
  }

  watchEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('booktrack_theme', theme.value);
    }
    if (typeof document !== 'undefined') {
      if (theme.value === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      }
    }
  });

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
