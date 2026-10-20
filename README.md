# Admin Pegawai

Frontend admin dashboard untuk backend pegawai Spring Boot di
`/home/agungdh/IdeaProjects/demo`. Dibangun dengan Angular 22 dan Angular Material 3.

## Fitur

- Layout admin dengan sidebar responsif (mode `side` di desktop, `over` di mobile).
- Halaman dashboard berisi shortcut dan 5 data pegawai terbaru.
- CRUD pegawai: daftar, pencarian server-side (nama/NIP), tambah, edit, dan hapus (soft delete).
- Pagination cursor mengikuti API backend (20 data per halaman, tombol sebelumnya/berikutnya).
- Form reaktif dengan validasi yang sama seperti backend, datepicker locale `id-ID`,
  penanganan NIP duplikat (409), dan snackbar notifikasi.

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
├── core/                 # model, service HTTP, error helper, date adapter
├── layout/               # shell admin: sidebar + topbar
└── features/
    ├── dashboard/        # ringkasan dan pegawai terbaru
    └── pegawai/          # tabel, form dialog, dialog konfirmasi hapus
```

## Catatan API

- Response dan request memakai JSON snake_case (`tanggal_lahir`, `no_telepon`, dst).
- Identifier publik adalah `uuid`; numeric id tidak pernah dipakai di frontend.
- Daftar memakai cursor pagination: kirim `next_cursor` dari response sebelumnya sebagai `cursor`.
- Pencarian backend mencocokkan `lower(nama)` dan `nip`; NIP yang mengandung huruf
  besar tidak akan cocok karena backend me-lowercase pola pencariannya.
