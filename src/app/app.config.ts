import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from './core/api/api.config';
import { ID_DATE_FORMATS, IdDateAdapter } from './core/date/id-date-adapter';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: MAT_DATE_LOCALE, useValue: 'id-ID' },
    { provide: MAT_DATE_FORMATS, useValue: ID_DATE_FORMATS },
    { provide: DateAdapter, useClass: IdDateAdapter },
    { provide: API_BASE_URL, useValue: 'http://localhost:8080' },
  ],
};
