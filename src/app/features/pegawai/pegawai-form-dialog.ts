import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { apiErrorMessage, isDuplicateNip } from '../../core/api/error';
import { PegawaiService } from '../../core/api/pegawai.service';
import { Gender, Pegawai, PegawaiRequest } from '../../core/models/pegawai';
import { parseIsoDate, toIsoDate, yesterday } from '../../core/utils/date';

export interface DialogResult {
  action: 'created' | 'updated';
  pegawai: Pegawai;
}

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Date | null;

  if (!value) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return value < today ? null : { past: true };
}

@Component({
  selector: 'app-pegawai-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressBarModule,
  ],
  templateUrl: './pegawai-form-dialog.html',
  styleUrl: './pegawai-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PegawaiFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly pegawaiService = inject(PegawaiService);
  private readonly dialogRef = inject<MatDialogRef<PegawaiFormDialog, DialogResult>>(MatDialogRef);

  protected readonly data = inject<Pegawai | null>(MAT_DIALOG_DATA);
  protected readonly isEdit = this.data !== null;
  protected readonly maxBirthDate = yesterday();
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nip: ['', [Validators.required, Validators.maxLength(30)]],
    nama: ['', [Validators.required, Validators.maxLength(150)]],
    tanggal_lahir: this.fb.control<Date | null>(null, [Validators.required, pastDateValidator]),
    gender: this.fb.nonNullable.control<Gender>('male'),
    email: ['', [Validators.email, Validators.maxLength(150)]],
    no_telepon: ['', [Validators.maxLength(30)]],
    alamat: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    if (this.data) {
      this.form.patchValue({
        nip: this.data.nip,
        nama: this.data.nama,
        tanggal_lahir: parseIsoDate(this.data.tanggal_lahir),
        gender: this.data.gender,
        email: this.data.email ?? '',
        no_telepon: this.data.no_telepon ?? '',
        alamat: this.data.alamat ?? '',
      });
    }

    this.form.controls.nip.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.clearDuplicateError());
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: PegawaiRequest = {
      nip: value.nip.trim(),
      nama: value.nama.trim(),
      tanggal_lahir: toIsoDate(value.tanggal_lahir),
      gender: value.gender,
      email: value.email.trim() || null,
      no_telepon: value.no_telepon.trim() || null,
      alamat: value.alamat.trim() || null,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    const operation = this.data
      ? this.pegawaiService.update(this.data.uuid, request)
      : this.pegawaiService.create(request);

    operation.subscribe({
      next: (pegawai) =>
        this.dialogRef.close({
          action: this.data ? 'updated' : 'created',
          pegawai,
        }),
      error: (error: unknown) => {
        this.saving.set(false);

        if (isDuplicateNip(error)) {
          this.form.controls.nip.setErrors({
            ...(this.form.controls.nip.errors ?? {}),
            duplicate: true,
          });
          this.form.controls.nip.markAsTouched();
          return;
        }

        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  private clearDuplicateError(): void {
    const errors = this.form.controls.nip.errors;

    if (!errors?.['duplicate']) {
      return;
    }

    const { duplicate: _duplicate, ...rest } = errors;
    this.form.controls.nip.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }
}
