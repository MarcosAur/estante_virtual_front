<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';

const authStore = useAuthStore();
useTheme(); // Initialize and bind theme watcher

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.fetchMe();
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b1326] text-[#0f172a] dark:text-[#f8fafc] transition-colors duration-200">
    <Navbar />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="bg-white dark:bg-[#131b2e] border-t border-[#e2e8f0] dark:border-[#1e293b] py-6 text-center text-xs text-[#64748b] dark:text-[#94a3b8] transition-colors duration-200">
      <p>BookTrack &bull; Organização particular de leituras e resenhas privadas.</p>
    </footer>
  </div>
</template>
