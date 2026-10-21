import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { JenisPelatihanService } from './jenis-pelatihan.service';

describe('JenisPelatihanService', () => {
  let service: JenisPelatihanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });

    service = TestBed.inject(JenisPelatihanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists jenis pelatihan with search and cursor params', () => {
    service.list({ search: ' kepemimpinan ', cursor: 'cursor-1' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/jenis-pelatihan');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('kepemimpinan');
    expect(request.request.params.get('cursor')).toBe('cursor-1');

    request.flush({ content: [], next_cursor: null });
  });

  it('omits blank search from the query string', () => {
    service.list({ search: '  ' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === 'http://api.test/jenis-pelatihan');
    expect(request.request.params.has('search')).toBe(false);
    expect(request.request.params.has('cursor')).toBe(false);

    request.flush({ content: [], next_cursor: null });
  });

  it('creates a jenis pelatihan', () => {
    service.create({ nama: 'Sertifikasi' }).subscribe();

    const request = httpMock.expectOne('http://api.test/jenis-pelatihan');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nama: 'Sertifikasi' });

    request.flush({ uuid: 'uuid-1', nama: 'Sertifikasi' });
  });

  it('updates a jenis pelatihan by uuid', () => {
    service.update('uuid-1', { nama: 'Sertifikasi Baru' }).subscribe();

    const request = httpMock.expectOne('http://api.test/jenis-pelatihan/uuid-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nama: 'Sertifikasi Baru' });

    request.flush({ uuid: 'uuid-1', nama: 'Sertifikasi Baru' });
  });

  it('deletes a jenis pelatihan by uuid', () => {
    service.delete('uuid-1').subscribe();

    const request = httpMock.expectOne('http://api.test/jenis-pelatihan/uuid-1');
    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });
});
