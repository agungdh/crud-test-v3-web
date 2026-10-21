/** Cursor-based list response used by every collection endpoint. */
export interface CursorPage<T> {
  content: T[];
  next_cursor: string | null;
}

/** Shape of the backend `ErrorResponse`. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}
