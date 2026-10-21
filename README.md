# Admin Pegawai

Frontend admin dashboard untuk backend pegawai Spring Boot di
`/home/agungdh/IdeaProjects/demo`. Dibangun dengan Angular 22 dan Angular Material 3.

## Fitur

- Layout admin dengan sidebar responsif (mode `side` di desktop, `over` di mobile).
- Halaman dashboard berisi shortcut, tautan ke semua jenis kegiatan, dan 5 data pegawai terbaru.
- CRUD pegawai: daftar, pencarian server-side (nama/NIP), tambah, edit, dan hapus (soft delete).
- CRUD jenis pelatihan sebagai lookup untuk data diklat.
- CRUD 9 resource kegiatan: diklat, PPM, seminar, webinar, LC, belajar mandiri,
  mentoring, coaching, dan workshop.
- Setiap daftar kegiatan mendukung pencarian server-side, filter pegawai, dan
  infinite scroll. Filter pegawai disimpan di query param `pegawai_uuid` sehingga
  bisa dibuka langsung dari daftar pegawai.
- Form kegiatan menyesuaikan field per resource: nomor surat (diklat/PPM),
  rentang tanggal dan jenis pelatihan (diklat), serta jumlah jam.
- Form reaktif dengan validasi yang sama seperti backend, datepicker locale `id-ID`,
  penanganan NIP duplikat (409), validasi rentang tanggal diklat, dan snackbar notifikasi.

## Menjalankan

Backend harus berjalan di `http://localhost:8080`.

```bash
# di repo backend
docker compose up -d
./gradlew bootRun

# opsional: isi 1000 data dummy
make seed
```

Lalu jalankan frontend:

```bash
npm install
npm start
```

Buka `http://localhost:4200/`. CORS backend sudah mengizinkan semua port localhost,
jadi frontend memanggil API secara langsung tanpa proxy.

Base URL API diatur lewat token `API_BASE_URL` di `src/app/app.config.ts`.

## Perintah

```bash
npm start        # dev server di port 4200
npm run build    # production build ke dist/
npm test         # unit test (Vitest)
```

## Struktur

```
src/app/
├── core/
│   ├── api/       # service HTTP per resource + cache nama pegawai
│   ├── config/    # metadata 9 jenis kegiatan (slug, label, icon, varian field)
│   ├── models/    # tipe request/response dan cursor page
│   ├── ui/        # dialog konfirmasi generik
│   └── utils/     # helper tanggal dan validator
├── layout/        # shell admin: sidebar + topbar
└── features/
    ├── dashboard/         # ringkasan dan pegawai terbaru
    ├── jenis-pelatihan/   # tabel, form dialog, dan hapus
    ├── kegiatan/          # satu komponen generik untuk 9 resource
    └── pegawai/           # tabel, form dialog, dan dialog konfirmasi hapus
```

## Rute

| Rute                                                       | Keterangan                                      |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `/dashboard`                                               | Ringkasan data                                  |
| `/pegawai`                                                 | CRUD pegawai                                    |
| `/jenis-pelatihan`                                         | CRUD lookup jenis pelatihan                     |
| `/diklat`                                                  | CRUD diklat (rentang tanggal + jenis pelatihan) |
| `/ppm`                                                     | CRUD PPM                                        |
| `/seminar`, `/webinar`, `/lc`                              | CRUD kegiatan sederhana                         |
| `/belajar-mandiri`, `/mentoring`, `/coaching`, `/workshop` | CRUD kegiatan sederhana                         |

## Catatan API

- Response dan request memakai JSON snake_case (`tanggal_lahir`, `no_telepon`, dst).
- Identifier publik adalah `uuid`; numeric id tidak pernah dipakai di frontend.
- Semua daftar memakai cursor pagination: kirim `next_cursor` dari response sebelumnya
  sebagai `cursor`. Halaman berisi maksimal 20 baris.
- Pencarian pegawai mencocokkan `lower(nama)` dan `nip`; NIP yang mengandung huruf
  besar tidak akan cocok karena backend me-lowercase pola pencariannya.
- Setiap endpoint kegiatan menerima `search` (materi pengembangan; diklat dan PPM juga
  nomor surat) dan `pegawai_uuid`.
- Nama field jam berbeda: `jumlah_jam` untuk seminar/webinar/LC/belajar mandiri/
  mentoring/coaching/workshop, dan `jumlah_jam_pelatihan` untuk diklat/PPM.
- Diklat memakai `dari_tanggal_pelaksanaan` dan `sampai_tanggal_pelaksanaan`; resource
  lain memakai `tanggal_pelaksanaan`. Backend menolak rentang terbalik dengan `400`.
- Response kegiatan hanya mengembalikan `pegawai_uuid`, jadi frontend mengambil nama
  pegawai lewat cache `PegawaiDirectoryService` untuk kolom daftar.
