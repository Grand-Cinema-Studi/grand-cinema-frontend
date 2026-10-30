import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { HoldSeatsRequest, Reservation } from './models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);

  holdSeats(request: HoldSeatsRequest): Observable<Reservation> {
    return EMPTY;
  }

  getReservation(reservationId: string): Observable<Reservation> {
    return EMPTY;
  }
}
