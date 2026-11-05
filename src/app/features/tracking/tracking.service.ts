import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationTracking } from './models/reservation-tracking';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  getTracking(_date?: string): Observable<ReservationTracking> {
    throw new Error('Step 18a');
  }
}
