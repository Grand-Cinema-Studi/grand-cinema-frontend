import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { problemMessage } from '../../../core/errors/problem-message';
import { Screening } from '../../schedule/models/schedule';
import { ReservationsService } from '../reservations.service';

/** US 2.3, criterion 7: at most 10 seats per hold; the API refuses more anyway. */
const MAXIMUM_SEAT_COUNT = 10;

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-hold-form',
  templateUrl: './hold-form.html',
})
export class HoldForm {
  private readonly auth = inject(AuthService);
  private readonly reservations = inject(ReservationsService);
  private readonly router = inject(Router);

  readonly screening = input.required<Screening>();

  /** 1 to 10 seats, and never more than the seats left. */
  protected readonly seatCounts = computed(() =>
    Array.from(
      { length: Math.min(MAXIMUM_SEAT_COUNT, this.screening().remainingSeats) },
      (_, index) => index + 1,
    ),
  );

  /** Back to 1 seat whenever another screening is chosen. */
  protected readonly seatCount = linkedSignal({ source: this.screening, computation: () => 1 });
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected hold(): void {
    // Criterion 1: a visitor who is not signed in is invited to sign in, then comes back to this form
    if (!this.auth.isSignedIn()) {
      this.goToSignIn();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    this.reservations
      .holdSeats({ screeningId: this.screening().screeningId, seatCount: this.seatCount() })
      .subscribe({
        next: (hold) => void this.router.navigateByUrl(`/reservations/${hold.reservationId}`),
        error: (error: unknown) => {
          this.sending.set(false);
          // Session expired meanwhile: the interceptor has already signed the visitor out
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.goToSignIn();
            return;
          }
          this.error.set(problemMessage(error));
        },
      });
  }

  private goToSignIn(): void {
    void this.router.navigate(['/sign-in'], { queryParams: { returnUrl: this.router.url } });
  }
}
