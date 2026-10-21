/**
 * Slugs match the backend resource paths one-to-one.
 */
export type KegiatanSlug =
  | 'diklat'
  | 'ppm'
  | 'seminar'
  | 'webinar'
  | 'lc'
  | 'belajar-mandiri'
  | 'mentoring'
  | 'coaching'
  | 'workshop';

/**
 * Broad row shape shared by all kegiatan endpoints. Variant-only fields are
 * optional because Jackson omits them for the other resource types:
 * - diklat: nomor_surat, jenis_pelatihan_uuid, date range, jumlah_jam_pelatihan
 * - ppm: nomor_surat, jumlah_jam_pelatihan
 * - the other seven: tanggal_pelaksanaan + jumlah_jam
 */
export interface KegiatanRow {
  uuid: string;
  pegawai_uuid: string;
  materi_pengembangan: string;
  tanggal_pelaksanaan?: string;
  jumlah_jam?: number;
  nomor_surat?: string;
  dari_tanggal_pelaksanaan?: string;
  sampai_tanggal_pelaksanaan?: string;
  jumlah_jam_pelatihan?: number;
  jenis_pelatihan_uuid?: string;
}

export interface KegiatanRequest {
  pegawai_uuid: string;
  materi_pengembangan: string;
  tanggal_pelaksanaan: string;
  jumlah_jam: number;
}

export interface PpmRequest {
  pegawai_uuid: string;
  nomor_surat: string;
  materi_pengembangan: string;
  tanggal_pelaksanaan: string;
  jumlah_jam_pelatihan: number;
}

export interface DiklatRequest {
  pegawai_uuid: string;
  jenis_pelatihan_uuid: string;
  nomor_surat: string;
  materi_pengembangan: string;
  dari_tanggal_pelaksanaan: string;
  sampai_tanggal_pelaksanaan: string;
  jumlah_jam_pelatihan: number;
}

export type KegiatanRequestPayload = KegiatanRequest | PpmRequest | DiklatRequest;
