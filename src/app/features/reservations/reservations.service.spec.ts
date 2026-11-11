import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaymentPage, Reservation, Ticket, TicketSummary } from './models/reservation';
import { ReservationsService } from './reservations.service';

describe('US 2.3 – ReservationsService', () => {
  const hold: Reservation = {
    reservationId: 'id-hold',
    screeningId: 'id-screening',
    movieId: 'id-bird',
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

  it('when a hold is cancelled, then DELETE /api/reservations/{id} is called', () => {
    const { http, service } = setUp();
    let done = false;

    service.cancelHold('id-hold').subscribe({ complete: () => (done = true) });

    const request = http.expectOne('/api/reservations/id-hold');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
    http.verify();
  });

  it('when the payment is started, then POST /api/reservations/{id}/payment is called with the terms of sale accepted', () => {
    const { http, service } = setUp();
    let result: PaymentPage | undefined;

    service.startPayment('id-hold').subscribe((page) => (result = page));

    const request = http.expectOne('/api/reservations/id-hold/payment');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ acceptTermsOfSale: true });
    request.flush({ checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test' });
    expect(result).toEqual({ checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test' });
    http.verify();
  });

  it('when a ticket is read, then GET /api/reservations/{id}/ticket is called', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: Ticket | undefined;

    TestBed.inject(ReservationsService)
      .getTicket('id-paid')
      .subscribe((ticket) => (result = ticket));

    const request = http.expectOne('/api/reservations/id-paid/ticket');
    expect(request.request.method).toBe('GET');
    request.flush({ reservationId: 'id-paid' });
    expect(result?.reservationId).toBe('id-paid');
    http.verify();
  });

  it('when my tickets are read, then GET /api/users/me/tickets is called', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: TicketSummary[] | undefined;

    TestBed.inject(ReservationsService)
      .getMyTickets()
      .subscribe((tickets) => (result = tickets));

    const request = http.expectOne('/api/users/me/tickets');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    expect(result).toEqual([]);
    http.verify();
  });
});
