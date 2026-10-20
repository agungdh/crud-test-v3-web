import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout';

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
    ],
  },
  { path: '**', redirectTo: '' },
];
