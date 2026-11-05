import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReservationTracking } from './models/reservation-tracking';
import { TrackingService } from './tracking.service';

describe('US 5.3 – TrackingService', () => {
  it('when the tracking of a day is requested, then GET /api/reservation-tracking is called with the date', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const expected: ReservationTracking = { date: '2026-11-20', screenings: [] };
    let result: ReservationTracking | undefined;

    TestBed.inject(TrackingService)
      .getTracking('2026-11-20')
      .subscribe((tracking) => (result = tracking));

    const request = http.expectOne('/api/reservation-tracking?date=2026-11-20');
    expect(request.request.method).toBe('GET');
    request.flush(expected);
    expect(result).toEqual(expected);
    http.verify();
  });
});
