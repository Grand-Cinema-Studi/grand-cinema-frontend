import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    path: 'sign-up',
    title: 'Le Grand Cinéma – Créer un compte',
    loadComponent: () =>
      import('./features/auth/sign-up-page/sign-up-page').then((m) => m.SignUpPage),
  },
  {
    path: 'sign-in',
    title: 'Le Grand Cinéma – Connexion',
    loadComponent: () =>
      import('./features/auth/sign-in-page/sign-in-page').then((m) => m.SignInPage),
  },
  {
    path: 'account',
    title: 'Le Grand Cinéma – Mon compte',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/account-page/account-page').then((m) => m.AccountPage),
  },
  {
    path: 'privacy-policy',
    title: 'Le Grand Cinéma – Politique de confidentialité',
    loadComponent: () =>
      import('./features/legal/privacy-policy-page/privacy-policy-page').then(
        (m) => m.PrivacyPolicyPage,
      ),
  },
  {
    path: '**',
    title: 'Le Grand Cinéma – Page introuvable',
    loadComponent: () => import('./core/not-found/not-found').then((m) => m.NotFound),
  },
];
