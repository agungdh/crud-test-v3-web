import { Routes } from '@angular/router';
import { KEGIATAN_TYPES } from './core/config/kegiatan-types';
import { AdminLayout } from './layout/admin-layout';

const kegiatanRoutes = KEGIATAN_TYPES.map((config) => ({
  path: config.slug,
  title: config.label,
  data: { heading: config.label, kegiatan: config },
  loadComponent: () =>
    import('./features/kegiatan/kegiatan-list').then((module) => module.KegiatanList),
}));

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        data: { heading: 'Dashboard' },
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'pegawai',
        title: 'Pegawai',
        data: { heading: 'Pegawai' },
        loadComponent: () =>
          import('./features/pegawai/pegawai-list').then((module) => module.PegawaiList),
      },
      {
        path: 'jenis-pelatihan',
        title: 'Jenis Pelatihan',
        data: { heading: 'Jenis Pelatihan' },
        loadComponent: () =>
          import('./features/jenis-pelatihan/jenis-pelatihan-list').then(
            (module) => module.JenisPelatihanList,
          ),
      },
      ...kegiatanRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];
