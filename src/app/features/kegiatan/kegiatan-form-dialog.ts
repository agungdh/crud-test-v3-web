import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api/error';
import { JenisPelatihanService } from '../../core/api/jenis-pelatihan.service';
import { KegiatanService } from '../../core/api/kegiatan.service';
import { PegawaiDirectoryService } from '../../core/api/pegawai-directory.service';
import { PegawaiService } from '../../core/api/pegawai.service';
import { KegiatanTypeConfig } from '../../core/config/kegiatan-types';
import { JenisPelatihan } from '../../core/models/jenis-pelatihan';
import {
  DiklatRequest,
  KegiatanRequest,
  KegiatanRequestPayload,
  KegiatanRow,
  PpmRequest,
} from '../../core/models/kegiatan';
import { Pegawai } from '../../core/models/pegawai';
import { parseIsoDate, toIsoDate } from '../../core/utils/date';
import {
  dateRangeValidator,
  integerValidator,
  notBlankValidator,
} from '../../core/utils/validators';

export interface KegiatanFormData {
  config: KegiatanTypeConfig;
  item: KegiatanRow | null;
  defaultPegawai: Pegawai | null;
}

export interface KegiatanDialogResult {
  action: 'created' | 'updated';
  item: KegiatanRow;
}

interface KegiatanFormValue {
  pegawai: Pegawai | string | null;
  jenis_pelatihan: JenisPelatihan | string | null;
  nomor_surat: string | null;
  materi_pengembangan: string | null;
  dari_tanggal_pelaksanaan: Date | null;
  sampai_tanggal_pelaksanaan: Date | null;
  tanggal_pelaksanaan: Date | null;
  jumlah_jam: number | null;
}

