import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CursorPage, Pegawai, PegawaiRequest } from '../models/pegawai';
import { API_BASE_URL } from './api.config';

export interface PegawaiListOptions {
  search?: string | null;
  cursor?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PegawaiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(options: PegawaiListOptions = {}): Observable<CursorPage<Pegawai>> {
    let params = new HttpParams();
    const search = options.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (options.cursor) {
      params = params.set('cursor', options.cursor);
    }

    return this.http.get<CursorPage<Pegawai>>(`${this.baseUrl}/pegawai`, { params });
  }

  get(uuid: string): Observable<Pegawai> {
    return this.http.get<Pegawai>(`${this.baseUrl}/pegawai/${uuid}`);
  }

  create(request: PegawaiRequest): Observable<Pegawai> {
    return this.http.post<Pegawai>(`${this.baseUrl}/pegawai`, request);
  }

  update(uuid: string, request: PegawaiRequest): Observable<Pegawai> {
    return this.http.put<Pegawai>(`${this.baseUrl}/pegawai/${uuid}`, request);
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pegawai/${uuid}`);
  }
}
