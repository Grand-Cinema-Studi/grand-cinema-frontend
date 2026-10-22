import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: "Le Grand Cinéma – À l'affiche",
    loadComponent: () =>
      import('./features/schedule/schedule-page/schedule-page').then((m) => m.SchedulePage),
  },
  {
    path: 'movies',
    title: 'Le Grand Cinéma – Tous les films',
    loadComponent: () =>
      import('./features/movies/movies-page/movies-page').then((m) => m.MoviesPage),
  },
  {
    path: '**',
    title: 'Le Grand Cinéma – Page introuvable',
    loadComponent: () => import('./core/not-found/not-found').then((m) => m.NotFound),
  },
];
