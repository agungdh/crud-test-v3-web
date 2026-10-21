import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CursorPage } from '../models/api';
import { JenisPelatihan, JenisPelatihanRequest } from '../models/jenis-pelatihan';
import { API_BASE_URL } from './api.config';

export interface JenisPelatihanListOptions {
  search?: string | null;
  cursor?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JenisPelatihanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(options: JenisPelatihanListOptions = {}): Observable<CursorPage<JenisPelatihan>> {
    let params = new HttpParams();
    const search = options.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (options.cursor) {
      params = params.set('cursor', options.cursor);
    }

    return this.http.get<CursorPage<JenisPelatihan>>(`${this.baseUrl}/jenis-pelatihan`, { params });
  }

  get(uuid: string): Observable<JenisPelatihan> {
    return this.http.get<JenisPelatihan>(`${this.baseUrl}/jenis-pelatihan/${uuid}`);
  }

  create(request: JenisPelatihanRequest): Observable<JenisPelatihan> {
    return this.http.post<JenisPelatihan>(`${this.baseUrl}/jenis-pelatihan`, request);
  }

  update(uuid: string, request: JenisPelatihanRequest): Observable<JenisPelatihan> {
    return this.http.put<JenisPelatihan>(`${this.baseUrl}/jenis-pelatihan/${uuid}`, request);
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/jenis-pelatihan/${uuid}`);
  }
}
