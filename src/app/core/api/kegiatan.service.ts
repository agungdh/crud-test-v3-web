import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CursorPage } from '../models/api';
import { KegiatanRequestPayload, KegiatanRow, KegiatanSlug } from '../models/kegiatan';
import { API_BASE_URL } from './api.config';

export interface KegiatanListOptions {
  search?: string | null;
  pegawaiUuid?: string | null;
  cursor?: string | null;
}

/** CRUD client for the nine `/diklat`, `/ppm`, `/seminar`, ... resources. */
@Injectable({ providedIn: 'root' })
export class KegiatanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(slug: KegiatanSlug, options: KegiatanListOptions = {}): Observable<CursorPage<KegiatanRow>> {
    let params = new HttpParams();
    const search = options.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (options.pegawaiUuid) {
      params = params.set('pegawai_uuid', options.pegawaiUuid);
    }

    if (options.cursor) {
      params = params.set('cursor', options.cursor);
    }

    return this.http.get<CursorPage<KegiatanRow>>(this.url(slug), { params });
  }

  get(slug: KegiatanSlug, uuid: string): Observable<KegiatanRow> {
    return this.http.get<KegiatanRow>(`${this.url(slug)}/${uuid}`);
  }

  create(slug: KegiatanSlug, request: KegiatanRequestPayload): Observable<KegiatanRow> {
    return this.http.post<KegiatanRow>(this.url(slug), request);
  }

  update(
    slug: KegiatanSlug,
    uuid: string,
    request: KegiatanRequestPayload,
  ): Observable<KegiatanRow> {
    return this.http.put<KegiatanRow>(`${this.url(slug)}/${uuid}`, request);
  }

  delete(slug: KegiatanSlug, uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.url(slug)}/${uuid}`);
  }

  private url(slug: KegiatanSlug): string {
    return `${this.baseUrl}/${slug}`;
  }
}
