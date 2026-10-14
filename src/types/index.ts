export type BookStatus = 'want_to_read' | 'reading' | 'read';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  books_count?: number;
  created_at?: string;
}

export interface Review {
  id: string;
  book_id: string;
  rating: number;
  title: string | null;
  body: string;
  has_spoiler: boolean;
  created_at: string;
  updated_at: string;
  book?: {
    id: string;
    title: string;
    author: string;
    cover_path: string | null;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  pages: number;
  cover_path: string | null;
  cover_url: string | null;
  synopsis: string | null;
  status: BookStatus;
  current_page: number;
  progress_percentage: number;
  started_at: string | null;
  finished_at: string | null;
  created_at?: string;
  updated_at?: string;
  review?: Review | null;
  tags?: Tag[];
}

export interface Stats {
  year: number;
  total_books: number;
  read_this_year: number;
  pages_read_this_year: number;
  average_rating: number;
  reviews_count: number;
  status_counts: {
    reading: number;
    read: number;
    want_to_read: number;
  };
  ratings_distribution: Record<string, number>;
}

export interface ExternalBookLookup {
  title: string;
  author: string;
  publisher: string | null;
  year: number | null;
  pages: number;
  synopsis: string | null;
  isbn: string | null;
  cover_url: string | null;
}
