import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api';

const FALLBACK_MESSAGE = 'Terjadi kesalahan tak terduga. Coba lagi.';
const OFFLINE_MESSAGE =
  'Tidak dapat terhubung ke server. Pastikan backend berjalan di http://localhost:8080.';

/**
 * Turns the backend `ErrorResponse` (or a network failure) into a message that
 * is safe to show in a snackbar or an inline alert.
 */
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK_MESSAGE;
  }

  if (error.status === 0) {
    return OFFLINE_MESSAGE;
  }

  const body = error.error as Partial<ApiError> | string | null;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const details = Array.isArray(body.details) ? body.details.filter(Boolean) : [];

    if (details.length > 0) {
      return `${body.message ?? FALLBACK_MESSAGE} (${details.join('; ')})`;
    }

    if (body.message) {
      return body.message;
    }
  }

  return error.message || FALLBACK_MESSAGE;
}

/** The backend returns 409 when the NIP is already used by another active row. */
export function isDuplicateNip(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409;
}
