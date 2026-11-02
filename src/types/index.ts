export type BookStatus = 'want_to_read' | 'reading' | 'read';
export type MovieStatus = 'want_to_watch' | 'watching' | 'watched';

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
  movies_count?: number;
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

export interface MovieReview {
  id: string;
  movie_id: string;
  rating: number;
  title: string | null;
  body: string;
  has_spoiler: boolean;
  created_at: string;
  updated_at: string;
  movie?: {
    id: string;
    title: string;
    director: string | null;
    poster_path: string | null;
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

export interface Movie {
  id: string;
  title: string;
  director: string | null;
  year: number | null;
  runtime_minutes: number;
  genre: string | null;
  synopsis: string | null;
  poster_path: string | null;
  poster_url: string | null;
  tmdb_id: string | null;
  status: MovieStatus;
  watched_at: string | null;
  created_at?: string;
  updated_at?: string;
  review?: MovieReview | null;
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

  // Movies
  total_movies?: number;
  movies_watched_this_year?: number;
  movies_average_rating?: number;
  movies_reviews_count?: number;
  movie_status_counts?: {
    watching: number;
    watched: number;
    want_to_watch: number;
  };
  movie_ratings_distribution?: Record<string, number>;
}

export type SuggestedMediaStatus = 'suggested' | BookStatus | MovieStatus;

export interface SuggestedMedia {
  id: string;
  suggestion_id: string;
  position: number;
  title: string;
  creator: string | null;
  year: number | null;
  synopsis: string | null;
  reason: string | null;
  status: SuggestedMediaStatus;
  mediable_type: 'book' | 'movie' | null;
  mediable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  type: 'book' | 'movie';
  prompt: string;
  model: string;
  media: SuggestedMedia[];
  created_at: string;
  updated_at: string;
}

export interface BatchImportResult {
  created_count: number;
  skipped_count: number;
  created: SuggestedMedia[];
  skipped: SuggestedMedia[];
}

export type WritingKind = 'reflection' | 'reading' | 'note' | 'free';

export interface WritingEntry {
  id: string;
  kind: WritingKind;
  title: string | null;
  body: string;
  entry_date: string;
  source_label: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface WritingSummary {
  total: number;
  by_kind: Record<WritingKind, number>;
  entries_this_month: number;
  current_streak: number;
  longest_streak: number;
}