@Component({
  selector: 'app-kegiatan-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatProgressBarModule,
  ],
  templateUrl: './kegiatan-form-dialog.html',
  styleUrl: './kegiatan-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KegiatanFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly kegiatanService = inject(KegiatanService);
  private readonly pegawaiService = inject(PegawaiService);
  private readonly pegawaiDirectory = inject(PegawaiDirectoryService);
  private readonly jenisPelatihanService = inject(JenisPelatihanService);
  private readonly dialogRef =
    inject<MatDialogRef<KegiatanFormDialog, KegiatanDialogResult>>(MatDialogRef);

  protected readonly data = inject<KegiatanFormData>(MAT_DIALOG_DATA);
  protected readonly config = this.data.config;
  protected readonly isEdit = this.data.item !== null;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pegawaiOptions = signal<Pegawai[]>([]);
  protected readonly jenisPelatihanOptions = signal<JenisPelatihan[]>([]);

  protected readonly form = this.fb.group({
    pegawai: this.fb.control<Pegawai | string | null>(null, Validators.required),
    jenis_pelatihan: this.fb.control<JenisPelatihan | string | null>(null),
    nomor_surat: ['', [Validators.maxLength(150)]],
    materi_pengembangan: ['', [Validators.required, notBlankValidator, Validators.maxLength(255)]],
    dari_tanggal_pelaksanaan: this.fb.control<Date | null>(null),
    sampai_tanggal_pelaksanaan: this.fb.control<Date | null>(null),
    tanggal_pelaksanaan: this.fb.control<Date | null>(null),
    jumlah_jam: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      integerValidator,
    ]),
  });

  constructor() {
    this.applyConditionalValidators();
    this.watchPegawaiInput();
    this.watchJenisPelatihanInput();

    if (this.data.item) {
      this.patchItem(this.data.item);
    } else if (this.data.defaultPegawai) {
      this.form.controls.pegawai.setValue(this.data.defaultPegawai);
    }
  }

  protected displayPegawai(value: Pegawai | string | null): string {
    return typeof value === 'string' ? value : (value?.nama ?? '');
  }

  protected displayJenisPelatihan(value: JenisPelatihan | string | null): string {
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

  protected onJenisPelatihanFocus(): void {
    if (this.jenisPelatihanOptions().length > 0) {
      return;
    }

    this.loadJenisPelatihan('');
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
    const pegawai = value.pegawai;

    if (!pegawai || typeof pegawai === 'string') {
      this.form.controls.pegawai.setErrors({ required: true });
      this.form.controls.pegawai.markAsTouched();
      return;
    }

    const jenis = value.jenis_pelatihan;

    if (this.config.hasJenisPelatihan && (!jenis || typeof jenis === 'string')) {
      this.form.controls.jenis_pelatihan.setErrors({ required: true });
      this.form.controls.jenis_pelatihan.markAsTouched();
      return;
    }

    const request = this.buildRequest(pegawai, value);

    this.saving.set(true);
    this.errorMessage.set(null);

    const operation = this.data.item
      ? this.kegiatanService.update(this.config.slug, this.data.item.uuid, request)
      : this.kegiatanService.create(this.config.slug, request);

    operation.subscribe({
      next: (item) =>
        this.dialogRef.close({
          action: this.data.item ? 'updated' : 'created',
          item,
        }),
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  private applyConditionalValidators(): void {
    if (this.config.hasJenisPelatihan) {
      this.form.controls.jenis_pelatihan.addValidators(Validators.required);
    }

    if (this.config.hasNomorSurat) {
      this.form.controls.nomor_surat.addValidators([Validators.required, notBlankValidator]);
    }

    if (this.config.hasDateRange) {
      this.form.controls.dari_tanggal_pelaksanaan.addValidators(Validators.required);
      this.form.controls.sampai_tanggal_pelaksanaan.addValidators(Validators.required);
      this.form.addValidators(
        dateRangeValidator('dari_tanggal_pelaksanaan', 'sampai_tanggal_pelaksanaan'),
      );
    } else {
      this.form.controls.tanggal_pelaksanaan.addValidators(Validators.required);
    }

    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private watchPegawaiInput(): void {
    this.form.controls.pegawai.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value): value is string => typeof value === 'string'),
        switchMap((term) => this.pegawaiService.list({ search: term })),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (page) => this.pegawaiOptions.set(page.content),
        error: () => this.pegawaiOptions.set([]),
      });
  }

  private watchJenisPelatihanInput(): void {
    this.form.controls.jenis_pelatihan.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value): value is string => typeof value === 'string'),
        switchMap((term) => this.jenisPelatihanService.list({ search: term })),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (page) => this.jenisPelatihanOptions.set(page.content),
        error: () => this.jenisPelatihanOptions.set([]),
      });
  }

  private loadJenisPelatihan(search: string): void {
    this.jenisPelatihanService.list({ search }).subscribe({
      next: (page) => this.jenisPelatihanOptions.set(page.content),
      error: () => this.jenisPelatihanOptions.set([]),
    });
  }

  private patchItem(item: KegiatanRow): void {
    this.form.patchValue({
      nomor_surat: item.nomor_surat ?? '',
      materi_pengembangan: item.materi_pengembangan,
      dari_tanggal_pelaksanaan: parseIsoDate(item.dari_tanggal_pelaksanaan),
      sampai_tanggal_pelaksanaan: parseIsoDate(item.sampai_tanggal_pelaksanaan),
      tanggal_pelaksanaan: parseIsoDate(item.tanggal_pelaksanaan),
      jumlah_jam: item.jumlah_jam ?? item.jumlah_jam_pelatihan ?? 0,
    });

    this.pegawaiDirectory.get(item.pegawai_uuid).subscribe((pegawai) => {
      if (pegawai) {
        this.form.controls.pegawai.setValue(pegawai);
      }
    });

    if (this.config.hasJenisPelatihan && item.jenis_pelatihan_uuid) {
      const uuid = item.jenis_pelatihan_uuid;

      this.jenisPelatihanService.get(uuid).subscribe({
        next: (jenis) => this.form.controls.jenis_pelatihan.setValue(jenis),
        error: () => this.errorMessage.set('Jenis pelatihan terkait tidak ditemukan.'),
      });
    }
  }

  private buildRequest(pegawai: Pegawai, value: KegiatanFormValue): KegiatanRequestPayload {
    const base = {
      pegawai_uuid: pegawai.uuid,
      materi_pengembangan: (value.materi_pengembangan ?? '').trim(),
    };
    const jam = value.jumlah_jam ?? 0;
    const jenis = value.jenis_pelatihan;

    if (this.config.hasDateRange) {
      const request: DiklatRequest = {
        ...base,
        jenis_pelatihan_uuid: jenis && typeof jenis !== 'string' ? jenis.uuid : '',
        nomor_surat: (value.nomor_surat ?? '').trim(),
        dari_tanggal_pelaksanaan: toIsoDate(value.dari_tanggal_pelaksanaan),
        sampai_tanggal_pelaksanaan: toIsoDate(value.sampai_tanggal_pelaksanaan),
        jumlah_jam_pelatihan: jam,
      };

      return request;
    }

    if (this.config.hasNomorSurat) {
      const request: PpmRequest = {
        ...base,
        nomor_surat: (value.nomor_surat ?? '').trim(),
        tanggal_pelaksanaan: toIsoDate(value.tanggal_pelaksanaan),
        jumlah_jam_pelatihan: jam,
      };

      return request;
    }

    const request: KegiatanRequest = {
      ...base,
      tanggal_pelaksanaan: toIsoDate(value.tanggal_pelaksanaan),
      jumlah_jam: jam,
    };

    return request;
  }
}
