import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/api/api.config';
import { apiErrorMessage } from '../../core/api/error';
import { PegawaiService } from '../../core/api/pegawai.service';
import { KEGIATAN_TYPES } from '../../core/config/kegiatan-types';
import { GENDER_LABELS, Gender, Pegawai } from '../../core/models/pegawai';
import { formatTanggal } from '../../core/utils/date';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatTableModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly pegawaiService = inject(PegawaiService);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly swaggerUrl = `${this.baseUrl}/swagger-ui.html`;
  protected readonly kegiatanTypes = KEGIATAN_TYPES;
  protected readonly columns = ['nip', 'nama', 'tanggal_lahir', 'gender'];
  protected readonly formatTanggal = formatTanggal;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly latest = signal<Pegawai[]>([]);

  constructor() {
    this.load();
  }

  protected genderLabel(gender: Gender): string {
    return GENDER_LABELS[gender];
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.pegawaiService.list().subscribe({
      next: (page) => {
        this.latest.set(page.content.slice(0, 5));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
