import { InjectionToken } from '@angular/core';

/**
 * Base URL of the Spring Boot API. Kept as an injection token so it can be
 * overridden in tests or when the frontend is deployed next to the backend.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
