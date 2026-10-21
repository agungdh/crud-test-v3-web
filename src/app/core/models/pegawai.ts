export type Gender = 'male' | 'female';

export interface Pegawai {
  uuid: string;
  nip: string;
  nama: string;
  tanggal_lahir: string;
  gender: Gender;
  email: string | null;
  no_telepon: string | null;
  alamat: string | null;
}

export interface PegawaiRequest {
  nip: string;
  nama: string;
  tanggal_lahir: string;
  gender: Gender;
  email: string | null;
  no_telepon: string | null;
  alamat: string | null;
}

export type { ApiError, CursorPage } from './api';

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};
