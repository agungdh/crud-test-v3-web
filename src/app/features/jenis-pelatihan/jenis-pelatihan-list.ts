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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { apiErrorMessage } from '../../core/api/error';
import { JenisPelatihanService } from '../../core/api/jenis-pelatihan.service';
import { JenisPelatihan } from '../../core/models/jenis-pelatihan';
import { ConfirmDialog, ConfirmDialogData } from '../../core/ui/confirm-dialog';
import { DialogResult, JenisPelatihanFormDialog } from './jenis-pelatihan-form-dialog';

@Component({
  selector: 'app-jenis-pelatihan-list',
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
  templateUrl: './jenis-pelatihan-list.html',
  styleUrl: './jenis-pelatihan-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JenisPelatihanList {
  private readonly service = inject(JenisPelatihanService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly columns = ['nama', 'aksi'];

  protected readonly rows = signal<JenisPelatihan[]>([]);
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
  }

  protected load(): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);

    this.service.list({ search: this.searchControl.value }).subscribe({
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

  protected loadMore(): void {
    const cursor = this.nextCursor();

    if (!cursor || this.loading() || this.loadingMore() || this.loadMoreError()) {
      return;
    }

    const requestId = this.requestId;
    this.loadingMore.set(true);

    this.service.list({ search: this.searchControl.value, cursor }).subscribe({
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

  protected openEdit(jenis: JenisPelatihan): void {
    this.openForm(jenis);
  }

  protected deleteRow(jenis: JenisPelatihan): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Hapus Jenis Pelatihan?',
        message: `Jenis pelatihan "${jenis.nama}" akan dihapus. Data tidak akan tampil lagi di daftar.`,
      },
      width: '440px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.service.delete(jenis.uuid).subscribe({
        next: () => {
          this.notify(`Jenis pelatihan "${jenis.nama}" berhasil dihapus.`);
          this.removeRow(jenis);
        },
        error: (error: unknown) => this.notifyError(apiErrorMessage(error)),
      });
    });
  }

  private openForm(jenis: JenisPelatihan | null): void {
    const dialogRef = this.dialog.open<
      JenisPelatihanFormDialog,
      JenisPelatihan | null,
      DialogResult
    >(JenisPelatihanFormDialog, {
      data: jenis,
      width: '520px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (result.action === 'created') {
        this.notify('Jenis pelatihan baru berhasil ditambahkan.');
        this.load();
        return;
      }

      this.notify('Jenis pelatihan berhasil diperbarui.');

      if (this.searchControl.value.trim()) {
        this.load();
        return;
      }

      this.rows.update((rows) =>
        rows.map((row) => (row.uuid === result.jenis.uuid ? result.jenis : row)),
      );
    });
  }

  private removeRow(jenis: JenisPelatihan): void {
    const remaining = this.rows().filter((row) => row.uuid !== jenis.uuid);
    this.rows.set(remaining);

    if (remaining.length === 0) {
      this.load();
      return;
    }

    if (this.nextCursor() === jenis.uuid) {
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
