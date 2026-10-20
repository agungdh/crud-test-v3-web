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

export interface CursorPage<T> {
  content: T[];
  next_cursor: string | null;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};
