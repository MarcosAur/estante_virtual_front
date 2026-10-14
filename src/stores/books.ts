import { defineStore } from 'pinia';
import { ref } from 'vue';
import { booksApi, type BookFilterParams } from '@/api/books';
import type { Book } from '@/types';

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([]);
  const currentBook = ref<Book | null>(null);
  const loading = ref(false);
  const meta = ref<any>(null);

  async function fetchBooks(params?: BookFilterParams) {
    loading.value = true;
    try {
      const res = await booksApi.getBooks(params);
      books.value = res.data;
      meta.value = res.meta || null;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBook(id: string) {
    loading.value = true;
    try {
      const book = await booksApi.getBook(id);
      currentBook.value = book;
      return book;
    } finally {
      loading.value = false;
    }
  }

  async function createBook(payload: Partial<Book> & { tag_ids?: string[] }) {
    loading.value = true;
    try {
      const newBook = await booksApi.createBook(payload);
      books.value.unshift(newBook);
      return newBook;
    } finally {
      loading.value = false;
    }
  }

  async function updateBook(id: string, payload: Partial<Book> & { tag_ids?: string[] }) {
    loading.value = true;
    try {
      const updated = await booksApi.updateBook(id, payload);
      const index = books.value.findIndex(b => b.id === id);
      if (index !== -1) {
        books.value[index] = updated;
      }
      if (currentBook.value?.id === id) {
        currentBook.value = updated;
      }
      return updated;
    } finally {
      loading.value = false;
    }
  }

  async function deleteBook(id: string) {
    loading.value = true;
    try {
      await booksApi.deleteBook(id);
      books.value = books.value.filter(b => b.id !== id);
      if (currentBook.value?.id === id) {
        currentBook.value = null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateProgress(id: string, data: { current_page: number; status?: string; finished_at?: string }) {
    const updated = await booksApi.updateProgress(id, data);
    const index = books.value.findIndex(b => b.id === id);
    if (index !== -1) {
      books.value[index] = updated;
    }
    if (currentBook.value?.id === id) {
      currentBook.value = updated;
    }
    return updated;
  }

  async function uploadCover(id: string, file: File) {
    const updated = await booksApi.uploadCover(id, file);
    const index = books.value.findIndex(b => b.id === id);
    if (index !== -1) {
      books.value[index] = updated;
    }
    if (currentBook.value?.id === id) {
      currentBook.value = updated;
    }
    return updated;
  }

  async function deleteCover(id: string) {
    const updated = await booksApi.deleteCover(id);
    const index = books.value.findIndex(b => b.id === id);
    if (index !== -1) {
      books.value[index] = updated;
    }
    if (currentBook.value?.id === id) {
      currentBook.value = updated;
    }
    return updated;
  }

  function reset() {
    books.value = [];
    currentBook.value = null;
    meta.value = null;
    loading.value = false;
  }

  return {
    books,
    currentBook,
    loading,
    meta,
    fetchBooks,
    fetchBook,
    createBook,
    updateBook,
    deleteBook,
    updateProgress,
    uploadCover,
    deleteCover,
    reset,
  };
});
