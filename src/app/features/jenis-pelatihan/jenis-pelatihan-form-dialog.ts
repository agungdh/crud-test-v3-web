import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { apiErrorMessage } from '../../core/api/error';
import { JenisPelatihanService } from '../../core/api/jenis-pelatihan.service';
import { JenisPelatihan, JenisPelatihanRequest } from '../../core/models/jenis-pelatihan';
import { notBlankValidator } from '../../core/utils/validators';

export interface DialogResult {
  action: 'created' | 'updated';
  jenis: JenisPelatihan;
}

@Component({
  selector: 'app-jenis-pelatihan-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './jenis-pelatihan-form-dialog.html',
  styleUrl: './jenis-pelatihan-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JenisPelatihanFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(JenisPelatihanService);
  private readonly dialogRef =
    inject<MatDialogRef<JenisPelatihanFormDialog, DialogResult>>(MatDialogRef);

  protected readonly data = inject<JenisPelatihan | null>(MAT_DIALOG_DATA);
  protected readonly isEdit = this.data !== null;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nama: ['', [Validators.required, notBlankValidator, Validators.maxLength(150)]],
  });

  constructor() {
    if (this.data) {
      this.form.patchValue({ nama: this.data.nama });
    }
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: JenisPelatihanRequest = {
      nama: this.form.getRawValue().nama.trim(),
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const operation = this.data
      ? this.service.update(this.data.uuid, request)
      : this.service.create(request);

    operation.subscribe({
      next: (jenis) =>
        this.dialogRef.close({
          action: this.data ? 'updated' : 'created',
          jenis,
        }),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }
}
