import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Reservation } from './models/reservation';
import { ReservationsService } from './reservations.service';

describe('US 2.3 – ReservationsService', () => {
  const hold: Reservation = {
    reservationId: 'id-hold',
    screeningId: 'id-screening',
    status: 'PendingPayment',
    seats: ['A1', 'A2'],
    totalAmount: 24,
    expiresAt: '2026-10-30T17:07:59Z',
  };

  function setUp() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return {
      http: TestBed.inject(HttpTestingController),
      service: TestBed.inject(ReservationsService),
    };
  }

  it('when seats are held, then POST /api/reservations is called with the screening and the number of seats', () => {
    const { http, service } = setUp();
    let result: Reservation | undefined;

    service
      .holdSeats({ screeningId: 'id-screening', seatCount: 2 })
      .subscribe((reservation) => (result = reservation));

    const request = http.expectOne('/api/reservations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ screeningId: 'id-screening', seatCount: 2 });
    request.flush(hold);
    expect(result).toEqual(hold);
    http.verify();
  });

  it('when a hold is read, then GET /api/reservations/{id} is called', () => {
    const { http, service } = setUp();
    let result: Reservation | undefined;

    service.getReservation('id-hold').subscribe((reservation) => (result = reservation));

    const request = http.expectOne('/api/reservations/id-hold');
    expect(request.request.method).toBe('GET');
    request.flush(hold);
    expect(result).toEqual(hold);
    http.verify();
  });
});
