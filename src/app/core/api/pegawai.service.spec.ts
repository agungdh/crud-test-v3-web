import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { PegawaiService } from './pegawai.service';

describe('PegawaiService', () => {
  let service: PegawaiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });

    service = TestBed.inject(PegawaiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists pegawai with search and cursor params', () => {
    service.list({ search: ' budi ', cursor: 'cursor-uuid' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/pegawai');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('budi');
    expect(request.request.params.get('cursor')).toBe('cursor-uuid');

    request.flush({ content: [], next_cursor: null });
  });

  it('omits blank search from the query string', () => {
    service.list({ search: '   ' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/pegawai');
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('cursor')).toBe(false);

    request.flush({ content: [], next_cursor: null });
  });

  it('creates a pegawai', () => {
    const payload = {
      nip: '199001012020011001',
      nama: 'Budi Santoso',
      tanggal_lahir: '1990-01-01',
      gender: 'male' as const,
      email: 'budi@example.com',
      no_telepon: '081234567890',
      alamat: 'Jakarta',
    };

    service.create(payload).subscribe();

    const request = httpMock.expectOne('http://api.test/pegawai');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush({ uuid: 'uuid-1', ...payload });
  });

  it('updates a pegawai by uuid', () => {
    const payload = {
      nip: '199001012020011001',
      nama: 'Budi Santoso',
      tanggal_lahir: '1990-01-01',
      gender: 'male' as const,
      email: null,
      no_telepon: null,
      alamat: null,
    };

    service.update('uuid-1', payload).subscribe();

    const request = httpMock.expectOne('http://api.test/pegawai/uuid-1');
    expect(request.request.method).toBe('PUT');

    request.flush({ uuid: 'uuid-1', ...payload });
  });

  it('deletes a pegawai by uuid', () => {
    service.delete('uuid-1').subscribe();

    const request = httpMock.expectOne('http://api.test/pegawai/uuid-1');
    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });
});
