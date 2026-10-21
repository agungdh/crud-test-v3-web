import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { KegiatanService } from './kegiatan.service';

describe('KegiatanService', () => {
  let service: KegiatanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });

    service = TestBed.inject(KegiatanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists a resource with search, pegawai filter and cursor params', () => {
    service
      .list('seminar', { search: ' budi ', pegawaiUuid: 'pegawai-1', cursor: 'cursor-1' })
      .subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/seminar');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('budi');
    expect(request.request.params.get('pegawai_uuid')).toBe('pegawai-1');
    expect(request.request.params.get('cursor')).toBe('cursor-1');

    request.flush({ content: [], next_cursor: null });
  });

  it('omits blank filters from the query string', () => {
    service.list('belajar-mandiri', { search: '   ' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/belajar-mandiri');
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('pegawai_uuid')).toBe(false);
    expect(request.request.params.has('cursor')).toBe(false);

    request.flush({ content: [], next_cursor: null });
  });

  it('gets one row by uuid', () => {
    service.get('webinar', 'uuid-1').subscribe();

    const request = httpMock.expectOne('http://api.test/webinar/uuid-1');
    expect(request.request.method).toBe('GET');

    request.flush({ uuid: 'uuid-1', pegawai_uuid: 'pegawai-1' });
  });

  it('creates a diklat with the date range and jenis pelatihan', () => {
    const payload = {
      pegawai_uuid: 'pegawai-1',
      jenis_pelatihan_uuid: 'jenis-1',
      nomor_surat: 'SR-001',
      materi_pengembangan: 'Kepemimpinan',
      dari_tanggal_pelaksanaan: '2026-01-05',
      sampai_tanggal_pelaksanaan: '2026-01-09',
      jumlah_jam_pelatihan: 40,
    };

    service.create('diklat', payload).subscribe();

    const request = httpMock.expectOne('http://api.test/diklat');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush({ uuid: 'uuid-1', ...payload });
  });

  it('creates a seminar with a single date and jumlah_jam', () => {
    const payload = {
      pegawai_uuid: 'pegawai-1',
      materi_pengembangan: 'Riset pasar',
      tanggal_pelaksanaan: '2026-02-10',
      jumlah_jam: 4,
    };

    service.create('seminar', payload).subscribe();

    const request = httpMock.expectOne('http://api.test/seminar');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush({ uuid: 'uuid-1', ...payload });
  });

  it('updates a ppm by uuid', () => {
    const payload = {
      pegawai_uuid: 'pegawai-1',
      nomor_surat: 'SR-002',
      materi_pengembangan: 'Pengembangan profesi',
      tanggal_pelaksanaan: '2026-03-01',
      jumlah_jam_pelatihan: 8,
    };

    service.update('ppm', 'uuid-1', payload).subscribe();

    const request = httpMock.expectOne('http://api.test/ppm/uuid-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);

    request.flush({ uuid: 'uuid-1', ...payload });
  });

  it('deletes a row by uuid', () => {
    service.delete('workshop', 'uuid-1').subscribe();

    const request = httpMock.expectOne('http://api.test/workshop/uuid-1');
    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });
});
