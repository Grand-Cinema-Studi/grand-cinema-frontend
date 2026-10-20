import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '**',
    loadComponent: () => import('./core/not-found/not-found').then((m) => m.NotFound),
  },
];
