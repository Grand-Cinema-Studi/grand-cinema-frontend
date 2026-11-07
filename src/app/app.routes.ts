import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { staffHomeGuard } from './core/auth/staff-home.guard';

export const routes: Routes = [
  {
    path: '',
    title: "Le Grand Cinéma – À l'affiche",
    canActivate: [staffHomeGuard],
    loadComponent: () =>
      import('./features/schedule/schedule-page/schedule-page').then((m) => m.SchedulePage),
  },
  {
    path: 'movies',
    title: 'Le Grand Cinéma – Tous les films',
    canActivate: [staffHomeGuard],
    loadComponent: () =>
      import('./features/movies/movies-page/movies-page').then((m) => m.MoviesPage),
  },
  {
    path: 'movies/:movieId',
    title: 'Le Grand Cinéma – Fiche du film',
    canActivate: [staffHomeGuard],
    loadComponent: () => import('./features/movies/movie-page/movie-page').then((m) => m.MoviePage),
  },
  {
    path: 'reservations/:reservationId',
    title: 'Le Grand Cinéma – Votre réservation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/reservation-page/reservation-page').then(
        (m) => m.ReservationPage,
      ),
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
    path: 'terms-of-sale',
    title: 'Le Grand Cinéma – Conditions générales de vente',
    loadComponent: () =>
      import('./features/legal/terms-of-sale-page/terms-of-sale-page').then(
        (m) => m.TermsOfSalePage,
      ),
  },
  {
    path: 'legal-notice',
    title: 'Le Grand Cinéma – Mentions légales',
    loadComponent: () =>
      import('./features/legal/legal-notice-page/legal-notice-page').then((m) => m.LegalNoticePage),
  },
  {
    path: 'programming',
    title: 'Le Grand Cinéma – Programmation',
    canActivate: [roleGuard('Manager')],
    loadComponent: () =>
      import('./features/programming/programming-page/programming-page').then(
        (m) => m.ProgrammingPage,
      ),
  },
  {
    path: 'tracking',
    title: 'Le Grand Cinéma – Suivi des réservations',
    canActivate: [roleGuard('Manager', 'Cashier')],
    loadComponent: () =>
      import('./features/tracking/tracking-page/tracking-page').then((m) => m.TrackingPage),
  },
  {
    path: 'ticket-check',
    title: 'Le Grand Cinéma – Contrôle des billets',
    canActivate: [roleGuard('TicketInspector')],
    loadComponent: () =>
      import('./features/ticket-check/ticket-check-page/ticket-check-page').then(
        (m) => m.TicketCheckPage,
      ),
  },
  {
    path: '**',
    title: 'Le Grand Cinéma – Page introuvable',
    loadComponent: () => import('./core/not-found/not-found').then((m) => m.NotFound),
  },
];
