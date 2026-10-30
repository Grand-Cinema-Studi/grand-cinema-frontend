import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HoldSeatsRequest, Reservation } from './models/reservation';

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
}
