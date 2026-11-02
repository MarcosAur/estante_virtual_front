import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import DashboardView from '@/views/DashboardView.vue';
import ShelfView from '@/views/ShelfView.vue';
import BookDetailView from '@/views/BookDetailView.vue';
import BookFormView from '@/views/BookFormView.vue';
import MovieShelfView from '@/views/MovieShelfView.vue';
import MovieDetailView from '@/views/MovieDetailView.vue';
import MovieFormView from '@/views/MovieFormView.vue';
import ReviewsView from '@/views/ReviewsView.vue';
import SuggestionsView from '@/views/SuggestionsView.vue';
import WritingsView from '@/views/WritingsView.vue';
import WritingFormView from '@/views/WritingFormView.vue';
import WritingDetailView from '@/views/WritingDetailView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/registro',
      name: 'register',
      component: RegisterView,
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/estante',
      name: 'shelf',
      component: ShelfView,
      meta: { requiresAuth: true },
    },
    {
      path: '/livros/novo',
      name: 'book-create',
      component: BookFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/livros/:id',
      name: 'book-detail',
      component: BookDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/livros/:id/editar',
      name: 'book-edit',
      component: BookFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/filmes',
      name: 'movies-shelf',
      component: MovieShelfView,
      meta: { requiresAuth: true },
    },
    {
      path: '/filmes/novo',
      name: 'movie-create',
      component: MovieFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/filmes/:id',
      name: 'movie-detail',
      component: MovieDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/filmes/:id/editar',
      name: 'movie-edit',
      component: MovieFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/resenhas',
      name: 'reviews',
      component: ReviewsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/sugestoes',
      name: 'suggestions',
      component: SuggestionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/escritas',
      name: 'writings',
      component: WritingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/escritas/nova',
      name: 'writing-create',
      component: WritingFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/escritas/:id',
      name: 'writing-detail',
      component: WritingDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/escritas/:id/editar',
      name: 'writing-edit',
      component: WritingFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/perfil',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const allowRegistration = import.meta.env.VITE_ENABLE_REGISTER !== 'false';

  if (to.name === 'register' && !allowRegistration) {
    return next({ name: 'login' });
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
