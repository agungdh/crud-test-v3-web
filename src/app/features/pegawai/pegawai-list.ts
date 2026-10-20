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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { apiErrorMessage } from '../../core/api/error';
import { PegawaiService } from '../../core/api/pegawai.service';
import { GENDER_LABELS, Gender, Pegawai } from '../../core/models/pegawai';
import { formatTanggal } from '../../core/utils/date';
import { ConfirmDialog } from './confirm-dialog';
import { DialogResult, PegawaiFormDialog } from './pegawai-form-dialog';

@Component({
  selector: 'app-pegawai-list',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './pegawai-list.html',
  styleUrl: './pegawai-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PegawaiList {
  private readonly pegawaiService = inject(PegawaiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly columns = ['nip', 'nama', 'tanggal_lahir', 'gender', 'kontak', 'aksi'];
  protected readonly formatTanggal = formatTanggal;

  protected readonly rows = signal<Pegawai[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadMoreError = signal<string | null>(null);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly hasMore = computed(() => this.nextCursor() !== null);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;
  private requestId = 0;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());

    afterNextRender(() => this.observeSentinel());
    this.destroyRef.onDestroy(() => this.observer?.disconnect());

    this.load();
    this.openCreateFromQuery();
  }

  protected genderLabel(gender: Gender): string {
    return GENDER_LABELS[gender];
  }

  /** Loads the first page, discarding any rows from a previous search. */
  protected load(): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);

    this.pegawaiService.list({ search: this.searchControl.value }).subscribe({
      next: (page) => {
        if (requestId !== this.requestId) {
          return;
        }

        this.rows.set(page.content);
        this.nextCursor.set(page.next_cursor);
        this.loading.set(false);
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

  /** Loads the next cursor page and appends it to the table. */
  protected loadMore(): void {
    const cursor = this.nextCursor();

    if (!cursor || this.loading() || this.loadingMore() || this.loadMoreError()) {
      return;
    }

    const requestId = this.requestId;
    this.loadingMore.set(true);

    this.pegawaiService.list({ search: this.searchControl.value, cursor }).subscribe({
      next: (page) => {
        if (requestId !== this.requestId) {
          return;
        }

        this.rows.update((rows) => [...rows, ...page.content]);
        this.nextCursor.set(page.next_cursor);
        this.loadingMore.set(false);
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

  protected openEdit(pegawai: Pegawai): void {
    this.openForm(pegawai);
  }

  protected deleteRow(pegawai: Pegawai): void {
    const dialogRef = this.dialog.open<ConfirmDialog, Pegawai, boolean>(ConfirmDialog, {
      data: pegawai,
      width: '440px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.pegawaiService.delete(pegawai.uuid).subscribe({
        next: () => {
          this.notify(`Pegawai "${pegawai.nama}" berhasil dihapus.`);
          this.removeRow(pegawai);
        },
        error: (error: unknown) => this.notifyError(apiErrorMessage(error)),
      });
    });
  }

  private openForm(pegawai: Pegawai | null): void {
    const dialogRef = this.dialog.open<PegawaiFormDialog, Pegawai | null, DialogResult>(
      PegawaiFormDialog,
      {
        data: pegawai,
        width: '680px',
        maxWidth: '95vw',
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (result.action === 'created') {
        this.notify('Pegawai baru berhasil ditambahkan.');
        this.load();
        return;
      }

      this.notify('Data pegawai berhasil diperbarui.');

      if (this.searchControl.value.trim()) {
        this.load();
        return;
      }

      this.rows.update((rows) =>
        rows.map((row) => (row.uuid === result.pegawai.uuid ? result.pegawai : row)),
      );
    });
  }

  private openCreateFromQuery(): void {
    if (this.route.snapshot.queryParamMap.get('action') !== 'create') {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });

    this.openCreate();
  }

  /**
   * Removes a deleted row without reloading everything. If it was the cursor row,
   * the new last row becomes the cursor because keyset paging only needs any
   * loaded row to continue from.
   */
  private removeRow(pegawai: Pegawai): void {
    const remaining = this.rows().filter((row) => row.uuid !== pegawai.uuid);
    this.rows.set(remaining);

    if (remaining.length === 0) {
      this.load();
      return;
    }

    if (this.nextCursor() === pegawai.uuid) {
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

  /**
   * After a page renders, keep loading while the sentinel is still above the
   * viewport. Needed on very tall screens where the first page does not fill
   * the screen and the sentinel never leaves the intersection area.
   */
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
