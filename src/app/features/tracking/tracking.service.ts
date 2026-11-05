import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationTracking } from './models/reservation-tracking';

/** US 5.3 and 5.1: the API answers 403 to every role but the manager and the cashier. */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient);

  /** Without a date, the API returns the tracking of today. */
  getTracking(date?: string): Observable<ReservationTracking> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<ReservationTracking>('/api/reservation-tracking', { params });
  }
}
