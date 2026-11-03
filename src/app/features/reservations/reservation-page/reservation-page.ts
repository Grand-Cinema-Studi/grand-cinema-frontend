import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { problemMessage } from '../../../core/errors/problem-message';
import { ExternalNavigation } from '../../../core/navigation/external-navigation';
import { Reservation } from '../models/reservation';
import { ReservationsService } from '../reservations.service';

type ReservationState =
  { status: 'loading' } | { status: 'loaded'; reservation: Reservation } | { status: 'failed' };

@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-reservation-page',
  templateUrl: './reservation-page.html',
})
export class ReservationPage {
  private readonly reservations = inject(ReservationsService);
  private readonly router = inject(Router);
  protected readonly cancelling = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly externalNavigation = inject(ExternalNavigation);
  protected readonly termsAccepted = signal(false);
  protected readonly paying = signal(false);

  /** Identifier of the hold, read from the address /reservations/:reservationId. */
  readonly reservationId = input.required<string>();

  protected readonly state = toSignal(
    toObservable(this.reservationId).pipe(
      switchMap((reservationId) =>
        this.reservations.getReservation(reservationId).pipe(
          map((reservation): ReservationState => ({ status: 'loaded', reservation })),
          catchError(() => of<ReservationState>({ status: 'failed' })),
          startWith<ReservationState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as ReservationState },
  );

  protected readonly reservation = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.reservation : null;
  });

  /** The current instant, refreshed every second for the countdown. */
  private readonly now = signal(Date.now());

  /** Milliseconds left before the seats are freed; 0 once the 10 minutes have run out. */
  protected readonly timeLeft = computed(() => {
    const expiresAt = this.reservation()?.expiresAt;
    return expiresAt ? Math.max(0, new Date(expiresAt).getTime() - this.now()) : 0;
  });

  /** Criterion 5: expired for the API, or as soon as the countdown reaches 0 (the API agrees: same instant). */
  protected readonly expired = computed(() => {
    const reservation = this.reservation();
    return (
      reservation !== null &&
      (reservation.status === 'Expired' ||
        (reservation.status === 'PendingPayment' && this.timeLeft() === 0))
    );
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** "07:59": minutes and seconds left. */
  protected countdown(): string {
    const seconds = Math.ceil(this.timeLeft() / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  /** Cancels the hold: its seats are on sale again at once, and the visitor goes back to the movie. */
  protected cancel(reservation: Reservation): void {
    this.cancelling.set(true);
    this.error.set(null);
    this.reservations.cancelHold(reservation.reservationId).subscribe({
      next: () => void this.router.navigateByUrl(`/movies/${reservation.movieId}`),
      error: (error: unknown) => {
        this.cancelling.set(false);
        this.error.set(problemMessage(error));
      },
    });
  }

  /** US 3.1, criterion 4: paying is possible only once the terms of sale are accepted. */
  protected acceptTerms(event: Event): void {
    this.termsAccepted.set((event.target as HTMLInputElement).checked);
  }

  /** Opens the payment page of Stripe: the card is typed there, never on this site (criterion 3). */
  protected pay(reservation: Reservation): void {
    this.paying.set(true);
    this.error.set(null);
    this.reservations.startPayment(reservation.reservationId).subscribe({
      next: (page) => this.externalNavigation.go(page.checkoutUrl),
      error: (error: unknown) => {
        this.paying.set(false);
        this.error.set(problemMessage(error));
      },
    });
  }
}
