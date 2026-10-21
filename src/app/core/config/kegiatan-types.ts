import { KegiatanSlug } from '../models/kegiatan';

/**
 * UI metadata for one kegiatan resource. Keeping the variants declarative means
 * the sidebar, routes, list and form all share a single implementation.
 */
export interface KegiatanTypeConfig {
  slug: KegiatanSlug;
  label: string;
  description: string;
  icon: string;
  /** diklat and ppm carry `nomor_surat`. */
  hasNomorSurat: boolean;
  /** only diklat has a `jenis_pelatihan_uuid`. */
  hasJenisPelatihan: boolean;
  /** only diklat uses a start/end date range instead of a single date. */
  hasDateRange: boolean;
  /** diklat and ppm name the hours field `jumlah_jam_pelatihan`. */
  jamField: 'jumlah_jam' | 'jumlah_jam_pelatihan';
}

export const KEGIATAN_TYPES: readonly KegiatanTypeConfig[] = [
  {
    slug: 'diklat',
    label: 'Diklat',
    description: 'Kelola riwayat pendidikan dan pelatihan pegawai.',
    icon: 'school',
    hasNomorSurat: true,
    hasJenisPelatihan: true,
    hasDateRange: true,
    jamField: 'jumlah_jam_pelatihan',
  },
  {
    slug: 'ppm',
    label: 'PPM',
    description: 'Kelola data pengembangan profesi pegawai.',
    icon: 'engineering',
    hasNomorSurat: true,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam_pelatihan',
  },
  {
    slug: 'seminar',
    label: 'Seminar',
    description: 'Kelola riwayat seminar pegawai.',
    icon: 'record_voice_over',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'webinar',
    label: 'Webinar',
    description: 'Kelola riwayat webinar pegawai.',
    icon: 'videocam',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'lc',
    label: 'LC',
    description: 'Kelola riwayat learning center pegawai.',
    icon: 'menu_book',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'belajar-mandiri',
    label: 'Belajar Mandiri',
    description: 'Kelola riwayat belajar mandiri pegawai.',
    icon: 'self_improvement',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'mentoring',
    label: 'Mentoring',
    description: 'Kelola riwayat mentoring pegawai.',
    icon: 'supervisor_account',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'coaching',
    label: 'Coaching',
    description: 'Kelola riwayat coaching pegawai.',
    icon: 'psychology',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
  {
    slug: 'workshop',
    label: 'Workshop',
    description: 'Kelola riwayat workshop pegawai.',
    icon: 'handyman',
    hasNomorSurat: false,
    hasJenisPelatihan: false,
    hasDateRange: false,
    jamField: 'jumlah_jam',
  },
];

export const KEGIATAN_BY_SLUG = KEGIATAN_TYPES.reduce(
  (map, config) => {
    map[config.slug] = config;

    return map;
  },
  {} as Record<KegiatanSlug, KegiatanTypeConfig>,
);

export function kegiatanConfig(slug: KegiatanSlug): KegiatanTypeConfig {
  return KEGIATAN_BY_SLUG[slug];
}
