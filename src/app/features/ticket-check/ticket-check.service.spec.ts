import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TicketCheckService } from './ticket-check.service';

describe('US 4.1 – TicketCheckService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  it('when the screenings to control are read, then GET /api/ticket-checks/screenings is called', () => {
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(TicketCheckService).getScreenings().subscribe();

    expect(http.expectOne('/api/ticket-checks/screenings').request.method).toBe('GET');
    http.verify();
  });

  it('when a ticket is checked, then POST /api/ticket-checks is called with the screening and the code', () => {
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(TicketCheckService).checkTicket('id-bird', 'abc').subscribe();

    const request = http.expectOne('/api/ticket-checks');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ screeningId: 'id-bird', ticketCode: 'abc' });
    http.verify();
  });
});
