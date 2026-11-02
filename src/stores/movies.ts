import { defineStore } from 'pinia';
import { ref } from 'vue';
import { moviesApi, type MovieFilterParams } from '@/api/movies';
import type { Movie, MovieStatus } from '@/types';

export const useMoviesStore = defineStore('movies', () => {
  const movies = ref<Movie[]>([]);
  const currentMovie = ref<Movie | null>(null);
  const loading = ref(false);
  const meta = ref<any>(null);

  async function fetchMovies(params?: MovieFilterParams) {
    loading.value = true;
    try {
      const res = await moviesApi.getMovies(params);
      movies.value = res.data;
      meta.value = res.meta || null;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMovie(id: string) {
    loading.value = true;
    try {
      const movie = await moviesApi.getMovie(id);
      currentMovie.value = movie;
      return movie;
    } finally {
      loading.value = false;
    }
  }

  async function createMovie(payload: Partial<Movie> & { tag_ids?: string[]; poster?: File; poster_url?: string }) {
    loading.value = true;
    try {
      const newMovie = await moviesApi.createMovie(payload);
      movies.value.unshift(newMovie);
      return newMovie;
    } finally {
      loading.value = false;
    }
  }

  async function updateMovie(id: string, payload: Partial<Movie> & { tag_ids?: string[]; poster?: File; poster_url?: string }) {
    loading.value = true;
    try {
      const updated = await moviesApi.updateMovie(id, payload);
      const index = movies.value.findIndex(m => m.id === id);
      if (index !== -1) {
        movies.value[index] = updated;
      }
      if (currentMovie.value?.id === id) {
        currentMovie.value = updated;
      }
      return updated;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMovie(id: string) {
    loading.value = true;
    try {
      await moviesApi.deleteMovie(id);
      movies.value = movies.value.filter(m => m.id !== id);
      if (currentMovie.value?.id === id) {
        currentMovie.value = null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateStatus(id: string, data: { status: MovieStatus; watched_at?: string }) {
    const updated = await moviesApi.updateStatus(id, data);
    const index = movies.value.findIndex(m => m.id === id);
    if (index !== -1) {
      movies.value[index] = updated;
    }
    if (currentMovie.value?.id === id) {
      currentMovie.value = updated;
    }
    return updated;
  }

  async function uploadPoster(id: string, file: File) {
    const updated = await moviesApi.uploadPoster(id, file);
    const index = movies.value.findIndex(m => m.id === id);
    if (index !== -1) {
      movies.value[index] = updated;
    }
    if (currentMovie.value?.id === id) {
      currentMovie.value = updated;
    }
    return updated;
  }

  async function deletePoster(id: string) {
    const updated = await moviesApi.deletePoster(id);
    const index = movies.value.findIndex(m => m.id === id);
    if (index !== -1) {
      movies.value[index] = updated;
    }
    if (currentMovie.value?.id === id) {
      currentMovie.value = updated;
    }
    return updated;
  }

  function reset() {
    movies.value = [];
    currentMovie.value = null;
    meta.value = null;
    loading.value = false;
  }

  return {
    movies,
    currentMovie,
    loading,
    meta,
    fetchMovies,
    fetchMovie,
    createMovie,
    updateMovie,
    deleteMovie,
    updateStatus,
    uploadPoster,
    deletePoster,
    reset,
  };
});
