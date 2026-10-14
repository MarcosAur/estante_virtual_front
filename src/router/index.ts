import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import DashboardView from '@/views/DashboardView.vue';
import ShelfView from '@/views/ShelfView.vue';
import BookDetailView from '@/views/BookDetailView.vue';
import BookFormView from '@/views/BookFormView.vue';
import ReviewsView from '@/views/ReviewsView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(),
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
      path: '/resenhas',
      name: 'reviews',
      component: ReviewsView,
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
