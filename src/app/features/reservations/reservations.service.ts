import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HoldSeatsRequest,
  PaymentPage,
  Reservation,
  Ticket,
  TicketSummary,
} from './models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);

  /** Holds the seats for 10 minutes (US 2.3); 409 "not-enough-seats" when fewer are left. */
  holdSeats(request: HoldSeatsRequest): Observable<Reservation> {
    return this.http.post<Reservation>('/api/reservations', request);
  }

  /** A hold of the signed-in customer; its status becomes "Expired" after 10 minutes. */
  getReservation(reservationId: string): Observable<Reservation> {
    return this.http.get<Reservation>(`/api/reservations/${reservationId}`);
  }

  /** Cancels a hold before payment: its seats are on sale again at once (204). */
  cancelHold(reservationId: string): Observable<void> {
    return this.http.delete<void>(`/api/reservations/${reservationId}`);
  }

  /** Opens the payment page of a hold (US 3.1); only called once the terms of sale are accepted. */
  startPayment(reservationId: string): Observable<PaymentPage> {
    return this.http.post<PaymentPage>(`/api/reservations/${reservationId}/payment`, {
      acceptTermsOfSale: true,
    });
  }

  /** The ticket of a paid reservation (US 3.2); 404 "ticket-not-found" when it is not paid. */
  getTicket(reservationId: string): Observable<Ticket> {
    throw new Error(`Step 21b: ${reservationId}`);
  }

  /** The paid reservations of the signed-in customer, the latest screening first (US 3.2). */
  getMyTickets(): Observable<TicketSummary[]> {
    throw new Error('Step 21b');
  }
}
