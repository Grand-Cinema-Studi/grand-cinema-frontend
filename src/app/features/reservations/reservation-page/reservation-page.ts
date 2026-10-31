import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
}
