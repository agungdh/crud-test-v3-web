import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Pegawai } from '../../core/models/pegawai';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Hapus Pegawai?</h2>

    <mat-dialog-content>
      <div class="warning">
        <mat-icon>warning_amber</mat-icon>
        <p>
          Data pegawai <strong>{{ data.nama }}</strong> dengan NIP
          <strong>{{ data.nip }}</strong> akan dihapus. Pegawai tidak akan tampil lagi di daftar.
        </p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Batal</button>
      <button mat-flat-button type="button" class="danger-filled" [mat-dialog-close]="true">
        Hapus
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .warning {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .warning mat-icon {
      color: var(--mat-sys-error);
    }

    .warning p {
      margin: 0;
      line-height: 1.5;
    }

    .danger-filled {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<Pegawai>(MAT_DIALOG_DATA);
}
