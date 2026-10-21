import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, Observable, of, shareReplay } from 'rxjs';
import { Pegawai } from '../models/pegawai';
import { PegawaiService } from './pegawai.service';

/**
 * Resolves pegawai names for rows from the kegiatan endpoints, which only expose
 * `pegawai_uuid`. Requests are cached so each UUID is fetched at most once while
 * the app is open.
 */
@Injectable({ providedIn: 'root' })
export class PegawaiDirectoryService {
  private readonly pegawaiService = inject(PegawaiService);
  private readonly cache = new Map<string, Observable<Pegawai | null>>();
  private readonly requested = new Set<string>();
  private readonly loaded = signal<ReadonlyMap<string, Pegawai>>(new Map());

  /** Fetches any UUID that has not been requested yet, in one batch. */
  load(uuids: Iterable<string>): void {
    const missing = [...new Set(uuids)].filter((uuid) => !this.requested.has(uuid));

    if (missing.length === 0) {
      return;
    }

    missing.forEach((uuid) => this.requested.add(uuid));

    forkJoin(missing.map((uuid) => this.fetch(uuid))).subscribe((rows) => {
      this.loaded.update((map) => {
        const next = new Map(map);

        for (const row of rows) {
          if (row) {
            next.set(row.uuid, row);
          }
        }

        return next;
      });
    });
  }

  get(uuid: string): Observable<Pegawai | null> {
    return this.fetch(uuid);
  }

  name(uuid: string): string | undefined {
    return this.loaded().get(uuid)?.nama;
  }

  nip(uuid: string): string | undefined {
    return this.loaded().get(uuid)?.nip;
  }

  private fetch(uuid: string): Observable<Pegawai | null> {
    const cached = this.cache.get(uuid);

    if (cached) {
      return cached;
    }

    const request = this.pegawaiService.get(uuid).pipe(
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(uuid, request);

    return request;
  }
}
