import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { apiErrorMessage } from '../../core/api/error';
import { KegiatanService } from '../../core/api/kegiatan.service';
import { PegawaiDirectoryService } from '../../core/api/pegawai-directory.service';
import { PegawaiService } from '../../core/api/pegawai.service';
import { KegiatanTypeConfig } from '../../core/config/kegiatan-types';
import { KegiatanRow } from '../../core/models/kegiatan';
import { Pegawai } from '../../core/models/pegawai';
import { ConfirmDialog, ConfirmDialogData } from '../../core/ui/confirm-dialog';
import { formatTanggal } from '../../core/utils/date';
import { KegiatanDialogResult, KegiatanFormData, KegiatanFormDialog } from './kegiatan-form-dialog';

@Component({
  selector: 'app-kegiatan-list',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './kegiatan-list.html',
  styleUrl: './kegiatan-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KegiatanList {
  private readonly kegiatanService = inject(KegiatanService);
  private readonly pegawaiService = inject(PegawaiService);
  private readonly pegawaiDirectory = inject(PegawaiDirectoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly config = this.route.snapshot.data['kegiatan'] as KegiatanTypeConfig;
  protected readonly columns = [
    'pegawai',
    ...(this.config.hasNomorSurat ? ['nomor_surat'] : []),
    'materi',
    'tanggal',
    'jam',
    'aksi',
  ];
  protected readonly searchPlaceholder = this.config.hasNomorSurat
    ? 'Materi atau nomor surat'
    : 'Materi pengembangan';

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly pegawaiControl = new FormControl<Pegawai | string | null>(null);
  protected readonly pegawaiOptions = signal<Pegawai[]>([]);
  protected readonly pegawaiFilter = signal<Pegawai | null>(null);

  protected readonly rows = signal<KegiatanRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadMoreError = signal<string | null>(null);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly hasMore = computed(() => this.nextCursor() !== null);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private requestId = 0;
  private pegawaiSearchId = 0;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());

    this.pegawaiControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.searchPegawai(value);
        }
      });

    afterNextRender(() => this.observeSentinel());
    this.destroyRef.onDestroy(() => this.observer?.disconnect());

    // The component is reused while only the query string changes (browser
    // back/forward or a menu click that drops the filter).
    this.route.queryParamMap
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((params) => this.applyQueryFilter(params.get('pegawai_uuid')));

    this.initialize();
  }

  protected displayPegawai(value: Pegawai | string | null): string {
    return typeof value === 'string' ? value : (value?.nama ?? '');
  }

  protected onPegawaiFocus(): void {
    if (this.pegawaiOptions().length > 0) {
      return;
    }

    this.pegawaiService.list().subscribe({
      next: (page) => this.pegawaiOptions.set(page.content),
      error: () => this.pegawaiOptions.set([]),
    });
  }

  protected onPegawaiSelected(pegawai: Pegawai): void {
    if (this.pegawaiFilter()?.uuid === pegawai.uuid) {
      return;
    }

    this.pegawaiFilter.set(pegawai);
    this.pegawaiOptions.set([]);
    this.syncPegawaiQuery(pegawai.uuid);
    this.load();
  }

  protected clearPegawaiFilter(): void {
    this.pegawaiControl.setValue(null, { emitEvent: false });
    this.pegawaiOptions.set([]);
    this.pegawaiFilter.set(null);
    this.syncPegawaiQuery(null);
    this.load();
  }

  protected load(): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);

    this.kegiatanService
      .list(this.config.slug, {
        search: this.searchControl.value,
        pegawaiUuid: this.pegawaiFilter()?.uuid,
      })
      .subscribe({
        next: (page) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.rows.set(page.content);
          this.nextCursor.set(page.next_cursor);
          this.loading.set(false);
          this.pegawaiDirectory.load(page.content.map((row) => row.pegawai_uuid));
          this.fillViewportIfNeeded();
        },
        error: (error: unknown) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.rows.set([]);
          this.nextCursor.set(null);
          this.error.set(apiErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected loadMore(): void {
    const cursor = this.nextCursor();

    if (!cursor || this.loading() || this.loadingMore() || this.loadMoreError()) {
      return;
    }

    const requestId = this.requestId;
    this.loadingMore.set(true);

    this.kegiatanService
      .list(this.config.slug, {
        search: this.searchControl.value,
        pegawaiUuid: this.pegawaiFilter()?.uuid,
        cursor,
      })
      .subscribe({
        next: (page) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.rows.update((rows) => [...rows, ...page.content]);
          this.nextCursor.set(page.next_cursor);
          this.loadingMore.set(false);
          this.pegawaiDirectory.load(page.content.map((row) => row.pegawai_uuid));
          this.fillViewportIfNeeded();
        },
        error: (error: unknown) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.loadingMore.set(false);
          this.loadMoreError.set(apiErrorMessage(error));
        },
      });
  }

  protected retryLoadMore(): void {
    this.loadMoreError.set(null);
    this.loadMore();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected openCreate(): void {
    this.openForm(null);
  }

  protected openEdit(row: KegiatanRow): void {
    this.openForm(row);
  }

  protected deleteRow(row: KegiatanRow): void {
    const owner = this.pegawaiName(row.pegawai_uuid);
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: `Hapus ${this.config.label}?`,
        message: `${this.config.label} "${row.materi_pengembangan}" milik ${owner} (${this.tanggalLabel(row)}) akan dihapus dan tidak tampil lagi di daftar.`,
        confirmLabel: 'Hapus',
      },
      width: '460px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.kegiatanService.delete(this.config.slug, row.uuid).subscribe({
        next: () => {
          this.notify(`${this.config.label} "${row.materi_pengembangan}" berhasil dihapus.`);
          this.removeRow(row);
        },
        error: (error: unknown) => this.notifyError(apiErrorMessage(error)),
      });
    });
  }

  protected pegawaiName(uuid: string): string {
    return this.pegawaiDirectory.name(uuid) ?? uuid.slice(0, 8);
  }

  protected pegawaiNip(uuid: string): string | undefined {
    return this.pegawaiDirectory.nip(uuid);
  }

  protected tanggalLabel(row: KegiatanRow): string {
    if (this.config.hasDateRange) {
      const dari = formatTanggal(row.dari_tanggal_pelaksanaan);
      const sampai = formatTanggal(row.sampai_tanggal_pelaksanaan);

      return `${dari} – ${sampai}`;
    }

    return formatTanggal(row.tanggal_pelaksanaan);
  }

  protected jamLabel(row: KegiatanRow): string {
    const jam = row.jumlah_jam ?? row.jumlah_jam_pelatihan;

    return jam === undefined || jam === null ? '-' : `${jam} jam`;
  }

  private initialize(): void {
    const pegawaiUuid = this.route.snapshot.queryParamMap.get('pegawai_uuid');

    if (!pegawaiUuid) {
      this.load();
      return;
    }

    this.applyPegawaiUuid(pegawaiUuid);
  }

  private applyQueryFilter(uuid: string | null): void {
    if ((uuid ?? null) === (this.pegawaiFilter()?.uuid ?? null)) {
      return;
    }

    if (!uuid) {
      this.pegawaiControl.setValue(null, { emitEvent: false });
      this.pegawaiFilter.set(null);
      this.load();
      return;
    }

    this.applyPegawaiUuid(uuid);
  }

  private applyPegawaiUuid(uuid: string): void {
    this.pegawaiDirectory.get(uuid).subscribe((pegawai) => {
      if (!pegawai) {
        this.pegawaiControl.setValue(null, { emitEvent: false });
        this.pegawaiFilter.set(null);
        this.load();
        return;
      }

      this.pegawaiFilter.set(pegawai);
      this.pegawaiControl.setValue(pegawai, { emitEvent: false });
      this.load();
    });
  }

  private searchPegawai(term: string): void {
    const search = term.trim();

    if (!search) {
      this.pegawaiOptions.set([]);
      return;
    }

    const requestId = ++this.pegawaiSearchId;

    this.pegawaiService.list({ search }).subscribe({
      next: (page) => {
        if (requestId === this.pegawaiSearchId) {
          this.pegawaiOptions.set(page.content);
        }
      },
      error: () => {
        if (requestId === this.pegawaiSearchId) {
          this.pegawaiOptions.set([]);
        }
      },
    });
  }

  private syncPegawaiQuery(uuid: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pegawai_uuid: uuid },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private openForm(row: KegiatanRow | null): void {
    const dialogRef = this.dialog.open<KegiatanFormDialog, KegiatanFormData, KegiatanDialogResult>(
      KegiatanFormDialog,
      {
        data: {
          config: this.config,
          item: row,
          defaultPegawai: this.pegawaiFilter(),
        },
        width: '720px',
        maxWidth: '95vw',
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.pegawaiDirectory.load([result.item.pegawai_uuid]);

      if (result.action === 'created') {
        this.notify(`${this.config.label} baru berhasil ditambahkan.`);
        this.load();
        return;
      }

      this.notify(`${this.config.label} berhasil diperbarui.`);

      if (this.searchControl.value.trim() || this.pegawaiFilter()) {
        this.load();
        return;
      }

      this.rows.update((rows) =>
        rows.map((item) => (item.uuid === result.item.uuid ? result.item : item)),
      );
    });
  }

  private removeRow(row: KegiatanRow): void {
    const remaining = this.rows().filter((item) => item.uuid !== row.uuid);
    this.rows.set(remaining);

    if (remaining.length === 0) {
      this.load();
      return;
    }

    if (this.nextCursor() === row.uuid) {
      this.nextCursor.set(remaining[remaining.length - 1].uuid);
    }

    this.fillViewportIfNeeded();
  }

  private observeSentinel(): void {
    const element = this.sentinel()?.nativeElement;

    if (!element) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMore();
        }
      },
      { rootMargin: '400px 0px' },
    );
    this.observer.observe(element);
  }

  private fillViewportIfNeeded(): void {
    setTimeout(() => {
      const element = this.sentinel()?.nativeElement;

      if (element && element.getBoundingClientRect().top <= window.innerHeight + 400) {
        this.loadMore();
      }
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Tutup', { duration: 3000 });
  }

  private notifyError(message: string): void {
    this.snackBar.open(message, 'Tutup', {
      duration: 6000,
      panelClass: 'snackbar-error',
    });
  }
}
