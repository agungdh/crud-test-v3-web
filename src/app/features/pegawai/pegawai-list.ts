import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly columns = ['nip', 'nama', 'tanggal_lahir', 'gender', 'kontak', 'aksi'];
  protected readonly formatTanggal = formatTanggal;

  protected readonly rows = signal<Pegawai[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pageIndex = signal(1);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly canPrevious = computed(() => this.pageIndex() > 1);

  private cursorStack: (string | null)[] = [null];
  private requestId = 0;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.cursorStack = [null];
        this.pageIndex.set(1);
        this.load();
      });

    this.load();
    this.openCreateFromQuery();
  }

  protected genderLabel(gender: Gender): string {
    return GENDER_LABELS[gender];
  }

  protected load(): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);

    this.pegawaiService
      .list({ search: this.searchControl.value, cursor: this.currentCursor() })
      .subscribe({
        next: (page) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.rows.set(page.content);
          this.nextCursor.set(page.next_cursor);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (requestId !== this.requestId) {
            return;
          }

          this.error.set(apiErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected nextPage(): void {
    const cursor = this.nextCursor();

    if (!cursor || this.loading()) {
      return;
    }

    this.cursorStack.push(cursor);
    this.pageIndex.update((page) => page + 1);
    this.load();
  }

  protected previousPage(): void {
    if (!this.canPrevious() || this.loading()) {
      return;
    }

    this.cursorStack.pop();
    this.pageIndex.update((page) => page - 1);
    this.load();
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

          if (this.rows().length === 1 && this.canPrevious()) {
            this.previousPage();
          } else {
            this.load();
          }
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

      this.notify(
        result === 'created'
          ? 'Pegawai baru berhasil ditambahkan.'
          : 'Data pegawai berhasil diperbarui.',
      );

      if (result === 'created') {
        this.cursorStack = [null];
        this.pageIndex.set(1);
      }

      this.load();
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

  private currentCursor(): string | null {
    return this.cursorStack[this.cursorStack.length - 1] ?? null;
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
